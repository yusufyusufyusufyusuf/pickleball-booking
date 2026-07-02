CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`stripeSubscriptionId` varchar(255) NOT NULL,
	`stripeCustomerId` varchar(255) NOT NULL,
	`tier` enum('silver','gold') NOT NULL,
	`substatus` enum('active','past_due','cancelled') NOT NULL DEFAULT 'active',
	`currentPeriodStart` int NOT NULL,
	`currentPeriodEnd` int NOT NULL,
	`cancelledAt` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscriptions_stripeSubscriptionId_unique` UNIQUE(`stripeSubscriptionId`)
);
