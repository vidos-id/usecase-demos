import { type Client, hcWithType } from "server/client";
import { z } from "zod";

const envSchema = z.object({
	VITE_VIDOS_DEMO_BANK_SERVER_URL: z.string().url(),
});

const env = envSchema.parse({
	VITE_VIDOS_DEMO_BANK_SERVER_URL: import.meta.env
		.VITE_VIDOS_DEMO_BANK_SERVER_URL,
});

export const apiClient: Client = hcWithType(
	env.VITE_VIDOS_DEMO_BANK_SERVER_URL,
);
