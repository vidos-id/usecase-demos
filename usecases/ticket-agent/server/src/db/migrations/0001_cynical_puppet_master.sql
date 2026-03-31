ALTER TABLE `delegation_sessions` ADD `credential_status_value` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `delegation_sessions` ADD `credential_activated_at` text;--> statement-breakpoint
ALTER TABLE `delegation_sessions` ADD `credential_suspended_at` text;