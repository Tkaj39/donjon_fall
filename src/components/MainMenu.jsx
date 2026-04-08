/**
 * MainMenu component — primary navigation hub.
 * Phase 9.3
 */

import { useState } from "react";
import { Logo } from "./Logo.jsx";
import { RulesViewer } from "./RulesViewer.jsx";

/**
 * @param {{ onPlay: () => void, onDirectPlay: () => void }} props
 * @returns {JSX.Element}
 */
export function MainMenu({ onPlay, onDirectPlay }) {
    const [rulesOpen, setRulesOpen] = useState(false);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-stone-900/60 text-white">
            <Logo className="w-32 h-32 mb-6" />

            <h1 className="text-4xl font-bold tracking-widest uppercase mb-2">Donjon Fall</h1>
            <p className="text-stone-400 text-sm mb-12">Pád Donjonu</p>

            <div className="flex flex-col gap-4 w-48">
                <button
                    onClick={onPlay}
                    className="bg-red-700 hover:bg-red-600 text-white font-semibold py-3 rounded-lg tracking-wide uppercase transition-colors"
                >
                    Play
                </button>
                <button
                    onClick={onDirectPlay}
                    className="bg-stone-600 hover:bg-stone-500 text-white font-semibold py-3 rounded-lg tracking-wide uppercase transition-colors"
                >
                    Direct Play
                </button>
                <button
                    onClick={() => setRulesOpen(true)}
                    className="bg-stone-700 hover:bg-stone-600 text-white font-semibold py-3 rounded-lg tracking-wide uppercase transition-colors"
                >
                    Rules
                </button>
            </div>

            {rulesOpen && <RulesViewer onClose={() => setRulesOpen(false)} />}
        </div>
    );
}