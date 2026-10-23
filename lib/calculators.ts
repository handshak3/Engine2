export interface OneRepMaxTableEntry {
  rm: number; // 1, 2, 3, ... 10
  percent1RM: number; // e.g. 100%, 95%, 93%, 90%
  totalLoadKg: number;
  addedWeightKg?: number; // for weighted bodyweight (zavorra)
}

export interface OneRepMaxResult {
  estimated1RM: number;
  formulaUsed: string;
  isWeightedCalisthenics: boolean;
  bodyweightKg?: number;
  addedWeight1RMKg?: number;
  scaledTable: OneRepMaxTableEntry[];
}

/**
 * Calculates 1RM using Brzycki or Epley formula, supporting weighted calisthenics
 */
export function calculateOneRepMax(
  weightKg: number,
  reps: number,
  isWeightedCalisthenics = false,
  athleteBodyweightKg = 75
): OneRepMaxResult {
  if (reps <= 1) {
    const total = isWeightedCalisthenics ? athleteBodyweightKg + weightKg : weightKg;
    const added1RM = isWeightedCalisthenics ? weightKg : undefined;
    return {
      estimated1RM: Math.round(total * 10) / 10,
      formulaUsed: "Carico diretto (1 rep)",
      isWeightedCalisthenics,
      bodyweightKg: athleteBodyweightKg,
      addedWeight1RMKg: added1RM,
      scaledTable: generateScaledTable(total, isWeightedCalisthenics, athleteBodyweightKg),
    };
  }

  // If weighted calisthenics, total moved mass = Bodyweight + Added Weight
  const totalWeight = isWeightedCalisthenics ? athleteBodyweightKg + weightKg : weightKg;

  // Brzycki formula: 1RM = Weight / (1.0278 - 0.0278 * reps)
  // Epley formula: 1RM = Weight * (1 + reps / 30)
  // We use average of Brzycki & Epley for gold standard accuracy under 10 reps
  const brzycki = totalWeight / (1.0278 - 0.0278 * Math.min(12, reps));
  const epley = totalWeight * (1 + Math.min(12, reps) / 30);
  const total1RM = (brzycki + epley) / 2;

  const estimated1RM = Math.round(total1RM * 10) / 10;
  const addedWeight1RMKg = isWeightedCalisthenics
    ? Math.max(0, Math.round((total1RM - athleteBodyweightKg) * 10) / 10)
    : undefined;

  return {
    estimated1RM,
    formulaUsed: "Brzycki & Epley Ibrido Gold Standard",
    isWeightedCalisthenics,
    bodyweightKg: athleteBodyweightKg,
    addedWeight1RMKg,
    scaledTable: generateScaledTable(total1RM, isWeightedCalisthenics, athleteBodyweightKg),
  };
}

const RM_PERCENTAGES = [
  { rm: 1, pct: 1.0 },
  { rm: 2, pct: 0.955 },
  { rm: 3, pct: 0.925 },
  { rm: 4, pct: 0.895 },
  { rm: 5, pct: 0.865 },
  { rm: 6, pct: 0.835 },
  { rm: 7, pct: 0.805 },
  { rm: 8, pct: 0.775 },
  { rm: 9, pct: 0.745 },
  { rm: 10, pct: 0.715 },
];

function generateScaledTable(
  total1RM: number,
  isWeightedCalisthenics: boolean,
  bodyweightKg: number
): OneRepMaxTableEntry[] {
  return RM_PERCENTAGES.map(({ rm, pct }) => {
    const totalLoad = Math.round(total1RM * pct * 10) / 10;
    const addedWeight = isWeightedCalisthenics
      ? Math.max(0, Math.round((totalLoad - bodyweightKg) * 10) / 10)
      : undefined;

    return {
      rm,
      percent1RM: Math.round(pct * 100),
      totalLoadKg: totalLoad,
      addedWeightKg: addedWeight,
    };
  });
}

/**
 * Running race prediction using Riegel formula + VDOT pace zones
 */
export interface RunningPredictionItem {
  distanceName: string;
  distanceKm: number;
  predictedTimeSecs: number;
  predictedTimeFormatted: string;
  paceMinKmFormatted: string;
}

export interface RunningPaceZones {
  easyPace: string; // Zone 2
  marathonPace: string;
  thresholdPace: string; // Zone 4 / Tempo
  intervalPace: string; // VO2max
  repetitionPace: string; // Anaerobic
}

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatPace(paceSecPerKm: number): string {
  const m = Math.floor(paceSecPerKm / 60);
  const s = Math.round(paceSecPerKm % 60);
  return `${m}:${String(s).padStart(2, "0")}/km`;
}

