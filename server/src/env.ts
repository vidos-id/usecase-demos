import { z } from "zod";

const envSchema = z.object({
	VIDOS_AUTHORIZER_URL: z
		.string()
		.url("VIDOS_AUTHORIZER_URL must be a valid URL"),
	VIDOS_API_KEY: z.string().min(1, "VIDOS_API_KEY is required"),
});

// Parse environment at module load time (fail-fast)
export const env = envSchema.parse({
	VIDOS_AUTHORIZER_URL: process.env.VIDOS_AUTHORIZER_URL,
	VIDOS_API_KEY: process.env.VIDOS_API_KEY,
});

export type Env = z.infer<typeof envSchema>;
