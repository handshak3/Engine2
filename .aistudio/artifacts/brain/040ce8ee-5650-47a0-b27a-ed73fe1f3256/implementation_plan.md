# Engine: Hybrid Athlete Operating System - Complete Overhaul & Expansion

Trasformazione ed evoluzione completa dell'applicazione **Engine** per atleta ibrido (forza, calisthenics, running, multi-sport e nutrizione di precisione), mantenendo il 100% delle funzionalità esistenti (sync bidirezionale intervals.icu, database offline/Supabase, timer live, macro tracker, pantry, OCR ed esportazioni) e implementando tutte le 37 nuove funzionalità avanzate richieste.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> Tutte le scelte strategiche confermate durante il chiarimento iniziale sono integrate come architettura cardine:

- **Confirmed Decision 1: Standard Nutrizionale Gold Standard & Macro-Cycling**:
  Formula **Mifflin-St Jeor** dinamica con calcolo del TDEE integrato con il carico e dispendio energetico reale da intervals.icu. Macro-cycling intelligente che aumenta i carboidrati (5-8 g/kg) nei giorni di alto volume di corsa e assicura 1.8-2.2 g/kg di proteine nei giorni di forza. **Tutto disattivabile e personalizzabile punto per punto dalle Impostazioni**.
- **Confirmed Decision 2: Generatore Pasti & Ricette AI Ibrido**:
  Compromesso ottimale che privilegia la modalità **"Svuota Dispensa" (Zero Waste)** per consumare prima gli ingredienti in scadenza o aperti, creando vere ricette culinarie bilanciate (anziché alimenti slegati casuali), con selettore del budget di spesa (Economica / Normale / Gourmet), integrazione automatica con Whey quando mancano proteine, dosaggio micronutrienti e sale per la sudorazione da endurance, e generazione rapida per intervalli di date o "Prossima Settimana".
- **Confirmed Decision 3: Coach AI Rigoroso & Severo (Score 1-100)**:
  Algoritmo di valutazione severo basato sulla reale aderenza alla scheda, RPE, rispetto delle zone cardio, cadenza/SPM nel running e passo target, con recap analitico e suggerimenti tecnici senza sconti.
- **Confirmed Decision 4: Layout Desktop & Drag-and-Drop Settimanale**:
  Sidebar laterale comprimibile/espandibile su PC e tablet con icone compatte; schermata Meal Plan su desktop con vista estesa a 7 giorni e gestione drag-and-drop tra giorni e pasti (Colazione, Pranzo, Snack, Cena).

---

## 1. Overview & Core Concept

Engine è l'hub definitivo per l'atleta ibrido che combina sollevamento pesi/calisthenics zavorrato, corsa su strada e trail, nuoto, calcio a 5 e nutrizione ad alte prestazioni.

- **Cosa fa**: Unifica il calendario di allenamento (con sincronizzazione bidirezionale con intervals.icu), timer interattivi live (EMOM, AMRAP, Tabata, For Time, Interval Running), previsioni di gara e recupero, tracciamento 1RM zavorrato e corpo libero, monitoraggio meteo in tempo reale per l'ora esatta della sessione, pianificazione alimentare avanzata con ricettario interattivo, dispensa intelligente con rotazione scorte e lista della spesa automatica con calcolo extra.
- **Target Persona**: Atleta ibrido esigente che necessita di rigore scientifico, zero perdita di tempo, tracciamento millimetrico dei macro e micro-nutrienti (incluso il sale per sessioni lunghe), e feedback severo e costruttivo sulle prestazioni.
- **Valore Chiave**: Una singola piattaforma ultra-veloce, reattiva su smartphone, tablet e desktop, che elimina le app frammentate e guida decisioni nutrizionali e di allenamento basate sui dati.

---

## 2. User Experience & Visual Design

Seguendo i principi di design specificati nella costituzione frontend e nelle linee guida SaaS & Dashboard (`references/3_saas_dashboard.md`), l'interfaccia adotta un'estetica tecnica, pulita e priva di elementi decorativi superflui ("anti-slop"):

