/**
 * App component — root application component.
 * Phase 9.1 — top-level screen state machine.
 *
 * Screen flow:
 *   splash → mainMenu → mapSelection → playerSetup → gameLoading → game
 *   ?style-guide URL param → styleGuide (dev helper page)
 */

import { useState } from "react";
import { Game } from "./components/Game.jsx";
import { SplashScreen } from "./components/SplashScreen.jsx";
import { MainMenu } from "./components/MainMenu.jsx";
import { MapSelection } from "./components/MapSelection.jsx";
import { PlayerSetup } from "./components/PlayerSetup.jsx";
import { GameLoading } from "./components/GameLoading.jsx";
import { StyleGuide } from "./components/StyleGuide.jsx";
import { DEFAULT_MAP } from "./game/boardDefinition.js";
import { ANIMAL_OPTIONS } from "./styles/themes/default.js";

/**
 * @typedef {"splash"|"mainMenu"|"mapSelection"|"playerSetup"|"gameLoading"|"game"|"styleGuide"} Screen
 */

/**
 * Root application component — manages screen transitions.
 *
 * @returns {JSX.Element}
 */
export function App() {
    const initialScreen = new URLSearchParams(window.location.search).has("style-guide")
        ? "styleGuide"
        : "splash";

    /** @type {[Screen, Function]} */
    const [screen, setScreen] = useState(initialScreen);

    /** @type {[import("./game/boardDefinition.js").BoardDefinition|null, Function]} */
    const [selectedMap, setSelectedMap] = useState(null);

    /** @type {[import("./components/PlayerSetup.jsx").PlayerConfig[]|null, Function]} */
    const [playerConfigs, setPlayerConfigs] = useState(null);

    /** @type {[{ players: string[], boardFields: import("./hex/fieldProperties.js").HexField[], diceValues: number[]|null }|null, Function]} */
    const [gameSetup, setGameSetup] = useState(null);

    /** Initial sub-screen for MainMenu — "main" normally, "settings" when navigating from in-game settings. */
    const [menuInitialScreen, setMenuInitialScreen] = useState("main");

    /**
     * Transitions the app to the given screen.
     *
     * @param {Screen} target - Screen identifier to navigate to.
     * @returns {void}
     */
    const navigate = (target) => setScreen(target);

    switch (screen) {
        case "styleGuide":
            return <StyleGuide onBack={() => navigate("mainMenu")} />;
        case "splash":
            return <SplashScreen onDone={() => navigate("mainMenu")} />;
        case "mainMenu":
            return (
                <MainMenu
                    onPlay={() => navigate("mapSelection")}
                    initialScreen={menuInitialScreen}
                    onDirectPlay={() => {
                        const randomAnimal = () => ANIMAL_OPTIONS[Math.floor(Math.random() * ANIMAL_OPTIONS.length)].id;
                        const randomDice = Array.from({ length: 5 }, () => Math.ceil(Math.random() * 6));
                        setSelectedMap(DEFAULT_MAP);
                        setPlayerConfigs([
                            { id: "red",  name: "Red",  coatOfArms: randomAnimal() },
                            { id: "blue", name: "Blue", coatOfArms: randomAnimal() },
                        ]);
                        setGameSetup(prev => ({ ...(prev ?? {}), diceValues: randomDice }));
                        navigate("gameLoading");
                    }}
                />
            );
        case "mapSelection":
            return (
                <MapSelection
                    onSelect={(map) => { setSelectedMap(map); navigate("playerSetup"); }}
                    onBack={() => navigate("mainMenu")}
                />
            );
        case "playerSetup":
            return (
                <PlayerSetup
                    map={selectedMap}
                    onConfirm={(configs) => { setPlayerConfigs(configs); navigate("gameLoading"); }}
                    onBack={() => navigate("mapSelection")}
                />
            );
        case "gameLoading":
            return (
                <GameLoading
                    playerConfigs={playerConfigs}
                    map={selectedMap}
                    onDone={(players, boardFields) => {
                        setGameSetup(prev => ({ diceValues: prev?.diceValues ?? null, players, boardFields }));
                        navigate("game");
                    }}
                />
            );
        case "game":
            return gameSetup
                ? <Game players={gameSetup.players} boardFields={gameSetup.boardFields} playerConfigs={playerConfigs ?? []} diceValues={gameSetup.diceValues} onExit={() => { setMenuInitialScreen("main"); navigate("mainMenu"); }} onSettings={() => { setMenuInitialScreen("settings"); navigate("mainMenu"); }} />
                : <Game onExit={() => { setMenuInitialScreen("main"); navigate("mainMenu"); }} onSettings={() => { setMenuInitialScreen("settings"); navigate("mainMenu"); }} />;
        default:
            return <Game onExit={() => { setMenuInitialScreen("main"); navigate("mainMenu"); }} onSettings={() => { setMenuInitialScreen("settings"); navigate("mainMenu"); }} />;
    }
}