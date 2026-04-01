export function buildApiUrl(
	baseUrl: string,
	pathname: string,
	query?: Record<string, string | undefined>,
): string {
	const url = new URL(pathname, baseUrl);

	if (query) {
		for (const [key, value] of Object.entries(query)) {
			if (value) {
				url.searchParams.set(key, value);
			}
		}
	}

	return url.toString();
}

type CreateAuthFetchOptions = {
	getToken: () => string | null | undefined;
	headerName?: string;
	prefix?: string;
};

export function createAuthFetch({
	getToken,
	headerName = "Authorization",
	prefix = "Bearer ",
}: CreateAuthFetchOptions): typeof fetch {
	return ((input, init) => {
		const token = getToken();

		if (!token) {
			return fetch(input, init);
		}

		const headers = new Headers(init?.headers);
		if (!headers.has(headerName)) {
			headers.set(headerName, `${prefix}${token}`);
		}

		return fetch(input, { ...init, headers });
	}) as typeof fetch;
}
