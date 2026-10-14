-- ============================================================================
-- StyleIn — Database Schema (MySQL 8.x / MariaDB)
-- Paste into Hostinger phpMyAdmin → SQL tab → Go.
-- Target an already-created database (hPanel → Databases → MySQL Databases).
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ────────────────────────────────────────────────────────────
-- 1. site_settings  (single-row site-wide CMS content)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `site_settings` (
  `id`                     TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `marquee_text`           VARCHAR(500)   NOT NULL DEFAULT 'FREE DELIVERY OVER PKR 3,500 • NEW DROPS EVERY FRIDAY • CASH ON DELIVERY NATIONWIDE',
  `phone_primary`          VARCHAR(40)    NOT NULL DEFAULT '+92 300 0000000',
  `whatsapp_number`        VARCHAR(40)    NOT NULL DEFAULT '+92 300 0000000',
  `concierge_email`        VARCHAR(190)   NOT NULL DEFAULT 'hello@stylein.pk',
  `address`                VARCHAR(500)   NOT NULL DEFAULT 'StyleIn Boutique, Gulberg III, Lahore, Pakistan',
  `store_hours`            VARCHAR(190)   NOT NULL DEFAULT 'Mon–Sat 12pm–9pm',
  `instagram_url`          VARCHAR(300)   NOT NULL DEFAULT '',
  `facebook_url`           VARCHAR(300)   NOT NULL DEFAULT '',
  `tiktok_url`             VARCHAR(300)   NOT NULL DEFAULT '',
  `shipping_fee`           DECIMAL(10,2)  NOT NULL DEFAULT 200.00,
  `free_delivery_threshold` DECIMAL(10,2) NOT NULL DEFAULT 3500.00,
  `hero_left_media_url`    VARCHAR(500)   NOT NULL DEFAULT '',
  `hero_left_eyebrow`      VARCHAR(120)   NOT NULL DEFAULT 'Streetwear Apparel',
  `hero_left_title`        VARCHAR(160)   NOT NULL DEFAULT 'The Off-Duty Edit',
  `hero_left_cta_label`    VARCHAR(40)    NOT NULL DEFAULT 'Shop Clothes',
  `hero_left_category_id`  INT UNSIGNED   NULL,
  `hero_right_media_url`   VARCHAR(500)   NOT NULL DEFAULT '',
  `hero_right_eyebrow`     VARCHAR(120)   NOT NULL DEFAULT 'Kinetic Footwear',
  `hero_right_title`       VARCHAR(160)   NOT NULL DEFAULT 'Sole Movement',
  `hero_right_cta_label`   VARCHAR(40)    NOT NULL DEFAULT 'Shop Shoes',
  `hero_right_category_id` INT UNSIGNED   NULL,
  `hero_slides`            JSON           NULL,
  `updated_at`             TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `chk_single_row` CHECK (`id` = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `site_settings` (`id`) VALUES (1)
  ON DUPLICATE KEY UPDATE `id` = `id`;

-- ────────────────────────────────────────────────────────────
-- 2. categories  (recursive parent-child tree)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `categories` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(120) NOT NULL,
  `slug`       VARCHAR(140) NOT NULL,
  `parent_id`  INT UNSIGNED NULL DEFAULT NULL,
  `image_url`  VARCHAR(500) NULL DEFAULT NULL,
  `is_active`  TINYINT(1)   NOT NULL DEFAULT 1,
  `sort_order` INT          NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_categories_slug` (`slug`),
  KEY `idx_categories_parent` (`parent_id`),
  CONSTRAINT `fk_categories_parent`
    FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `categories` (`name`, `slug`, `parent_id`, `is_active`, `sort_order`) VALUES
  ('Clothes', 'clothes', NULL, 1, 1),
  ('Shoes',   'shoes',   NULL, 1, 2)
  ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- ────────────────────────────────────────────────────────────
-- 3. products
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `products` (
  `id`                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `category_id`       INT UNSIGNED NULL DEFAULT NULL,
  `name`              VARCHAR(200)  NOT NULL,
  `slug`              VARCHAR(220)  NOT NULL,
  `description`       TEXT          NULL,
  `actual_price`      DECIMAL(10,2) NOT NULL DEFAULT 0.00,  -- compare-at / original
  `discounted_price`  DECIMAL(10,2) NOT NULL DEFAULT 0.00,  -- selling price
  `sizes_available`   JSON          NULL,                   -- ["S","M","L"] or ["40","41"]
  `stock`             INT           NOT NULL DEFAULT 0,
  `sort_order`        INT           NOT NULL DEFAULT 0,      -- lower shows first
  `is_featured`       TINYINT(1)    NOT NULL DEFAULT 0,
  `is_active`         TINYINT(1)    NOT NULL DEFAULT 1,      -- 0 = archived
  `created_at`        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_products_slug` (`slug`),
  KEY `idx_products_category` (`category_id`),
  KEY `idx_products_active` (`is_active`),
  CONSTRAINT `fk_products_category`
    FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 4. product_images  (cascade delete with parent product)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `product_images` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` INT UNSIGNED NOT NULL,
  `image_url`  VARCHAR(500) NOT NULL,
  `is_primary` TINYINT(1)   NOT NULL DEFAULT 0,
  `sort_order` INT          NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_images_product` (`product_id`),
  CONSTRAINT `fk_images_product`
    FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 5. orders  (Cash on Delivery)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `orders` (
  `id`               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_number`     VARCHAR(40)   NOT NULL,
  `customer_name`    VARCHAR(190)  NOT NULL,
  `customer_phone`   VARCHAR(40)   NOT NULL,
  `shipping_address` VARCHAR(600)  NOT NULL,
  `city`             VARCHAR(120)  NOT NULL,
  `items_json`       JSON          NOT NULL,
  `subtotal`         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `shipping_fee`     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `total_amount`     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `payment_method`   VARCHAR(20)   NOT NULL DEFAULT 'COD',
  `order_status`     ENUM('Pending','Confirmed','Dispatched','Delivered','Cancelled')
                       NOT NULL DEFAULT 'Pending',
  `created_at`       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_orders_number` (`order_number`),
  KEY `idx_orders_status` (`order_status`),
  KEY `idx_orders_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 6. admin_users  (bcrypt password hashes)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `admin_users` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username`      VARCHAR(80)  NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role`          VARCHAR(40)  NOT NULL DEFAULT 'admin',
  `created_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_admin_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default admin seed.
-- Username: admin   Password: StyleIn@2026   (CHANGE IMMEDIATELY after first login)
-- The hash below is a bcrypt hash of 'StyleIn@2026' (cost 10). Generate your
-- own with:  node scripts/hash-password.js "YourNewPassword"
INSERT INTO `admin_users` (`username`, `password_hash`, `role`) VALUES
  ('admin', '$2a$10$Y4nEg6TKpNNBFNM3Y/ran.g7gusshgW1wIte2cnUCYU79qvM6Z7le', 'admin')
  ON DUPLICATE KEY UPDATE `username` = `username`;

-- ────────────────────────────────────────────────────────────
-- 7. newsletter_subscribers  (footer signups)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `newsletter_subscribers` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email`      VARCHAR(190) NOT NULL,
  `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_newsletter_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- Done. Remember to:
--   1. Log into /admin with the seed credentials.
--   2. Immediately change the admin password (or re-seed with your own hash).
--   3. Add your real categories, products, and images from the admin panel.
-- ============================================================================
