import { UserSettings, SportType } from "./types";

export interface MacroTargetResult {
  bmr: number;
  tdee: number;
  targetKcal: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  sodiumMg: number;
  potassiumMg: number;
  magnesiumMg: number;
  fiberGrams: number;
  isHighCarbDay: boolean;
  dayTypeLabel: string;
}

/**
 * Calculates BMR using Mifflin-St Jeor or Katch-McArdle (if body fat is provided)
 */
export function calculateBMR(settings: UserSettings): number {
  const { athleteWeightKg, athleteHeightCm, athleteAge, athleteGender, bodyFatPercentage } = settings;

  if (bodyFatPercentage && bodyFatPercentage > 3 && bodyFatPercentage < 50) {
    // Katch-McArdle
    const lbm = athleteWeightKg * (1 - bodyFatPercentage / 100);
    return Math.round(370 + 21.6 * lbm);
  }

  // Mifflin-St Jeor
  if (athleteGender === "female") {
    return Math.round(10 * athleteWeightKg + 6.25 * athleteHeightCm - 5 * athleteAge - 161);
  }
  return Math.round(10 * athleteWeightKg + 6.25 * athleteHeightCm - 5 * athleteAge + 5);
}

/**
 * Gold-standard dynamic macro & micronutrient calculation for hybrid athletes
 */
export function calculateDailyTargets(
  settings: UserSettings,
  plannedSport?: SportType,
  workoutMinutes = 0,
  estimatedKcalBurned = 0
): MacroTargetResult {
  const bmr = calculateBMR(settings);
  const weight = settings.athleteWeightKg;

  // Base activity multiplier
  const baseTdee = Math.round(bmr * (settings.baseTdeeMultiplier || 1.4));

  // Determine if today is high endurance / running vs strength vs rest
  const isRunning = plannedSport === "Running" || plannedSport === "Trail Running";
  const isSwimmingOrFutsal = plannedSport === "Nuoto al mare" || plannedSport === "Nuoto in piscina" || plannedSport === "Calcio a 5";
  const isStrength = plannedSport === "Strength" || plannedSport === "Calisthenics";
  const isHighVolume = workoutMinutes >= 50 || isRunning || isSwimmingOrFutsal;

  let dayTypeLabel = "Giorno Riposo / Attività Leggera";
  let isHighCarbDay = false;
  let workoutExtraKcal = estimatedKcalBurned;

  if (!workoutExtraKcal && workoutMinutes > 0) {
    // Estimate burn based on sport and athlete weight
    const met = isRunning ? 10.5 : isSwimmingOrFutsal ? 9.0 : isStrength ? 5.5 : 3.5;
    workoutExtraKcal = Math.round((met * 3.5 * weight) / 200 * workoutMinutes);
  }

  let carbsPerKg = settings.strengthDayCarbsPerKg || 4.0;
  let proteinPerKg = settings.proteinPerKg || 2.0;

  if (settings.macroCyclingEnabled) {
    if (isRunning || (isHighVolume && !isStrength)) {
      isHighCarbDay = true;
      dayTypeLabel = `Endurance High-Carb (${plannedSport || "Corsa"})`;
      carbsPerKg = settings.runningDayCarbsPerKg || 6.5;
      proteinPerKg = 1.9; // Optimal retention without digestive drag
    } else if (isStrength) {
      dayTypeLabel = "Giorno Forza / Calisthenics";
      carbsPerKg = settings.strengthDayCarbsPerKg || 4.2;
      proteinPerKg = 2.2; // Maximum muscle protein synthesis
    }
  }

  const proteinGrams = Math.round(weight * proteinPerKg);
  const carbsGrams = Math.round(weight * carbsPerKg);

  // Calories from P & C
  const kcalFromProteinAndCarbs = proteinGrams * 4 + carbsGrams * 4;

  // Total daily target: Base TDEE + workout burn (or calibrated)
  const targetKcal = Math.max(bmr + 200, baseTdee + workoutExtraKcal);

  // Remaining calories to fats (minimum 0.7g/kg for hormonal health)
  const remainingKcalForFat = Math.max(weight * 0.7 * 9, targetKcal - kcalFromProteinAndCarbs);
  const fatGrams = Math.round(remainingKcalForFat / 9);

  // Adjusted TDEE total
  const finalTargetKcal = proteinGrams * 4 + carbsGrams * 4 + fatGrams * 9;

  // Micronutrients & Electrolytes (Gold Standard for Sweating Hybrid Athlete)
  const sweatHours = Math.max(0, workoutMinutes / 60);
  const baseSodium = settings.targetSodiumMgBase || 2500;
  const sweatSodium = Math.round(sweatHours * (settings.sodiumPerSweatHourMg || 750));
  const sodiumMg = baseSodium + sweatSodium;
  const potassiumMg = Math.round(3500 + sweatHours * 400);
  const magnesiumMg = 450;
  const fiberGrams = Math.round(Math.min(55, Math.max(30, (carbsGrams * 0.12))));

  return {
    bmr,
    tdee: baseTdee + workoutExtraKcal,
    targetKcal: finalTargetKcal,
    proteinGrams,
    carbsGrams,
    fatGrams,
    sodiumMg,
    potassiumMg,
    magnesiumMg,
    fiberGrams,
    isHighCarbDay,
    dayTypeLabel,
  };
}

/**
 * Computes missing protein and suggests Whey scoop doses
 */
export function calculateWheySupplementation(
  currentProtein: number,
  targetProtein: number,
  proteinPerScoop = 25
): { needed: boolean; missingGrams: number; scoops: number; gramsToAdd: number } {
  const missingGrams = Math.round(Math.max(0, targetProtein - currentProtein));
  if (missingGrams <= 12) {
    return { needed: false, missingGrams: 0, scoops: 0, gramsToAdd: 0 };
  }

  // Assuming ~80% purity for standard Whey Protein powder
  const gramsToAdd = Math.round(missingGrams / 0.8);
  const scoops = Math.round((missingGrams / proteinPerScoop) * 2) / 2; // nearest 0.5 scoop

  return {
    needed: true,
    missingGrams,
    scoops: Math.max(0.5, scoops),
    gramsToAdd,
  };
}
