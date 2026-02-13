import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod";

// Discriminated union for activity item meta based on activity type
export const paymentMetaSchema = z.object({
	recipient: z.string().optional(),
	reference: z.string().optional(),
});

export const loanMetaSchema = z.object({
	loanAmount: z.number(),
	loanPurpose: z.string(),
	loanTerm: z.number(),
});

const paymentActivityItemSchema = z.object({
	id: z.string(),
	type: z.literal("payment"),
	title: z.string(),
	amount: z.number(),
	createdAt: z.string(),
	meta: paymentMetaSchema.optional(),
});

const loanActivityItemSchema = z.object({
	id: z.string(),
	type: z.literal("loan"),
	title: z.string(),
	amount: z.number(),
	createdAt: z.string(),
	meta: loanMetaSchema,
});

export const activityItemSchema = z.discriminatedUnion("type", [
	paymentActivityItemSchema,
	loanActivityItemSchema,
]);

export const activityItemsSchema = z.array(activityItemSchema);

export const pendingAuthMetadataSchema = z.record(z.string(), z.unknown());

export const pendingAuthResultSchema = z.object({
	claims: z.record(z.string(), z.unknown()),
	sessionId: z.string().optional(),
	error: z.string().optional(),
});

// Full entity schemas for type inference
export const pendingAuthRequestSchema = z.object({
	id: z.string(),
	vidosAuthorizationId: z.string(),
	type: z.enum(["signup", "signin", "payment", "loan"]),
	mode: z.enum(["direct_post", "dc_api"]),
	status: z.enum(["pending", "completed", "failed", "expired"]),
	responseUrl: z.string().optional(),
	metadata: pendingAuthMetadataSchema.optional(),
	createdAt: z.date(),
	completedAt: z.date().optional(),
	result: pendingAuthResultSchema.optional(),
});

export const sessionSchema = z.object({
	id: z.string(),
	userId: z.string(),
	mode: z.enum(["direct_post", "dc_api"]),
	createdAt: z.date(),
	expiresAt: z.date(),
});

export type ActivityItem = z.infer<typeof activityItemSchema>;
export type PendingAuthMetadata = z.infer<typeof pendingAuthMetadataSchema>;
export type PendingAuthResult = z.infer<typeof pendingAuthResultSchema>;
export type PendingAuthRequest = z.infer<typeof pendingAuthRequestSchema>;
export type Session = z.infer<typeof sessionSchema>;

export const users = sqliteTable("users", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull().unique(),
	documentNumber: text("document_number"),
	familyName: text("family_name").notNull(),
	givenName: text("given_name").notNull(),
	birthDate: text("birth_date").notNull(),
	nationality: text("nationality").notNull(),
	email: text("email"),
	address: text("address"),
	portrait: text("portrait"),
	balanceCents: integer("balance_cents").notNull().default(0),
	pendingLoansTotalCents: integer("pending_loans_total_cents")
		.notNull()
		.default(0),
	activity: text("activity").notNull().default("[]").$type<ActivityItem[]>(),
	createdAt: text("created_at").notNull(),
});

export const sessions = sqliteTable(
	"sessions",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		mode: text("mode").notNull(),
		createdAt: text("created_at").notNull(),
		expiresAt: text("expires_at").notNull(),
	},
	(table) => [
		index("idx_sessions_user_expires").on(table.userId, table.expiresAt),
	],
);

export const pendingAuthRequests = sqliteTable(
	"pending_auth_requests",
	{
		id: text("id").primaryKey(),
		vidosAuthorizationId: text("vidos_authorization_id").notNull().unique(),
		type: text("type").notNull(),
		mode: text("mode").notNull(),
		status: text("status").notNull().default("pending"),
		responseUrl: text("response_url"),
		metadata: text("metadata").$type<PendingAuthMetadata>(),
		createdAt: text("created_at").notNull(),
		completedAt: text("completed_at"),
		result: text("result").$type<PendingAuthResult>(),
	},
	(table) => [
		index("idx_pending_auth_vidos_id").on(table.vidosAuthorizationId),
	],
);
