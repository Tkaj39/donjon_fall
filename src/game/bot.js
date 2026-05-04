/**
 * Bot player using Monte Carlo Tree Search (MCTS).
 *
 * Move generation delegates entirely to existing game functions so only
 * legal moves are ever considered — the same functions that gate the UI.
 *
 * Randomness (reroll values, focal-phase rolls) is sampled at the point
 * where it is needed and injected into the pure reducer, keeping the
 * reducer itself deterministic.
 */

import { gameReducer } from "./gameReducer.js";
import {
    getReachableHexes,
    getJumpReachableHexes,
    getTowerReachableHexes,
    getShortestPathToHex,
    canCollapse,
} from "./movement.js";
import { getAvailableCombatOptions } from "./combat.js";
import { getController, getAttackStrength } from "./gameState.js";
import { hexFromKey, getNeighbors, hexesDistance } from "../hex/hexUtils.js";
import { isOnBoard } from "../hex/boardUtils.js";
import { BOARD_HEX_SET } from "../hex/boardConstants.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VICTORY_POINTS = 5;
const EXPLORATION = Math.SQRT2;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function roll() {
    return Math.ceil(Math.random() * 6);
}

/** Auto-advance the focal phase with sampled random rolls (not a decision). */
function advanceFocal(state) {
    if (state.phase !== "focal") return state;
    return gameReducer(state, {
        type: "ADVANCE_FOCAL_PHASE",
        dieNewValue: roll(),
        extraDieRoll: roll(),
    });
}

/**
 * Apply a bot action and, if no combat was triggered, auto-confirm to end the
 * action phase so the next state is always at a decision point.
 */
function applyMove(state, move) {
    const next = gameReducer(state, move);
    if (next.actionTaken && next.phase === "action") {
        return gameReducer(next, { type: "CONFIRM_ACTION" });
    }
    return next;
}

// ---------------------------------------------------------------------------
// Move generation — legal moves only, via game functions
// ---------------------------------------------------------------------------

/**
 * Returns all legal moves for the current player given `state`.
 * Delegates to the same game functions used by the UI, so no illegal move
 * can appear in the tree.
 *
 * @param {import("./gameState.js").GameState} state
 * @returns {Object[]}  Array of action objects ready to dispatch to gameReducer.
 */
export function generateLegalMoves(state) {
    // Combat phase: choose push or occupy
    if (state.phase === "combat") {
        return getAvailableCombatOptions(state).map(option =>
            option === "push"
                ? { type: "CHOOSE_COMBAT_OPTION", option: "push", rerollValue: roll() }
                : { type: "CHOOSE_COMBAT_OPTION", option: "occupy" },
        );
    }

    if (state.phase !== "action" || state.actionTaken) return [];

    const moves = [];
    const player = state.currentPlayer;

    for (const [fromKey, stack] of Object.entries(state.dice)) {
        if (!stack.length) continue;
        if (stack[stack.length - 1].owner !== player) continue;

        // MOVE_DIE — reachable hexes from the game's own BFS.
        // getShortestPathToHex (BFS) replaces getApproachDirections (all-paths DFS)
        // — we only need one valid approach direction, not all of them.
        for (const toKey of getReachableHexes(state, fromKey)) {
            const path = getShortestPathToHex(state, fromKey, toKey, "move-die");
            const dir = path.length >= 2 ? path[path.length - 2] : null;
            moves.push({ type: "MOVE_DIE", fromHex: fromKey, toHex: toKey, approachDirection: dir });
        }

        if (stack.length >= 2) {
            // JUMP — top die detaches from tower
            for (const toKey of getJumpReachableHexes(state, fromKey)) {
                const path = getShortestPathToHex(state, fromKey, toKey, "move-die");
                const dir = path.length >= 2 ? path[path.length - 2] : null;
                moves.push({ type: "JUMP", towerHex: fromKey, targetHex: toKey, approachDirection: dir });
            }

            // MOVE_TOWER — whole tower moves
            for (const toKey of getTowerReachableHexes(state, fromKey)) {
                const path = getShortestPathToHex(state, fromKey, toKey, "move-tower");
                const dir = path.length >= 2 ? path[path.length - 2] : null;
                moves.push({ type: "MOVE_TOWER", fromHex: fromKey, toHex: toKey, approachDirection: dir });
            }
        }

        // COLLAPSE — remove bottom die from 3+ tower
        if (canCollapse(state, fromKey)) {
            moves.push({ type: "COLLAPSE", hex: fromKey });
        }

        // REROLL — value is sampled; reducer keeps max(roll, original)
        moves.push({ type: "REROLL", hex: fromKey, newValue: roll() });
    }

    return moves;
}

