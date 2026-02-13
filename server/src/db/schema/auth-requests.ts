import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const authRequestsTable = sqliteTable(
	"auth_requests",
	{
		id: text("id").primaryKey(),
		externalAuthorizationId: text("external_authorization_id")
			.notNull()
			.unique(),
		kind: text("kind", {
			enum: ["signup", "signin", "payment", "loan"],
		}).notNull(),
		mode: text("mode", { enum: ["direct_post", "dc_api"] }).notNull(),
		status: text("status", {
			enum: ["pending", "authorized", "failed", "expired"],
		}).notNull(),
		requestPayload: text("request_payload"),
		verifiedClaims: text("verified_claims"),
		errorMessage: text("error_message"),
		createdAt: text("created_at").notNull(),
		completedAt: text("completed_at"),
	},
	(table) => [
		index("auth_requests_external_auth_id_idx").on(
			table.externalAuthorizationId,
		),
		index("auth_requests_status_idx").on(table.status),
		index("auth_requests_kind_status_idx").on(table.kind, table.status),
	],
);