- **Palette & Atmosfera (60-30-10)**:
  - *Canvas (60%)*: Dark Slate profondo (`#090D16` / `#0F172A`) per il tema dark focalizzato sull'allenamento, con alternativa Light pulita (`#F8FAFC`).
  - *Struttura e Card (30%)*: Superfici piatte con bordi hairline a 1px (`border-slate-800`), contrasto mirato, elevazione a singolo livello senza nesting di card in card.
  - *Accenti Energetici (10%)*: 
    - Verde Smeraldo / Neon Mint (`#10B981` / `#059669`) per zone target, aderenza perfetta e recupero ottimale.
    - Arancio Ambra (`#F59E0B`) per fatica moderata, soglia anaerobica e attenzione scorte dispensa.
    - Ciano Elettrico (`#06B6D4`) per running, sessioni intervals e meteo/pioggia.
    - Rosso Sportivo (`#EF4444`) per allarmi sovrallenamento e sforzo massimale.
- **Tipografia & Gerarchia**:
  - *Display*: `Plus Jakarta Sans` per titoli, card header e brand wordmark.
  - *Body*: `DM Sans` per etichette, descrizioni e ricette con leggibilità ad alta densità.
  - *Dati & Telemetria*: `JetBrains Mono` con `tabular-nums` per tutti i pesi, RPE, tempi, ritmi al km, battiti cardiaci e macro/calorie.
- **Zero-Pill Discipline**:
  - Nessun badge a pillola per metadati statici. Date, categorie e valori sono separati da caratteri tipografici puliti (`·`, `/`).
  - I filtri interattivi (es. High Protein, Vegetables, Timeframes 1w–12w) utilizzano controlli segmentati compatti a pulsante con stati attivo/inattivo puliti.
- **Top Bar Contract & Layout**:
  - Header compatto a 3 zone: Brand / Navigazione contestuale / Azione primaria o sincronizzazione intervals.icu.
  - Sidebar desktop/tablet comprimibile (toggle rapido con animazione Framer Motion) per massimizzare l'area visiva durante l'analisi settimanale dei pasti o delle tabelle di forza.
  - Vista settimanale Meal Plan su desktop: visualizzazione affiancata Lunedì-Domenica con drag-and-drop o riordinamento rapido dei pasti e delle ricette.

---

## 3. Key Product Decisions & Trade-Offs

### Decisione 1: Architettura dei Dati e Coesistenza con il Codice Esistente
- **Approccio Scelto**: Strutturare il codice in moduli TypeScript Next.js/React chiari (`components/workout`, `components/nutrition`, `components/pantry`, `components/tools`, `lib/intervals`, `lib/nutrition`, `lib/calculators`), importando la logica consolidata del sorgente Engine (`extracted_engine/source/engine.html`), preservando la persistenza locale (LocalStorage + Supabase sync compatibile) e le API di Open Food Facts e Intervals.icu.
- **Perché**: Permette un'interfaccia moderna e manutenibile con Tailwind CSS v4, animazioni Framer Motion fluide, eliminazione dei bug grafici e supporto nativo a tutte le 37 nuove feature senza regressioni.

### Decisione 2: Gestione Meteo e Orario di Allenamento
- **Approccio Scelto**: 
  - Estrazione automatica dell'orario di allenamento previsto dal feed eventi di intervals.icu (es. ore 07:00 o 18:30).
  - Possibilità di modificare l'orario del workout direttamente nell'interfaccia con un selettore orario.
  - Grafico meteo orario potenziato: asse orizzontale orario con evidenziazione della finestra di allenamento, barra di probabilità/millimetri di pioggia ad alto contrasto e indicazione visiva immediata (*"Soleggiato per la tua corsa"*, *"Rischio pioggia 80% alle 18:00 - Anticipa alle 16:30"*).
  - Geocoding con visualizzazione della località corrente e pulsante per cambiarla istantaneamente (geolocalizzazione browser o ricerca città).

### Decisione 3: Dispensa Intelligente, Porzionatura e Shopping List
- **Approccio Scelto**:
  - Modifica rapida di prezzo e quantità direttamente dalle righe del Meal Plan o dalla vista Pantry.
  - Stima spesa aggregata per la settimana corrente e storico della media settimanale.
  - Dosaggio "Metà Pacco" (50% del formato confezione registrato, es. 250g su pacco da 500g).
  - Shopping list con filtro rapido "Questa Settimana": gli alimenti già presenti in dispensa in quantità sufficiente vengono nascosti dalla lista attiva e raggruppati in una sezione a scomparsa *"Scorte Sufficienti"*, con avviso di esaurimento (*"Finisce dopo questo pasto"*).
  - Sezione dedicata per articoli Extra (Non-Food: sapone, spugne, detersivo) con tracciamento costi separato e salvataggio per inserimento rapido futuro.

