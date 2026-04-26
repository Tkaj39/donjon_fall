/**
 * RulesViewer component — modal overlay displaying the game rules.
 * Phase 8.3 — Rules viewer.
 *
 * Structured into collapsible sections mirroring the rules in CLAUDE.md.
 * Can be opened from the main menu or from within an active game without
 * affecting game state in any way.
 */

import { useState } from "react";

import picArrow         from "../assets/pictogram/pictogram-arrow.svg";
import picBoot          from "../assets/pictogram/pictogram-boot.svg";
import picMoveDice      from "../assets/pictogram/pictogram-move-dice.svg";
import picMoveTower     from "../assets/pictogram/pictogram-move-tower.svg";
import picAttack        from "../assets/pictogram/pictogram-attack.svg";
import picDestroyed     from "../assets/pictogram/pictogram-destroyed.svg";
import picFocalActive   from "../assets/pictogram/pictogram-focal-active.svg";
import picFocalInactive from "../assets/pictogram/pictogram-focal-inactive.svg";
import picJump          from "../assets/pictogram/pictogram-jump.svg";
import picMinus         from "../assets/pictogram/pictogram-minus.svg";
import picNum1          from "../assets/pictogram/pictogram-num-1.svg";
import picNum2          from "../assets/pictogram/pictogram-num-2.svg";
import picNum3          from "../assets/pictogram/pictogram-num-3.svg";
import picNum4          from "../assets/pictogram/pictogram-num-4.svg";
import picPlus          from "../assets/pictogram/pictogram-plus.svg";
import picPush          from "../assets/pictogram/pictogram-push.svg";
import picHex          from "../assets/pictogram/pictogram-hex.svg";
import picReroll        from "../assets/pictogram/pictogram-reroll.svg";
import picTower        from "../assets/pictogram/pictogram-tower.svg";
import picTowerCollapse from "../assets/pictogram/pictogram-tower-collapse.svg";
import picTowerMove     from "../assets/pictogram/pictogram-tower-move.svg";

// ---------------------------------------------------------------------------
// Rules data
// ---------------------------------------------------------------------------

/** Each item: { text, icon? } — icon is an imported SVG URL. */
const SECTIONS = [
    {
        id:    "board",
        title: "Board & Components",
        items: [
            { text: "61 hexagonal fields arranged in a large hexagon. Default map; more maps can be designed." },
            { text: "Two players: red and blue." },
            { text: "Each player gets 5 D6 dice representing their units, plus one shared extra D6 for focal point resolution." },
            { text: "Red base = top row; Blue base = bottom row. Bases act as normal fields during play." },
            { text: "3 focal points in the middle horizontal row (left, center, right). The center focal point starts active.", icon: picFocalActive },
        ],
    },
    {
        id:    "win",
        title: "Win Condition",
        items: [
            { text: "First player to accumulate 5 victory points wins. Points are permanent (cannot be lost).", icon: picPlus },
            { text: "Points are scored only on your own turn." },
            { text: "A player who cannot make a legal move immediately loses (sudden death)." },
        ],
    },
    {
        id:    "scoring",
        title: "Scoring",
        items: [
            { text: "Destruction: +1 point per enemy die destroyed (pushed off map, encircled, or tower collapse).", icon: picDestroyed },
            { text: "Focal points: if your die held an active focal point at the end of your previous turn, you score 1 point, reroll that die (min(roll, original−1)), then roll the extra D6 to pick which remaining focal point activates next (even = left, odd = right).", icon: picFocalActive },
        ],
    },
    {
        id:    "turn",
        title: "Turn Structure",
        items: [
            { text: "1. Focal points — resolve any focal point scoring.", icon: picNum1 },
            { text: "2. Actions — choose and perform exactly one action.", icon: picNum2 },
            { text: "3. Combat — resolve combat if your move ended on an enemy field.", icon: picNum3 },
            { text: "4. Victory — check if you have 5+ points.", icon: picNum4 },
        ],
    },
    {
        id:    "actions",
        title: "Actions",
        items: [
            { text: "Move die — move one of your dice up to its face value in hexes. Cannot pass through enemy dice. Can pass through friendly dice only if your die has higher attack strength.", icon: picMoveDice },
            { text: "Jump from tower: top die may detach and jump (range = own dice − enemy dice, min 1); attack strength uses jumping die value alone.", icon: picJump },
            { text: "Tower collapse — available when tower has 3+ dice and you control the top. Removes the bottom die; score 1 point if it was an enemy die.", icon: picTowerCollapse },
            { text: "Move whole tower — controlled by the player with the top die. Range = own dice − enemy dice (min 1). If destination has an enemy, only push is available.", icon: picMoveTower },
            { text: "Reroll — reroll one of your dice (standalone or tower top). If the new value is lower than the original, keep the original. Value can only stay the same or increase.", icon: picReroll },
        ],
    },
    {
        id:    "combat",
        title: "Combat",
        items: [
            { text: "Triggered when a move ends on an enemy-occupied field.", icon: picAttack },
            { text: "Attack strength = top die value + own dice count − enemy dice count." },
            { text: "Attack succeeds only if attack strength strictly exceeds defender's attack strength." },
            { text: "Phase 1 (automatic): attacker's die value decreases by 1 (minimum 1)." },
            { text: "Phase 2 — Push: enemy formation is pushed 1 hex in the attack direction if a free field exists. One defeated enemy die rerolls. Chain reaction: formations pushed into your unit or the map edge are destroyed (score 1 point each). Encirclement: if your own unit blocks the retreat, the last formation is destroyed.", icon: picPush },
            { text: "Phase 2 — Occupy: attacker's die is placed on top of the enemy, creating a mixed tower. Defender does not reroll.", icon: picJump },
        ],
    },
    {
        id:    "towers",
        title: "Towers & Key Terms",
        items: [
            { text: "Tower: 2+ dice on the same field. A new die can only be added if its attack strength strictly exceeds the current top die's attack strength. Control = player with the top die." },
            { text: "Mixed tower: tower containing both players' dice. Controlled by the player with the top die — only that player can move it, attack from it, or jump from it." },
            { text: "Inactive focal point: not currently scoring.", icon: picFocalInactive },
            { text: "Base: starting row; no special rules during play." },
        ],
    },
];

