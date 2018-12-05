const tablesInfo = {
    actors: {
        primaryKeys: ['_id'],
        attributes: ['fullname', 'sex', 'birthday', 'nationality'],
    },
    film_directors: {
        primaryKeys: ['_id'],
        attributes: ['fullname', 'sex', 'birthday', 'nationality'],
    },
    film_studios: {
        primaryKeys: ['_id'],
        attributes: ['studio_name', 'founded', 'location'],
    },
    films: {
        primaryKeys: ['_id'],
        attributes: ['film_name', 'release_date', 'plot', 'running_time', 'profitable', 'director_id', 'studio_id'],
    },
    casting: {
        primaryKeys: ['film_id', 'actor_id', 'role'],
        attributes: ['film_id', 'actor_id', 'role'],
    },
}

module.exports = tablesInfo;