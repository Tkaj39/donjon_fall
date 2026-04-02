/**
 * Application entry point — mounts the React app to the DOM.
 * Phase 4 — Board visualization.
 */

import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { App } from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <App />
    </StrictMode>,
);

