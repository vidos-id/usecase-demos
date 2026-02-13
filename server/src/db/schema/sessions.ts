import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { usersTable } from "./users";

export const sessionsTable = sqliteTable(
"sessions",
{
id: text("id").primaryKey(),
userId: text("user_id")
.notNull()
.references(() => usersTable.id, { onDelete: "cascade" }),
mode: text("mode", { enum: ["direct_post", "dc_api"] }).notNull(),
status: text("status", { enum: ["active", "expired", "revoked"] }).notNull(),
createdAt: text("created_at").notNull(),
expiresAt: text("expires_at").notNull(),
},
(table) => [
index("sessions_user_id_idx").on(table.userId),
index("sessions_expires_at_idx").on(table.expiresAt),
index("sessions_status_idx").on(table.status),
],
);
