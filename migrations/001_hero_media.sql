-- Migration 001 — Homepage hero media (image/video) + editable hero text.
-- Run this ONCE against an existing `stylein` database that was created before
-- hero fields existed. Safe to run once; re-running errors because the columns
-- already exist (that's fine — it means you're already migrated).
--
-- In MySQL Workbench: open this file, make sure `stylein` is the bold (default)
-- schema, then click the lightning bolt.

USE stylein;

ALTER TABLE `site_settings`
  ADD COLUMN `hero_left_media_url`  VARCHAR(500) NOT NULL DEFAULT '' AFTER `free_delivery_threshold`,
  ADD COLUMN `hero_left_eyebrow`    VARCHAR(120) NOT NULL DEFAULT 'Streetwear Apparel' AFTER `hero_left_media_url`,
  ADD COLUMN `hero_left_title`      VARCHAR(160) NOT NULL DEFAULT 'The Off-Duty Edit' AFTER `hero_left_eyebrow`,
  ADD COLUMN `hero_right_media_url` VARCHAR(500) NOT NULL DEFAULT '' AFTER `hero_left_title`,
  ADD COLUMN `hero_right_eyebrow`   VARCHAR(120) NOT NULL DEFAULT 'Kinetic Footwear' AFTER `hero_right_media_url`,
  ADD COLUMN `hero_right_title`     VARCHAR(160) NOT NULL DEFAULT 'Sole Movement' AFTER `hero_right_eyebrow`;
