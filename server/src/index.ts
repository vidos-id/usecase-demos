import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { helloRequestSchema, helloResponseSchema } from "shared/api/hello";
import { otherQuerySchema, otherResponseSchema } from "shared/api/other";

export const app = new Hono();

app.use(cors());
app.use(compress());

app.get("/", (c) => {
	return c.text("Hello Hono!");
});

app.post("/hello", zValidator("json", helloRequestSchema), (c) => {
	const data = c.req.valid("json");
	return c.json(
		helloResponseSchema.parse({
			success: true,
			message: `${data.name} is ${data.age}`,
		}),
	);
});

app.get("/other", zValidator("query", otherQuerySchema), (c) => {
	const data = c.req.valid("query");
	return c.json(
		otherResponseSchema.parse({
			success: true,
			message: `${data.otherField}`,
		}),
	);
});

export default app;
