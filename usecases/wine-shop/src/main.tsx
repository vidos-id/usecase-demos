import { createRouter, RouterProvider } from "@tanstack/react-router";
import ReactDOM from "react-dom/client";
import { OrderStoreProvider } from "@/domain/order/order-store";
import { VerificationStoreProvider } from "@/domain/verification/verification-store";
import "./index.css";
import { routeTree } from "./routeTree.gen";

const router = createRouter({ routeTree, basepath: "/wine-shop" });

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

const rootElement = document.getElementById("root");

if (!rootElement) {
	throw new Error(
		"Root element not found. Check if it's in your index.html or if the id is correct.",
	);
}

if (!rootElement.innerHTML) {
	const root = ReactDOM.createRoot(rootElement);
	root.render(
		<OrderStoreProvider>
			<VerificationStoreProvider>
				<RouterProvider router={router} />
			</VerificationStoreProvider>
		</OrderStoreProvider>,
	);
}
