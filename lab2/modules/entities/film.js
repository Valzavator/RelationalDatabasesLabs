module.exports = class Film {
    constructor(film_name, release_date, plot, running_time, profitable, director_id, studio_id) {
        this.film_name = film_name;
        this.release_date = release_date;
        this.plot = plot;
        this.running_time = running_time;
        this.profitable = profitable;
        this.director_id = director_id;
        this.studio_id = studio_id;
    }
}