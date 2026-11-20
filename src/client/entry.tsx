import { createRoot } from "react-dom/client";

import "./styles/global.scss";
import Root from "./root";

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root container not found");
}

createRoot(container).render(<Root />);