### Decisione 4: Ricette e Integrazione Open Food Facts / AI
- **Approccio Scelto**:
  - Sezione dedicata "Ricette" e creazione istantanea di ricette anche all'interno del Meal Plan (combinazione dosata di cibi registrati, con auto-registrazione per quelli nuovi).
  - Import ricetta da testo o foto/camera tramite API Gemini server-side (`/api/gemini/recipe-import`).
  - Stima AI istantanea calorie e macro per cibi non presenti nel database con un clic.
  - Correzione automatica della categoria dei cibi aggiunti con IA.
  - Funzione "Swap Pranzo <-> Cena" immediata con un tocco.
  - Auto-integrazione Whey Protein se il pasto o la giornata non raggiungono la quota proteica target.

### Decisione 5: Suite Calcolatori Smart, Multi-Sport e Test 1RM
- **Approccio Scelto**:
  - Calcolatore 1RM scalato fino a 10RM con formule Brzycki, Epley, Lombardi e calibrazione per Calisthenics zavorrato (peso corporeo + zavorra).
  - Predizione recupero personalizzata: calcolo dell'affaticamento post-workout combinando dati cardiaci/TRIMP, DOMS, sonno e sensazioni registrate nel check-in giornaliero.
  - Check-in giornaliero retroattivo: selettore data per consultare e modificare lo stato e i parametri dei giorni passati.
  - Contatore push-up con sensore di prossimità o tocco con sensibilità regolabile e feedback sonoro.
  - Supporto sport ampliato: Calcio a 5 (da intervals.icu), Nuoto in piscina (con vasche/passo 100m), Nuoto al mare (con stima deriva/GPS), Passeggiata, Trail Running, ecc.

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ENGINE HYBRID APP                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  Top Bar: Wordmark · Location/Weather Pill · Intervals Sync Status · Profile│
├───────────────────┬─────────────────────────────────────────────────────────┤
│ COLLAPSIBLE NAV   │                      MAIN VIEWPORT                      │
│ ┌───────────────┐ │ ┌─────────────────────────────────────────────────────┐ │
│ │ 🏋️ Workouts   │ │ │ View Tabs / Routing:                                │ │
│ │ ⚡ Live Timer │ │ │  [TODAY WORKOUT] [MEAL PLAN] [PANTRY] [TOOLS/CALCS] │ │
│ │ 🥗 Meal Plan  │ │ └─────────────────────────────────────────────────────┘ │
│ │ 📦 Pantry     │ │                                                         │
│ │ 🛒 Shop List  │ │ ┌─────────────────────────────────────────────────────┐ │
│ │ 🍳 Recipes    │ │ │ Active Component View:                              │ │
│ │ 📊 Stats/Reps │ │ │  • Desktop 7-Day Drag-and-Drop Meal Matrix          │ │
│ │ 🎯 1RM / VDOT │ │ │  • Pre-Start "How It Will Run" Weather Forecast     │ │
│ │ ⚙️ Settings   │ │ │  • Severe Coach Workout Evaluation Card (1-100)    │ │
│ └───────────────┘ │ │  • Dynamic TDEE Macro-Cycling & Whey Auto-Suggest   │ │
│                   │ └─────────────────────────────────────────────────────┘ │
├───────────────────┴─────────────────────────────────────────────────────────┤
│                           LOCAL STATE & STORAGE ENGINE                      │
│  • EngineStorage (Pantry, Recipes, MealPlan, Foods, ShopList, History)      │
│  • IntervalsSyncService (Two-way sync: planned/completed activities, steps) │
│  • WeatherEngine (Open-Meteo API: coordinates, hourly rain & temp)          │
│  • RecoveryModel (DOMS, RPE, TRIMP, Sleep, Sport-specific curve)            │
│  • NutritionEngine (Mifflin-St Jeor, Macro-cycler, Micronutrients)          │
│  • StrengthEngine (1RM-10RM, Weighted Calisthenics, Volume Trends)         │
├─────────────────────────────────────────────────────────────────────────────┤
│                         SERVER-SIDE GEMINI API PROXIES                      │
│  • /api/gemini/meal-planner (AI Meal Generator with Zero-Waste Pantry logic)│
│  • /api/gemini/food-estimate (Kcal & Macro instant estimator)               │
│  • /api/gemini/recipe-import (OCR/Text/Camera multimodal recipe extraction) │
│  • /api/gemini/coach-eval (Severe 1-100 score & cadence/zone feedback)      │
│  • /api/gemini/workout-generator (Text-to-intervals script generator)      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Struttura Entità & Modelli Dati
- **`FoodItem`**: `id`, `name`, `brand`, `kcal`, `protein`, `carbs`, `fat`, `fiber`, `sodium`, `packageSizeGrams`, `price`, `storageQty`, `category` (proteico, glucidico, lipidico, verdura, mix), `source` (manuale, off, ai).
- **`Recipe`**: `id`, `name`, `servings`, `ingredients: { foodId, grams, halfPack?: boolean }[]`, `instructions`, `totalMacros`, `costEstimate`.
- **`MealPlanDay`**: `date`, `meals: { id, type: 'breakfast'|'lunch'|'snack'|'dinner', items: (FoodPortion | RecipePortion)[] }`, `notes`, `macroTargets: { kcal, protein, carbs, fat, sodium }`.
- **`WorkoutSession`**: `id`, `intervalsId`, `type` (running, strength, calisthenics, swim_pool, swim_open, futsal, walk, other), `scheduledTime`, `durationMinutes`, `plannedScript`, `actualData: { reps, sets, avgHr, maxHr, zones, avgCadence, distanceKm, rpe, feelings }`, `coachScore: { total: 1-100, adherence, intensity, cadenceAnalysis, feedbackText }`.
- **`CheckInRecord`**: `date`, `weightKg`, `restingHr`, `sleepQuality`, `sleepHours`, `domsScore: 1-5`, `legFatigueScore: 1-5`, `notes`.
- **`ShoppingList`**: `items: { id, foodId?, name, amountNeeded, amountToBuy, priceEstimate, isExtraNonFood: boolean, purchased: boolean }[]`.

