import { Hono } from "hono";
import { filterEvents, getEventById } from "ticket-agent-shared/lib/events";

export const eventsRouter = new Hono()
	.get("/", (c) => {
		const category = c.req.query("category");
		const city = c.req.query("city");

		const filtered = filterEvents({ category, city });
		return c.json({ events: filtered });
	})
	.get("/:id", (c) => {
		const id = c.req.param("id");
		const event = getEventById(id);

		if (!event) {
			return c.json({ error: "Event not found" }, 404);
		}

		return c.json(event);
	});
