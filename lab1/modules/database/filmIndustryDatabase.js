const path = require('path');
const faker = require('faker');
const random = require('../helpers/random');

require('dotenv').config();
const env = process.env;

const promise = require('bluebird');

const initOptions = {
    schema: 'film_industry',
    promiseLib: promise, // overriding the default (ES6 Promise)
    error(error, e) {
        if (e.cn) {
            // A connection-related error;
            //
            // Connections are reported back with the password hashed,
            // for safe errors logging, without exposing passwords.
            console.log('CN:', e.cn);
            console.log('EVENT:', error.message || error);
        }
    }
};

const pgp = require('pg-promise')(initOptions);

module.exports = class FilmIndustryDatabase {
    constructor(
        username = env.USERNAME,
        password = env.PASSWORD,
        host = env.HOST,
        port = env.PORT,
        database = env.DATABASE
    ) {
        this.db = pgp({
            username: username,
            password: password,
            host: host,
            port: port,
            database: database,
        });
    }

    async connect() {
        try {
            let res = await this.db.proc('version');
            console.log(res.version);
        } catch (err) {
            console.log("<< Please, enter other parameters for Database >>");
        }
    }

    async close() {
        this.db.$pool.end();
    }

    async execScriptFile(filePath) {
        try {
            const fullPath = path.join(__dirname, filePath);
            await this.db.query(new pgp.QueryFile(fullPath, { minify: true }));
        } catch (err) {
            console.log(err);
        }
    }

    async insert(tableName, object) {
        return await this.db.one(`
            INSERT INTO $1:name ($2:name)
            VALUES ($2:csv)
            RETURNING $3:name
            `, [tableName, object, chooseReturnValues(tableName)]);
    }

    async delete(tableName, criteria) {
        return await this.db.one(`
            DELETE FROM $1:name 
            WHERE $2 RETURNING *
            `, [tableName, new WhereValues(criteria)])
    }

    async getAll(tableName) {
        return await this.db.many(`
            SELECT $1:name
            FROM $2:name
            `, ['*', tableName]);
    };

    async getByCriteria(tableName, criteria) {
        return await this.db.one(`
            SELECT $1:name
            FROM $2:name
            WHERE $3
            `, ['*', tableName, new WhereValues(criteria)]);
    }

    async update(tableName, criteria, object) {
        return await this.db.one(`
            UPDATE $1:name
            SET $2
            WHERE $3
            RETURNING *
            `, [tableName, new SetValues(object), new WhereValues(criteria)]);
    }

    async findFilmsByStudioAndProfit(studioName, isProfitable) {
        return await this.db.query(`
            SELECT film_name, release_date, running_time
            FROM film_studios
            INNER JOIN films
            ON film_studios._id = films.studio_id
            WHERE film_studios.studio_name = $1 AND films.profitable = $2
            `, [studioName, isProfitable]);
    }

    async findActorsByFilmAndSex(filmName, sex) {
        return await this.db.query(`
            SELECT fullname, role, birthday, nationality
            FROM casting
            INNER JOIN actors
            ON casting.actor_id = actors._id
            INNER JOIN films
            ON casting.film_id = films._id
            WHERE films.film_name = $1 AND actors.sex = $2
            `, [filmName, sex]);
    }

    async textSearchByWords(words) {
        let searchWords = words.join(" & ");
        return await this.db.query(`
            SELECT _id film_id, film_name, ts_headline('english', plot, query, 'StartSel = <, StopSel = >') plot
            FROM films, to_tsquery('english', $1) query
            WHERE tsv @@ query;
        `, [
                searchWords
            ]);
    }

    async textSearchByPhrase(phrase) {
        return await this.db.query(`
            SELECT _id film_id, film_name, ts_headline('english', plot, query, 'StartSel = "<", StopSel = ">" ') plot
            FROM films, phraseto_tsquery('english', $1) query
            WHERE tsv @@ query;
        `, [
                phrase
            ]);
    }

    async generateFilmDirectors(count = 100) {
        for (let i = 0; i < count; i++)
            await this.db.query(
                `
                INSERT INTO film_directors (fullname, sex, birthday, nationality)
                VALUES ($1, $2, $3, $4)
                `,
                [
                    faker.name.findName(),
                    random.getRndSexEnum(),
                    random.getRndDate(),
                    faker.address.country()
                ]);
    }

    async generateActors(count = 100) {
        for (let i = 0; i < count; i++)
            await this.db.query(`
                INSERT INTO actors (fullname, sex, birthday, nationality)
                SELECT $1, $2, $3, $4
                `,
                [
                    faker.name.findName(),
                    random.getRndSexEnum(),
                    random.getRndDate(),
                    faker.address.country()
                ]);
    }

    async generateFilmStudios(count = 100) {
        for (let i = 0; i < count; i++)
            await this.db.query(`
                INSERT INTO film_studios (studio_name, founded, location)
                SELECT $1, $2, $3
                `,
                [
                    faker.company.companyName(),
                    random.getRndDate('1900.11.27'),
                    faker.fake('{{address.country}}, {{address.city}}')
                ]);
    }

    async generateFilms(count = 100) {
        for (let i = 0; i < count; i++)
            await this.db.query(`
                INSERT INTO films (film_name, release_date, plot, running_time, profitable, director_id, studio_id)
                VALUES ($1, $2, $3, $4, $5, 
                            (SELECT _id FROM film_directors ORDER BY random() LIMIT 1), 
                            (SELECT _id FROM film_studios ORDER BY random() LIMIT 1))`,
                [
                    faker.commerce.productName(),
                    random.getRndDate('1950.11.27', '2018.11.27'),
                    faker.lorem.paragraphs(3),
                    random.getRndInteger(100, 200),
                    Math.random() >= 0.5
                ]);
    }

    async generateCasting(count = 100) {
        for (let i = 0; i < count; i++)
            await this.db.query(`
                INSERT INTO casting (film_id, actor_id, role)
                VALUES( (SELECT _id FROM films ORDER BY random() LIMIT 1),
                        (SELECT _id FROM actors ORDER BY random() LIMIT 1), 
                        $1)
                `,
                [faker.name.findName()]);
    }

    async generateDataTables(recreate = false) {
        await this.generateFilmDirectors(20);
        await this.generateActors();
        await this.generateFilmStudios(15);
        await this.generateFilms(150);
        await this.generateCasting(2000);
    }
}

class SetValues {
    constructor(obj) {
        this.obj = obj;
        this.rawType = true; // raw-text output override;
    }

    toPostgres() {
        let props = Object.keys(this.obj);
        let s = props.map(function (m) {
            return m + '=${' + m + '}'; // creating the formatting parameters;
        });
        return pgp.as.format(s.join(", "), this.obj); // returning the formatted string;
    };
}

class WhereValues {
    constructor(obj) {
        this.obj = (typeof obj == 'object') ? obj : { _id: obj };
        this.rawType = true; // raw-text output override;
    }

    toPostgres() {
        let props = Object.keys(this.obj);
        let s = props.map(function (m) {
            return m + '=${' + m + '}'; // creating the formatting parameters;
        });
        return pgp.as.format(s.join(" AND "), this.obj); // returning the formatted string;
    };
}

function chooseReturnValues(tableName) {
    return tableName == 'casting' ? '*' : '_id';
}

