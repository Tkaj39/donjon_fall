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
| VP lead (vlastní − soupeř) | ×10 | Body vítězství jsou podmínkou výhry |
| Rozdíl útočné síly formací | ×0.5 | Dle pravidel: `hodnota horní kostky + počet vlastních podpůrných − počet nepřátelských`; pohřbené kostky přispívají ±1 bez ohledu na hodnotu |
| Vlastní kostka pohřbená ve věži pod nepřátelskou kontrolou | −1 za každou | Hrozí zřícení věže (soupeř skóruje 1 bod vítězství) |
| Vlastní kostka na aktivním ohnisku | +3 za každou | Ohniska skórují body na začátku příštího tahu |
| Nepřátelská kostka na aktivním ohnisku | −3 za každou | Soupeř bude skórovat, pokud jej nevytlačíme |
| Vlastní kostka na pasivním ohnisku | +3 ÷ počet pasivních v skupině | Rovnoměrná pravděpodobnost, že se stane dalším aktivním ohniskem |
| Nepřátelská kostka na pasivním ohnisku | −3 ÷ počet pasivních v skupině | Stejná logika z pohledu soupeře |
| Rozdíl v počtu kostek (vlastní − soupeř) | ×0.3 | Ztráta kostky je permanentní a snižuje mobilitu i útočnou sílu po zbytek hry |
| Zřítitelná věž pod vlastní kontrolou (3+ kostky, vlastní kostka nahoře) | +1.5 za každou | Lze zřítit příští tah a okamžitě skórovat |
| Zřítitelná věž pod nepřátelskou kontrolou (3+ kostky, nepřátelská kostka nahoře) | −1.5 za každou | Soupeř může zřítit příští tah; kumuluje se s penalizací pohřbených kostek výše |
| Rozdíl mobility — součet hodnot vlastních top kostek minus soupeřových | ×0.1 | Vyšší hodnota kostky = více dosažitelných hexů za tah |
| Blízkost k nejbližšímu neobsazenému aktivnímu ohnisku (vlastní top kostky) | +1 ÷ vzdálenost | Přibližné (kubická vzdálenost, ne délka cesty); odměňuje postup k bodovacím příležitostem |
| Blízkost k nejbližšímu neobsazenému aktivnímu ohnisku (nepřátelské top kostky) | −1 ÷ vzdálenost | Penalizuje soupeře ohrožujícího neobsazené ohnisko |
| Blízkost okraje/díry — průměrný počet platných sousedů (rozdíl) | ×0.2 | Méně platných sousedů = blíže k okraji nebo díře = vyšší riziko vystrčení z mapy; nezávislé na tvaru mapy |
| Výhra (5+ bodů vítězství) | +1000 | Terminál |
| Prohra | −1000 | Terminál |

> **TODO**: Váha pasivního ohniska předpokládá rovnoměrné losování mezi pasivními ohnisky ve stejné skupině. Pokud budoucí mapy zavedou skupiny ohnisek různé velikosti nebo nerovnoměrná pravidla aktivace, může být nutné tento vzorec přehodnotit.
>
> **TODO**: Provést analýzu citlivosti komponent pro lepší kalibraci vah. Princip: porovnat ohodnocení mezi dvojicemi pozic lišícími se v právě jedné vlastnosti (např. hodnota kostky změněna o 1) a změřit, o kolik každá komponenta posune celkové skóre. Komponenty s nepřiměřeně velkým nebo malým vlivem jsou kandidáty na přehodnocení vah nebo odebrání. Analýza může také odhalit problémy s vyvážením hry — pokud jedna komponenta konzistentně dominuje, může to znamenat, že odpovídající akce nebo mechanika je příliš silná oproti ostatním. Poznámka: analýza citlivosti zpřesňuje existující heuristiku, ale sama o sobě nemůže konvergovat ke skutečné herní hodnotě (to by vyžadovalo self-play s učením na základě výsledků her).
>
> **TODO**: Dlouhodobý cíl — nahradit ručně navrženou evaluační funkci neuronovou sítí trénovanou metodou self-play ve stylu AlphaZero. Přehled přístupu:
>
> - `evaluateState` se nahradí neuronovou sítí (vstup = tenzor herního stavu, výstup = skóre pozice). MCTS zůstane beze změny, ale místo heuristiky volá síť.
> - Bot hraje sám proti sobě opakovaně. Výsledek každé hry (výhra/prohra) se zpětně propaguje a trénuje síť. Jako výchozí bod nejsou potřeba žádné ručně navržené váhy — trénink začíná od náhodných vah.
> - Proces je iterativní: silnější bot generuje kvalitnější trénovací data, která vyprodukují ještě silnějšího bota.
>
> **Technologie**: PyTorch nebo TensorFlow pro síť. Herní logika musí být dostupná v Pythonu — buď přepsána, nebo volána přes export stavu do JSONu (pomalejší). Doporučení: přepsat jádro herní logiky do Pythonu pro účely trénování, JS verzi zachovat pro UI.
>
> **Kódování vstupu**: hexagonální mřížka se musí zakódovat jako tenzor. Možnosti: (a) axiální souřadnice mapované na 2D pole s paddingem pro chybějící buňky; (b) specializované hex konvoluce. AlphaZero používá konvoluční vrstvy na čtvercové mřížce — pro hex mřížky je nutná adaptace.
>
> **Řídkost odměny**: signál výhra/prohra přichází až na konci hry, což učení zpomaluje. Existující heuristiku lze použít jako reward shaping (pomocný signál během hry) pro urychlení konvergence — paradoxně tak zůstává ručně navržená heuristika užitečná i v pipeline hlubokého učení.
>
> **Hardware**: trénink vyžaduje stovky tisíc self-play her s MCTS, což na běžném stroji trvá dny. Přístup k silnějšímu hardware (GPU cluster) by dobu výrazně zkrátil. Jde o dlouhodobý výzkumný směr, nikoli o blízkou úlohu.

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