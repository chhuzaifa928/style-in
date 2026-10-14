-- Migration 004 — admin-controlled product display order.
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

-- Lower sort_order shows first; 0 (default) keeps newest-first behavior.
CALL add_col('products','sort_order',"`sort_order` INT NOT NULL DEFAULT 0 AFTER `stock`");

DROP PROCEDURE IF EXISTS add_col;
