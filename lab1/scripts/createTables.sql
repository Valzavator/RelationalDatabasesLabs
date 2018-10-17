CREATE TABLE IF NOT EXISTS film_directors (
  _id SERIAL PRIMARY KEY,
  fullname VARCHAR(255) NOT NULL,
  sex sex NOT NULL,
  birthday DATE NOT NULL,
  nationality VARCHAR(255) NOT NULL
);


CREATE TABLE IF NOT EXISTS actors (
  _id SERIAL PRIMARY KEY,
  fullname VARCHAR(255) NOT NULL,
  sex sex NOT NULL,
  birthday DATE NOT NULL,
  nationality VARCHAR(255) NOT NULL
);


CREATE TABLE IF NOT EXISTS film_studios (
  _id SERIAL PRIMARY KEY,
  studio_name VARCHAR(255) NOT NULL UNIQUE,
  founded DATE NOT NULL,
  location VARCHAR(255) NOT NULL
);


CREATE TABLE IF NOT EXISTS films (
  _id SERIAL PRIMARY KEY,
  film_name VARCHAR(255) NOT NULL,
  release_date DATE NOT NULL,
  plot TEXT,
  running_time SMALLINT NOT NULL CONSTRAINT positive_time CHECK (running_time > 0),
  profitable boolean NOT NULL,
  director_id INTEGER NOT NULL REFERENCES film_directors ON UPDATE CASCADE ON DELETE RESTRICT,
  studio_id INTEGER NOT NULL REFERENCES film_studios ON UPDATE CASCADE ON DELETE RESTRICT,
  tsv tsvector NOT NULL
);

CREATE INDEX search_idx ON films USING GIN (tsv);

CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE
ON films FOR EACH ROW EXECUTE PROCEDURE
tsvector_update_trigger(tsv, 'pg_catalog.english', plot);

CREATE TABLE IF NOT EXISTS casting (
  film_id INTEGER NOT NULL REFERENCES films ON UPDATE CASCADE ON DELETE CASCADE,
  actor_id INTEGER NOT NULL REFERENCES actors ON UPDATE CASCADE ON DELETE RESTRICT,
  ROLE VARCHAR(255) NOT NULL,
  PRIMARY KEY (film_id, actor_id, ROLE)
);
