import { hydrateRoot } from "react-dom/client";
import App from "./src/App";

const container = document.getElementById("app");

const ssrPropsElement = document.getElementById("__SSR_PROPS__");
const ssrProps = ssrPropsElement
  ? JSON.parse(ssrPropsElement.textContent || "{}")
  : {};

if (container) {
  hydrateRoot(container, <App {...ssrProps} />);
}
