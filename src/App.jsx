/**
 * App component — root application component rendering the game board.
 * Phase 4 — Board visualization, highlight overlay interaction.
 */

import { useState, useMemo } from 'react';
import { Board } from './components/Board.jsx';
import { createInitialState, getController } from './game/gameState.js';
import { getReachableHexes, getPathsToHex } from './game/movement.js';
import { BOARD_FIELDS } from './hex/boardConstants.js';

/** Shared starting state; recreated only on app reload. */
const INITIAL_STATE = createInitialState(['red', 'blue'], BOARD_FIELDS);

/**
 * Root application component.
 *
 * @returns {JSX.Element}
 */
export function App() {
    const [gameState]   = useState(INITIAL_STATE);
    const [selectedHex, setSelectedHex] = useState(null);
    const [targetHex,   setTargetHex]   = useState(null);

    /** Hex keys reachable by the selected die (empty Set when nothing selected). */
    const reachableKeys = useMemo(() => {
        if (!selectedHex) return new Set();
        return getReachableHexes(gameState, selectedHex);
    }, [gameState, selectedHex]);

    /**
     * Intermediate hexes on the shortest path from selectedHex to targetHex.
     * Excludes both endpoints so they keep their own visual role.
     */
    const trajectoryKeys = useMemo(() => {
        if (!selectedHex || !targetHex) return new Set();
        const paths = getPathsToHex(gameState, selectedHex, targetHex);
        if (paths.length === 0) return new Set();
        const shortest = paths.reduce((a, b) => (a.length <= b.length ? a : b));
        return new Set(shortest.slice(1, -1));
    }, [gameState, selectedHex, targetHex]);

    /** Map of hexKey → highlight type passed down to Board → HexTile. */
    const highlightedHexes = useMemo(() => {
        const map = {};
        for (const key of reachableKeys) {
            const controller = getController(gameState, key);
            const isEnemy = controller !== null && controller !== gameState.currentPlayer;
            map[key] = isEnemy ? 'enemy-reachable' : 'reachable';
        }
        for (const key of trajectoryKeys) {
            map[key] = 'trajectory';
        }
        return map;
    }, [gameState, reachableKeys, trajectoryKeys]);

    /**
     * Handles a hex click from the board.
     *
     * @param {string} key - hexKey of the clicked hex.
     * @returns {void}
     */
    function handleHexClick(key) {
        const controller = getController(gameState, key);
        const isOwn = controller === gameState.currentPlayer;

        if (!selectedHex) {
            // Initial selection: must click own die
            if (isOwn) {
                setSelectedHex(key);
                setTargetHex(null);
            }
            return;
        }

        if (key === selectedHex) {
            // Click same die again → deselect
            setSelectedHex(null);
            setTargetHex(null);
            return;
        }

        if (reachableKeys.has(key)) {
            if (key === targetHex) {
                // Second click on same target → clear all
                setSelectedHex(null);
                setTargetHex(null);
            } else {
                // Show trajectory toward this target
                setTargetHex(key);
            }
            return;
        }

        if (isOwn) {
            // Switch selection to another own die
            setSelectedHex(key);
            setTargetHex(null);
            return;
        }

        // Click outside reachable area → deselect
        setSelectedHex(null);
        setTargetHex(null);
    }

    return (
        <div className="min-h-screen bg-(--color-bg) flex flex-col items-center py-8 gap-6">
            <h1 className="text-4xl font-bold text-(--color-title)">Donjon Fall</h1>
            <Board
                state={gameState}
                selectedHex={selectedHex}
                highlightedHexes={highlightedHexes}
                onHexClick={handleHexClick}
            />
        </div>
    );
}

