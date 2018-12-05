********************* T2 *********************

SET search_path TO film_industry,public;

// READ COMMITTED //

1 BEGIN transaction isolation level READ COMMITTED;

2 select * from casting;

3 select * from casting;    

5 commit;



// REPEATABLE READ //

1 BEGIN transaction isolation level REPEATABLE READ;

2 select * from casting;              

3 update casting set role = 'SUPER NEW ROLE' where actor_id = 1;

4 select * from casting; 

5 commit;   

INSERT into casting values (4,4,5);

// SERIALIZABLE //

1 BEGIN transaction isolation level SERIALIZABLE;

2 select * from casting;              

3 UPDATE casting SET role = (SELECT sum(film_id) FROM casting) where actor_id = 2;

4 select * from casting; 

5 commit;   