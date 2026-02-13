import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { sessionsTable } from "../schema/sessions";

export const sessionSelectSchema = createSelectSchema(sessionsTable);
export const sessionInsertSchema = createInsertSchema(sessionsTable);
