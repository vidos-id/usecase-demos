CREATE TABLE `activities` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`amount` real NOT NULL,
	`metadata` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `activities_user_created_idx` ON `activities` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `auth_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`external_authorization_id` text NOT NULL,
	`kind` text NOT NULL,
	`mode` text NOT NULL,
	`status` text NOT NULL,
	`request_payload` text,
	`verified_claims` text,
	`error_message` text,
	`created_at` text NOT NULL,
	`completed_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_requests_external_authorization_id_unique` ON `auth_requests` (`external_authorization_id`);--> statement-breakpoint
CREATE INDEX `auth_requests_external_auth_id_idx` ON `auth_requests` (`external_authorization_id`);--> statement-breakpoint
CREATE INDEX `auth_requests_status_idx` ON `auth_requests` (`status`);--> statement-breakpoint
CREATE INDEX `auth_requests_kind_status_idx` ON `auth_requests` (`kind`,`status`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`mode` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	`expires_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sessions_user_id_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `sessions_expires_at_idx` ON `sessions` (`expires_at`);--> statement-breakpoint
CREATE INDEX `sessions_status_idx` ON `sessions` (`status`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`document_number` text,
	`family_name` text NOT NULL,
	`given_name` text NOT NULL,
	`birth_date` text,
	`nationality` text,
	`email` text,
	`address` text,
	`portrait` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_identifier_unique` ON `users` (`identifier`);