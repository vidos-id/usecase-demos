CREATE TABLE `__new_delegation_sessions` (
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
	`credential_issued_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_delegation_sessions` (
	`id`,
	`user_id`,
	`status`,
	`verified_claims`,
	`scopes`,
	`created_at`
)
SELECT
	`id`,
	`user_id`,
	CASE
		WHEN `status` = 'revoked' THEN 'revoked'
		ELSE 'offer_created'
	END,
	`verified_claims`,
	`scopes`,
	`created_at`
FROM `delegation_sessions`;
--> statement-breakpoint
DROP TABLE `delegation_sessions`;
--> statement-breakpoint
ALTER TABLE `__new_delegation_sessions` RENAME TO `delegation_sessions`;
--> statement-breakpoint
CREATE INDEX `idx_delegation_sessions_user` ON `delegation_sessions` (`user_id`);
