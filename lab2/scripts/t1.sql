********************* T1 *********************

SET search_path TO film_industry,public;

// READ COMMITTED //

1 BEGIN transaction isolation level READ COMMITTED;

2 select * from casting;              

3 update casting set role = 'NEW ROLE' where actor_id = 1;

4 select * from casting; 

5 commit;                             

// REPEATABLE READ //

1 BEGIN transaction isolation level REPEATABLE READ;

2 select * from casting;              

3 update casting set role = 'NEW ROLE' where actor_id = 1;

4 select * from casting; 

5 commit;        

INSERT into casting values (4,4,5);

// SERIALIZABLE //

1 BEGIN transaction isolation level SERIALIZABLE;

2 select * from casting;              

3 UPDATE casting SET role = (SELECT sum(film_id) FROM casting) where actor_id = 1;

4 UPDATE casting SET film_id = 10 where actor_id = 1;

5 select * from casting; 

6 commit;   


DELETE FROM casting;
INSERT INTO casting VALUES(1,1,1),(2,2,2);
