import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./styles/global.scss";
import Root from "./root";

if (location.hash) {
  history.scrollRestoration = "manual";
}

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root container not found");
}

createRoot(container).render(
  <BrowserRouter>
    <Root />
  </BrowserRouter>,
);
