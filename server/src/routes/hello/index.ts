import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { helloRequestSchema, helloResponseSchema } from "shared/api/hello";

export const helloRouter = new Hono().post(
	"/",
	zValidator("json", helloRequestSchema),
	(c) => {
		const data = c.req.valid("json");
		return c.json(
			helloResponseSchema.parse({
				success: true,
				message: `${data.name} is ${data.age}`,
			}),
		);
	},
);
