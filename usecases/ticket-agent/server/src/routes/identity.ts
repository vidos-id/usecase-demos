import { Hono } from "hono";
import { z } from "zod";
import { startAuthorizationMonitor } from "../services/authorization-monitor";
import {
	createPIDAuthorizationRequest,
	getExtractedCredentials,
	pollAuthorizationStatus,
} from "../services/vidos";
import { getSessionById } from "../stores/sessions";
import { getUserById, updateUserIdentity } from "../stores/users";

const pidClaimsSchema = z.object({
	given_name: z.string(),
	family_name: z.string(),
	birthdate: z.string(),
});

async function getVerifiedUser(userId: string, authorizationId: string) {
	const user = getUserById(userId);
	if (!user) {
		return undefined;
	}

	if (user.givenName && user.familyName) {
		return user;
	}

	try {
		const claims = await getExtractedCredentials(
			authorizationId,
			pidClaimsSchema,
		);
		return updateUserIdentity(userId, {
			givenName: claims.given_name,
			familyName: claims.family_name,
			birthDate: claims.birthdate,
		});
	} catch (error) {
		console.error("[Identity] Failed to hydrate verified user claims:", error);
		return getUserById(userId);
	}
}

export const identityRouter = new Hono()
	.post("/verify", async (c) => {
		const sessionId = c.req.header("Authorization")?.replace("Bearer ", "");
		if (!sessionId) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		const session = getSessionById(sessionId);
		if (!session) {
			return c.json({ error: "Invalid or expired session" }, 401);
		}

		const user = getUserById(session.userId);
		if (!user) {
			return c.json({ error: "User not found" }, 404);
		}

		if (user.identityVerified) {
			return c.json({ error: "Identity already verified" }, 400);
		}

		const result = await createPIDAuthorizationRequest();

		startAuthorizationMonitor({
			type: "pid_verification",
			authorizationId: result.authorizationId,
			userId: session.userId,
		});

		return c.json({
			authorizationId: result.authorizationId,
			authorizeUrl: result.authorizeUrl,
		});
	})
	.get("/verify/:id/status", async (c) => {
		const authorizationId = c.req.param("id");
		const sessionId = c.req.header("Authorization")?.replace("Bearer ", "");
		if (!sessionId) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		const session = getSessionById(sessionId);
		if (!session) {
			return c.json({ error: "Invalid or expired session" }, 401);
		}

		const result = await pollAuthorizationStatus(authorizationId);

		if (result.status === "authorized") {
			const user = await getVerifiedUser(session.userId, authorizationId);
			return c.json({
				status: result.status,
				user: user
					? {
							identityVerified: user.identityVerified,
							givenName: user.givenName,
							familyName: user.familyName,
						}
					: undefined,
			});
		}

		return c.json({ status: result.status });
	});
