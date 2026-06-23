CREATE TABLE `articles` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NULL,
  `content` TEXT NULL,
  `cover` VARCHAR(255) NULL,
  `slug` VARCHAR(255) NULL,
  `keywords` VARCHAR(255) NULL,
  `created_at` TIMESTAMP(0) NULL,
  `updated_at` TIMESTAMP(0) NULL,

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET latin1 COLLATE latin1_swedish_ci ENGINE = InnoDB;
