const Sequelize = require('sequelize');

const filmDirectors = (sequelize, DataTypes) => {
    const FilmDirectors = sequelize.define('film_directors', {
        _id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        fullname: {
            type: Sequelize.STRING,
            allowNull: false
        },
        sex: {
            type: Sequelize.ENUM('male', 'female'),
            allowNull: false
        },
        birthday: {
            type: Sequelize.DATE,
            allowNull: false
        },
        nationality: {
            type: Sequelize.STRING,
            allowNull: false
        }
    });

    return FilmDirectors;
};

module.exports = filmDirectors;