import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { otherQuerySchema, otherResponseSchema } from "shared/api/other";

export const otherRouter = new Hono().get(
	"/",
	zValidator("query", otherQuerySchema),
	(c) => {
		const data = c.req.valid("query");
		return c.json(
			otherResponseSchema.parse({
				success: true,
				message: `${data.otherField}`,
			}),
		);
	},
);
