import { hydrateRoot } from "react-dom/client";
import App from "./src/App";

const container = document.getElementById("app");

if (container) {
  hydrateRoot(container, <App />);
}
