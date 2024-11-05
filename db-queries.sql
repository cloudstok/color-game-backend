
DROP DATABASE if EXISTS `color_game`;
CREATE DATABASE IF NOT EXISTS `color_game`;
use `color_game`;

 CREATE TABLE IF NOT EXISTS `settlement`(
   `settlement_id` int NOT NULL AUTO_INCREMENT,
   `bet_id` varchar(255) DEFAULT NULL,
   `lobby_id` varchar(255) DEFAULT NULL,
   `user_id` varchar(255) DEFAULT NULL,
   `operator_id` varchar(255) DEFAULT NULL,
   `name` varchar(255) DEFAULT NULL,
   `bet_amount` varchar(255) DEFAULT NULL,
   `avatar` VARCHAR(255) NOT NULL,
   `balance` varchar(255) DEFAULT NULL,
   `max_mult` varchar(255) DEFAULT NULL,
   `status` varchar(255) DEFAULT "CRASHED",
   `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
   PRIMARY KEY (`settlement_id`)
 );

 CREATE TABLE IF NOT EXISTS `round_stats` (
   `id` int primary key  auto_increment,
   `lobby_id` varchar(255)  NOT NULL,
   `start_time` varchar(255) DEFAULT NULL,
   `max_mult` varchar(255) DEFAULT NULL,
   `end_time` varchar(255) DEFAULT NULL,
   `total_bets` varchar(255) DEFAULT NULL,
   `total_players` varchar(255) DEFAULT NULL,
   `total_bet_amount` varchar(255) DEFAULT NULL,
   `total_cashout_amount` varchar(255) DEFAULT NULL,
   `biggest_winner` varchar(255) DEFAULT NULL,
   `biggest_looser` varchar(255) DEFAULT NULL,
   `total_round_settled` varchar(255) DEFAULT NULL,
   `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
 );



CREATE TABLE IF NOT EXISTS `lobbies` (
   `id` int primary key  auto_increment,
   `lobby_id` varchar(255) NOT NULL,
   `start_delay` varchar(45) NOT NULL,
   `end_delay` varchar(45) NOT NULL,
   `max_mult` varchar(60) NOT NULL,
   `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
   `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
 );


CREATE TABLE IF NOT EXISTS `bets` (
   `id` int primary key  auto_increment,
   `bet_id` varchar(255) NOT NULL,
   `lobby_id` varchar(255) NOT NULL,
   `user_id` varchar(255) NOT NULL,
   `operator_id` varchar(255) DEFAULT NULL,
   `bet_amount` VARCHAR(255) NOT NULL,
   `avatar` VARCHAR(255) NULL ,
   `balance` VARCHAR(45) NOT NULL ,
   `name` VARCHAR(45) NOT NULL ,
   `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
   `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
 ); 


CREATE TABLE user_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    operator_id varchar(255) DEFAULT NULL,
    msg TEXT,
    gif varchar(255) DEFAULT null,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);



CREATE TABLE user_likes (
   id int primary key  auto_increment,
    user_id VARCHAR(255)  not null ,
    operator_id varchar(255) DEFAULT NULL,
    msg_id INT not null ,
    is_like BOOLEAN default 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE `users` (
  `id` int not null auto_increment,
   `user_id` varchar(255) NOT NULL,
   `operator_id` varchar(255) DEFAULT NULL,
   `name` varchar(255) DEFAULT NULL,
   `balance` varchar(11),
   `avatar` varchar(255) ,
   `session_token` varchar(60) not null,
   `is_active` tinyint NOT NULL DEFAULT '1',
   `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
   `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
   PRIMARY KEY (`id`)
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;




-- users table
create index user_id_index on users (user_id);
create index session_toke_index on users (session_token);
-- uesr_like table
create index user_id_index on user_likes (user_id);
create index session_toke_index on user_likes (msg_id);
-- bets table
create index user_id_index on bets (bet_id);
create index session_toke_index on bets (user_id);
-- settlement table
create index user_id_index on settlement (bet_id);
create index session_toke_index on settlement (user_id);


ALTER TABLE `users` ADD COLUMN `socket_id` VARCHAR(255) NULL AFTER `session_token`;
ALTER TABLE `user_messages` ADD COLUMN `avatar` VARCHAR(255) ;
ALTER TABLE `user_messages` ADD COLUMN `name` VARCHAR(255);


ALTER TABLE `user_messages` ADD COLUMN `user_likes` TEXT NULL DEFAULT NULL AFTER `gif`;
DROP TABLE `user_likes`;

--INDEX QUERIES
ALTER TABLE `color_game`.`bets` ADD INDEX `lobby_id_index` (`lobby_id` ASC)VISIBLE, ADD INDEX `operator_id_index` (`operator_id` ASC) VISIBLE, ADD INDEX `bet_amount_index` (`bet_amount` ASC) VISIBLE, ADD INDEX `created_at_index` (`created_at` ASC) VISIBLE;
ALTER TABLE `color_game`.`round_stats` ADD INDEX `lobby_id_index` (`lobby_id` ASC) VISIBLE, ADD INDEX `max_mult_index` (`max_mult` ASC) VISIBLE, ADD INDEX `created_at_index` (`created_at` ASC) VISIBLE;
ALTER TABLE `color_game`.`settlement` ADD INDEX `lobby_id_index` (`lobby_id` ASC) INVISIBLE,ADD INDEX `bet_amount_index` (`bet_amount` ASC) INVISIBLE, ADD INDEX `max_mult_index` (`max_mult` ASC) VISIBLE;
ALTER TABLE `color_game`.`user_messages` ADD INDEX `user_id` (`user_id` ASC) INVISIBLE, ADD INDEX `operator_id_index` (`operator_id` ASC) VISIBLE, ADD INDEX `created_at_index` (`created_at` ASC) VISIBLE;


ALTER TABLE `color_game`.`bets` ADD COLUMN `auto_cashout` DECIMAL(10, 2) NULL DEFAULT NULL AFTER `bet_amount`;
ALTER TABLE `color_game`.`settlement` ADD COLUMN `auto_cashout` DECIMAL(10, 2) NULL DEFAULT NULL AFTER `bet_amount`;
