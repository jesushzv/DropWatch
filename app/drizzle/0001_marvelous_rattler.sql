CREATE TABLE `priceEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`watchedRecordId` int NOT NULL,
	`productUrl` varchar(2048) NOT NULL,
	`store` varchar(120) NOT NULL,
	`priceCents` int NOT NULL,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `priceEntries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `watchEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`watchedRecordId` int NOT NULL,
	`eventType` enum('created','updated','paused','resumed','price_logged','threshold_met','deleted') NOT NULL,
	`message` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `watchEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `watchedRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`originalRequest` text NOT NULL,
	`productName` varchar(255) NOT NULL,
	`stores` text NOT NULL,
	`thresholdCents` int NOT NULL,
	`status` enum('active','paused','triggered','deleted') NOT NULL DEFAULT 'active',
	`currentPriceCents` int,
	`currentStore` varchar(120),
	`dealVerdict` text,
	`lastAlertedAt` timestamp,
	`deletedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `watchedRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `priceEntries` ADD CONSTRAINT `priceEntries_watchedRecordId_watchedRecords_id_fk` FOREIGN KEY (`watchedRecordId`) REFERENCES `watchedRecords`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `watchEvents` ADD CONSTRAINT `watchEvents_watchedRecordId_watchedRecords_id_fk` FOREIGN KEY (`watchedRecordId`) REFERENCES `watchedRecords`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `watchedRecords` ADD CONSTRAINT `watchedRecords_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `price_entries_recorded_idx` ON `priceEntries` (`watchedRecordId`,`recordedAt`);--> statement-breakpoint
CREATE INDEX `watch_events_recorded_idx` ON `watchEvents` (`watchedRecordId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `watched_records_user_status_idx` ON `watchedRecords` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `watched_records_user_updated_idx` ON `watchedRecords` (`userId`,`updatedAt`);