import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const usersTable = sqliteTable("users", {
id: text("id").primaryKey(),
identifier: text("identifier").notNull().unique(),
documentNumber: text("document_number"),
familyName: text("family_name").notNull(),
givenName: text("given_name").notNull(),
birthDate: text("birth_date"),
nationality: text("nationality"),
email: text("email"),
address: text("address"),
portrait: text("portrait"),
createdAt: text("created_at").notNull(),
});
