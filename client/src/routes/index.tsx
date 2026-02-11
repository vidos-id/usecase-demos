import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { hcWithType } from "server/client";

export const Route = createFileRoute("/")({
	component: Index,
});

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

const client = hcWithType(SERVER_URL);

function Index() {
	const mutation = useQuery({
		queryKey: ["other"],
		queryFn: async () => {
			const res = await client.other.$get({
				query: { otherField: new Date().toISOString() },
			});
			if (!res.ok) {
				throw new Error("Error fetching data");
			}
			return await res.json();
		},
	});

	return (
		<div>
			{mutation.isPending
				? "Loading..."
				: mutation.isSuccess
					? JSON.stringify(mutation.data)
					: mutation.isError
						? "Error"
						: null}
		</div>
	);
}

export default Index;
