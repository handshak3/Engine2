import {
  FoodItem,
  Recipe,
  DayMealPlan,
  WorkoutSession,
  CheckInRecord,
  ExerciseDefinition,
  ShoppingExtraItem,
  RaceReport,
  UserSettings,
} from "./types";

const STORAGE_KEY = "engine_hybrid_data_v2";

export interface EngineAppData {
  settings: UserSettings;
  foods: FoodItem[];
  recipes: Recipe[];
  mealPlans: Record<string, DayMealPlan>; // key: YYYY-MM-DD
  workouts: WorkoutSession[];
  checkIns: Record<string, CheckInRecord>; // key: YYYY-MM-DD
  exercises: ExerciseDefinition[];
  shoppingExtras: ShoppingExtraItem[];
  raceReports: RaceReport[];
}

export const DEFAULT_SETTINGS: UserSettings = {
  athleteName: "Kerberos",
  athleteWeightKg: 76,
  athleteHeightCm: 178,
  athleteAge: 28,
  athleteGender: "male",
  bodyFatPercentage: 11.5,
  currentLocationName: "Milano, Italia",
  latitude: 45.4642,
  longitude: 9.19,
  useMifflinStJeor: true,
  baseTdeeMultiplier: 1.45,
  macroCyclingEnabled: true,
  runningDayCarbsPerKg: 6.5,
  strengthDayCarbsPerKg: 4.2,
  proteinPerKg: 2.1,
  targetSodiumMgBase: 2500,
  sodiumPerSweatHourMg: 750,
  autoWheySupplementation: true,
  wheyProteinPerScoopGrams: 25,
  weeklyKmGoal: 45,
  dailyStepGoal: 10000,
  stepGoalEnabled: true,
  dailyNeatGoalKcal: 450,
  neatGoalEnabled: true,
  intervalsSyncEnabled: false,
  desktopSidebarCollapsed: false,
  defaultSpendLevel: "normal",
  zeroWastePantryDefault: true,
};

export const INITIAL_FOODS: FoodItem[] = [
  {
    id: "f-1",
    name: "Riso Basmati",
    kcal: 350,
    protein: 8.5,
    carbs: 77.0,
    fat: 0.8,
    fiber: 1.5,
    sodiumMg: 5,
    category: "glucidico",
    packageSizeGrams: 1000,
    priceEuro: 2.49,
    storageQty: 850,
    unit: "g",
  },
  {
    id: "f-2",
    name: "Petto di Pollo Fresco",
    kcal: 110,
    protein: 23.5,
    carbs: 0.0,
    fat: 1.2,
    fiber: 0.0,
    sodiumMg: 65,
    category: "proteico",
    packageSizeGrams: 500,
    priceEuro: 4.99,
    storageQty: 500,
    unit: "g",
  },
  {
    id: "f-3",
    name: "Olio Extravergine d'Oliva",
    kcal: 884,
    protein: 0.0,
    carbs: 0.0,
    fat: 100.0,
    fiber: 0.0,
    sodiumMg: 2,
    category: "lipidico",
    packageSizeGrams: 750,
    priceEuro: 8.9,
    storageQty: 600,
    unit: "g",
  },
  {
    id: "f-4",
    name: "Fiocchi d'Avena Integrali",
    kcal: 375,
    protein: 13.5,
    carbs: 60.0,
    fat: 7.0,
    fiber: 10.0,
    sodiumMg: 6,
    category: "glucidico",
    packageSizeGrams: 500,
    priceEuro: 1.89,
    storageQty: 400,
    unit: "g",
  },
  {
    id: "f-5",
    name: "Uova Medie Fresche",
    kcal: 143,
    protein: 12.6,
    carbs: 0.8,
    fat: 9.9,
    fiber: 0.0,
    sodiumMg: 140,
    category: "proteico",
    packageSizeGrams: 360, // 6 uova ~ 360g
    priceEuro: 2.19,
    storageQty: 360,
    unit: "g",
  },
  {
    id: "f-6",
    name: "Yogurt Greco 0%",
    kcal: 57,
    protein: 10.3,
    carbs: 4.0,
    fat: 0.0,
    fiber: 0.0,
    sodiumMg: 45,
    category: "proteico",
    packageSizeGrams: 500,
    priceEuro: 2.59,
    storageQty: 250,
    unit: "g",
  },
  {
    id: "f-7",
    name: "Zucchine Fresche",
    kcal: 17,
    protein: 1.2,
    carbs: 3.1,
    fat: 0.3,
    fiber: 1.1,
    sodiumMg: 8,
    category: "verdura",
    packageSizeGrams: 500,
    priceEuro: 1.49,
    storageQty: 300,
    unit: "g",
  },
  {
    id: "f-8",
    name: "Spinaci Freschi",
    kcal: 23,
    protein: 2.9,
    carbs: 3.6,
    fat: 0.4,
    fiber: 2.2,
    sodiumMg: 79,
    category: "verdura",
    packageSizeGrams: 500,
    priceEuro: 1.99,
    storageQty: 500,
    unit: "g",
  },
  {
    id: "f-9",
    name: "Whey Isolate Vaniglia",
    kcal: 380,
    protein: 85.0,
    carbs: 3.0,
    fat: 1.5,
    fiber: 0.5,
    sodiumMg: 180,
    category: "proteico",
    packageSizeGrams: 1000,
    priceEuro: 29.9,
    storageQty: 750,
    unit: "g",
  },
  {
    id: "f-10",
    name: "Mandorle Pelate",
    kcal: 579,
    protein: 21.2,
    carbs: 21.6,
    fat: 49.9,
    fiber: 12.5,
    sodiumMg: 1,
    category: "lipidico",
    packageSizeGrams: 200,
    priceEuro: 3.2,
    storageQty: 180,
    unit: "g",
  },
  {
    id: "f-11",
    name: "Parmigiano Reggiano 24 Mesi",
    kcal: 402,
    protein: 32.4,
    carbs: 0.0,
    fat: 29.7,
    fiber: 0.0,
    sodiumMg: 650,
    category: "proteico",
    packageSizeGrams: 250,
    priceEuro: 4.8,
    storageQty: 150,
    unit: "g",
  },
  {
    id: "f-12",
    name: "Sale Marino Fino Iodato",
    kcal: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sodiumMg: 38758,
    category: "mix",
    packageSizeGrams: 1000,
    priceEuro: 0.59,
    storageQty: 900,
    unit: "g",
  },
];

