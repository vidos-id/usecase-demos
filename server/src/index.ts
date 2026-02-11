import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { helloRequestSchema, helloResponseSchema } from "shared/api/hello";
import { otherQuerySchema, otherResponseSchema } from "shared/api/other";

export const app = new Hono()
	.use(cors())
	.use(compress())
	.get("/", (c) => {
		return c.text("Hello Hono!");
	})
	.post("/hello", zValidator("json", helloRequestSchema), (c) => {
		const data = c.req.valid("json");
		return c.json(
			helloResponseSchema.parse({
				success: true,
				message: `${data.name} is ${data.age}`,
			}),
		);
	})
	.get("/other", zValidator("query", otherQuerySchema), (c) => {
		const data = c.req.valid("query");
		return c.json(
			otherResponseSchema.parse({
				success: true,
				message: `${data.otherField}`,
			}),
		);
	});

export default app;
