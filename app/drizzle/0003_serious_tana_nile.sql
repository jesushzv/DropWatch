CREATE TABLE `notificationPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`priceAlertEmails` boolean NOT NULL DEFAULT true,
	`unsubscribedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notificationPreferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `notification_preferences_user_idx` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `watchedRecords` ADD `sources` varchar(512) NOT NULL DEFAULT '["google_shopping"]';--> statement-breakpoint
ALTER TABLE `notificationPreferences` ADD CONSTRAINT `notificationPreferences_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;
