const readlineSync = require('readline-sync');
const dataManipulation = require('./dataManipulation');
const FilmIndustryDatabase = require('../database');

module.exports = class FillmsApplication {
    constructor() {
        this.database = new FilmIndustryDatabase();
    }

    async initDB() {
        try {
            await this.database.connect();
        } catch (err) {
            console.log(err);
        }
    }

    async run() {
        console.clear();
        console.log('Wait a second...')

        await this.initDB();

        console.clear();


        let userChoice;

        while (userChoice !== 0) {
            userChoice = parseInt(readlineSync.question(
                'Choose operation:\n' +
                '1. Insert\n' +
                '2. Update\n' +
                '3. Delete\n' +
                '4. Search\n' +
                '5. Full text search\n' +
                '6. Get all\n' +
                '7. Get by PK\n' +
                '8. Clear tables\n' +
                '9. Re-create tables and generate new data\n' +
                '0. Exit\n\n' +
                'Input: '
            ));

            console.clear();

            try {
                switch (userChoice) {
                    case 1:
                        await dataManipulation.insertData(this.database);
                        break;

                    case 2:
                        await dataManipulation.updateData(this.database);
                        break;

                    case 3:
                        await dataManipulation.deleteData(this.database);
                        break;

                    case 4:
                        await dataManipulation.searchData(this.database);
                        break;

                    case 5:
                        await dataManipulation.fullTextSearch(this.database);
                        break;

                    case 6:
                        await dataManipulation.getAllData(this.database);
                        break;

                    case 7:
                        await dataManipulation.getDataByPK(this.database);
                        break;

                    case 8:
                        await dataManipulation.cleareTables(this.database);
                        break;

                    case 9:
                        await this.database.syncTables();
                        await this.database.generateDataTables();
                        break;

                    case 0:
                        await this.database.close();
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
}
