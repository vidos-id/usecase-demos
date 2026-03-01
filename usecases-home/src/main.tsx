import { RouterProvider } from "@tanstack/react-router";
import ReactDOM from "react-dom/client";
import "./index.css";
import { router } from "./routes";

const rootElement = document.getElementById("root");

if (!rootElement) {
	throw new Error(
		"Root element not found. Check if it's in your index.html or if the id is correct.",
	);
}

if (!rootElement.innerHTML) {
	const root = ReactDOM.createRoot(rootElement);
	root.render(<RouterProvider router={router} />);
}
