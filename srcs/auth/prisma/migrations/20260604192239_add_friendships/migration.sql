-- CreateTable
CREATE TABLE `friendships` (
    `user_low` VARCHAR(36) NOT NULL,
    `user_high` VARCHAR(36) NOT NULL,
    `requested_by` VARCHAR(36) NOT NULL,
    `status` ENUM('PENDING', 'ACCEPTED') NOT NULL DEFAULT 'PENDING',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `friendships_user_high_idx`(`user_high`),
    PRIMARY KEY (`user_low`, `user_high`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `friendships` ADD CONSTRAINT `friendships_user_low_fkey` FOREIGN KEY (`user_low`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `friendships` ADD CONSTRAINT `friendships_user_high_fkey` FOREIGN KEY (`user_high`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
