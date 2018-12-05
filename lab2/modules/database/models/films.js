//     tsv tsvector NOT NULL

//   CREATE INDEX search_idx ON films USING GIN (tsv);

//   CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE
//   ON films FOR EACH ROW EXECUTE PROCEDURE
//   tsvector_update_trigger(tsv, 'pg_catalog.english', plot);

const Sequelize = require('sequelize');

const vectorName = 'tsv';
const seatchCriteria = ['plot'];

const films = (sequelize, DataTypes) => {

    const Films = sequelize.define('films', {
        _id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        film_name: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
        },
        release_date: {
            type: Sequelize.DATE,
            allowNull: false
        },
        plot: Sequelize.TEXT,
        running_time: {
            type: Sequelize.SMALLINT,
            allowNull: false,
            validate: {
                min: 1
            }
        },
        profitable: {
            type: Sequelize.BOOLEAN,
            allowNull: false
        }
    });

    Films.associate = models => {
        Films.belongsTo(models.FilmDirectors, {
            foreignKey: {
                name: 'director_id',
                allowNull: false
            },
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE'
        });
        Films.belongsTo(models.FilmStudios, {
            foreignKey: {
                name: 'studio_id',
                allowNull: false
            },
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE'
        });
    };

    Films.up = async (sequelize) => {
        const t = await sequelize.transaction();
        try {
            await sequelize.query(
                `ALTER TABLE film_industry.films ADD COLUMN IF NOT EXISTS tsv TSVECTOR;`,
                { transaction: t }
            );

            await sequelize.query(
                `CREATE INDEX IF NOT EXISTS films_search ON film_industry.films USING GIN(${vectorName});`,
                { transaction: t }
            );

            await sequelize.query(`
                CREATE TRIGGER films_vector_update
                BEFORE INSERT OR UPDATE ON film_industry.films
                FOR EACH ROW EXECUTE PROCEDURE tsvector_update_trigger(${vectorName}, 'pg_catalog.english', ${seatchCriteria.join(', ')});`,
                { transaction: t }
            );

            await sequelize.query(`
                CREATE OR REPLACE FUNCTION film_industry.generate_casting_trigger_function() RETURNS trigger AS
                $$
                DECLARE
                    countCasting integer;
                    defaultCountCasting CONSTANT integer = 10;
                    actor film_industry.actors%ROWTYPE;
                BEGIN
                    SELECT INTO countCasting count(*) FROM film_industry.actors;
                    IF countCasting > defaultCountCasting THEN
                        countCasting = defaultCountCasting;
                    END IF;
                    FOR actor IN SELECT * FROM film_industry.actors ORDER BY random() limit countCasting LOOP
                        INSERT INTO film_industry.casting(film_id, actor_id, role)
                    VALUES(NEW._id, actor._id, md5(random()::text));
                    END LOOP;
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;`,
                { transaction: t }
            );

            await sequelize.query(`
                CREATE TRIGGER generate_casting_trigger
                AFTER INSERT 
                ON film_industry.films
                FOR EACH ROW
                EXECUTE PROCEDURE film_industry.generate_casting_trigger_function();`,
                { transaction: t }
            );

            await sequelize.query(`
                CREATE OR REPLACE FUNCTION film_industry.check_uniqueness_film_name_trigger_function() RETURNS trigger AS
                $$
                BEGIN
                    IF (SELECT count(*) FROM film_industry.films WHERE film_name = NEW.film_name) > 0 THEN
                        NEW.film_name = CONCAT(NEW.film_name, ' (', NEW._id, ')');     
                    END IF;
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;`,
                { transaction: t }
            );

            await sequelize.query(`
                CREATE TRIGGER check_uniqueness_film_name_trigger
                BEFORE INSERT 
                ON film_industry.films
                FOR EACH ROW
                EXECUTE PROCEDURE film_industry.check_uniqueness_film_name_trigger_function();`,
                { transaction: t }
            );

            // commit
            await t.commit();

        } catch (err) {
            // Rollback transaction if any errors were encountered
            console.log(err);
            await t.rollback();
        }
    }

    Films.down = async (sequelize) => {
        const t = await sequelize.transaction();
        try {
            await sequelize.query(
                `DROP TRIGGER IF EXISTS films_vector_update ON film_industry.films;`,
                { transaction: t }
            );

            await sequelize.query(
                `DROP INDEX IF EXISTS film_industry.films_search;`,
                { transaction: t }
            );

            await sequelize.query(
                `ALTER TABLE film_industry.films DROP COLUMN IF EXISTS ${vectorName};`,
                { transaction: t }
            );

            await sequelize.query(
                `DROP TRIGGER IF EXISTS generate_casting_trigger ON film_industry.films;`,
                { transaction: t }
            );

            await sequelize.query(
                `DROP TRIGGER IF EXISTS check_uniqueness_film_name_trigger ON film_industry.films;`,
                { transaction: t }
            );

            // commit
            await t.commit();

        } catch (err) {
            // Rollback transaction if any errors were encountered
            console.log(err);
            await t.rollback();
        }
    }

    return Films;
};

module.exports = films;































// Films.up = (sequelize) =>
    //     sequelize.transaction((t) =>
    //         sequelize.query(
    //             `ALTER TABLE film_industry.films ADD COLUMN IF NOT EXISTS tsv TSVECTOR;`
    //             , { transaction: t })
    //             .then(() =>
    //                 sequelize.query(
    //                     `CREATE INDEX IF NOT EXISTS films_search ON film_industry.films USING GIN(${vectorName});`,
    //                     { transaction: t })
    //             ).then(() =>
    //                 sequelize.query(`
    //                     CREATE TRIGGER films_vector_update
    //                     BEFORE INSERT OR UPDATE ON film_industry.films
    //                     FOR EACH ROW EXECUTE PROCEDURE tsvector_update_trigger(${vectorName}, 'pg_catalog.english', ${seatchCriteria.join(', ')});`,
    //                     { transaction: t })
    //             ).then(() =>
    //                 sequelize.query(`
    //                     CREATE OR REPLACE FUNCTION film_industry.generate_casting_trigger_function() RETURNS trigger AS
    //                     $$
    //                     DECLARE
    //                         countCasting int;
    //                         defaultCountCasting CONSTANT int:= 10;
    //                         actor film_industry.actors%ROWTYPE;
    //                     BEGIN
    //                         SELECT INTO countCasting count(*) FROM film_industry.actors;
    //                         IF countCasting > defaultCountCasting THEN
    //                             countCasting:= defaultCountCasting;
    //                         END IF;
    //                         FOR actor IN SELECT * FROM film_industry.actors ORDER BY random() limit countCasting LOOP
    //                             INSERT INTO film_industry.casting(film_id, actor_id, role)
    //                         VALUES(NEW._id, actor._id, md5(random()::text));
    //                         END LOOP;
    //                         RETURN NEW;
    //                     END;
    //                     $$ LANGUAGE plpgsql;`,
    //                     { transaction: t })

    //             ).then(() =>
    //                 sequelize.query(`
    //                     CREATE TRIGGER generate_casting_trigger
    //                     AFTER INSERT 
    //                     ON film_industry.films
    //                     FOR EACH ROW
    //                     EXECUTE PROCEDURE film_industry.generate_casting_trigger_function();`,
    //                     { transaction: t })
    //             ).error(console.log)
    //     );
