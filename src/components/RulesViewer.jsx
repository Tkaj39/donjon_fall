/**
 * RulesViewer component — modal overlay displaying the game rules.
 * Phase 8.3 — Rules viewer.
 *
 * Structured into collapsible sections mirroring the rules in CLAUDE.md.
 * Can be opened from the main menu or from within an active game without
 * affecting game state in any way.
 */

import { useState } from "react";

// ---------------------------------------------------------------------------
// Shared style helpers
// ---------------------------------------------------------------------------

const smallBtnStyle = {
    padding:      "0.25rem 0.65rem",
    borderRadius: "0.4rem",
    border:       "1px solid rgba(255,255,255,0.2)",
    background:   "rgba(255,255,255,0.07)",
    color:        "rgba(241,245,249,0.75)",
    fontSize:     "0.75rem",
    cursor:       "pointer",
};

// ---------------------------------------------------------------------------
// Rules data
// ---------------------------------------------------------------------------

/** Each entry: { id, title, content } where content is an array of paragraphs/lists. */
const SECTIONS = [
    {
        id:    "board",
        title: "Board & Components",
        items: [
            "61 hexagonal fields arranged in a large hexagon. Default map; more maps can be designed.",
            "Two players: red and blue.",
            "Each player gets 5 D6 dice representing their units, plus one shared extra D6 for focal point resolution.",
            "Red base = top row; Blue base = bottom row. Bases act as normal fields during play.",
            "3 focal points in the middle horizontal row (left, center, right). The center focal point starts active.",
        ],
    },
    {
        id:    "win",
        title: "Win Condition",
        items: [
            "First player to accumulate 5 victory points wins. Points are permanent (cannot be lost).",
            "Points are scored only on your own turn.",
            "A player who cannot make a legal move immediately loses (sudden death).",
        ],
    },
    {
        id:    "scoring",
        title: "Scoring",
        items: [
            "Destruction: +1 point per enemy die destroyed (pushed off map, encircled, or tower collapse).",
            "Focal points: if your die held an active focal point at the end of your previous turn, at the start of your current turn you score 1 point, reroll that die (new value = min(roll, original−1)), then roll the extra D6 to pick which remaining focal point activates next (even = left, odd = right).",
        ],
    },
    {
        id:    "turn",
        title: "Turn Structure",
        items: [
            "1. Focal points — resolve any focal point scoring.",
            "2. Actions — choose and perform exactly one action.",
            "3. Combat — resolve combat if your move ended on an enemy field.",
            "4. Victory — check if you have 5+ points.",
        ],
    },
    {
        id:    "actions",
        title: "Actions",
        items: [
            "Move die — move one of your dice up to its face value in hexes. Cannot pass through enemy dice. Can pass through friendly dice only if your die has higher attack strength. Jump from tower: top die may detach and jump (range = own dice − enemy dice, min 1); attack strength uses jumping die value alone.",
            "Tower collapse — available when tower has 3+ dice and you control the top. Removes the bottom die; score 1 point if it was an enemy die.",
            "Move whole tower — controlled by the player with the top die. Range = own dice − enemy dice (min 1). If destination has an enemy, only push is available.",
            "Reroll — reroll one of your dice (standalone or tower top). If the new value is lower than the original, keep the original. Value can only stay the same or increase.",
        ],
    },
    {
        id:    "combat",
        title: "Combat",
        items: [
            "Triggered when a move ends on an enemy-occupied field.",
            "Attack strength = top die value + own dice count − enemy dice count.",
            "Attack succeeds only if attack strength strictly exceeds defender's attack strength.",
            "Phase 1 (automatic): attacker's die value decreases by 1 (minimum 1).",
            "Phase 2 — Push: enemy formation is pushed 1 hex in the attack direction if a free field exists. One defeated enemy die rerolls (min(roll, original)). Chain reaction: formations behind are also pushed — those that hit your unit or the map edge are destroyed (score 1 point each). Encirclement: if your own unit blocks the retreat, the last formation is destroyed.",
            "Phase 2 — Occupy: attacker's die is placed on top of the enemy, creating a mixed tower. Defender does not reroll.",
        ],
    },
    {
        id:    "towers",
        title: "Towers & Key Terms",
        items: [
            "Tower: 2+ dice on the same field. A new die can only be added if its attack strength strictly exceeds the current top die's attack strength. Control = player with the top die.",
            "Mixed tower: tower containing both players' dice. Controlled by the player with the top die — only that player can move it, attack from it, or jump from it.",
            "Base: starting row; no special rules during play.",
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
 */
function RulesSection({ id, title, items, isOpen, onToggle }) {
    return (
        <div
            style={{
                borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
        >
            <button
                id={`rules-heading-${id}`}
                aria-expanded={isOpen}
                aria-controls={`rules-panel-${id}`}
                onClick={onToggle}
                style={{
                    width:          "100%",
                    display:        "flex",
                    justifyContent: "space-between",
                    alignItems:     "center",
                    padding:        "0.75rem 0",
                    background:     "none",
                    border:         "none",
                    cursor:         "pointer",
                    color:          "#f1f5f9",
                    fontWeight:     600,
                    fontSize:       "0.95rem",
                    textAlign:      "left",
                }}
            >
                {title}
                <span
                    aria-hidden="true"
                    style={{
                        transition: "transform 0.2s",
                        transform:  isOpen ? "rotate(180deg)" : "rotate(0deg)",
                        opacity:    0.6,
                        fontSize:   "0.75rem",
                        flexShrink: 0,
                        marginLeft: "0.5rem",
                    }}
                >
                    ▼
                </span>
            </button>

            {isOpen && (
                <ul
                    id={`rules-panel-${id}`}
                    role="region"
                    aria-labelledby={`rules-heading-${id}`}
                    style={{
                        margin:     "0 0 0.75rem 0",
                        padding:    "0 0 0 1.1rem",
                        color:      "rgba(241,245,249,0.82)",
                        fontSize:   "0.85rem",
                        lineHeight: 1.65,
                    }}
                >
                    {items.map((text, i) => (
                        <li key={i} style={{ marginBottom: "0.35rem" }}>
                            {text}
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
            style={{
                position:       "fixed",
                inset:          0,
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                background:     "rgba(0,0,0,0.75)",
                zIndex:         300,
                padding:        "1rem",
            }}
            onClick={(e) => {
                // Close when clicking the backdrop (not the panel)
                if (e.target === e.currentTarget) onClose();
            }}
        >
            {/* Panel */}
            <div
                style={{
                    background:   "var(--color-panel-bg, #1e293b)",
                    border:       "2px solid var(--color-panel-border, #475569)",
                    borderRadius: "1rem",
                    width:        "100%",
                    maxWidth:     "36rem",
                    maxHeight:    "85vh",
                    display:      "flex",
                    flexDirection:"column",
                    boxShadow:    "0 16px 48px rgba(0,0,0,0.6)",
                    overflow:     "hidden",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display:        "flex",
                        justifyContent: "space-between",
                        alignItems:     "center",
                        padding:        "1rem 1.25rem 0.75rem",
                        borderBottom:   "1px solid rgba(255,255,255,0.1)",
                        flexShrink:     0,
                    }}
                >
                    <h2
                        style={{
                            margin:     0,
                            fontSize:   "1.15rem",
                            fontWeight: 700,
                            color:      "#f1f5f9",
                        }}
                    >
                        Game Rules
                    </h2>

                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <button
                            data-testid="expand-all-btn"
                            onClick={expandAll}
                            style={smallBtnStyle}
                        >
                            Expand all
                        </button>
                        <button
                            data-testid="collapse-all-btn"
                            onClick={collapseAll}
                            style={smallBtnStyle}
                        >
                            Collapse all
                        </button>
                        <button
                            data-testid="close-btn"
                            aria-label="Close rules viewer"
                            onClick={onClose}
                            style={{
                                ...smallBtnStyle,
                                fontWeight: 700,
                                fontSize:   "1.1rem",
                                padding:    "0.2rem 0.55rem",
                            }}
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Scrollable body */}
                <div
                    style={{
                        overflowY: "auto",
                        padding:   "0 1.25rem",
                        flexGrow:  1,
                    }}
                >
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
