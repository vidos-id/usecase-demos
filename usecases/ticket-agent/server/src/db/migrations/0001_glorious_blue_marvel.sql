CREATE TABLE `issuer_state` (
	`id` text PRIMARY KEY NOT NULL,
	`trust_material` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
