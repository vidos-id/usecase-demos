CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`user_id` text,
	`quantity` integer NOT NULL,
	`booked_by` text DEFAULT 'user' NOT NULL,
	`status` text DEFAULT 'pending_verification' NOT NULL,
	`delegator_name` text,
	`authorization_id` text,
	`status_token` text,
	`delegation_session_id` text,
	`error_message` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_bookings_authorization` ON `bookings` (`authorization_id`);--> statement-breakpoint
CREATE INDEX `idx_bookings_status_token` ON `bookings` (`status_token`);--> statement-breakpoint
CREATE INDEX `idx_bookings_delegation_session` ON `bookings` (`delegation_session_id`);--> statement-breakpoint
CREATE TABLE `delegation_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`status` text DEFAULT 'pending_verification' NOT NULL,
	`authorization_id` text,
	`verified_claims` text,
	`agent_public_key` text,
	`scopes` text,
	`issued_credential` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_delegation_sessions_user` ON `delegation_sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `issuer_state` (
	`id` text PRIMARY KEY NOT NULL,
	`trust_material` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` text NOT NULL,
	`expires_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_sessions_user_expires` ON `sessions` (`user_id`,`expires_at`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`identity_verified` integer DEFAULT false NOT NULL,
	`given_name` text,
	`family_name` text,
	`birth_date` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);