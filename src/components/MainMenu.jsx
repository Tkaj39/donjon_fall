/**
 * MainMenu component — primary navigation hub with sidebar layout.
 * Phase 9.3
 *
 * Layout: left sidebar (menu items) + right canvas (placeholder).
 * Items without implemented functionality are rendered as disabled buttons.
 */

import { useState } from "react";
import { Logo } from "./Logo.jsx";
import { RulesViewer } from "./RulesViewer.jsx";

/** Application version shown in the sidebar footer. */
const APP_VERSION = "v0.1.0";

/**
 * @typedef {"start"|null} Submenu
 */

/* ── MenuButton sub-component ─────────────────────────────────────────────── */

/**
 * Single menu button rendered inside the sidebar.
 *
 * @param {{
 *   label: string,
 *   onClick?: () => void,
 *   disabled?: boolean,
 *   hasSubmenu?: boolean,
 *   isOpen?: boolean
 * }} props
 * @returns {React.JSX.Element}
 */
function MenuButton({ label, onClick, disabled = false, hasSubmenu = false, isOpen = false }) {
    /** Base classes shared by all states. */
    const base = "w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-colors flex items-center justify-between";

    /** Enabled interactive style. */
    const enabled = "hover:bg-stone-700 text-stone-200 cursor-pointer";

    /** Disabled (greyed-out) style for unimplemented features. */
    const disabledStyle = "text-stone-600 cursor-not-allowed";

    return (
        <button
            onClick={disabled ? undefined : onClick}
            disabled={disabled}
            className={`${base} ${disabled ? disabledStyle : enabled}`}
        >
            <span>{label}</span>
            {hasSubmenu && (
                <span
                    className={`text-[0.65rem] transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
                    aria-hidden="true"
                >
                    ▶
                </span>
            )}
        </button>
    );
}

// ---------------------------------------------------------------------------
// MainMenu — Exported Component
// ---------------------------------------------------------------------------

/**
 * @param {{ onPlay: () => void, onDirectPlay: () => void }} props
 * @returns {React.JSX.Element}
 */
export function MainMenu({ onPlay, onDirectPlay }) {
    const [rulesOpen, setRulesOpen] = useState(false);
    /** @type {[Submenu, Function]} */
    const [openSubmenu, setOpenSubmenu] = useState(null);

    /**
     * Toggles a submenu open/closed.
     *
     * @param {Submenu} id
     * @returns {void}
     */
    function toggleSubmenu(id) {
        setOpenSubmenu((prev) => (prev === id ? null : id));
    }

    return (
        <div className="flex min-h-screen bg-stone-900 text-white">
            {/* ── Sidebar ─────────────────────────────────────── */}
            <nav className="flex flex-col w-72 shrink-0 bg-stone-900/95 border-r border-stone-700">
                {/* Logo */}
                <div className="flex justify-center pt-6 pb-4">
                    <Logo className="w-36 h-36" />
                </div>

                {/* Menu items */}
                <div className="flex flex-col gap-1 px-3 overflow-y-auto grow">
                    {/* ── Start (submenu) ── */}
                    <MenuButton
                        label="Start"
                        hasSubmenu
                        isOpen={openSubmenu === "start"}
                        onClick={() => toggleSubmenu("start")}
                    />
                    {openSubmenu === "start" && (
                        <div className="flex flex-col gap-1 pl-4">
                            <MenuButton label="Quick Start" onClick={onDirectPlay} />
                            <MenuButton label="Start" onClick={onPlay} />
                            <MenuButton label="Start vs Bot" disabled />
                            <MenuButton label="Online" disabled />
                            <MenuButton label="Daily Challenge" disabled />
                            <MenuButton label="Campaign" disabled />
                        </div>
                    )}

                    <MenuButton label="Continue" disabled />
                    <MenuButton label="Tutorial" disabled />
                    <MenuButton label="Rules" onClick={() => setRulesOpen(true)} />
                    <MenuButton label="Statistics" disabled />
                    <MenuButton label="Leaderboard" disabled />
                    <MenuButton label="Achievements" disabled />
                    <MenuButton label="Settings" disabled hasSubmenu />
                    <MenuButton label="Map Editor" disabled />
                    <MenuButton label="Credits" disabled />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-stone-700 text-stone-500 text-xs">
                    <span>{APP_VERSION}</span>
                    <div className="flex gap-3">
                        <a
                            href="https://github.com/Tkaj39/donjon_fall"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-stone-300 transition-colors"
                            aria-label="GitHub"
                        >
                            GitHub
                        </a>
                    </div>
                </div>
            </nav>

            {/* ── Canvas (right area) ─────────────────────────── */}
            <main className="flex flex-col items-center justify-center grow bg-stone-800/50">
                <p className="text-stone-500 text-lg uppercase tracking-widest">
                    Donjon Fall
                </p>
                <p className="text-stone-600 text-sm mt-2">
                    Select an option from the menu
                </p>
            </main>

            {rulesOpen && <RulesViewer onClose={() => setRulesOpen(false)} />}
        </div>
    );
}