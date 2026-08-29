ALTER TABLE `priceEntries` ADD `shippingCents` int;--> statement-breakpoint
ALTER TABLE `priceEntries` ADD `taxCents` int;--> statement-breakpoint
ALTER TABLE `priceEntries` ADD `estimatedTotalCents` int;--> statement-breakpoint
ALTER TABLE `priceEntries` ADD `currency` varchar(3) DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE `priceEntries` ADD `condition` varchar(32);--> statement-breakpoint
ALTER TABLE `priceEntries` ADD `fulfillment` varchar(80);--> statement-breakpoint
ALTER TABLE `priceEntries` ADD `availability` varchar(32);--> statement-breakpoint
ALTER TABLE `priceEntries` ADD `seller` varchar(160);--> statement-breakpoint
ALTER TABLE `priceEntries` ADD `destinationPostalCode` varchar(10);--> statement-breakpoint
ALTER TABLE `priceEntries` ADD `costConfidence` varchar(24) DEFAULT 'unknown' NOT NULL;--> statement-breakpoint
ALTER TABLE `priceEntries` ADD `evidenceJson` text;--> statement-breakpoint
ALTER TABLE `priceImportJobs` ADD `resultReason` varchar(120);--> statement-breakpoint
ALTER TABLE `watchedRecords` ADD `alertBasis` varchar(32) DEFAULT 'item_price' NOT NULL;--> statement-breakpoint
ALTER TABLE `watchedRecords` ADD `destinationPostalCode` varchar(10);--> statement-breakpoint
ALTER TABLE `watchedRecords` ADD `observationMode` boolean DEFAULT false NOT NULL;