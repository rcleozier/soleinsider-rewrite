CREATE TABLE `members` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(80) NOT NULL,
  `password` VARCHAR(80) NOT NULL,
  `phone_number` VARCHAR(80) NOT NULL,
  `carrier` INTEGER NOT NULL,
  `member_type` VARCHAR(40) NULL,
  `verified` BINARY(1) NOT NULL,
  `profile_image` VARCHAR(255) NOT NULL DEFAULT 'default.png',
  `bounced_email` INTEGER NOT NULL,
  `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP(0) NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`id`),
  KEY `email` (`email`)
) DEFAULT CHARACTER SET latin1 COLLATE latin1_swedish_ci ENGINE = InnoDB;

CREATE TABLE `member_logins` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `member_id` INTEGER NULL,
  `timestamp` DATETIME NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET latin1 COLLATE latin1_swedish_ci ENGINE = InnoDB;