// ---------------------------------------------------------------------------
// Evaluation function
// ---------------------------------------------------------------------------

/**
 * Heuristic score of `state` from `player`'s perspective.
 * Terminal wins/losses return large values that dominate non-terminal scores.
 *
 * @param {import("./gameState.js").GameState} state
 * @param {string} player
 * @returns {number}
 */
function evaluateState(state, player) {
    if (state.phase === "victory") {
        return (state.scores[player] ?? 0) >= VICTORY_POINTS ? 1000 : -1000;
    }

    const opponent = state.players.find(p => p !== player);
    let score = ((state.scores[player] ?? 0) - (state.scores[opponent] ?? 0)) * 10;

    // Formation combat power: top die value + own supporting count − enemy count (per rules).
    // Buried dice contribute ±1 to their tower's combat power regardless of face value.
    let myPower = 0, theirPower = 0;
    for (const [hexKey, stack] of Object.entries(state.dice)) {
        if (stack.length === 0) continue;
        const ctrl = getController(state, hexKey);
        const strength = getAttackStrength(state, hexKey);
        if (ctrl === player) myPower += strength;
        else if (ctrl === opponent) theirPower += strength;

        // Friendly dice buried in an enemy-controlled tower risk being collapsed (enemy scores 1 VP).
        if (ctrl === opponent) {
            const buriedFriendly = stack.slice(0, -1).filter(d => d.owner === player).length;
            score -= buriedFriendly;
        }
    }
    score += (myPower - theirPower) * 0.5;

    // Focal point control — generalized over all focal points and groups.
    // Active focal point: full weight. Passive: weight / passive count in same group,
    // reflecting the uniform probability that it becomes the next active one.
    const allFocalEntries = Object.entries(state.focalPoints);
    const focalHexKeys = new Set(allFocalEntries.map(([k]) => k));
    for (const [hexKey, fp] of allFocalEntries) {
        const ctrl = getController(state, hexKey);
        if (!ctrl) continue;
        let weight;
        if (fp.isActive) {
            weight = 3;
        } else {
            const passiveInGroup = allFocalEntries.filter(
                ([, f]) => f.group === fp.group && !f.isActive
            ).length;
            weight = 3 / passiveInGroup;
        }
        if (ctrl === player) score += weight;
        else if (ctrl === opponent) score -= weight;
    }

    // Die count: each surviving die is worth 0.3 — losing a die permanently reduces
    // mobility and combat power for the rest of the game.
    // Tower collapse threat: if a tower has 3+ dice and the top die belongs to the
    // opponent, the opponent can collapse it next turn and score 1 VP per buried
    // friendly die. Penalise 1.5 per collapsible position (on top of the buried-die
    // penalty already applied above).
    let myDieCount = 0, theirDieCount = 0;
    for (const [hexKey, stack] of Object.entries(state.dice)) {
        if (stack.length === 0) continue;
        for (const die of stack) {
            if (die.owner === player) myDieCount++;
            else theirDieCount++;
        }
        if (stack.length >= 3) {
            const ctrl = getController(state, hexKey);
            if (ctrl === opponent) score -= 1.5;
            else if (ctrl === player) score += 1.5;
        }
    }
    score += (myDieCount - theirDieCount) * 0.3;

    // Mobility: sum of face values of own top dice (standalone or tower top).
    // Higher face value = more reachable hexes per turn.
    // Focal-point proximity: for each own top die, reward closeness to the nearest
    // active focal point not already controlled by the player (BFS distance via
    // hexesDistance — no board-path cost, intentionally approximate).
    const activeFocals = allFocalEntries
        .filter(([, fp]) => fp.isActive)
        .map(([k]) => k);
    let myMobility = 0, theirMobility = 0;
    for (const [hexKey, stack] of Object.entries(state.dice)) {
        if (stack.length === 0) continue;
        const ctrl = getController(state, hexKey);
        const top = stack[stack.length - 1];
        if (ctrl === player) {
            myMobility += top.value;
            if (activeFocals.length > 0) {
                const hex = hexFromKey(hexKey);
                const minDist = Math.min(
                    ...activeFocals
                        .filter(fk => getController(state, fk) !== player)
                        .map(fk => hexesDistance(hex, hexFromKey(fk)))
                );
                if (isFinite(minDist) && minDist > 0) score += 1 / minDist;
            }
        } else if (ctrl === opponent) {
            theirMobility += top.value;
            if (activeFocals.length > 0) {
                const hex = hexFromKey(hexKey);
                const minDist = Math.min(
                    ...activeFocals
                        .filter(fk => getController(state, fk) !== opponent)
                        .map(fk => hexesDistance(hex, hexFromKey(fk)))
                );
                if (isFinite(minDist) && minDist > 0) score -= 1 / minDist;
            }
        }
    }
    score += (myMobility - theirMobility) * 0.1;

    // Edge proximity: count valid board neighbors for each own top die.
    // Fewer valid neighbors = closer to edge/hole = more vulnerable to being pushed off.
    // Max 6 neighbors; reward the difference in average neighbor count.
    let myEdgeSum = 0, myEdgeCount = 0, theirEdgeSum = 0, theirEdgeCount = 0;
    for (const [hexKey, stack] of Object.entries(state.dice)) {
        if (stack.length === 0) continue;
        const ctrl = getController(state, hexKey);
        if (ctrl !== player && ctrl !== opponent) continue;
        const validNeighbors = getNeighbors(hexFromKey(hexKey))
            .filter(n => isOnBoard(n)).length;
        if (ctrl === player) { myEdgeSum += validNeighbors; myEdgeCount++; }
        else { theirEdgeSum += validNeighbors; theirEdgeCount++; }
    }
    const myEdgeAvg = myEdgeCount > 0 ? myEdgeSum / myEdgeCount : 0;
    const theirEdgeAvg = theirEdgeCount > 0 ? theirEdgeSum / theirEdgeCount : 0;
    score += (myEdgeAvg - theirEdgeAvg) * 0.2;

    return score;
}

