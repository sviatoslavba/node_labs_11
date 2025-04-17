create database petition_service;

use petition_service;

create table petitions(
	id int primary key auto_increment,
    author_id int  not null,
    title varchar(50) not null,
    text varchar(1000) not null,
    petition_current int not null default 0,
    creation_date date not null,
    expiry_date date not null,
    status enum ("In_Progress", "rejected", "accepted", "on-review", "expired")
    
);

create table authors(
	id int primary key auto_increment,
	username varchar(100) not null,
    password varchar(100) not null
);

create table signatures(
	id int primary key auto_increment,
	author_id int not null,
    petition_id int not null,
    created_at timestamp default current_timestamp,
    
    unique key unique_signature(author_id, petition_id)
);

alter table petitions
add constraint author_petition
foreign key (author_id) references authors(id) on delete cascade;

alter table signatures
add constraint signature_author
foreign key (author_id) references authors(id) on delete cascade;

alter table signatures
add constraint signature_petition
foreign key (petition_id) references petitions(id) on delete cascade
