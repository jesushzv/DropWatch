ALTER TABLE `priceEntries` ADD `freshnessState` varchar(24) DEFAULT 'fresh' NOT NULL;--> statement-breakpoint
ALTER TABLE `priceEntries` ADD `observedAt` timestamp DEFAULT (now()) NOT NULL;