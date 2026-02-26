import { Hono } from "hono";
import { userProfileResponseSchema } from "demo-bank-shared/api/users-me";
import { getSessionById } from "../stores/sessions";
import { getUserById } from "../stores/users";

export const usersMeRouter = new Hono().get("/", (c) => {
	const authHeader = c.req.header("Authorization");
	if (!authHeader?.startsWith("Bearer ")) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const sessionId = authHeader.slice(7);
	const session = getSessionById(sessionId);

	if (!session) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const user = getUserById(session.userId);
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const response = userProfileResponseSchema.parse({
		id: user.id,
		familyName: user.familyName,
		givenName: user.givenName,
		birthDate: user.birthDate,
		nationality: user.nationality,
		email: user.email,
		address: user.address,
		portrait: user.portrait,
		balance: user.balance,
		pendingLoansTotal: user.pendingLoansTotal,
		activity: user.activity,
	});
	return c.json(response);
});
