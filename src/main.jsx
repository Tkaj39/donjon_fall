/**
 * Application entry point — mounts the React app to the DOM.
 * Phase 4 — Board visualization.
 */

import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { App } from "./App.jsx";
import "./index.css";
import { appBackground } from "./styles/themes/default.js";

// Apply background from theme — keeps index.css free of asset paths.
document.body.style.backgroundImage    = `url(${appBackground})`;
document.body.style.backgroundSize     = "cover";
document.body.style.backgroundRepeat   = "no-repeat";
document.body.style.backgroundAttachment = "fixed";
document.body.style.backgroundPosition = "center";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <App />
    </StrictMode>,
);

