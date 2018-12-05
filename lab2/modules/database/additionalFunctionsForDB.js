module.exports = class AdditionalFunctionsForDB {
    constructor(sequelize) {
        this.sequelize = sequelize;
    }

    async up() {
        const t = await this.sequelize.transaction();
        try {

            await this.sequelize.query(`
                CREATE OR REPLACE FUNCTION film_industry.find_actors_by_film_and_sex(name VARCHAR, sex film_industry.ENUM_ACTORS_SEX)
                RETURNS TABLE (actor_id INTEGER, role VARCHAR, fullname VARCHAR, birthday DATE, nationality VARCHAR) AS
                $$
                DECLARE
                    temp_film_id INTEGER = -1;
                    casting film_industry.casting%ROWTYPE;
                    actor film_industry.actors%ROWTYPE;
                    actor_id INTEGER;
                BEGIN
                    CREATE TEMP TABLE IF NOT EXISTS temp_table(
						actor_id INTEGER, 
						role VARCHAR,
						fullname VARCHAR,
						birthday DATE,
						nationality VARCHAR
                    );

                    SELECT INTO temp_film_id _id FROM film_industry.films WHERE film_name = name;

                    IF temp_film_id IS NULL THEN
                        RAISE 'Such films does\`nt exist: %', name USING ERRCODE = '23505';
                    END IF;

                    FOR casting IN SELECT * FROM film_industry.casting WHERE film_id = temp_film_id LOOP
                        SELECT INTO actor * FROM film_industry.actors WHERE _id = casting.actor_id;
                        IF actor.sex = sex THEN
                            INSERT INTO temp_table(actor_id, role, fullname, birthday, nationality) 
                            VALUES(
								casting.actor_id, 
								casting.role, actor.fullname, 
								actor.birthday, 
								actor.nationality
							);
                        END IF;
                    END LOOP;
                    
                    RETURN QUERY
                    SELECT * FROM temp_table;
                    DROP TABLE IF EXISTS temp_table;
                END;
                $$  
                LANGUAGE plpgsql
                RETURNS NULL ON NULL INPUT;`,
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


    async down() {
        const t = await this.sequelize.transaction();
        try {

            await this.sequelize.query(
                `DROP FUNCTION IF EXISTS film_industry.find_actors_by_film_and_sex;`,
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


    async findActorsByFilmAndSex(filmName, sex) {
        return (await this.sequelize.query(
            `SELECT * from film_industry.find_actors_by_film_and_sex('${filmName}', '${sex}');`,
            { raw: true }))[0];
    }

}

