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
import { SettingsPanel } from "./SettingsPanel.jsx";
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
export function MainMenu({ onPlay, onDirectPlay, initialScreen = "main" }) {
    const [rulesOpen, setRulesOpen] = useState(false);
    const [tutorialOpen, setTutorialOpen] = useState(false);
    /** @type {[Screen, Function]} */
    const [screen, setScreen] = useState(initialScreen);

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

                <div className="grow" />

                <div className="flex flex-col px-3 pb-3 gap-3 border-t border-stone-700 pt-3">
                    <MenuButton label="Zpět" onClick={onBack} />
                    <div className="flex items-center justify-between text-stone-500 text-xs px-1">
                        <span>{APP_VERSION}</span>
                    </div>
                </div>
            </nav>

            {/* ── Canvas ──────────────────────────────────────── */}
            <main className="flex flex-col items-center justify-center grow">
                <SettingsPanel
                    sound={sound}
                    onSoundChange={setSound}
                    animations={animations}
                    onAnimationsChange={setAnimations}
                    language={language}
                    onLanguageChange={setLanguage}
                />
            </main>
        </div>
    );
}