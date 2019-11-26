CREATE DATABASE server2;
\c server2;


create table attendees
(
    firstname text,
    lastname text,
    username text,
    email text,
    PRIMARY KEY (username)
);

INSERT INTO attendees (firstname, lastname, username, email) VALUES
    ('Ryan', 'kohler', 'rkohls21', 'rkohls@gmail.com'),
    ('Colin', 'Vitkus', 'commandocolin', 'c.vitkus@gmail.com'),
    ('Kyle', 'Ortiz', 'kyleguy33', 'kortiz33@gmail.com'),
    ('Joe', 'Mego', 'myguymego', 'jojomego@gmail.com'),
    ('Julian', 'Perez', 'juju1999', 'jujuperez41@gmail.com'),
    ('Diego', 'Phillips', 'jauntsjohnson', 'dagophillips@gmail.com');

create table workshop(
    id serial PRIMARY KEY,
    title text,
    date DATE,
    location text,
    maxseats INTEGER,
    instructor text
);

create table workshop_attendees(
    attendee text references attendees(username),
    workshop_id integer references workshop(id),
    PRIMARY KEY (attendee, workshop_id)
);
