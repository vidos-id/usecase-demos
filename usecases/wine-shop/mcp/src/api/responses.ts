import type { ZodType } from "zod";

type ApiEnvelope = {
	success: boolean;
	message: string;
	data?: unknown;
};

export function json(body: ApiEnvelope, status = 200): Response {
	return Response.json(body, {
		status,
		headers: {
			"content-type": "application/json; charset=utf-8",
		},
	});
}

export function success(
	message: string,
	data?: unknown,
	status = 200,
): Response {
	return json({ success: true, message, data }, status);
}

export function failure(
	message: string,
	status = 400,
	data?: unknown,
): Response {
	return json({ success: false, message, data }, status);
}

export async function parseJsonBody<T>(
	request: Request,
	schema: ZodType<T>,
): Promise<
	{ success: true; data: T } | { success: false; response: Response }
> {
	let body: unknown;

	try {
		body = await request.json();
	} catch {
		return {
			success: false,
			response: failure("Request body must be valid JSON.", 400),
		};
	}

	const parsed = schema.safeParse(body);
	if (!parsed.success) {
		return {
			success: false,
			response: failure(`Invalid input: ${parsed.error.message}`, 400),
		};
	}

	return { success: true, data: parsed.data };
}
