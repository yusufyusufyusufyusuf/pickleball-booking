ALTER TABLE `subscriptions` ADD `status` enum('active','past_due','cancelled') DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `subscriptions` DROP COLUMN `substatus`;