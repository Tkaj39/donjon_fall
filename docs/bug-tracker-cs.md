# Sledování chyb

## Formát

| ID | Komponenta | Popis | Priorita | Stav | Řešení |
|----|------------|-------|----------|------|--------|
| — | — | — | — | — | — |

**Priorita:** `P1` kritická · `P2` vysoká · `P3` střední · `P4` nízká  
**Stav:** `otevřená` · `řeší se` · `vyřešená` · `neřeší se`

---

## Otevřené chyby

| ID | Komponenta | Popis                                                                                                                                                                                    | Priorita | Stav | Řešení |
|----|------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|------|--------|
| BUG-001 | Game / PlayerHUD | Erby se zobrazují na špatných stranách — skóre červeného hráče se ukazuje na modrém erbu                                                                                                 | P2 | vyřešená | Chybu se nepodařilo reprodukovat — kód správně váže obrázek erbu, skóre i aktivní stav na playerId |
| BUG-002 | Game / PlayerHUD | Indikátor aktivního hráče a přičítání bodů jsou prohozené — když hraje červený, na modrém erbu svítí aktivní stav a body dostává modrý; modrý hráč vyhrává body nasbíranými červeným     | P1 | vyřešená | Chybu se nepodařilo reprodukovat — indikátor aktivního hráče i přičítání bodů jsou správně vázány na aktuálního hráče |
| BUG-003 | game / combat | Hráč může zaútočit na nepřátelskou kostku nebo věž se stejnou nebo vyšší silou útoku — útok by měl být povolen pouze pokud útočníkova síla striktně převyšuje obranu                     | P1 | vyřešená | Přidána ochrana canAttack v moveDie, jumpDie a moveTower; nedosažitelné cíle útoku odstraněny z dosažitelných polí v UI |
| BUG-004 | Board / FocalPointMarker | Indikátor aktivního ohniska není vidět, když je na ohnisku umístěna kostka — značka aktivního ohniska by měla být vždy viditelná nad každou kostkou                                      | P2 | vyřešená | Aktivní ohnisko je rozpoznatelné díky žlutému zvýraznění pole — viditelnost hvězdičky není nutná |
| BUG-005 | game / combat | Po zvolení posunutí se útočící kostka nepohne na napadené pole — po odsunutí nepřítele by se útočník měl přesunout na uvolněné pole                                                      | P1 | vyřešená | Útočící stack se nyní přesunuje z attackerHex do defenderHex v applyPush po aplikaci posunutí |
| BUG-006 | hex / boardDefinition | Krajní ohniska jsou umístěna příliš blízko středu — každé by mělo být 2 pole od středového ohniska v horizontální řadě                                                                   | P2 | vyřešená | Krajní ohniska opravena na 3 pole od středu; boardConstants.js refaktorován tak, aby používal FOCAL_POINT_HEXES jako jediný zdroj pravdy |
| BUG-007 | game / victory | Vítězství se vyhodnocuje pouze na konci tahu — hra by měla skončit okamžitě, jakmile některý hráč dosáhne 5 bodů (např. uprostřed tahu po zisku bodů za zničení nebo ohniska)            | P1 | vyřešená | Přidána kontrola vítězství v advancePhase pro případ ohniska — pokud hráč dosáhne 5 BP ze skórování ohniska, fáze se okamžitě přejde na vítězství místo na akci |
| BUG-008 | game / movement | Přesun věže, kterou hráč kontroluje, je nesprávně vyhodnocen jako souboj, pokud cílové pole obsazuje vlastní kostka — přesun kontrolované věže na vlastní kostku by neměl spustit souboj | P1 | vyřešená | applyMoveTowerAction nyní zpracovává přátelské cíle samostatně: stackuje věž, pokud výchozí síla kostky překročí sílu cíle, bez spuštění souboje |
| BUG-009 | game / combat | Vypočítaná síla útoku je nejspíš o +1 vyšší u obou stran — počet vlastních kostek by neměl zahrnovat samotnou útočící kostku                                                             | P2 | vyřešená | getAttackStrength opravena tak, aby nezahrnovala vrchní kostku do počtu vlastních kostek; canEnterTower aktualizována na použití hodnoty přesouvané kostky |

---

## Vyřešené chyby

| ID | Komponenta | Popis | Priorita | Stav | Řešení |
|----|------------|-------|----------|------|--------|
| — | — | — | — | — | — |
