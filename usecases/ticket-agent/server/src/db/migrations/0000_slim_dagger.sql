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
	`status` text DEFAULT 'offer_created' NOT NULL,
	`verified_claims` text,
	`scopes` text,
	`valid_until` text,
	`offer` text,
	`offer_uri` text,
	`pre_authorized_code` text,
	`pre_authorized_code_expires_at` text,
	`pre_authorized_code_used_at` text,
	`access_token` text,
	`access_token_expires_at` text,
	`access_token_used_at` text,
	`last_nonce` text,
	`last_nonce_expires_at` text,
	`last_nonce_used_at` text,
	`holder_public_key` text,
	`credential_status` text,
	`credential_revoked_at` text,
	`credential_issued_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_delegation_sessions_user` ON `delegation_sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `issuer_state` (
	`id` text PRIMARY KEY NOT NULL,
	`trust_material` text NOT NULL,
	`status_list` text,
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