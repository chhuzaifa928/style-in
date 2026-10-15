-- Migration 005 — admin picks which products appear in each homepage rail.
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

CALL add_col('products','show_in_new',"`show_in_new` TINYINT(1) NOT NULL DEFAULT 0 AFTER `is_featured`");
CALL add_col('products','show_in_best',"`show_in_best` TINYINT(1) NOT NULL DEFAULT 0 AFTER `show_in_new`");
CALL add_col('products','show_in_sale',"`show_in_sale` TINYINT(1) NOT NULL DEFAULT 0 AFTER `show_in_best`");

DROP PROCEDURE IF EXISTS add_col;
