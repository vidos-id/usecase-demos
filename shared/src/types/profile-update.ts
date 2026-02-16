import type { z } from "zod";
import { pidClaimsSchema } from "./auth";

export const profileUpdateClaimsSchema = pidClaimsSchema;
export type ProfileUpdateClaims = z.infer<typeof profileUpdateClaimsSchema>;
