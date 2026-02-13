import { z } from "zod";

const envSchema = z.object({
VIDOS_AUTHORIZER_URL: z.url("VIDOS_AUTHORIZER_URL must be a valid URL"),
VIDOS_API_KEY: z.string().optional(),
VIDOS_SQLITE_PATH: z.string().default("./data/vidos.sqlite"),
});

export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
