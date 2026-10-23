export type FoodCategory =
  | "proteico"
  | "glucidico"
  | "lipidico"
  | "verdura"
  | "mix"
  | "carboidrato"
  | "grasso"
  | "vegetables";

export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sodiumMg?: number; // Salt & electrolyte tracking
  category: FoodCategory;
  packageSizeGrams: number;
  priceEuro: number;
  storageQty: number; // Current quantity in grams or units
  unit: "g" | "ml" | "pz";
  isNewAdded?: boolean; // For AI category fix button
  barcode?: string;
  notes?: string;
}

export interface RecipeIngredient {
  foodId: string;
  foodName: string;
  grams: number;
  halfPack?: boolean;
}

export interface Recipe {
  id: string;
  name: string;
  servings: number;
  category?: string;
  ingredients: RecipeIngredient[];
  instructions?: string;
  prepTimeMinutes?: number;
  notes?: string;
  // Computed macro totals per serving
  kcalPerServing: number;
  proteinPerServing: number;
  carbsPerServing: number;
  fatPerServing: number;
  sodiumMgPerServing?: number;
  estimatedCostPerServing?: number;
}

export interface MealItemPortion {
  id: string;
  type: "food" | "recipe";
  targetId: string; // foodId or recipeId
  name: string;
  amountGrams: number;
  servings?: number;
  halfPack?: boolean;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  sodiumMg?: number;
  priceEuro?: number;
  isWheyAutoAdded?: boolean;
}

export interface DayMeal {
  id: string;
  type: "breakfast" | "lunch" | "snack" | "dinner";
  label: string;
  items: MealItemPortion[];
}

export interface DayMealPlan {
  date: string; // YYYY-MM-DD
  meals: DayMeal[];
  targetKcal: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  targetSodiumMg: number;
  isHighCarbDay?: boolean; // Running/endurance high volume
  notes?: string;
}

export interface ShoppingExtraItem {
  id: string;
  name: string;
  category: string;
  estimatedPriceEuro?: number;
  priceEuro?: number;
  qty: number;
  unit?: string;
  checked?: boolean;
  isPurchased?: boolean;
}

export interface ShoppingListItem {
  id?: string;
  foodId?: string;
  name?: string;
  foodName?: string;
  neededGrams: number;
  inStorageGrams: number;
  toBuyUnits?: number;
  toBuyPacks?: number;
  packageSizeGrams?: number;
  priceEuro?: number;
  estimatedCostEuro?: number;
  isSufficientInStorage?: boolean;
  isSufficient?: boolean;
  willRunOutAfterMeals?: boolean;
  checked?: boolean;
  isPurchased?: boolean;
  isExtraNonFood?: boolean;
}

export type SportType =
  | "Running"
  | "Trail Running"
  | "Calisthenics"
  | "Strength"
  | "Calcio a 5"
  | "Nuoto in piscina"
  | "Nuoto al mare"
  | "Passeggiata"
  | "Cycling"
  | "CrossFit / Hyrox"
  | "Ciclismo / Gravel"
  | "Other";

export interface ExerciseDefinition {
  id: string;
  name: string;
  category: "Calisthenics" | "Gym / Pesi" | "Corpo Libero" | "Core / Addome" | "Mobilità";
  isWeightedBodyweight?: boolean; // For added load calculations like Weighted Pull-up/Dip
  defaultRestSecs: number;
  notes?: string;
}

export interface ExerciseSetRecord {
  id: string;
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  reps: number;
  loadKg: number; // Added weight (zavorra) or barbell weight
  isBodyweight: boolean;
  rir?: number; // Reps In Reserve
  rpe?: number;
}

export interface CoachEvaluation {
  score: number; // 1-100
  grade: string;
  summaryRecap: string;
  adherenceScore: number;
  intensityScore: number;
  cadencePaceAnalysis?: string;
  strengthExecutionAnalysis?: string;
  actionableTips: string[];
  recoveryHoursSuggested: number;
  evaluatedAt: string;
}

export interface WorkoutSession {
  id: string;
  intervalsId?: string;
  date: string; // YYYY-MM-DD
  scheduledTime: string; // HH:mm, e.g. "18:30"
  sport: SportType;
  title: string;
  notes?: string;
  script?: string;
  plannedMinutes?: number;
  plannedKm?: number;
  plannedTss?: number;
  // Actual results
  completed: boolean;
  actualMinutes?: number;
  actualKm?: number;
  avgHr?: number;
  maxHr?: number;
  hrZones?: number[]; // seconds in Z1-Z5
  avgCadence?: number; // SPM
  cadencePhases?: { phase: string; spm: number }[];
  avgPace?: string; // min/km e.g. "4:45"
  paceZones?: number[];
  rpe?: number; // 1-10
  feelings?: string;
  sets?: ExerciseSetRecord[];
  coachEvaluation?: CoachEvaluation;
}

export interface CheckInRecord {
  date: string; // YYYY-MM-DD
  weightKg?: number;
  restingHr?: number;
  hrv?: number;
  sleepHours?: number;
  sleepQuality?: number; // 1-5
  domsScore: number; // 1-5 (1=none, 5=severe)
  legFatigueScore: number; // 1-5
  stressLevel?: number; // 1-5
  notes?: string;
}

export interface RaceReport {
  id: string;
  name: string;
  date: string;
  sport?: SportType;
  distanceKm: number;
  finishTime: string; // e.g. "1:38:45"
  avgPace?: string;
  averagePace?: string;
  avgHr?: number;
  averageHr?: number;
  maxHr?: number;
  weatherCondition?: string;
  fuelingStrategyUsed?: string;
  fuelingStrategy?: string;
  overallRating?: number; // 1-10
  performanceRating?: number;
  sensationsAndNotes?: string;
  notes?: string;
  podiumOrCategoryPlace?: string;
}

export interface UserSettings {
  athleteName: string;
  athleteWeightKg: number;
  athleteHeightCm: number;
  athleteAge: number;
  athleteGender: "male" | "female";
  bodyFatPercentage?: number;
  currentLocationName: string;
  latitude: number;
  longitude: number;
  // Nutrition & TDEE
  useMifflinStJeor: boolean;
  baseTdeeMultiplier: number; // 1.2 to 1.9
  macroCyclingEnabled: boolean;
  runningDayCarbsPerKg: number; // e.g. 6.5 g/kg
  strengthDayCarbsPerKg: number; // e.g. 4.0 g/kg
  proteinPerKg: number; // e.g. 2.0 g/kg
  targetSodiumMgBase: number; // 2500mg
  sodiumPerSweatHourMg: number; // 750mg
  autoWheySupplementation: boolean;
  wheyProteinPerScoopGrams: number; // e.g. 25g
  wheyProductFoodId?: string;
  // Activity targets
  weeklyKmGoal: number; // Running km target
  dailyStepGoal: number; // Steps goal
  stepGoalEnabled: boolean;
  dailyNeatGoalKcal: number; // Daily NEAT target
  neatGoalEnabled: boolean;
  // Intervals.icu
  intervalsApiKey?: string;
  intervalsAthleteId?: string;
  intervalsSyncEnabled: boolean;
  intervalsLastSync?: string;
  intervalsDailySteps?: number;
  // UI & App state
  desktopSidebarCollapsed: boolean;
  defaultSpendLevel: "economic" | "normal" | "expensive";
  zeroWastePantryDefault: boolean;
}