// ---------------------------------------------------------------------------
// MCTS
// ---------------------------------------------------------------------------

class MCTSNode {
    constructor(state, move = null, parent = null) {
        this.state = state;
        this.move = move;
        this.parent = parent;
        this.children = [];
        this.visits = 0;
        this.totalScore = 0;
        this._untriedMoves = null;
    }

    get untriedMoves() {
        if (this._untriedMoves === null) {
            this._untriedMoves = generateLegalMoves(this.state);
        }
        return this._untriedMoves;
    }

    isFullyExpanded() {
        return this.untriedMoves.length === 0;
    }

    isTerminal() {
        return this.state.phase === "victory";
    }

    ucb1() {
        if (this.visits === 0) return Infinity;
        return this.totalScore / this.visits +
            EXPLORATION * Math.sqrt(Math.log(this.parent.visits) / this.visits);
    }

    selectChild() {
        return this.children.reduce((best, c) => c.ucb1() > best.ucb1() ? c : best);
    }

    expand() {
        const move = this.untriedMoves.pop();
        const childState = advanceFocal(applyMove(this.state, move));
        const child = new MCTSNode(childState, move, this);
        this.children.push(child);
        return child;
    }

    backpropagate(score) {
        this.visits++;
        this.totalScore += score;
        if (this.parent) this.parent.backpropagate(score);
    }
}

/**
 * Fast random rollout — avoids the full generateLegalMoves enumeration.
 *
 * Each step picks a random own die then a random reachable hex (BFS only —
 * no all-paths DFS). Combat is resolved randomly. Focal phases are
 * auto-advanced. Stops after ROLLOUT_DEPTH full turns or on victory.
 *
 * @param {import("./gameState.js").GameState} state
 * @param {string} botPlayer
 * @returns {number}
 */
