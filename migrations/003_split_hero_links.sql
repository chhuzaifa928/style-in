-- Migration 003 — admin-controlled split hero panels (button text + link).
-- Idempotent: safe to run once, even if run again. In MySQL Workbench make
-- `stylein` the bold (default) schema, then click the lightning bolt.

USE stylein;

DROP PROCEDURE IF EXISTS add_col;
DELIMITER //
CREATE PROCEDURE add_col(IN tbl VARCHAR(64), IN col VARCHAR(64), IN ddl TEXT)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = tbl AND column_name = col
  ) THEN
    SET @s = CONCAT('ALTER TABLE `', tbl, '` ADD COLUMN ', ddl);
    PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
  END IF;
END //
DELIMITER ;

CALL add_col('site_settings','hero_left_cta_label',"`hero_left_cta_label` VARCHAR(40) NOT NULL DEFAULT 'Shop Clothes'");
CALL add_col('site_settings','hero_left_category_id',"`hero_left_category_id` INT UNSIGNED NULL");
CALL add_col('site_settings','hero_right_cta_label',"`hero_right_cta_label` VARCHAR(40) NOT NULL DEFAULT 'Shop Shoes'");
CALL add_col('site_settings','hero_right_category_id',"`hero_right_category_id` INT UNSIGNED NULL");

DROP PROCEDURE IF EXISTS add_col;
