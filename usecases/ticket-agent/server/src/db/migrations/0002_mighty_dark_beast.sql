ALTER TABLE `bookings` ADD `agent_name` text;--> statement-breakpoint
ALTER TABLE `delegation_sessions` ADD `agent_name` text DEFAULT '' NOT NULL;