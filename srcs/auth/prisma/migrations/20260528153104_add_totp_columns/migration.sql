-- AlterTable
ALTER TABLE `users` ADD COLUMN `last_totp_step_consumed` BIGINT NULL,
    ADD COLUMN `totp_enabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `totp_secret_encrypted` VARCHAR(255) NULL;
