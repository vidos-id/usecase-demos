import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { authRequestsTable } from "../schema/auth-requests";

export const authRequestSelectSchema = createSelectSchema(authRequestsTable);
export const authRequestInsertSchema = createInsertSchema(authRequestsTable);