// ---------------------------------------------------------------------------
// Section sub-component
// ---------------------------------------------------------------------------

/**
 * One collapsible rules section.
 *
 * @param {Object}   props
 * @param {string}   props.id       - Unique section ID.
 * @param {string}   props.title    - Section heading.
 * @param {string[]} props.items    - Array of rule text strings.
 * @param {boolean}  props.isOpen   - Whether this section is expanded.
 * @param {function} props.onToggle - Callback to toggle open/closed state.
 * @returns {JSX.Element}
 */
function RulesSection({ id, title, items, isOpen, onToggle }) {
    return (
        <div className="border-b border-white/[0.08]">
            <button
                id={`rules-heading-${id}`}
                aria-expanded={isOpen}
                aria-controls={`rules-panel-${id}`}
                onClick={onToggle}
                className="w-full flex justify-between items-center py-3 bg-transparent border-0 cursor-pointer text-[#f1f5f9] font-semibold text-[0.95rem] text-left"
            >
                {title}
                <span
                    aria-hidden="true"
                    className={`transition-transform duration-200 opacity-60 text-[0.75rem] shrink-0 ml-2 ${isOpen ? "rotate-180" : ""}`}
                >
                    ▼
                </span>
            </button>

            {isOpen && (
                <ul
                    id={`rules-panel-${id}`}
                    role="region"
                    aria-labelledby={`rules-heading-${id}`}
                    className="m-0 mb-3 p-0 list-none text-[rgba(241,245,249,0.82)] text-[0.85rem] leading-[1.65]"
                >
                    {items.map((item, i) => (
                        <li key={i} className="mb-[0.35rem] flex items-start gap-2">
                            {item.icon
                                ? <img src={item.icon} alt="" className="w-4 h-4 mt-[0.2rem] shrink-0 invert opacity-70" />
                                : <span className="w-4 h-4 mt-[0.2rem] shrink-0" />
                            }
                            <span>{item.text}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * Full-screen modal overlay showing the game rules in collapsible sections.
 *
 * @param {Object}   props
 * @param {function} props.onClose - Callback invoked when the player closes the viewer.
 * @returns {JSX.Element}
 */
export function RulesViewer({ onClose }) {
    // Track which section IDs are open; start with all closed.
    const [openSections, setOpenSections] = useState(new Set());

    /**
     * Toggles the open/closed state of a rules section.
     *
     * @param {string} id - Section ID to toggle.
     * @returns {void}
     */
    function toggleSection(id) {
        setOpenSections((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }

    /**
     * Expands all rules sections.
     *
     * @returns {void}
     */
    function expandAll() {
        setOpenSections(new Set(SECTIONS.map((s) => s.id)));
    }

    /**
     * Collapses all rules sections.
     *
     * @returns {void}
     */
    function collapseAll() {
        setOpenSections(new Set());
    }

    return (
        /* Backdrop */
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Rules viewer"
            className="fixed inset-0 flex items-center justify-center z-[300] p-4"
            onClick={(e) => {
                // Close when clicking the backdrop (not the panel)
                if (e.target === e.currentTarget) onClose();
            }}
        >
            {/* Panel */}
            <div className="frame-panel w-full max-w-[36rem] max-h-[85vh] flex flex-col overflow-hidden px-4 py-4">
                {/* Header */}
                <div className="flex justify-between items-center pt-6 pb-3 px-4 sm:px-8 border-b border-white/10 shrink-0">
                    <h2 className="m-0 text-[1.15rem] font-bold text-[#f1f5f9]">
                        Game Rules
                    </h2>

                    <div className="flex gap-2 items-center">
                        <button
                            data-testid="expand-all-btn"
                            onClick={expandAll}
                            className="py-[0.2rem] px-[0.55rem] rounded-[0.4rem] border border-white/20 bg-white/[0.07] text-[rgba(241,245,249,0.75)] text-[1.1rem] cursor-pointer"
                        >
                            Expand all
                        </button>
                        <button
                            data-testid="collapse-all-btn"
                            onClick={collapseAll}
                            className="py-[0.2rem] px-[0.55rem] rounded-[0.4rem] border border-white/20 bg-white/[0.07] text-[rgba(241,245,249,0.75)] text-[1.1rem] cursor-pointer"
                        >
                            Collapse all
                        </button>
                        <button
                            data-testid="close-btn"
                            aria-label="Close rules viewer"
                            onClick={onClose}
                            className="btn-frame-sm px-2 py-1 text-stone-400 hover:text-stone-100 cursor-pointer text-base leading-none transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Scrollable body */}
                <div className="overflow-y-auto scrollbar-stone px-4 sm:px-8 pb-6 grow">
                    {SECTIONS.map((section) => (
                        <RulesSection
                            key={section.id}
                            id={section.id}
                            title={section.title}
                            items={section.items}
                            isOpen={openSections.has(section.id)}
                            onToggle={() => toggleSection(section.id)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
