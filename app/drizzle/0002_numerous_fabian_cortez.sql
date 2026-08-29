CREATE TABLE `priceImportJobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`watchedRecordId` int NOT NULL,
	`providerJobId` varchar(80) NOT NULL,
	`source` varchar(80) NOT NULL DEFAULT 'google_shopping',
	`country` varchar(2) NOT NULL DEFAULT 'us',
	`status` enum('queued','completed','failed') NOT NULL DEFAULT 'queued',
	`resultUrl` varchar(2048),
	`errorMessage` text,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `priceImportJobs_id` PRIMARY KEY(`id`),
	CONSTRAINT `priceImportJobs_providerJobId_unique` UNIQUE(`providerJobId`)
);
--> statement-breakpoint
CREATE TABLE `priceImportSchedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`scheduleCronTaskUid` varchar(65),
	`cronExpression` varchar(120) NOT NULL,
	`market` varchar(2) NOT NULL DEFAULT 'us',
	`enabled` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `priceImportSchedules_id` PRIMARY KEY(`id`),
	CONSTRAINT `priceImportSchedules_scheduleCronTaskUid_unique` UNIQUE(`scheduleCronTaskUid`),
	CONSTRAINT `price_import_schedule_owner_idx` UNIQUE(`ownerId`)
);
--> statement-breakpoint
ALTER TABLE `watchEvents` MODIFY COLUMN `eventType` enum('created','updated','paused','resumed','price_logged','threshold_met','import_requested','import_completed','import_failed','email_sent','email_failed','email_skipped','deleted') NOT NULL;--> statement-breakpoint
ALTER TABLE `priceEntries` ADD `priceImportJobId` varchar(80);--> statement-breakpoint
ALTER TABLE `priceEntries` ADD CONSTRAINT `priceEntries_priceImportJobId_unique` UNIQUE(`priceImportJobId`);--> statement-breakpoint
ALTER TABLE `priceImportJobs` ADD CONSTRAINT `priceImportJobs_watchedRecordId_watchedRecords_id_fk` FOREIGN KEY (`watchedRecordId`) REFERENCES `watchedRecords`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `priceImportSchedules` ADD CONSTRAINT `priceImportSchedules_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `price_import_jobs_record_status_idx` ON `priceImportJobs` (`watchedRecordId`,`status`);