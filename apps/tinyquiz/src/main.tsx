import { createRoot } from "react-dom/client";
import "./index.css";
import { StrictMode } from "react";
import { AppRoot } from "./AppRoot";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppRoot />
  </StrictMode>,
);
