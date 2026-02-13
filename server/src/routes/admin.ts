import { Hono } from "hono";
import { resetResponseSchema } from "shared/api/admin";
import { activitiesRepository } from "../repositories/activities-repository";
import { authRequestsRepository } from "../repositories/auth-requests-repository";
import { sessionsRepository } from "../repositories/sessions-repository";
import { usersRepository } from "../repositories/users-repository";

export const adminRouter = new Hono().delete("/reset", (c) => {
authRequestsRepository.clearAll();
sessionsRepository.clearAll();
activitiesRepository.clearAll();
usersRepository.clearAll();
return c.json(
resetResponseSchema.parse({
success: true,
message: "Demo data has been reset",
}),
);
});
