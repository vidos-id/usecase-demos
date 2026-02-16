import { Hono } from "hono";
import { resetResponseSchema } from "shared/api/admin";
import { getSessionById } from "../stores/sessions";
import { deleteUser } from "../stores/users";

export const adminRouter = new Hono().delete("/reset", (c) => {
	const authHeader = c.req.header("Authorization");
	if (!authHeader?.startsWith("Bearer ")) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const sessionId = authHeader.slice(7);
	const session = getSessionById(sessionId);

	if (!session) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	// Delete user (cascades to sessions via FK constraint)
	deleteUser(session.userId);

	const response = resetResponseSchema.parse({
		success: true,
		message: "Your demo data has been reset",
	});
	return c.json(response);
});
