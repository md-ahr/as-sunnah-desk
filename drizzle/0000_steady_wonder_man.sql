CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`sort_order` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_categories_slug` ON `categories` (`slug`);--> statement-breakpoint
CREATE TABLE `request_activities` (
	`id` text PRIMARY KEY NOT NULL,
	`request_id` text NOT NULL,
	`actor_id` text NOT NULL,
	`type` text NOT NULL,
	`field` text,
	`from_value` text,
	`to_value` text,
	`comment` text,
	`idempotency_key` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`request_id`) REFERENCES `service_requests`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_activities_request` ON `request_activities` (`request_id`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_activities_idem` ON `request_activities` (`idempotency_key`);--> statement-breakpoint
CREATE TABLE `service_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`reference` text NOT NULL,
	`subject` text NOT NULL,
	`description` text NOT NULL,
	`category_id` text NOT NULL,
	`priority` text NOT NULL,
	`status` text NOT NULL,
	`requester_id` text NOT NULL,
	`assignee_id` text,
	`version` integer DEFAULT 1 NOT NULL,
	`priority_rank` integer GENERATED ALWAYS AS (CASE priority
          WHEN 'urgent' THEN 4
          WHEN 'high' THEN 3
          WHEN 'medium' THEN 2
          WHEN 'low' THEN 1
        END) STORED NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`resolved_at` integer,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`requester_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assignee_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_requests_reference` ON `service_requests` (`reference`);--> statement-breakpoint
CREATE INDEX `idx_requests_updated` ON `service_requests` (`updated_at`,`id`);--> statement-breakpoint
CREATE INDEX `idx_requests_status_updated` ON `service_requests` (`status`,`updated_at`,`id`);--> statement-breakpoint
CREATE INDEX `idx_requests_assignee_status` ON `service_requests` (`assignee_id`,`status`,`updated_at`);--> statement-breakpoint
CREATE INDEX `idx_requests_priority_updated` ON `service_requests` (`priority`,`updated_at`,`id`);--> statement-breakpoint
CREATE INDEX `idx_requests_category_updated` ON `service_requests` (`category_id`,`updated_at`,`id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_users_email` ON `users` (`email`);