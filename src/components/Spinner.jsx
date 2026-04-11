/**
 * Spinner component — used on loading screens.
 * Phase 14
 */

/**
 * @returns { React.JSX.Element }
 */
export function Spinner() {
    return (
        <div className="w-32 h-32 rounded-full border-4 border-stone-400 border-t-transparent animate-spin" />
    );
}
