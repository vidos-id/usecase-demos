CREATE TABLE `pending_auth_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`vidos_authorization_id` text NOT NULL,
	`type` text NOT NULL,
	`mode` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`response_url` text,
	`metadata` text,
	`created_at` text NOT NULL,
	`completed_at` text,
	`result` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pending_auth_requests_vidos_authorization_id_unique` ON `pending_auth_requests` (`vidos_authorization_id`);--> statement-breakpoint
CREATE INDEX `idx_pending_auth_vidos_id` ON `pending_auth_requests` (`vidos_authorization_id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`mode` text NOT NULL,
	`created_at` text NOT NULL,
	`expires_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_sessions_user_expires` ON `sessions` (`user_id`,`expires_at`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`document_number` text,
	`family_name` text NOT NULL,
	`given_name` text NOT NULL,
	`birth_date` text NOT NULL,
	`nationality` text NOT NULL,
	`email` text,
	`address` text,
	`portrait` text,
	`balance_cents` integer DEFAULT 0 NOT NULL,
	`pending_loans_total_cents` integer DEFAULT 0 NOT NULL,
	`activity` text DEFAULT '[]' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_identifier_unique` ON `users` (`identifier`);