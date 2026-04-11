/**
 * SplashScreen component — shown briefly on app start while assets load.
 * Phase 9.2
 */

import { useEffect } from "react";
import { preloadImages } from "../utils/preloadImages.js";
import { MENU_ASSETS } from "../styles/themes/default.js";
import { Logo } from "./Logo.jsx";
import { Spinner } from "./Spinner.jsx";

/** Minimum display duration after assets are loaded. */
const SPLASH_DURATION_MS = 2000;

/**
 * @param {{ onDone: () => void }} props
 * @returns { React.JSX.Element }
 */
export function SplashScreen({ onDone }) {
    useEffect(() => {
        let cancelled = false;
        preloadImages(MENU_ASSETS).then(() => {
            if (cancelled) return;
            const timer = setTimeout(() => { if (!cancelled) onDone(); }, SPLASH_DURATION_MS);
            return () => clearTimeout(timer);
        });
        return () => { cancelled = true; };
    }, [onDone]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-stone-900 text-white">
            <Logo className="w-48 h-48 mb-8" />
            <Spinner />
            <p className="mt-6 text-stone-400 text-sm uppercase tracking-widest">
                Loading…
            </p>
        </div>
    );
}