export const INITIAL_RECIPES: Recipe[] = [
  {
    id: "r-1",
    name: "Bowl Avena & Proteine al Mattino",
    servings: 1,
    category: "Colazione",
    prepTimeMinutes: 5,
    instructions: "Mescola i fiocchi d'avena con acqua tiepida, aggiungi lo yogurt greco, le mandorle tritate e lo scoop di Whey.",
    ingredients: [
      { foodId: "f-4", foodName: "Fiocchi d'Avena Integrali", grams: 70 },
      { foodId: "f-6", foodName: "Yogurt Greco 0%", grams: 150 },
      { foodId: "f-9", foodName: "Whey Isolate Vaniglia", grams: 25 },
      { foodId: "f-10", foodName: "Mandorle Pelate", grams: 15 },
    ],
    kcalPerServing: 531,
    proteinPerServing: 47,
    carbsPerServing: 52,
    fatPerServing: 13,
    sodiumMgPerServing: 115,
    estimatedCostPerServing: 1.95,
  },
  {
    id: "r-2",
    name: "Riso Basmati con Pollo & Zucchine al Wok",
    servings: 1,
    category: "Pranzo",
    prepTimeMinutes: 15,
    instructions: "Cuoci il riso basmati per assorbimento. In padella salta il pollo tagliato a cubetti con le zucchine a rondelle in un filo d'olio e pizzico di sale.",
    ingredients: [
      { foodId: "f-1", foodName: "Riso Basmati", grams: 120 },
      { foodId: "f-2", foodName: "Petto di Pollo Fresco", grams: 200 },
      { foodId: "f-7", foodName: "Zucchine Fresche", grams: 150 },
      { foodId: "f-3", foodName: "Olio Extravergine d'Oliva", grams: 12 },
      { foodId: "f-12", foodName: "Sale Marino Fino Iodato", grams: 2 },
    ],
    kcalPerServing: 772,
    proteinPerServing: 59,
    carbsPerServing: 97,
    fatPerServing: 15,
    sodiumMgPerServing: 910,
    estimatedCostPerServing: 3.15,
  },
  {
    id: "r-3",
    name: "Omelette Spinaci e Parmigiano con Riso",
    servings: 1,
    category: "Cena",
    prepTimeMinutes: 12,
    instructions: "Sbatti le uova con un pizzico di sale e parmigiano. Salta gli spinaci in padella e versa le uova. Accompagna con riso cotto.",
    ingredients: [
      { foodId: "f-5", foodName: "Uova Medie Fresche", grams: 180 }, // 3 uova
      { foodId: "f-11", foodName: "Parmigiano Reggiano 24 Mesi", grams: 30 },
      { foodId: "f-8", foodName: "Spinaci Freschi", grams: 150 },
      { foodId: "f-3", foodName: "Olio Extravergine d'Oliva", grams: 8 },
      { foodId: "f-1", foodName: "Riso Basmati", grams: 80 },
    ],
    kcalPerServing: 735,
    proteinPerServing: 45,
    carbsPerServing: 67,
    fatPerServing: 30,
    sodiumMgPerServing: 620,
    estimatedCostPerServing: 2.85,
  },
];

