# Donjon Fall — Styl kódu

Platí pro všechny soubory v `src/`. Aktualizuj tento dokument při zavedení nových vzorů.

---

## Jazyk a moduly

- **Vanilla JavaScript** (ES Modules, přípona `.js`). Bez TypeScriptu.
- Typy jsou dokumentovány pomocí JSDoc `@typedef` (definovány v `src/game/gameState.js`).
- Každý soubor končí prázdným řádkem.

---

## Přípona v importech

Vždy uváděj příponu `.js` v cestách importů:

```js
// ✅ správně
import { hexKey } from "../hex/hexUtils.js";
import { getDiceAt } from "./gameState.js";

// ❌ špatně — chybí .js
import { hexKey } from "../hex/hexUtils";
```

> **Poznámka:** Některé starší soubory v `src/hex/` příponu stále vynechávají — oprav je při editaci.

---

## Pořadí importů

1. Externí balíčky (zatím žádné).
2. Interní importy — nejprve hlubší cesty (`../hex/…`), poté stejná složka (`./…`), abecedně uvnitř každé skupiny.

```js
import { hexKey, hexFromKey, getNeighbors, hexesDistance } from "../hex/hexUtils.js";
import { isOnBoard } from "../hex/boardUtils.js";
import { getDiceAt, getTopDie, getController } from "./gameState.js";
```

---

## Exporty

- **Pouze pojmenované exporty** — `export function`, `export const`. Žádné default exporty.
- Interní pomocné funkce se **neexportují**.

```js
// ✅ veřejné API
export function getReachableHexes(state, fromKey) { … }

// interní pomocník — bez export
function canTraverseThrough(state, moverDie, neighborKey) { … }
```

---

## Konvence pojmenování

| Kategorie | Konvence | Příklady |
|---|---|---|
| Funkce | `camelCase`, sloveso na prvním místě | `getDiceAt`, `applyMoveAction`, `createInitialState` |
| Konstanty | `UPPER_SNAKE_CASE` | `BOARD_RADIUS`, `FOCAL_POINT_KEYS` |
| Parametry / proměnné | `camelCase` | `fromKey`, `towerKey`, `moverDie`, `newValue` |
| Parametry hexového klíče | suffix `…Key` nebo `…Hex` | `fromKey`, `toKey`, `attackerHex`, `defenderHex` |
| Booleovské predikáty | `can…` / `is…` / `has…` | `canCollapse`, `isOnBoard`, `hasProperty` |
| Tovární funkce | `create…` | `createInitialState` |
| Selektory | `get…` | `getDiceAt`, `getTopDie`, `getController` |
| Aplikátory akcí | `apply…Action` | `applyMoveAction`, `applyCollapseAction`, `applyRerollAction` |

---

## Styl funkcí

- Preferuj **`function` deklarace** pro exportované funkce.
- **Šipkové funkce** používej pouze pro inline callbacky a krátké pomocníky uvnitř těla funkce.
- **Guard klauzule** pro neplatný vstup na začátku; vracet brzy místo hlubokého vnořování.

```js
export function applyCollapseAction(state, hex) {
    if (!canCollapse(state, hex)) return state;  // guard klauzule
    // … zbytek logiky
}
```

---

## JSDoc

Každá funkce (exportovaná i interní) a typedef dostane JSDoc blok:

```js
/**
 * Jednořádkový popis funkce.
 *
 * Volitelný delší popis, pokud chování není samozřejmé.
 *
 * @param {GameState} state
 * @param {string} hex  - hexKey cílového pole
 * @returns {boolean}
 */
export function canCollapse(state, hex) { … }
```

- Používej `{GameState}`, `{Die}`, `{string}`, `{number}`, `{boolean}`, `{Set<string>}`, `{string[][]}` atd.
- V souborech, které typedef přímo neimportují, odkazuj přes `{import("./gameState.js").GameState}`.

---

## Struktura souboru

Každý `.js` soubor dodržuje toto pořadí:

1. **Komentář na úrovni souboru** — jeden řádek nebo krátký blok popisující účel souboru a fázi.
2. **Importy.**
3. **Privátní konstanty** (pokud existují).
4. **Interní pomocníky** (neexportované).
5. **Exportované funkce/konstanty**, seskupené podle fáze nebo tématu se separátorem 75 pomlček.

Formát separátoru sekcí:

```js
// ---------------------------------------------------------------------------
// 3.2 — applyMoveAction
// ---------------------------------------------------------------------------
```

---

## Neměnnost stavu

Všechny funkce herní logiky jsou **čisté** — vracejí nový stavový objekt; nikdy nemutují vstup.

```js
// ✅ správně — spread pro vytvoření nových objektů
const newDice = { ...state.dice, [hex]: newStack };
return { ...state, dice: newDice, actionTaken: true };

// ❌ špatně — mutuje vstup
state.dice[hex] = newStack;
return state;
```

Pro zásobníky kostek: používej `slice()` a spread pro nová pole. Nikdy `push` / `pop` na místě.

---

## Datové konvence

- **Formát hexKey**: řetězec `"q,r,s"` vytvořený funkcí `hexKey({q, r, s})` z `hexUtils.js`.
- Zásobníky kostek jsou pole seřazená **zdola nahoru** (`stack[stack.length - 1]` je vrchní kostka).
- Celý herní stav je tvořen **prostými JS objekty** — žádné třídy.
- Výchozí hodnota `state.scores` pro hráče je `0`; vždy číst jako `state.scores[playerId] ?? 0`.

---

## Uvozovky

Používej **dvojité uvozovky** pro řetězce. Jednoduché uvozovky používej pouze tehdy, když řetězec sám obsahuje dvojitou uvozovku.

```js
// ✅ správně
import { hexKey } from "../hex/hexUtils.js";
const label = "Game Over";
const msg = 'He said "hello"';

// ❌ špatně
const label = 'Game Over';
```

---

## Žádná magická čísla

Opakovaně používané geometrické konstanty vkládej do `boardConstants.js`. Číselné prahy pojmenuj pomocí `const`.

---

## Stylování (React komponenty)

- **Preferuj Tailwind utility třídy** místo inline `style` propů pro všechny statické hodnoty.
- `style` propsy používej pouze pro **dynamické hodnoty**, které Tailwind nedokáže vyjádřit (např. vypočtené pixelové pozice, SVG transformace, interpolované barvy).

```jsx
// ✅ správně — statický vzhled přes Tailwind
<div className="bg-red-500 rounded-full w-6 h-6" />

// ✅ správně — dynamická hodnota, kterou Tailwind neumí
<div style={{ transform: `translate(${x}px, ${y}px)` }} />

// ❌ špatně — statická hodnota jako inline styl
<div style={{ backgroundColor: "red", borderRadius: "9999px" }} />
```

---
