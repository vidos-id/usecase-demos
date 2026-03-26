import { z } from "zod";

const envSchema = z.object({
	VIDOS_AUTHORIZER_URL: z.string().url(),
	VIDOS_API_KEY: z.string().optional(),
	DATABASE_PATH: z.string().default("./data/ticket-agent.db"),
	PORT: z.coerce.number().default(53914),
	ISSUER_PUBLIC_URL: z.string().url().optional(),
});

export const env = envSchema.parse(process.env);
