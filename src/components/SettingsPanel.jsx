/**
 * SettingsPanel — shared settings UI used in MainMenu and the in-game pause overlay.
 * When `onClose` is provided, renders as a self-contained modal overlay.
 */

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SettingRow({ label, children }) {
    return (
        <div className="flex items-center justify-between border-b border-stone-700 pb-4">
            <span className="text-stone-300 font-medium tracking-wider">{label}</span>
            {children}
        </div>
    );
}

function ToggleSwitch({ value, onChange }) {
    return (
        <button
            onClick={() => onChange(!value)}
            className={`w-14 h-7 rounded-full transition-colors duration-200 cursor-pointer relative shadow-inner ${value ? "bg-amber-700" : "bg-stone-800"}`}
            style={{ border: "1px solid rgba(0,0,0,0.4)" }}
        >
            <span
                className={`absolute top-1 w-5 h-5 rounded-full transition-all duration-200 shadow-md ${value ? "left-8 bg-amber-200" : "left-1 bg-stone-500"}`}
            />
        </button>
    );
}

function ToggleChip({ active, onClick, children }) {
    return (
        <button
            onClick={onClick}
            className={`btn-frame-sm px-4 py-1 text-sm font-semibold tracking-wide cursor-pointer transition-colors ${active ? "text-stone-200" : "text-stone-500"}`}
        >
            {children}
        </button>
    );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * When `onClose` is provided, wraps the panel in a fixed backdrop overlay
 * that closes on outside click — matching Tutorial/RulesViewer behaviour.
 *
 * @param {Object}   props
 * @param {boolean}  props.sound               - Sound enabled.
 * @param {function} props.onSoundChange        - Called with new boolean.
 * @param {boolean}  props.animations           - Animations enabled.
 * @param {function} props.onAnimationsChange   - Called with new boolean.
 * @param {string}   [props.language]           - Active language code ("cs"|"en"). Omit to hide row.
 * @param {function} [props.onLanguageChange]   - Called with new language code.
 * @param {function} [props.onClose]            - Called when the panel should close.
 */
export function SettingsPanel({
    sound,
    onSoundChange,
    animations,
    onAnimationsChange,
    language,
    onLanguageChange,
    onClose,
}) {
    const panel = (
        <div className="frame-panel flex flex-col gap-5 w-[90vw] sm:w-80 px-6 sm:px-10 py-8">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-widest text-stone-300 uppercase">
                    Nastavení
                </h2>
                {onClose && (
                    <button
                        onClick={onClose}
                        aria-label="Zavřít"
                        className="btn-frame-sm px-2 py-1 text-stone-400 hover:text-stone-100 cursor-pointer text-base leading-none transition-colors"
                    >
                        ✕
                    </button>
                )}
            </div>

            {language !== undefined && onLanguageChange && (
                <SettingRow label="Jazyk">
                    <div className="flex gap-2">
                        <ToggleChip active={language === "cs"} onClick={() => onLanguageChange("cs")}>CS</ToggleChip>
                        <ToggleChip active={language === "en"} onClick={() => onLanguageChange("en")}>EN</ToggleChip>
                    </div>
                </SettingRow>
            )}

            <SettingRow label="Zvuk">
                <ToggleSwitch value={sound} onChange={onSoundChange} />
            </SettingRow>

            <SettingRow label="Animace">
                <ToggleSwitch value={animations} onChange={onAnimationsChange} />
            </SettingRow>
        </div>
    );

    if (!onClose) return panel;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onClick={onClose}
        >
            <div onClick={e => e.stopPropagation()}>
                {panel}
            </div>
        </div>
    );
}
