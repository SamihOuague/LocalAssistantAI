-- CreateTable
CREATE TABLE `avatars` (
    `user_id` VARCHAR(36) NOT NULL,
    `data` MEDIUMBLOB NOT NULL,
    `mime_type` VARCHAR(255) NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `avatars` ADD CONSTRAINT `avatars_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
