CREATE TABLE `products` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(200) NOT NULL,
  `sku` VARCHAR(11) NOT NULL,
  `image` TEXT NOT NULL,
  `link` TEXT NOT NULL,
  `colorway` VARCHAR(80) NOT NULL,
  `description` TEXT NOT NULL,
  `content` TEXT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `price` DECIMAL(5, 2) NOT NULL,
  `coming_soon` INTEGER NOT NULL,
  `views` INTEGER NOT NULL DEFAULT 0,
  `resale` VARCHAR(50) NOT NULL DEFAULT 'medium',
  `type` VARCHAR(40) NOT NULL DEFAULT 'sneakers',
  `stockx_url` VARCHAR(90) NOT NULL,
  `stockx_thumbnail_url` TEXT NOT NULL,
  `stockx_ticker_symbol` VARCHAR(90) NOT NULL,
  `stockx_name` VARCHAR(90) NOT NULL,
  `stockx_make` VARCHAR(90) NOT NULL,
  `stockx_model` VARCHAR(90) NOT NULL,
  `stockx_price` INTEGER NOT NULL,
  `stockx_highest_bid` INTEGER NOT NULL,
  `stockx_total_dollars` INTEGER NOT NULL,
  `stockx_lowest_ask` INTEGER NOT NULL,
  `stockx_last_sale` INTEGER NOT NULL,
  `stockx_deadstock_sold` INTEGER NOT NULL,
  `stockx_sales_last_72` INTEGER NOT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,

  PRIMARY KEY (`id`),
  KEY `id` (`id`)
) DEFAULT CHARACTER SET latin1 COLLATE latin1_swedish_ci ENGINE = InnoDB;

CREATE TABLE `comments` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `member_id` INTEGER NULL,
  `product_id` INTEGER NULL,
  `comment` VARCHAR(140) NULL,
  `votes_up` INTEGER NOT NULL DEFAULT 1,
  `votes_down` INTEGER NOT NULL,
  `created_at` DATETIME NULL,
  `updated_at` DATETIME NULL,

  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`)
) DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci ENGINE = InnoDB;
