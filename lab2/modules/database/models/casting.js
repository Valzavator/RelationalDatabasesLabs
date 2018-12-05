const Sequelize = require('sequelize');

const casting = (sequelize, DataTypes) => {
    const Casting = sequelize.define('casting', {
        film_id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            allowNull: false,
        },
        actor_id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            allowNull: false,
        },
        role: {
            type: Sequelize.STRING,
            primaryKey: true,
            allowNull: false
        }
    },
        { freezeTableName: true });

    Casting.associate = models => {
        Casting.belongsTo(models.Films, {
            foreignKey: 'film_id',
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE'
        });
        Casting.belongsTo(models.Actors, {
            foreignKey: 'actor_id',
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE'
        });
    };

    return Casting;
};

module.exports = casting;