export function predictRunningRaces(
  baseDistanceKm: number,
  baseTimeSecs: number
): { predictions: RunningPredictionItem[]; trainingPaces: RunningPaceZones } {
  // Riegel formula: T2 = T1 * (D2 / D1)^1.06 (with 1.07 for marathon to account for hybrid fatigue)
  const targets = [
    { name: "1500m", km: 1.5 },
    { name: "3000m", km: 3.0 },
    { name: "5K", km: 5.0 },
    { name: "10K", km: 10.0 },
    { name: "Mezza Maratona", km: 21.0975 },
    { name: "Maratona", km: 42.195 },
  ];

  const predictions: RunningPredictionItem[] = targets.map((t) => {
    const exponent = t.km > 25 ? 1.075 : 1.06;
    const tSecs = baseTimeSecs * Math.pow(t.km / baseDistanceKm, exponent);
    const paceSec = tSecs / t.km;

    return {
      distanceName: t.name,
      distanceKm: t.km,
      predictedTimeSecs: Math.round(tSecs),
      predictedTimeFormatted: formatTime(tSecs),
      paceMinKmFormatted: formatPace(paceSec),
    };
  });

  // Calculate training pace zones based on 5K pace
  const pred5k = predictions.find((p) => p.distanceKm === 5.0) || predictions[2];
  const pace5kSec = pred5k.predictedTimeSecs / 5.0;

  const trainingPaces: RunningPaceZones = {
    easyPace: formatPace(pace5kSec * 1.3), // Easy / Z2 (~ +60-90s/km)
    marathonPace: formatPace(pace5kSec * 1.15),
    thresholdPace: formatPace(pace5kSec * 1.08), // Soglia anaerobica
    intervalPace: formatPace(pace5kSec * 0.98), // VO2max
    repetitionPace: formatPace(pace5kSec * 0.92), // Rapide
  };

  return { predictions, trainingPaces };
}

/**
 * Calculates recovery time based on post-workout DOMS, sensations and sport type
 */
export function calculateRecoveryReadiness(
  domsScore: number, // 1-5
  legFatigueScore: number, // 1-5
  sleepHours = 7.5,
  sportType: string = "Running",
  rpe = 7,
  durationMinutes = 60
): {
  readinessScore: number; // 0-100%
  status: "Pronto" | "Fatica Moderata" | "Recupero Richiesto" | "Alto Rischio Sovrallenamento";
  hoursToFullRecovery: number;
  recommendation: string;
} {
  // Base recovery hours from workload (RPE * minutes)
  const workload = (rpe * durationMinutes) / 10;
  let baseHours = 12 + workload * 0.15;

  // Sport specific eccentric impact multiplier (Running has higher muscle damage than swimming or cycling)
  if (/run|trail/i.test(sportType)) baseHours *= 1.25;
  if (/calis|strength|gym/i.test(sportType)) baseHours *= 1.15;
  if (/swim/i.test(sportType)) baseHours *= 0.85;

  // DOMS & Fatigue multiplier
  const sorenessFactor = (domsScore + legFatigueScore) / 2; // 1 to 5
  baseHours += (sorenessFactor - 1) * 8;

  // Sleep acceleration
  if (sleepHours >= 8.5) baseHours *= 0.85;
  else if (sleepHours < 6.0) baseHours *= 1.35;

  const hoursToFullRecovery = Math.max(8, Math.round(baseHours));

  // Readiness score (0 - 100)
  const fatiguePenalty = (domsScore - 1) * 15 + (legFatigueScore - 1) * 15 + (rpe > 7 ? (rpe - 7) * 8 : 0);
  const readinessScore = Math.max(15, Math.min(100, Math.round(100 - fatiguePenalty + (sleepHours >= 7.5 ? 8 : -10))));

  let status: "Pronto" | "Fatica Moderata" | "Recupero Richiesto" | "Alto Rischio Sovrallenamento" = "Pronto";
  let recommendation = "Fisiologia pronta per sessioni di qualità o carichi elevati.";

  if (readinessScore < 40 || domsScore >= 4 || legFatigueScore >= 4) {
    status = "Alto Rischio Sovrallenamento";
    recommendation = "Gambe pesanti e DOMS marcati: programma solo camminata, mobilità o riposo attivo. Nessuna ripetuta o massimale oggi.";
  } else if (readinessScore < 65) {
    status = "Recupero Richiesto";
    recommendation = "Fatica sistemica residua: mantieni intensità in Zona 1/2 facile o forza a basse ripetizioni buffer 3-4.";
  } else if (readinessScore < 85) {
    status = "Fatica Moderata";
    recommendation = "Buono stato generale con lieve affaticamento: sessione standard fattibile con buon riscaldamento.";
  }

  return {
    readinessScore,
    status,
    hoursToFullRecovery,
    recommendation,
  };
}
