import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { usersTable } from "../schema/users";

export const userSelectSchema = createSelectSchema(usersTable);
export const userInsertSchema = createInsertSchema(usersTable);
