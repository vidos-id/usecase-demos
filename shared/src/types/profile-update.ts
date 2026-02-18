import { z } from "zod";
import { pidClaimsSchema } from "./auth";

export const profileUpdateClaimsSchema = pidClaimsSchema.extend({
	resident_address: z.string().optional(),
});
export type ProfileUpdateClaims = z.infer<typeof profileUpdateClaimsSchema>;
