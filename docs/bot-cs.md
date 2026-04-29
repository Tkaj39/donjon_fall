# Bot – hráč s umělou inteligencí

Bot je implementován v souboru `src/game/bot.js` a používá **Monte Carlo Tree Search (MCTS)** k výběru tahů. Integruje se se stejným game reducerem a funkcemi pro validaci tahů, které používá uživatelské rozhraní, takže může vytvářet pouze legální tahy.

## Vstupní bod

```js
getBotMoveAsync(state, botPlayer, { onMove, timeoutMs })
```

Zavolejte tuto funkci, když je na řadě bot. Spustí MCTS na pozadí a zavolá `onMove(action)` po `timeoutMs` milisekundách (výchozí hodnota 10 s). Vrací funkci pro zrušení.

- **Focal phase** — vyřešena okamžitě s náhodně vzorkovanými hody (přehození kostky + losování ohniska pomocí extra kostky); není potřeba prohledávání.
- **Victory phase** — okamžitě zavolá `onMove(null)`; hra je již rozhodnutá.
- **Action / combat phases** — spouští úplné MCTS.

## MCTS – přehled

Standardní čtyřfázová smyčka běží v asynchronních dávkách až 80 iterací každých 50 ms, aby zůstala karta prohlížeče responsivní.

### 1. Selection (Výběr)

Začínáme v kořeni a opakovaně vybíráme potomka s nejvyšším skóre **UCB1**, dokud nedosáhneme pozice s nevyzkoušenými tahy nebo ukončené hry.

```
UCB1 = (totalScore / visits) + √2 · √(ln(parentVisits) / visits)
```

Konstanta `√2` pro exploraci (`Math.SQRT2`) vyváží zneužití vs. exploraci.

### 2. Expansion (Expanze)

Jeden nevyzkoušený tah (odtlačení kostky, skok, zřícení věže, přehození, možnost boje…) se vezme ze seznamu tahů pozice, aplikuje se na stav hry a vytvoří se nový podřízený uzel.

### 3. Simulation (Simulace – Rollout)

Mělká náhodná simulace běží maximálně **6 tahů** (`ROLLOUT_DEPTH`). Každý krok:

1. Automaticky se postupuje každou focal phase: skórují se body, přehodí se ohnisková kostka, losuje se extra kostkou, která ohnisko se také skóruje.
2. V bojové fázi se zvolí náhodná legální volba (odtlačení nebo obsazení).
3. V action phase se zkusí až 3 náhodně vybrané vlastní kostky; pro každou se zvolí náhodně dosažitelné pole přes BFS a pokusí se přesunout kostku tam. Tah se přeskočí, pokud je odmítnut (například pokud má cílové pole nepřátelskou útočnou sílu stejnou nebo vyšší).

Mělká simulace (hloubka 6) je záměrná: dlouhé náhodné hry skrývají taktické rozdíly mezi pozicemi.

### 4. Backpropagation (Zpětné šíření)

Skóre simulace se šíří nahoru skrz všechny předchozí pozice, aktualizuje se `visits` a `totalScore` v každé úrovni.

## Generování tahů (`generateLegalMoves`)

Vyjmenovává všechny legální tahy pro aktuální stav delegováním na vlastní funkce hry:

| Akce | Zdroj |
|---|---|
| `MOVE_DIE` — přesun samostatné kostky nebo kostky z věže | `getReachableHexes` + BFS path pro approach direction |
| `JUMP` — horní kostka se odtrhne od věže a skočí | `getJumpReachableHexes` + BFS path |
| `MOVE_TOWER` — celá věž se pohybuje jako celek | `getTowerReachableHexes` + BFS path |
| `COLLAPSE` — odstranění spodní kostky z věže se 3+ kostkami | `canCollapse` |
| `REROLL` — přehození jedné z vlastních kostek (hodnota může zůstat stejná nebo vzrůst) | vždy generován pro každou vlastní kostku; nová hodnota se vzorkuje v čase generování |
| Combat (odtlačení / obsazení) | `getAvailableCombatOptions` |

**BFS approach direction**: `getShortestPathToHex` najde jednu platnou cestu; předposlední pole v té cestě se předá jako `approachDirection`. Toto nahrazuje dřívější všechny-cesty DFS — reducer potřebuje pouze jeden platný approach direction pro vyřešení boje, takže vyjmenovávání všech cest bylo zbytečné.

## Evaluační funkce (`evaluateState`)

Ohodnocuje stav z perspektivy bota. Ukončená hra (dosaženo 5 bodů vítězství) vrací velkou hodnotu, která dominuje všem heuristickým skórům.

| Komponenta | Váha | Zdůvodnění |
|---|---|---|
| VP lead (vlastní − opponent) | ×10 | Body vítězství jsou podmínkou výhry |
| Material lead (součet vlastních hodnot kostek − nepřátelské hodnoty) | ×0.5 | Kostky s vyšší hodnotou útočí tvrdě a déle přežívají |
| Vlastní kostka na aktivním ohnisku | +3 za každou | Ohniska skórují body na začátku příštího tahu |
| Nepřátelská kostka na aktivním ohnisku | −3 za každou | Soupeř bude skórovat, pokud jej nevytlačíme |
| Výhra (5+ bodů vítězství) | +1000 | Terminál |
| Prohra | −1000 | Terminál |

## Výběr nejlepšího tahu

Po vypršení časového rozpočtu bot vybere **nejnavštěvovanější** potomka kořene (ne ten s nejvyšším průměrným skóre). Počet návštěv je spolehlivější signál, když je strom pouze částečně prozkoumán — větev s vysokým průměrem, ale málo navštívená, může být pouze optimistickou anomálií.

## Asynchronní model provádění

```
setTimeout(tick, 100)   ← 100 ms zpoždění, aby se React nejdříve vykreslil indikátor myšlení
  └─ spouští až BATCH_SIZE (80) iterací, omezeno na 50 ms času stěny na dávku
  └─ pokud deadline není dosažen: setTimeout(tick, 0)
  └─ pokud deadline je dosažen: onMove(bestMoveSoFar)
```

Funkce zrušení nastaví příznak `cancelled` a vymaže pending timer, čímž čistě zastaví všechny další iterace.