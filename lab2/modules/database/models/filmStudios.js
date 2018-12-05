const Sequelize = require('sequelize');

const filmStudios = (sequelize, DataTypes) => {
    const FilmStudios = sequelize.define('film_studios', {
        _id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        studio_name: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
        },
        founded: {
            type: Sequelize.DATE,
            allowNull: false
        },
        location: {
            type: Sequelize.STRING,
            allowNull: false
        }
    });

    return FilmStudios;
};

module.exports = filmStudios;