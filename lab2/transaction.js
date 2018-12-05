const FilmIndustryDatabase = require('./modules/database');
const readlineSync = require('readline-sync');
require('console.table');


const scenario = {
    nonRepeatebleRead: {
        role1: ['1', '2', '3'],
        role2: ['3', '2', '1']
    },
    serializationAnomaly: {
        role1: ['1', '2', '3'],
        role2: ['3', '2', '1']
    }
};

runApp = async () => {
    console.clear();

    const database = new FilmIndustryDatabase();
    await prepareDB(database);
    console.clear();

    let transactionChoice;
    let roleChoice = 1;
    let scenarioChoice = 1;

    while (transactionChoice !== 0) {
        transactionChoice = parseInt(readlineSync.question(
            'Choose type of transaction:\n' +
            '1. READ COMMITTED\n' +
            '2. REPEATABLE READ\n' +
            '3. SERIALIZABLE\n' +
            '0. Exit\n\n' +
            'Input: '
        ));

        console.clear();
        
        if (transactionChoice != 0) {
            roleChoice = parseInt(readlineSync.question(
                'Choose type of transaction:\n' +
                '1. ROLE << 1 >>\n' +
                '2. ROLE << 2 >>\n' +
                'Input: '
            ));
    
            console.clear();
    
            scenarioChoice = parseInt(readlineSync.question(
                'Choose type of transaction:\n' +
                '1. Non-repeatable read\n' +
                '2. Serialization anomaly\n' +
                'Input: '
            ));
        }
       
        try {
            await resetCastingTable(database);
            console.clear();

            switch (transactionChoice) {
                case 1:
                    await readCommitted(database, roleChoice, scenarioChoice);
                    break;

                case 2:
                    await repeatableRead(database, roleChoice, scenarioChoice);
                    break;

                case 3:
                    await serializable(database, roleChoice, scenarioChoice);
                    break;

                case 0:
                    await database.close();
                    console.log('Good luck!');
                    break;

                default:
                    console.log('\n<< Please, enter another operation >>\n');
            }
        } catch (err) {
            console.log(`\n<< ERROR: ${err.message} >>\n`);
        }

        readlineSync.question('\n<< To continue press \'Enter\' >>\n');
        console.clear();
    }
}


async function readCommitted(database, roleChoice, scenarioChoice) {
    // const commands = defineCommands(roleChoice, scenarioChoice);

    await database.query('BEGIN transaction isolation level READ COMMITTED;');

    console.log();

    console.table((await database.query('SELECT * FROM film_industry.casting;'))[0]);

    readlineSync.question();

    if (roleChoice == 1) {

        await database.query(`UPDATE film_industry.casting SET role = 'new Role' WHERE actor_id = 1;`);
        console.log();

        console.table((await database.query('SELECT * FROM film_industry.casting;'))[0]);

        readlineSync.question('\n');

        await database.query('COMMIT;');
    } else {
        await database.query(`UPDATE film_industry.casting SET role = 'old Role' WHERE actor_id = 1;`);

        console.table((await database.query('SELECT * FROM film_industry.casting;'))[0]);

        readlineSync.question('\n');

        console.table((await database.query('SELECT * FROM film_industry.casting;'))[0]);

        readlineSync.question('\n');

        await database.query('COMMIT;');
    }


    // for (let i = 0; i < commands.length; i++) {
    //     console.log(commands[i]);
    //     readlineSync.question('\n<< Next command >>\n');
    // }
}

async function repeatableRead(database, roleChoice, scenarioChoice) {
    const commands = defineCommands(roleChoice, scenarioChoice);

}

async function serializable(database, roleChoice, scenarioChoice) {
    const commands = defineCommands(roleChoice, scenarioChoice);
}

function defineCommands(roleChoice, scenarioChoice) {
    return scenarioChoice == 1
        ? roleChoice == 1
            ? scenario.nonRepeatebleRead.role1
            : scenario.nonRepeatebleRead.role2
        : roleChoice == 1
            ? scenario.serializationAnomaly.role1
            : scenario.serializationAnomaly.role2;
}

async function resetCastingTable(db) {
    await db.clearCastingTable();
    await db.createCasting({ film_id: 1, actor_id: 1, role: 'role1' });
    await db.createCasting({ film_id: 2, actor_id: 2, role: 'role2' });
}

async function prepareDB(db) {
    await db.syncTables();
    await db.generateDataTables();
    await db.clearCastingTable();
}

runApp();
