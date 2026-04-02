/**
 * MainMenu component — primary navigation hub.
 * Phase 9.3
 */

import { useState } from 'react';
import { RulesViewer } from './RulesViewer.jsx';

/**
 * @param {{ onPlay: () => void }} props
 * @returns {JSX.Element}
 */
export function MainMenu({ onPlay }) {
    const [rulesOpen, setRulesOpen] = useState(false);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-stone-900 text-white">
            {/* Placeholder logo */}
            <div className="w-24 h-24 rounded-full bg-stone-600 flex items-center justify-center mb-6 text-stone-400 text-sm">
                LOGO
            </div>

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