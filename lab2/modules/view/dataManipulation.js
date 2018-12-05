require('console.table');
const objManager = require('../helpers/objectManager');
const readlineSync = require('readline-sync');
const tablesInfo = require('../database/tablesInfo');
const arrayTools = require('../helpers/arrayTools');

module.exports.insertData = async (db) => {
    console.clear();
    let tableName = readTableName();

    let newObj = objManager.createObjectWithAttributes(tablesInfo[tableName].attributes);

    let res = await doAction(
        tableName,
        db.createActor.bind(db, newObj),
        db.createFilmDirector.bind(db, newObj),
        db.createFilmStudio.bind(db, newObj),
        db.createFilm.bind(db, newObj),
        db.createCasting.bind(db, newObj)
    );

    console.log();
    console.table([res]);
}

module.exports.updateData = async (db) => {
    console.clear();

    let tableName = readTableName();

    console.log('Enter criteria:')
    let objToUpd = objManager.createObjectWithAttributes(tablesInfo[tableName].primaryKeys);
    if (!arrayTools.compareArrays(Object.keys(objToUpd), tablesInfo[tableName].primaryKeys))
        throw new Error('Invalid criteria!');

    console.log('\nEnter updated fields:')
    let newObj = objManager.createObjectWithAttributes(tablesInfo[tableName].attributes);
    if (Object.keys(newObj).length === 0)
        throw new Error('There is nothing to update in the object.');

    let res = await doAction(
        tableName,
        db.updateActor.bind(db, objToUpd, newObj),
        db.updateFilmDirector.bind(db, objToUpd, newObj),
        db.updateFilmStudio.bind(db, objToUpd, newObj),
        db.updateFilm.bind(db, objToUpd, newObj),
        db.updateCasting.bind(db, objToUpd, newObj)
    );

    if (res)
        console.table([res]);
    else
        console.log('\nObject with such criteria does not exist!');
}

module.exports.deleteData = async (db) => {
    console.clear();

    let tableName = readTableName();

    console.log('Enter criteria:')
    let objToDel = objManager.createObjectWithAttributes(tablesInfo[tableName].primaryKeys);
    if (!arrayTools.compareArrays(Object.keys(objToDel), tablesInfo[tableName].primaryKeys))
        throw new Error('Invalid criteria!');

    let res = await doAction(
        tableName,
        db.deleteActor.bind(db, objToDel),
        db.deleteFilmDirector.bind(db, objToDel),
        db.deleteFilmStudio.bind(db, objToDel),
        db.deleteFilm.bind(db, objToDel),
        db.deleteCasting.bind(db, objToDel)
    );

    if (res == 1)
        console.log('\nObject deleted!');
    else
        console.log('\nObject with such criteria does not exist!');
}

module.exports.searchData = async (db) => {
    console.clear();

    let userChoice = parseInt(readlineSync.question(
        'Choose operation:\n' +
        '1. Get films by studio and profit\n' +
        '2. Get actors by film and sex\n\n' +
        'Input: '
    ));

    console.clear();

    let res;

    switch (userChoice) {
        case 1:
            let studioName = readlineSync.question('Studio name: ');
            let isProfit = readlineSync.question('Іs profitable film? (true, false): ');

            res = await db.findFilmsByStudioAndProfit(studioName, isProfit);
            break;

        case 2:
            let filmName = readlineSync.question('Film name: ');
            let sex = readlineSync.question('Sex (male, female): ');

            res = await db.findActorsByFilmAndSex(filmName, sex);
            break;
        default:
            console.log('\n<< Please, enter another operation >>\n');
    }

    console.log('\n');
    if (!res || res && res.length == 0)
        console.log('Such entities does not exist!')
    else
        console.table(res);
}

module.exports.getAllData = async (db) => {
    console.clear();

    let tableName = readTableName();

    let res = await doAction(
        tableName,
        db.getAllActors.bind(db),
        db.getAllFilmDirectors.bind(db),
        db.getAllFilmStudios.bind(db),
        db.getAllFilms.bind(db),
        db.getAllCasting.bind(db)
    );

    console.log();
    if (!res || res && res.length == 0)
        console.log('Such entities does not exist!')
    else {
        if (tableName == 'films')
            console.log(res);
        else
            console.table(res);
    }
}

module.exports.getDataByPK = async (db) => {
    console.clear();

    let tableName = readTableName();

    console.log('Enter PK:')
    let criteria = objManager.createObjectWithAttributes(tablesInfo[tableName].primaryKeys);
    if (!arrayTools.compareArrays(Object.keys(criteria), tablesInfo[tableName].primaryKeys))
        throw new Error('Invalid PK!');

    let res = await doAction(
        tableName,
        db.getActor.bind(db, criteria),
        db.getFilmDirector.bind(db, criteria),
        db.getFilmStudio.bind(db, criteria),
        db.getFilm.bind(db, criteria),
        db.getCasting.bind(db, criteria)
    );

    if (!res || res && res.length == 0)
        console.log('Such entity does not exist!')
    else {
        if (tableName == 'films')
            console.log(res);
        else
            console.table([res]);
    }
}

module.exports.fullTextSearch = async (db) => {
    console.clear();

    let userChoice = parseInt(readlineSync.question(
        'Choose type of search:\n' +
        '1. Obligatory entry of the words\n' +
        '2. Whole phrase\n\n' +
        'Input: '
    ));

    console.clear();

    let res;

    switch (userChoice) {
        case 1:
            let words = readlineSync.question('Enter the words: ').split(' ');
            res = await db.textSearchByWords(words);
            break;

        case 2:
            let phrase = readlineSync.question('Enter the phrase: ');
            res = await db.textSearchByPhrase(phrase);
            break;

        default:
            console.log('\n<< Please, enter another operation >>\n');
    }

    console.log('\n');

    if (!res || res && res.length == 0)
        console.log('Such entity does not exist!')
    else
        console.log(res);
}

module.exports.cleareTables = async (db) => {
    console.clear();

    let tableName = readTableName();

    await doAction(
        tableName,
        db.clearActorsTable.bind(db),
        db.clearFilmDirectorsTable.bind(db),
        db.clearFilmStudiosTable.bind(db),
        db.clearFilmsTable.bind(db),
        db.clearCastingTable.bind(db)
    );
    // await db.syncTables();

    console.log('Success!')
}


async function doAction(
    tableName,
    actrosAction,
    filmDirectorsAction,
    filmStudiosAction,
    filmsAction,
    castingAction
) {
    switch (tableName) {
        case 'actors':
            return await actrosAction();

        case 'film_directors':
            return await filmDirectorsAction();

        case 'film_studios':
            return await filmStudiosAction();

        case 'films':
            return await filmsAction();

        case 'casting':
            return await castingAction();
    }
}

function readTableName() {
    const tableName = readlineSync.question(
        'Table name:\n' +
        '1. Actors\n' +
        '2. Film directos\n' +
        '3. Film studios\n' +
        '4. Films\n' +
        '5. Casting\n' +
        'Input: '
    );
    console.clear();

    const res = parseInt(tableName);

    switch (res) {
        case 1:
            return 'actors';
        case 2:
            return 'film_directors';
        case 3:
            return 'film_studios';
        case 4:
            return 'films';
        case 5:
            return 'casting';
        default:
            throw new Error(`Invalid table name <${tableName}>!`);
    }
}
