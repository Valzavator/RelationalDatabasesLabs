const Sequelize = require('sequelize');

const actors = (sequelize, DataTypes) => {
    const Actors = sequelize.define('actors', {
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

    return Actors;
};

module.exports = actors;