function simulate(state, botPlayer) {
    let s = advanceFocal(state);

    for (let depth = 0; depth < ROLLOUT_DEPTH; depth++) {
        if (s.phase === "victory") break;

        if (s.phase === "combat") {
            const options = getAvailableCombatOptions(s);
            const option = options[Math.floor(Math.random() * options.length)];
            s = advanceFocal(gameReducer(s, { type: "CHOOSE_COMBAT_OPTION", option, rerollValue: roll() }));
            continue;
        }

        if (s.phase !== "action" || s.actionTaken) break;

        // Collect own die hex keys
        const ownKeys = Object.keys(s.dice).filter(k => {
            const stack = s.dice[k];
            return stack.length > 0 && stack[stack.length - 1].owner === s.currentPlayer;
        });
        if (ownKeys.length === 0) break;

        // Try up to 3 random dice to find one with valid destinations
        let moved = false;
        for (let attempt = 0; attempt < 3 && !moved; attempt++) {
            const fromKey = ownKeys[Math.floor(Math.random() * ownKeys.length)];
            const reachable = [...getReachableHexes(s, fromKey)];
            if (reachable.length === 0) continue;
            const toKey = reachable[Math.floor(Math.random() * reachable.length)];
            const next = gameReducer(s, { type: "MOVE_DIE", fromHex: fromKey, toHex: toKey });
            if (next === s) continue; // move was rejected
            s = next.actionTaken && next.phase === "action"
                ? advanceFocal(gameReducer(next, { type: "CONFIRM_ACTION" }))
                : next;
            moved = true;
        }
        if (!moved) break;
    }

    return evaluateState(s, botPlayer);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Number of MCTS iterations to run per async batch before yielding. */
const BATCH_SIZE = 80;

/** Max turns per simulation rollout. Kept shallow — deep random play adds noise, not signal. */
const ROLLOUT_DEPTH = 6;

/**
 * Returns the most-visited child's move, or null if no children exist yet.
 *
 * @param {MCTSNode} root
 * @returns {Object|null}
 */
function bestMoveSoFar(root) {
    if (root.children.length === 0) return null;
    return root.children.reduce((a, b) => a.visits > b.visits ? a : b).move;
}

/**
 * Runs one MCTS iteration on `root` in-place.
 *
 * @param {MCTSNode} root
 * @param {string} botPlayer
 */
function mctsIteration(root, botPlayer) {
    let node = root;
    while (!node.isTerminal() && node.isFullyExpanded()) node = node.selectChild();
    if (!node.isTerminal()) node = node.expand();
    node.backpropagate(simulate(node.state, botPlayer));
}

/**
 * Runs MCTS asynchronously in batches so the UI stays responsive.
 *
 * Calls `onMove(action)` when `timeoutMs` elapses (or immediately for focal/
 * victory phases). Returns a cancel function — call it to abort early.
 *
 * @param {import("./gameState.js").GameState} state
 * @param {string} botPlayer
 * @param {{ onMove: (action: Object|null) => void, timeoutMs?: number }} options
 * @returns {() => void}  cancel function
 */
export function getBotMoveAsync(state, botPlayer, { onMove, timeoutMs = 10000 }) {
    if (state.phase === "victory") {
        onMove(null);
        return () => {};
    }

    if (state.phase === "focal") {
        const move = { type: "ADVANCE_FOCAL_PHASE", dieNewValue: roll(), extraDieRoll: roll() };
        const id = setTimeout(() => onMove(move), 0);
        return () => clearTimeout(id);
    }

    const root = new MCTSNode(state);
    const deadline = Date.now() + timeoutMs;
    let timerId = null;
    let cancelled = false;

    function tick() {
        if (cancelled) return;

        if (Date.now() >= deadline) {
            onMove(bestMoveSoFar(root));
            return;
        }

        // Run iterations until the batch budget (50 ms) is exhausted so
        // no single tick can freeze the browser tab.
        const batchDeadline = Date.now() + 50;
        for (let i = 0; i < BATCH_SIZE && Date.now() < batchDeadline; i++) {
            mctsIteration(root, botPlayer);
        }

        timerId = setTimeout(tick, 0);
    }

    // Delay the first tick by 100 ms so React has time to paint the spinner
    // before any CPU-heavy work begins.
    timerId = setTimeout(tick, 100);

    return () => {
        cancelled = true;
        clearTimeout(timerId);
    };
}