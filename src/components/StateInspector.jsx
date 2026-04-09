/**
 * StateInspector — Phase 14.2 debug panel.
 * Collapsible read-only panel that renders the full GameState as formatted JSON.
 * Only rendered when debug mode is active.
 */

import { useState } from "react";

/**
 * Collapsible panel that renders the full GameState as formatted JSON for debugging.
 *
 * @param {{ state: import("../hooks/useGameState.js").GameState }} props - Component props containing the current game state.
 * @returns {JSX.Element}
 */
export function StateInspector({ state }) {
    const [collapsed, setCollapsed] = useState(true);

    return (
        <div className="w-full font-mono text-[0.72rem] bg-(--color-inspector-bg) border border-(--color-inspector-border) rounded overflow-hidden">
            <button
                onClick={() => setCollapsed(prev => !prev)}
                className="w-full flex items-center justify-between bg-(--color-inspector-header-bg) text-(--color-inspector-header-text) px-3 py-1 cursor-pointer border-none text-left"
            >
                <span className="font-semibold">State Inspector</span>
                <span>{collapsed ? "▶ expand" : "▼ collapse"}</span>
            </button>
            {!collapsed && (
                <pre className="m-0 p-3 text-(--color-inspector-text) overflow-auto max-h-80 whitespace-pre-wrap break-all">
                    {JSON.stringify(state, null, 2)}
                </pre>
            )}
        </div>
    );
}