-- Migration 002 — Full-width hero slider + newsletter subscribers.
-- Run ONCE against an existing `stylein` database. In MySQL Workbench, make
-- sure `stylein` is the bold (default) schema, then click the lightning bolt.

USE stylein;

-- Hero slider: stored as a JSON array of slides on the single settings row.
ALTER TABLE `site_settings`
  ADD COLUMN `hero_slides` JSON NULL AFTER `hero_right_title`;

-- Newsletter signups captured from the footer.
CREATE TABLE IF NOT EXISTS `newsletter_subscribers` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email`      VARCHAR(190) NOT NULL,
  `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_newsletter_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
