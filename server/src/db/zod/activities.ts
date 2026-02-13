import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { activitiesTable } from "../schema/activities";

export const activitySelectSchema = createSelectSchema(activitiesTable);
export const activityInsertSchema = createInsertSchema(activitiesTable);