export const INITIAL_EXERCISES: ExerciseDefinition[] = [
  { id: "ex-1", name: "Weighted Pull-Up (Trazioni Zavorrate)", category: "Calisthenics", isWeightedBodyweight: true, defaultRestSecs: 180 },
  { id: "ex-2", name: "Weighted Dip (Dip alle Parallele Zavorrate)", category: "Calisthenics", isWeightedBodyweight: true, defaultRestSecs: 150 },
  { id: "ex-3", name: "Front Lever Pull", category: "Calisthenics", isWeightedBodyweight: true, defaultRestSecs: 120 },
  { id: "ex-4", name: "Barbell Back Squat", category: "Gym / Pesi", isWeightedBodyweight: false, defaultRestSecs: 180 },
  { id: "ex-5", name: "Romanian Deadlift", category: "Gym / Pesi", isWeightedBodyweight: false, defaultRestSecs: 120 },
  { id: "ex-6", name: "Overhead Press", category: "Gym / Pesi", isWeightedBodyweight: false, defaultRestSecs: 120 },
  { id: "ex-7", name: "Push-Up (Piegamenti)", category: "Corpo Libero", isWeightedBodyweight: true, defaultRestSecs: 60 },
];

export const INITIAL_WORKOUTS: WorkoutSession[] = [
  {
    id: "wo-1",
    date: new Date().toISOString().slice(0, 10),
    scheduledTime: "18:00",
    sport: "Running",
    title: "Ripetute Soglia 4x1000m @3:55",
    plannedMinutes: 52,
    plannedKm: 10.5,
    plannedTss: 65,
    completed: true,
    actualMinutes: 51,
    actualKm: 10.4,
    avgHr: 164,
    maxHr: 179,
    hrZones: [300, 720, 840, 1100, 100],
    avgCadence: 182,
    avgPace: "4:54",
    rpe: 8,
    feelings: "Gambe reattive nelle prime due ripetute, leggera fatica nel finale ma ritmo mantenuto bene.",
    coachEvaluation: {
      score: 84,
      grade: "Buono - Esecuzione Rispettata",
      summaryRecap: "Sessione solida: cadenza a 182 SPM eccellente per prevenire sovraccarichi. Picco in Z4 controllato con pochi secondi di sbavatura.",
      adherenceScore: 88,
      intensityScore: 82,
      cadencePaceAnalysis: "182 SPM costanti nelle ripetute veloci. Recuperi gestiti a 168 SPM senza crolli posturali.",
      actionableTips: [
        "Inizia la prima ripetuta 2 secondi più conservativa per evitare l'innalzamento prematuro del lattato.",
        "Integra 400ml di acqua con 600mg di sodio nella prima ora post-corsa.",
      ],
      recoveryHoursSuggested: 28,
      evaluatedAt: new Date().toISOString(),
    },
  },
  {
    id: "wo-2",
    date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
    scheduledTime: "17:30",
    sport: "Calisthenics",
    title: "Forza Trazioni + Zavorra & Dip",
    plannedMinutes: 60,
    plannedTss: 50,
    completed: true,
    actualMinutes: 63,
    avgHr: 128,
    maxHr: 156,
    rpe: 8,
    feelings: "Ottimo feeling sulla zavorra da 24kg nelle trazioni.",
    sets: [
      { id: "s-1", exerciseId: "ex-1", exerciseName: "Weighted Pull-Up", setNumber: 1, reps: 5, loadKg: 20, isBodyweight: true, rir: 2 },
      { id: "s-2", exerciseId: "ex-1", exerciseName: "Weighted Pull-Up", setNumber: 2, reps: 5, loadKg: 24, isBodyweight: true, rir: 1 },
      { id: "s-3", exerciseId: "ex-1", exerciseName: "Weighted Pull-Up", setNumber: 3, reps: 4, loadKg: 24, isBodyweight: true, rir: 0 },
      { id: "s-4", exerciseId: "ex-2", exerciseName: "Weighted Dip", setNumber: 1, reps: 6, loadKg: 28, isBodyweight: true, rir: 2 },
      { id: "s-5", exerciseId: "ex-2", exerciseName: "Weighted Dip", setNumber: 2, reps: 6, loadKg: 32, isBodyweight: true, rir: 1 },
    ],
    coachEvaluation: {
      score: 87,
      grade: "Molto Buono",
      summaryRecap: "Progressione carichi impeccabile. RIR rispettato nei primi set, cedimento tecnico pulito all'ultima serie.",
      adherenceScore: 92,
      intensityScore: 85,
      strengthExecutionAnalysis: "Trazioni a +24kg con ROM completo e mento sopra la sbarra. Buona stabilità delle scapole.",
      actionableTips: [
        "Aumenta il recupero a 3 minuti pieni prima dell'ultimo set massimale per preservare la 5a rep.",
      ],
      recoveryHoursSuggested: 36,
      evaluatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
  },
];

export const INITIAL_SHOPPING_EXTRAS: ShoppingExtraItem[] = [
  { id: "se-1", name: "Spugne cucina antigraffio", category: "Pulizia Casa", estimatedPriceEuro: 1.5, qty: 1, unit: "conf", checked: false },
  { id: "se-2", name: "Detersivo piatti ecologico", category: "Pulizia Casa", estimatedPriceEuro: 2.2, qty: 1, unit: "flacone", checked: false },
  { id: "se-3", name: "Sacchetti per congelatore 3L", category: "Cucina", estimatedPriceEuro: 1.8, qty: 1, unit: "pacco", checked: false },
];

export const INITIAL_RACE_REPORTS: RaceReport[] = [
  {
    id: "rr-1",
    name: "Mezza Maratona di Monza",
    date: "2026-09-14",
    sport: "Running",
    distanceKm: 21.0975,
    finishTime: "1:26:40",
    avgPace: "4:06/km",
    avgHr: 171,
    maxHr: 182,
    weatherCondition: "16°C, asfalto asciutto, leggera brezza",
    fuelingStrategyUsed: "1 gel idrosalino al km 7, 1 gel caffeina al km 14. 200ml acqua ai ristori.",
    overallRating: 9,
    sensationsAndNotes: "Gara corsa con progressione costante da 4:10 a 4:02 negli ultimi 4km. Nessun crampo, gestione idroelettrolitica impeccabile.",
    podiumOrCategoryPlace: "8° di categoria SM",
  },
];

export function getEngineStorage(): EngineAppData {
  if (typeof window === "undefined") {
    return {
      settings: DEFAULT_SETTINGS,
      foods: INITIAL_FOODS,
      recipes: INITIAL_RECIPES,
      mealPlans: {},
      workouts: INITIAL_WORKOUTS,
      checkIns: {},
      exercises: INITIAL_EXERCISES,
      shoppingExtras: INITIAL_SHOPPING_EXTRAS,
      raceReports: INITIAL_RACE_REPORTS,
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial: EngineAppData = {
        settings: DEFAULT_SETTINGS,
        foods: INITIAL_FOODS,
        recipes: INITIAL_RECIPES,
        mealPlans: generateInitialMealPlans(),
        workouts: INITIAL_WORKOUTS,
        checkIns: generateInitialCheckIns(),
        exercises: INITIAL_EXERCISES,
        shoppingExtras: INITIAL_SHOPPING_EXTRAS,
        raceReports: INITIAL_RACE_REPORTS,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const data = JSON.parse(raw);
    return {
      settings: { ...DEFAULT_SETTINGS, ...(data.settings || {}) },
      foods: data.foods || INITIAL_FOODS,
      recipes: data.recipes || INITIAL_RECIPES,
      mealPlans: data.mealPlans || generateInitialMealPlans(),
      workouts: data.workouts || INITIAL_WORKOUTS,
      checkIns: data.checkIns || generateInitialCheckIns(),
      exercises: data.exercises || INITIAL_EXERCISES,
      shoppingExtras: data.shoppingExtras || INITIAL_SHOPPING_EXTRAS,
      raceReports: data.raceReports || INITIAL_RACE_REPORTS,
    };
  } catch (err) {
    console.error("Storage load error:", err);
    return {
      settings: DEFAULT_SETTINGS,
      foods: INITIAL_FOODS,
      recipes: INITIAL_RECIPES,
      mealPlans: generateInitialMealPlans(),
      workouts: INITIAL_WORKOUTS,
      checkIns: generateInitialCheckIns(),
      exercises: INITIAL_EXERCISES,
      shoppingExtras: INITIAL_SHOPPING_EXTRAS,
      raceReports: INITIAL_RACE_REPORTS,
    };
  }
}

export function saveEngineStorage(data: EngineAppData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error("Storage save error:", err);
  }
}

function generateInitialMealPlans(): Record<string, DayMealPlan> {
  const plans: Record<string, DayMealPlan> = {};
  const today = new Date();

  for (let i = -3; i <= 6; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);

    const isRunningDay = i % 2 === 0;

    plans[dateStr] = {
      date: dateStr,
      targetKcal: isRunningDay ? 2850 : 2550,
      targetProtein: isRunningDay ? 155 : 170,
      targetCarbs: isRunningDay ? 420 : 310,
      targetFat: 68,
      targetSodiumMg: isRunningDay ? 3200 : 2500,
      isHighCarbDay: isRunningDay,
      meals: [
        {
          id: `m-${dateStr}-1`,
          type: "breakfast",
          label: "Colazione",
          items: [
            {
              id: `mi-1`,
              type: "recipe",
              targetId: "r-1",
              name: "Bowl Avena & Proteine al Mattino",
              amountGrams: 250,
              servings: 1,
              kcal: 531,
              protein: 47,
              carbs: 52,
              fat: 13,
              sodiumMg: 115,
              priceEuro: 1.95,
            },
          ],
        },
        {
          id: `m-${dateStr}-2`,
          type: "lunch",
          label: "Pranzo",
          items: [
            {
              id: `mi-2`,
              type: "recipe",
              targetId: "r-2",
              name: "Riso Basmati con Pollo & Zucchine al Wok",
              amountGrams: 480,
              servings: 1,
              kcal: 772,
              protein: 59,
              carbs: 97,
              fat: 15,
              sodiumMg: 910,
              priceEuro: 3.15,
            },
          ],
        },
        {
          id: `m-${dateStr}-3`,
          type: "snack",
          label: "Spuntino Pomeridiano",
          items: [
            {
              id: `mi-3`,
              type: "food",
              targetId: "f-6",
              name: "Yogurt Greco 0%",
              amountGrams: 200,
              kcal: 114,
              protein: 21,
              carbs: 8,
              fat: 0,
              sodiumMg: 90,
              priceEuro: 1.04,
            },
            {
              id: `mi-4`,
              type: "food",
              targetId: "f-10",
              name: "Mandorle Pelate",
              amountGrams: 25,
              kcal: 145,
              protein: 5,
              carbs: 5,
              fat: 12,
              sodiumMg: 1,
              priceEuro: 0.4,
            },
          ],
        },
        {
          id: `m-${dateStr}-4`,
          type: "dinner",
          label: "Cena",
          items: [
            {
              id: `mi-5`,
              type: "recipe",
              targetId: "r-3",
              name: "Omelette Spinaci e Parmigiano con Riso",
              amountGrams: 450,
              servings: 1,
              kcal: 735,
              protein: 45,
              carbs: 67,
              fat: 30,
              sodiumMg: 620,
              priceEuro: 2.85,
            },
          ],
        },
      ],
    };
  }

  return plans;
}

function generateInitialCheckIns(): Record<string, CheckInRecord> {
  const checkIns: Record<string, CheckInRecord> = {};
  const today = new Date();

  for (let i = 0; i <= 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);

    checkIns[dateStr] = {
      date: dateStr,
      weightKg: Math.round((76.2 + Math.sin(i) * 0.4) * 10) / 10,
      restingHr: 48 + (i % 3),
      hrv: 72 + (i % 5) * 2,
      sleepHours: 7.4 + (i % 2) * 0.5,
      sleepQuality: 4,
      domsScore: (i % 3) + 1,
      legFatigueScore: (i % 2) + 1,
      stressLevel: 2,
      notes: i === 0 ? "Ottima energia mattutina, gambe sciolte dopo il recupero." : undefined,
    };
  }

  return checkIns;
}
