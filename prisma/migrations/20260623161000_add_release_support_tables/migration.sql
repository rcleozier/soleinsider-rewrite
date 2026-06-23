CREATE TABLE `temp_product_images` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` INTEGER NULL,
  `image` TEXT NULL,

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci ENGINE = InnoDB;

CREATE TABLE `temp_products` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(200) NOT NULL,
  `sku` VARCHAR(11) NOT NULL,
  `image` TEXT NOT NULL,
  `link` TEXT NOT NULL,
  `description` TEXT NOT NULL,
  `content` TEXT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `hash` VARCHAR(255) NULL,
  `price` DECIMAL(5, 2) NOT NULL,
  `status` VARCHAR(11) NULL DEFAULT 'new',
  `type` VARCHAR(30) NOT NULL,
  `release_date` DATETIME NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,

  PRIMARY KEY (`id`),
  KEY `id` (`id`)
) DEFAULT CHARACTER SET latin1 COLLATE latin1_swedish_ci ENGINE = InnoDB;

CREATE TABLE `release_interest` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `member_id` INTEGER NULL,
  `product_id` INTEGER NULL,
  `status` INTEGER NULL,
  `created_at` DATETIME NULL,

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci ENGINE = InnoDB;

CREATE TABLE `release_date_update_log` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` INTEGER NULL,
  `old_date` TIMESTAMP(0) NULL,
  `new_date` TIMESTAMP(0) NULL,
  `created_at` TIMESTAMP(0) NULL,
  `updated_at` TIMESTAMP(0) NULL,

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci ENGINE = InnoDB;

CREATE TABLE `releases` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `product_id` INTEGER NOT NULL,
  `release_date` TIMESTAMP(0) NOT NULL DEFAULT '0000-00-00 00:00:00',
  `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP(0) NOT NULL DEFAULT '0000-00-00 00:00:00',

  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`)
) DEFAULT CHARACTER SET latin1 COLLATE latin1_swedish_ci ENGINE = InnoDB;

CREATE TABLE `product_images` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `product_id` INTEGER NOT NULL,
  `optimized` TINYINT(1) NOT NULL DEFAULT 0,
  `image` TEXT NOT NULL,

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET latin1 COLLATE latin1_swedish_ci ENGINE = MyISAM;

CREATE TABLE `product_checks` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `product_id` INTEGER NOT NULL,
  `link` TEXT NOT NULL,
  `search_string` TEXT NOT NULL,
  `false_negative` TEXT NOT NULL,
  `status` INTEGER NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP(0) NOT NULL DEFAULT '0000-00-00 00:00:00',

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET latin1 COLLATE latin1_swedish_ci ENGINE = InnoDB;
