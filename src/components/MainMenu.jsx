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
import { Tutorial } from "./Tutorial.jsx";

/** Application version shown in the sidebar footer. */
const APP_VERSION = "v0.1.0";

/**
 * @typedef {"main"|"start"|"settings"} Screen
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
    const base = "btn-frame w-full text-center px-6 py-6 text-3xl font-semibold tracking-wide transition-colors flex items-center justify-center";

    /** Enabled interactive style. */
    const enabled = "hover:bg-stone-700 text-stone-400 cursor-pointer";

    /** Disabled (greyed-out) style for unimplemented features. */
    const disabledStyle = "text-stone-600 cursor-not-allowed";

    return (
        <button
            onClick={disabled ? undefined : onClick}
            disabled={disabled}
            className={`${base} ${disabled ? disabledStyle : enabled}`}
        >
            <span>{label}</span>
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
/** @param {{ onPlay: () => void, onDirectPlay: () => void }} props */
export function MainMenu({ onPlay, onDirectPlay }) {
    const [rulesOpen, setRulesOpen] = useState(false);
    const [tutorialOpen, setTutorialOpen] = useState(false);
    /** @type {[Screen, Function]} */
    const [screen, setScreen] = useState("main");

    if (screen === "start") {
        return (
            <StartScreen
                onPlay={onPlay}
                onDirectPlay={onDirectPlay}
                onBack={() => setScreen("main")}
            />
        );
    }

    if (screen === "settings") {
        return <SettingsScreen onBack={() => setScreen("main")} />;
    }

    return (
        <div className="flex min-h-screen text-white">
            {/* ── Sidebar ─────────────────────────────────────── */}
            <nav className="flex flex-col w-72 shrink-0 bg-black/70 border-r-4 border-double border-stone-500">
                {/* Logo */}
                <div className="flex justify-center pt-6 pb-4">
                    <Logo className="w-36 h-36" />
                </div>

                {/* Menu items */}
                <div className="flex flex-col gap-4 px-3 overflow-y-auto grow">
                    <MenuButton label="Start" onClick={() => setScreen("start")} />
                    <MenuButton label="Continue" disabled />
                    <MenuButton label="Tutorial" onClick={() => setTutorialOpen(true)} />
                    <MenuButton label="Rules" onClick={() => setRulesOpen(true)} />
                    <MenuButton label="Settings" onClick={() => setScreen("settings")} />
                    <div className="hidden">
                        <MenuButton label="Statistics" disabled />
                        <MenuButton label="Leaderboard" disabled />
                        <MenuButton label="Achievements" disabled />
                        <MenuButton label="Map Editor" disabled />
                        <MenuButton label="Credits" disabled />
                    </div>
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
            <main className="flex flex-col items-center justify-center grow">
                <p className="text-stone-500 text-lg uppercase tracking-widest">
                    Donjon Fall
                </p>
                <p className="text-stone-600 text-sm mt-2">
                    Select an option from the menu
                </p>
            </main>

            {rulesOpen && <RulesViewer onClose={() => setRulesOpen(false)} />}
            {tutorialOpen && <Tutorial onClose={() => setTutorialOpen(false)} />}
        </div>
    );
}

/* ── StartScreen ───────────────────────────────────────────────────────────── */

/**
 * @param {{ onPlay: () => void, onDirectPlay: () => void, onBack: () => void }} props
 * @returns {React.JSX.Element}
 */
function StartScreen({ onPlay, onDirectPlay, onBack }) {
    return (
        <div className="flex min-h-screen text-white">
            {/* ── Sidebar ─────────────────────────────────────── */}
            <nav className="flex flex-col w-72 shrink-0 bg-black/70 border-r-4 border-double border-stone-500">
                <div className="flex justify-center pt-6 pb-4">
                    <Logo className="w-36 h-36" />
                </div>

                <div className="flex flex-col gap-4 px-3 overflow-y-auto grow">
                    <MenuButton label="Quick Start" onClick={onDirectPlay} />
                    <MenuButton label="Configure Game" onClick={onPlay} />
                </div>

                <div className="flex flex-col px-3 pb-3 gap-3 border-t border-stone-700 pt-3">
                    <MenuButton label="Back" onClick={onBack} />
                    <div className="flex items-center justify-between text-stone-500 text-xs px-1">
                        <span>{APP_VERSION}</span>
                    </div>
                </div>
            </nav>

            {/* ── Canvas ──────────────────────────────────────── */}
            <main className="flex flex-col items-center justify-center grow">
                <p className="text-stone-500 text-lg uppercase tracking-widest">
                    New Game
                </p>
                <p className="text-stone-600 text-sm mt-2">
                    Choose a game mode
                </p>
            </main>
        </div>
    );
}

/* ── SettingsScreen ────────────────────────────────────────────────────────── */

/** @param {{ onBack: () => void }} props */
function SettingsScreen({ onBack }) {
    const [language, setLanguage] = useState("cs");
    const [sound, setSound] = useState(true);
    const [animations, setAnimations] = useState(true);

    return (
        <div className="flex min-h-screen text-white">
            {/* ── Sidebar ─────────────────────────────────────── */}
            <nav className="flex flex-col w-72 shrink-0 bg-black/70 border-r-4 border-double border-stone-500">
                <div className="flex justify-center pt-6 pb-4">
                    <Logo className="w-36 h-36" />
                </div>

                <div className="flex flex-col gap-4 px-3 overflow-y-auto grow">
                    <p className="text-stone-500 text-xs uppercase tracking-widest text-center pt-2">
                        Settings
                    </p>
                </div>

                <div className="flex flex-col px-3 pb-3 gap-3 border-t border-stone-700 pt-3">
                    <MenuButton label="Back" onClick={onBack} />
                    <div className="flex items-center justify-between text-stone-500 text-xs px-1">
                        <span>{APP_VERSION}</span>
                    </div>
                </div>
            </nav>

            {/* ── Canvas ──────────────────────────────────────── */}
            <main className="flex flex-col items-center justify-center grow">
                <div className="frame-panel flex flex-col gap-6 w-96 px-10 py-8">
                    <h2 className="text-3xl font-bold tracking-widest text-stone-300 uppercase text-center mb-2">
                        Settings
                    </h2>

                    <SettingRow label="Language / Jazyk">
                        <div className="flex gap-2">
                            <ToggleChip active={language === "cs"} onClick={() => setLanguage("cs")}>CS</ToggleChip>
                            <ToggleChip active={language === "en"} onClick={() => setLanguage("en")}>EN</ToggleChip>
                        </div>
                    </SettingRow>

                    <SettingRow label="Sound">
                        <ToggleSwitch value={sound} onChange={setSound} />
                    </SettingRow>

                    <SettingRow label="Animations">
                        <ToggleSwitch value={animations} onChange={setAnimations} />
                    </SettingRow>
                </div>
            </main>
        </div>
    );
}

function SettingRow({ label, children }) {
    return (
        <div className="flex items-center justify-between border-b border-stone-700 pb-4">
            <span className="text-stone-300 text-lg tracking-wide">{label}</span>
            {children}
        </div>
    );
}

function ToggleSwitch({ value, onChange }) {
    return (
        <button
            onClick={() => onChange(!value)}
            className={`w-14 h-7 rounded-full transition-colors cursor-pointer relative ${value ? "bg-stone-400" : "bg-stone-700"}`}
        >
            <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${value ? "left-8" : "left-1"}`} />
        </button>
    );
}

function ToggleChip({ active, onClick, children }) {
    return (
        <button
            onClick={onClick}
            className={`btn-frame px-4 py-1 text-sm font-semibold tracking-wide cursor-pointer transition-colors ${active ? "text-stone-200 bg-stone-700" : "text-stone-500 hover:bg-stone-800"}`}
        >
            {children}
        </button>
    );
}