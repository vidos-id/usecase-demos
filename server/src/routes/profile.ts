import { Hono } from "hono";
import { userProfileResponseSchema } from "shared/api/users-me";
import { sessionsRepository } from "../repositories/sessions-repository";
import { getUserProfileById } from "../services/profile-service";

function getSessionId(authHeader?: string) {
if (!authHeader?.startsWith("Bearer ")) return undefined;
return authHeader.slice(7);
}

export const profileRouter = new Hono().get("/me", (c) => {
const sessionId = getSessionId(c.req.header("Authorization"));
if (!sessionId) return c.json({ error: "Unauthorized" }, 401);
const session = sessionsRepository.findActiveById(sessionId);
if (!session) return c.json({ error: "Unauthorized" }, 401);
const profile = getUserProfileById(session.userId);
if (!profile) return c.json({ error: "Unauthorized" }, 401);
return c.json(userProfileResponseSchema.parse(profile));
});
