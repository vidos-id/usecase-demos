import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
	id: text("id").primaryKey(),
	username: text("username").notNull().unique(),
	passwordHash: text("password_hash").notNull(),
	identityVerified: integer("identity_verified", { mode: "boolean" })
		.notNull()
		.default(false),
	givenName: text("given_name"),
	familyName: text("family_name"),
	birthDate: text("birth_date"),
	createdAt: text("created_at").notNull(),
});

export const sessions = sqliteTable(
	"sessions",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		createdAt: text("created_at").notNull(),
		expiresAt: text("expires_at").notNull(),
	},
	(table) => [
		index("idx_sessions_user_expires").on(table.userId, table.expiresAt),
	],
);

export const delegationSessions = sqliteTable(
	"delegation_sessions",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		status: text("status").notNull().default("offer_created"),
		verifiedClaims: text("verified_claims", { mode: "json" }),
		scopes: text("scopes", { mode: "json" }),
		validUntil: text("valid_until"),
		offer: text("offer", { mode: "json" }),
		offerUri: text("offer_uri"),
		preAuthorizedCode: text("pre_authorized_code"),
		preAuthorizedCodeExpiresAt: text("pre_authorized_code_expires_at"),
		preAuthorizedCodeUsedAt: text("pre_authorized_code_used_at"),
		accessToken: text("access_token"),
		accessTokenExpiresAt: text("access_token_expires_at"),
		accessTokenUsedAt: text("access_token_used_at"),
		lastNonce: text("last_nonce"),
		lastNonceExpiresAt: text("last_nonce_expires_at"),
		lastNonceUsedAt: text("last_nonce_used_at"),
		holderPublicKey: text("holder_public_key", { mode: "json" }),
		credentialIssuedAt: text("credential_issued_at"),
		createdAt: text("created_at").notNull(),
	},
	(table) => [index("idx_delegation_sessions_user").on(table.userId)],
);

export const bookings = sqliteTable(
	"bookings",
	{
		id: text("id").primaryKey(),
		eventId: text("event_id").notNull(),
		userId: text("user_id"),
		quantity: integer("quantity").notNull(),
		bookedBy: text("booked_by").notNull().default("user"),
		status: text("status").notNull().default("pending_verification"),
		delegatorName: text("delegator_name"),
		authorizationId: text("authorization_id"),
		statusToken: text("status_token"),
		delegationSessionId: text("delegation_session_id"),
		errorMessage: text("error_message"),
		createdAt: text("created_at").notNull(),
	},
	(table) => [
		index("idx_bookings_authorization").on(table.authorizationId),
		index("idx_bookings_status_token").on(table.statusToken),
		index("idx_bookings_delegation_session").on(table.delegationSessionId),
	],
);

export const issuerState = sqliteTable("issuer_state", {
	id: text("id").primaryKey(),
	trustMaterial: text("trust_material", { mode: "json" }).notNull(),
	createdAt: text("created_at").notNull(),
	updatedAt: text("updated_at").notNull(),
});
