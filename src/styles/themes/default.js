/**
 * Default visual theme for Donjon Fall.
 *
 * Maps field types and states to image hrefs for hex tile textures.
 * All image imports live here — game logic and components stay image-free.
 */

import grassImg          from "../../assets/battlefield/grass.png";
import grassDenseImg     from "../../assets/battlefield/grass-dense.png";

/** Background image for the entire app. */
export const appBackground = grassDenseImg;
import focusImg          from "../../assets/battlefield/focus.png";
import starterRedImg     from "../../assets/battlefield/startr-field-red.png";
import starterBlueImg    from "../../assets/battlefield/startr-field-blue.png";

// ── Coat of arms: shields ────────────────────────────────────────────────────
import shieldRedImg      from "../../assets/coat-of-arms/shield-red.png";
import shieldBlueImg     from "../../assets/coat-of-arms/shield-blue.png";
import shieldBlackImg    from "../../assets/coat-of-arms/shield-black.png";
import shieldGreenImg    from "../../assets/coat-of-arms/shield-green.png";
import shieldOrangeImg   from "../../assets/coat-of-arms/shield-orange.png";
import shieldLightBlueImg from "../../assets/coat-of-arms/shield-light-blue.png";

// ── Coat of arms: animals ────────────────────────────────────────────────────
import animalBearImg     from "../../assets/gamer-symbols/animal-bear.png";
import animalDeerImg     from "../../assets/gamer-symbols/animal-deer.png";
import animalHorseImg    from "../../assets/gamer-symbols/animal-horse.png";
import animalPigImg      from "../../assets/gamer-symbols/animal-pig.png";
import animalRoosterImg  from "../../assets/gamer-symbols/animal-rooster.png";
import animalWolfImg     from "../../assets/gamer-symbols/animal-wolf.png";

/**
 * Shield image href keyed by player ID.
 * @type {Object.<string, string>}
 */
export const SHIELD_BY_PLAYER = {
    red:        shieldRedImg,
    blue:       shieldBlueImg,
    green:      shieldGreenImg,
    amber:      shieldOrangeImg,
    purple:     shieldBlackImg,
    cyan:       shieldLightBlueImg,
};

/**
 * Selectable coat-of-arms options (animal symbols).
 * @type {Array<{id: string, label: string, href: string}>}
 */
export const ANIMAL_OPTIONS = [
    { id: "bear",    label: "Bear",    href: animalBearImg    },
    { id: "deer",    label: "Deer",    href: animalDeerImg    },
    { id: "horse",   label: "Horse",   href: animalHorseImg   },
    { id: "pig",     label: "Pig",     href: animalPigImg     },
    { id: "rooster", label: "Rooster", href: animalRoosterImg },
    { id: "wolf",    label: "Wolf",    href: animalWolfImg    },
];

/** Primary colour of PLAYER_PALETTE index 0 (red). */
const RED_PRIMARY  = "#dc2626";

/**
 * Resolves the image href for a hex tile given its field properties and player colours.
 * Returns a URL string when a texture is available, otherwise null
 * (HexTile falls back to the CSS-variable colour fill).
 *
 * @param {Array<{type:string,owner?:string}>} fieldProperties
 * @param {Object.<string,{primary:string}>}   playerColors - ownerId → colour pair
 * @returns {string|null}
 */
export function resolveHexImage(fieldProperties, playerColors) {
    const startingProp = fieldProperties.find(p => p.type === "startingField");
    if (startingProp) {
        const primary = playerColors[startingProp.owner]?.primary;
        return primary === RED_PRIMARY ? starterRedImg : starterBlueImg;
    }
    if (fieldProperties.some(p => p.type === "focalPoint")) return focusImg;
    return grassImg;
}

/**
 * @deprecated Use resolveHexImage instead.
 * Kept for any direct callers that pass a string type.
 */
export function resolveHexImageByType(type) {
    switch (type) {
        case "dense-grass": return grassDenseImg;
        default:            return grassImg;
    }
}
