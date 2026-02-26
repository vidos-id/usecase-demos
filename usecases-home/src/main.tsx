import ReactDOM from "react-dom/client";
import "./index.css";
import { Button } from "./components/ui/button";

const rootElement = document.getElementById("root");

if (!rootElement) {
	throw new Error(
		"Root element not found. Check if it's in your index.html or if the id is correct.",
	);
}

// Render the app
if (!rootElement.innerHTML) {
	const root = ReactDOM.createRoot(rootElement);
	root.render(
		<div>
			<Button>Hello</Button>
		</div>,
	);
}
