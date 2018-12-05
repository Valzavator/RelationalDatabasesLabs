const Sequelize = require('sequelize');
const Op = Sequelize.Op;

const random = require('../helpers/random');
const faker = require('faker');
const tablesInfo = require('./tablesInfo');
const AdditionalFunctionsForDB = require('./additionalFunctionsForDB');

const Human = require('../entities/human');
const FilmStudio = require('../entities/film-studio');
const Film = require('../entities/film');
const Casting = require('../entities/casting');

require('dotenv').config();
const env = process.env;

module.exports = class FilmIndustryDatabase {
    constructor(
        username = env.USERNAME,
        password = env.PASSWORD,
        host = env.HOST,
        port = env.PORT,
        database = env.DATABASE
    ) {
        this.sequelize = new Sequelize(
            username,
            database,
            password,
            {
                host: host,
                port: port,
                dialect: 'postgres',
                operatorsAliases: false,
                // logging: false,
                define: {
                    schema: 'film_industry',
                    timestamps: false,
                    underscored: true
                },
            }
        );
        this.Sequelize = Sequelize;
        this.models = {
            Actors: this.sequelize.import('./models/actors.js'),
            FilmDirectors: this.sequelize.import('./models/filmDirectors.js'),
            FilmStudios: this.sequelize.import('./models/filmStudios.js'),
            Films: this.sequelize.import('./models/films.js'),
            Casting: this.sequelize.import('./models/casting.js'),
        };
        Object.keys(this.models).forEach(key => {
            if ('associate' in this.models[key]) {
                this.models[key].associate(this.models);
            }
        });

        this.additionalFunctionsForDB = new AdditionalFunctionsForDB(this.sequelize);
    }

    async connect() {
        try {
            await this.sequelize.authenticate()
            console.log('Connection has been established successfully.');
        } catch (err) {
            console.log('Error:	' + err.message);
            console.log('<<	Please, enter other parameters for Database >>');
        }
    }

    async close() {
        await this.sequelize.close();
    }

    async syncTables() {
        await this.additionalFunctionsForDB.down();
        await this.models.Films.down(this.sequelize);

        await this.sequelize.sync({ force: true });

        await this.models.Films.up(this.sequelize);
        await this.additionalFunctionsForDB.up();
    }

    async findFilmsByStudioAndProfit(studioName, isProfitable) {
        return await this.models.Films.findAll({
            include: [{
                model: this.models.FilmStudios,
                required: true,
                where: { studio_name: studioName },
                attributes: []
            }],
            where: { profitable: isProfitable },
            attributes: ['film_name', 'release_date', 'running_time'],
            raw: true
        })
    }

    async findActorsByFilmAndSex(filmName, sex) {
        // return await this.models.Casting.findAll({
        //     include:
        //         [
        //             {
        //                 model: this.models.Films,
        //                 required: true,
        //                 where: { film_name: filmName },
        //                 attributes: []
        //             },
        //             {
        //                 model: this.models.Actors,
        //                 required: true,
        //                 where: { sex: sex },
        //                 attributes: ['fullname', 'birthday', 'nationality']
        //             }
        //         ],
        //     attributes: ['role'],
        //     raw: true
        // });

        return await this.additionalFunctionsForDB.findActorsByFilmAndSex(filmName, sex);
    }

    async textSearchByWords(words) {
        let searchWords = words.filter(word => /^\w+$/.test(word)).join(" & ");
        console.log(searchWords);
        return (await this.sequelize.query(`
            SELECT _id film_id, film_name, ts_headline('english', plot, query, 'StartSel = <, StopSel = >') plot
            FROM film_industry.films, to_tsquery('english', '${searchWords}') query
            WHERE tsv @@ query;`))[0];
    }

    async textSearchByPhrase(phrase) {
        return (await this.sequelize.query(`
            SELECT _id film_id, film_name, ts_headline('english', plot, query, 'StartSel = "<", StopSel = ">" ') plot
            FROM film_industry.films, phraseto_tsquery('english', '${phrase}') query
            WHERE tsv @@ query;`))[0];
    }

    async generateFilmDirectors(count = 100) {
        const listOfDirectors = Array.apply(null, { length: count }).map(() => {
            return new Human(
                faker.name.findName(),
                random.getRndSexEnum(),
                random.getRndDate(),
                faker.address.country()
            )
        });

        await this.models.FilmDirectors.bulkCreate(listOfDirectors);
    }

    async generateActors(count = 100) {
        const listOfActors = Array.apply(null, { length: count }).map(() => {
            return new Human(
                faker.name.findName(),
                random.getRndSexEnum(),
                random.getRndDate(),
                faker.address.country()
            )
        });

        await this.models.Actors.bulkCreate(listOfActors);
    }

    async generateFilmStudios(count = 100) {
        const listOfFilmStudios = Array.apply(null, { length: count }).map(() => {
            return new FilmStudio(
                faker.company.companyName(),
                random.getRndDate('1900.11.27'),
                faker.fake('{{address.country}}, {{address.city}}')
            )
        });

        await this.models.FilmStudios.bulkCreate(listOfFilmStudios);
    }

    async generateFilms(count = 100) {
        const directorsCount = await this.models.FilmDirectors.count();
        const studiosCount = await this.models.FilmStudios.count();

        const listOfFilms = Array.apply(null, { length: count }).map(() => {
            return new Film(
                faker.commerce.productName(),
                random.getRndDate('1950.11.27', '2018.11.27'),
                faker.lorem.paragraphs(3),
                random.getRndInteger(100, 200),
                Math.random() >= 0.5,
                random.getRndInteger(1, directorsCount + 1),
                random.getRndInteger(1, studiosCount + 1)
            )
        });

        await this.models.Films.bulkCreate(listOfFilms);
    }

    async generateCasting(count = 100) {
        const filmsCount = await this.models.Films.count();
        const actorsCount = await this.models.Actors.count();

        const listOfCasting = Array.apply(null, { length: count }).map(() => {
            return new Casting(
                random.getRndInteger(1, filmsCount + 1),
                random.getRndInteger(1, actorsCount + 1),
                faker.name.findName()
            )
        });

        await this.models.Casting.bulkCreate(listOfCasting);
    }

    async generateDataTables() {
        await this.generateFilmDirectors(20);
        await this.generateActors();
        await this.generateFilmStudios(15);
        await this.generateFilms(150);
        await this.generateCasting(2000);
    }

    async createActor(human) {
        return (await this.models.Actors.create(human)).get({ plain: true });
    }

    async updateActor(criteria, updatedObj) {
        const res = await this.models.Actors.update(
            updatedObj,
            {
                fields: tablesInfo.actors.attributes,
                where: criteria,
                returning: true
            });

        return res[0] == 1
            ? res[1][0].dataValues
            : null;
    }

    async getActor(criteria) {
        return await this.models.Actors.findOne({ where: criteria, raw: true });
    }

    async getAllActors() {
        return await this.models.Actors.findAll({ raw: true });
    }

    async deleteActor(criteria) {
        return await this.models.Actors.destroy({ where: criteria, returning: true });
    }

    async createFilmDirector(human) {
        return (await this.models.FilmDirectors.create(human)).get({ plain: true });
    }

    async updateFilmDirector(criteria, updatedObj) {
        const res = await this.models.FilmDirectors.update(
            updatedObj,
            {
                fields: tablesInfo.film_directors.attributes,
                where: criteria,
                returning: true
            });

        return res[0] == 1
            ? res[1][0].dataValues
            : null;
    }

    async getFilmDirector(criteria) {
        return await this.models.FilmDirectors.findOne({ where: criteria, raw: true });
    }

    async getAllFilmDirectors() {
        return await this.models.FilmDirectors.findAll({ raw: true });
    }

    async deleteFilmDirector(criteria) {
        return await this.models.FilmDirectors.destroy({ where: criteria });
    }

    async createFilmStudio(filmStudio) {
        return (await this.models.FilmStudios.create(filmStudio)).get({ plain: true });
    }

    async updateFilmStudio(criteria, updatedObj) {
        const res = await this.models.FilmStudios.update(
            updatedObj,
            {
                fields: tablesInfo.film_studios.attributes,
                where: criteria,
                returning: true
            });

        return res[0] == 1
            ? res[1][0].dataValues
            : null;
    }

    async getFilmStudio(criteria) {
        return await this.models.FilmStudios.findOne({ where: criteria, raw: true });
    }

    async getAllFilmStudios() {
        return await this.models.FilmStudios.findAll({ raw: true });
    }

    async deleteFilmStudio(criteria) {
        return await this.models.FilmStudios.destroy({ where: criteria });
    }

    async createFilm(film) {
        return (await this.models.Films.create(film)).get({ plain: true });
    }

    async updateFilm(criteria, updatedObj) {
        const res = await this.models.Films.update(
            updatedObj,
            {
                fields: tablesInfo.films.attributes,
                where: criteria,
                returning: true
            });

        return res[0] == 1
            ? res[1][0].dataValues
            : null;
    }

    async getFilm(criteria) {
        return await this.models.Films.findOne({ where: criteria, raw: true });
    }

    async getAllFilms() {
        return await this.models.Films.findAll({ raw: true });
    }

    async deleteFilm(criteria) {
        return await this.models.Films.destroy({ where: criteria });
    }

    async createCasting(casting) {
        return (await this.models.Casting.create(casting)).get({ plain: true });
    }

    async updateCasting(criteria, updatedObj) {
        const res = await this.models.Casting.update(
            updatedObj,
            {
                fields: tablesInfo.casting.attributes,
                where: criteria,
                returning: true
            });

        return res[0] == 1
            ? res[1][0].dataValues
            : null;
    }

    async getCasting(criteria) {
        return await this.models.Casting.findOne({ where: criteria, raw: true });
    }

    async getAllCasting() {
        return await this.models.Casting.findAll({ raw: true });
    }

    async deleteCasting(criteria) {
        return await this.models.Casting.destroy({ where: criteria });
    }

    async clearActorsTable() {
        await this.models.Actors.destroy({
            where: { _id: { [Op.ne]: null } }
        });
    }

    async clearFilmDirectorsTable() {
        await this.models.FilmDirectors.destroy({
            where: { _id: { [Op.ne]: null } }
        });
    }

    async clearFilmStudiosTable() {
        await this.models.FilmStudios.destroy({
            where: { _id: { [Op.ne]: null } }
        });
    }

    async clearFilmsTable() {
        await this.models.Films.destroy({
            where: { _id: { [Op.ne]: null } }
        });
    }

    async clearCastingTable() {
        await this.models.Casting.destroy({
            where: { film_id: { [Op.ne]: null } }
        });
    }

    async query(query) {
        return await this.sequelize.query(query);
    }
}