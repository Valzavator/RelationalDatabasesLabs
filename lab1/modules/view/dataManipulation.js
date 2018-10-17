require('console.table');
const objManager = require('../helpers/objectManager');
const readlineSync = require('readline-sync');
const tablesInfo = require('../database/tablesInfo');

module.exports.insertData = async (db) => {
    console.clear();
    let tableName = readTableName();

    let newObj = objManager.createObjectWithAttributes(tablesInfo[tableName].attributes);

    let res = await db.insert(tableName, newObj);

    console.log();
    console.table([res]);
}

module.exports.updateData = async (db) => {
    console.clear();

    let tableName = readTableName();

    let objToUpd = objManager.createObjectWithAttributes(tablesInfo[tableName].primaryKeys);
    let newObj = objManager.createObjectWithAttributes(tablesInfo[tableName].attributes);

    let res = await db.update(tableName, objToUpd, newObj)

    console.log('\nUpdated object:\n');
    console.table([res]);
}

module.exports.deleteData = async (db) => {
    console.clear();

    let tableName = readTableName();

    let objToDel = objManager.createObjectWithAttributes(tablesInfo[tableName].primaryKeys);
    let res = await db.delete(tableName, objToDel);

    console.log('\nDeleted object:\n');
    console.table([res]);
}

module.exports.searchData = async (db) => {
    console.clear();

    let userChoice = readlineSync.question(
        'Choose operation:\n' +
        '1. Get films by studio and profit\n' +
        '2. Get actors by film and sex\n\n' +
        'Input: '
    );

    console.clear();

    let res;

    switch (userChoice) {
        case '1':
            let studioName = readlineSync.question('Studio name: ');
            let isProfit = readlineSync.question('Іs profitable film? (true, false): ');

            res = await db.findFilmsByStudioAndProfit(studioName, isProfit);
            break;

        case '2':
            let filmName = readlineSync.question('Film name: ');
            let sex = readlineSync.question('Sex (male, female): ');

            res = await db.findActorsByFilmAndSex(filmName, sex);
            break;
        default:
            console.log('\n<< Please, enter another operation >>\n');
    }

    console.log('\n');
    if (res && res.length == 0)
        console.log('Such entities does not exist!')
    if (res && res.length > 0)
        console.table(res);
}

module.exports.getAllData = async (db) => {
    console.clear();

    let tableName = readTableName();

    let res = await db.getAll(tableName);

    console.log();
    console.table(res);
}

module.exports.getDataByPK = async (db) => {
    console.clear();

    let tableName = readTableName();

    let criteria = objManager.createObjectWithAttributes(tablesInfo[tableName].primaryKeys);
    let res = await db.getByCriteria(tableName, criteria);

    console.log();
    console.table([res]);
}

module.exports.fullTextSearch = async (db) => {
    console.clear();

    let userChoice = readlineSync.question(
        'Choose type of search:\n' +
        '1. Obligatory entry of the words\n' +
        '2. Whole phrase\n\n' +
        'Input: '
    );

    console.clear();

    let res;

    switch (userChoice) {
        case '1':

            let words = readlineSync.question('Enter the words: ').split(' ');
            res = await db.textSearchByWords(words);

            break;

        case '2':

            let phrase = readlineSync.question('Enter the phrase: ');
            res = await db.textSearchByPhrase(phrase);

            break;
        default:
            console.log('\n<< Please, enter another operation >>\n');
    }

    console.log('\n');
    if (res && res.length == 0)
        console.log('Such entities does not exist!')
    if (res && res.length > 0)
        console.log(res);
}

function readTableName() {
    let tableName = readlineSync.question('Table name: ');
    if (!tablesInfo[tableName])
        throw new Error(`Invalid table name <${tableName}>!`);

    return tableName;
}

