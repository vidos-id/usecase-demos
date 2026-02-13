import { index, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { usersTable } from "./users";

export const activitiesTable = sqliteTable(
"activities",
{
id: text("id").primaryKey(),
userId: text("user_id")
.notNull()
.references(() => usersTable.id, { onDelete: "cascade" }),
kind: text("kind", { enum: ["payment", "loan"] }).notNull(),
title: text("title").notNull(),
amount: real("amount").notNull(),
metadata: text("metadata"),
createdAt: text("created_at").notNull(),
},
(table) => [index("activities_user_created_idx").on(table.userId, table.createdAt)],
);