---

## 5. Execution Steps & Phasing

1. **Setup & Architettura Core**:
   Configurare i layer dati unificati in `lib/` e verificare che l'API Gemini utilizzi `@google/genai` lato server (`app/api/gemini/*`) conformemente alla skill `gemini-api`.
2. **Navigazione & Layout Responsive (PC/Tablet Collapsible Sidebar)**:
   Implementare la sidebar comprimibile con animazioni Framer Motion, la Top Bar contrattuale e la gestione delle 4 macro-aree (Allenamento, Nutrizione, Dispensa/Spesa, Tool/Calcolatori).
3. **Meteo & Orario Workout Dinamico**:
   Integrare la visualizzazione e modifica della geolocalizzazione, il recupero orario sessione da intervals.icu e il grafico dettagliato con previsione pioggia all'ora esatta del workout.
4. **Meal Plan & Ricettario Interattivo**:
   Costruire la vista settimanale desktop drag-and-drop, il ricettario avanzato, la modifica rapida prezzi/quantità dispensa, il dosaggio "metà pacco", lo swap Pranzo-Cena e l'auto-integrazione Whey.
5. **Algoritmi Nutrizionali Gold Standard & Generatore AI**:
   Attuare Mifflin-St Jeor con macro-cycling dinamico (tutto configurabile nei Settings), monitoraggio sale/elettroliti per endurance e il generatore pasti AI con filtro spesa (economica/normale/gourmet) e modalità "Svuota Dispensa".
6. **Dispensa & Shopping List Intelligente**:
   Implementare ricerca e ordinamento A-Z, menu a scomparsa per scorte già sufficienti con avviso esaurimento e tracciamento articoli Extra Non-Food con memoria prezzi.
7. **Workout Engine, Intervals.icu & Coach Severo (1-100)**:
   Completare l'anteprima "How it will run", il calcolo del punteggio live e post-workout (cadenza, zone, RPE), la gestione di esercizi personalizzati e i trend di forza con filtri da 1 a 12 settimane.
8. **Multi-Sport, Recupero & Calcolatori Smart**:
   Implementare Calcio a 5, Nuoto (piscina/mare), Passeggiate, Predizione recupero basata su check-in storico, calcolatori 1RM-10RM zavorrati e contatore push-up di prossimità.
9. **Integrazioni Esterne & AI Tooling**:
   Connettere Open Food Facts (barcode + ricerca), import ricette da testo/fotocamera, correzione automatica categoria cibi e stima calorie istantanea.
10. **Refinement, Test & Pre-flight Verification**:
    Controllare assenza di bug grafici o sovrapposizioni nelle 3 view principali, verificare la compilazione con `compile_applet` e validare il comportamento offline.
