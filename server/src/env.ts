import { z } from "zod";

const envSchema = z.object({
	VIDOS_AUTHORIZER_URL: z.url("VIDOS_AUTHORIZER_URL must be a valid URL"),
	VIDOS_API_KEY: z.string().min(1).optional(), // optional if working with gateway
});

// Parse environment at module load time (fail-fast)
export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
