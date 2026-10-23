"use client";

import React, { useState, useRef } from "react";
import {
  calculateOneRepMax,
  predictRunningRaces,
  calculateRecoveryReadiness,
  OneRepMaxResult,
} from "@/lib/calculators";
import { UserSettings, SportType } from "@/lib/types";
import {
  Dumbbell,
  Footprints,
  BatteryCharging,
  Sliders,
  Volume2,
  VolumeX,
  RefreshCw,
  Trophy,
  Zap,
  Gauge,
  Activity,
  Heart,
  Timer,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Waves,
  ShieldAlert,
  Flame,
  Droplets,
} from "lucide-react";

interface CalculatorsViewProps {
  settings: UserSettings;
}

export default function CalculatorsView({ settings }: CalculatorsViewProps) {
  const [activeTool, setActiveTool] = useState<"1rm" | "running" | "recovery" | "pushups" | "multisport">("1rm");

  // Tool 1: 1RM to 10RM Calculator State
  const [calcWeight, setCalcWeight] = useState<number>(24);
  const [calcReps, setCalcReps] = useState<number>(5);
  const [isWeightedCali, setIsWeightedCali] = useState<boolean>(true);
  const [bodyweight, setBodyweight] = useState<number>(settings.athleteWeightKg || 76);

  const oneRepMaxResult: OneRepMaxResult = calculateOneRepMax(
    calcWeight,
    calcReps,
    isWeightedCali,
    bodyweight
  );

  // Tool 2: Running Race Predictor State
  const [baseDistanceKm, setBaseDistanceKm] = useState<number>(5.0);
  const [baseTimeMinutes, setBaseTimeMinutes] = useState<number>(20);
  const [baseTimeSeconds, setBaseTimeSeconds] = useState<number>(30);

  const baseTotalSecs = baseTimeMinutes * 60 + baseTimeSeconds;
  const runningPred = predictRunningRaces(baseDistanceKm, baseTotalSecs);

  // Tool 3: Recovery Predictor State
  const [recDoms, setRecDoms] = useState<number>(2); // 1-5
  const [recLegFatigue, setRecLegFatigue] = useState<number>(3); // 1-5
  const [recSleep, setRecSleep] = useState<number>(7.5);
  const [recSport, setRecSport] = useState<string>("Running");
  const [recRpe, setRecRpe] = useState<number>(8);
  const [recDuration, setRecDuration] = useState<number>(60);

  const recoveryResult = calculateRecoveryReadiness(
    recDoms,
    recLegFatigue,
    recSleep,
    recSport,
    recRpe,
    recDuration
  );

  // Tool 4: Push-up Proximity Rep Counter State
  const [pushupCount, setPushupCount] = useState<number>(0);
  const [pushupTarget, setPushupTarget] = useState<number>(30);
  const [proximitySensitivity, setProximitySensitivity] = useState<number>(3); // 1 to 5
  const [isCounting, setIsCounting] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const lastTapTimeRef = useRef<number>(0);

  const handlePushupTapOrProximity = () => {
    if (!isCounting) return;
    const now = Date.now();
    // Sensitivity cooldown: 5 = 450ms, 1 = 1200ms
    const cooldownMs = 1350 - proximitySensitivity * 180;
    if (now - lastTapTimeRef.current < cooldownMs) return;

    lastTapTimeRef.current = now;
    setPushupCount((prev) => {
      const next = prev + 1;
      if (soundEnabled && typeof window !== "undefined") {
        try {
          const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          const ctx = new AudioContextClass();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = next >= pushupTarget ? 880 : 587.33; // D5 or A5 on target
          gain.gain.setValueAtTime(0.12, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
          osc.start();
          osc.stop(ctx.currentTime + 0.14);
        } catch {}
      }
      return next;
    });
  };

  // Tool 5: Multi-Sport Load Estimator State
  const [selectedSport, setSelectedSport] = useState<SportType>("Calcio a 5");
  const [sportMinutes, setSportMinutes] = useState<number>(60);
  const [sportIntensity, setSportIntensity] = useState<"Light" | "Moderate" | "Hard">("Hard");

  const getSportMet = (sp: SportType, int: string) => {
    let base = 7;
    if (sp === "Calcio a 5") base = int === "Hard" ? 10.5 : int === "Moderate" ? 8.5 : 6.5;
    else if (sp === "Nuoto in piscina") base = int === "Hard" ? 9.8 : int === "Moderate" ? 7.5 : 5.8;
    else if (sp === "Nuoto al mare") base = int === "Hard" ? 10.8 : int === "Moderate" ? 8.2 : 6.2;
    else if (sp === "Passeggiata") base = int === "Hard" ? 4.2 : int === "Moderate" ? 3.5 : 2.8;
    else if (sp === "CrossFit / Hyrox") base = int === "Hard" ? 11.5 : int === "Moderate" ? 9.0 : 7.0;
    else if (sp === "Ciclismo / Gravel") base = int === "Hard" ? 10.0 : int === "Moderate" ? 8.0 : 5.5;
    else base = 6.0;
    return base;
  };

  const currentMet = getSportMet(selectedSport, sportIntensity);
  const athleteWeight = settings.athleteWeightKg || 76;
  const estimatedCaloriesBurned = Math.round((currentMet * 3.5 * athleteWeight * sportMinutes) / 200);
  const estimatedSweatMl = Math.round((sportMinutes / 60) * (currentMet > 9 ? 950 : currentMet > 6 ? 700 : 450));
  const estimatedSodiumReplenishMg = Math.round((estimatedSweatMl / 1000) * 850);

  const toolsList = [
    { id: "1rm", label: "1RM - 10RM Scalato", icon: Dumbbell },
    { id: "running", label: "Running VDOT & Gare", icon: Footprints },
    { id: "recovery", label: "Readiness & Recupero", icon: BatteryCharging },
    { id: "pushups", label: "Push-Up Rep Counter", icon: Zap },
    { id: "multisport", label: "Multi-Sport Load & MET", icon: Waves },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="glass-panel-elevated p-6 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-emerald-400 mb-1.5">
              <Gauge className="h-4 w-4" />
              <span>Smart Athletic Calculators &middot; Gold Standard</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Calcolatori & Strumenti Smart
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Algoritmi per predizione carichi zavorra, VDOT endurance, readiness organica e conteggio rep con sensore di prossimità.
            </p>
          </div>

          {/* Cupertino Segmented Tabs */}
          <div className="mat-segment-track flex flex-wrap gap-1 p-1.5">
            {toolsList.map((t) => {
              const Icon = t.icon;
              const isActive = activeTool === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTool(t.id as any)}
                  className={`mat-segment-item flex items-center gap-1.5 ${
                    isActive ? "mat-segment-item-active" : ""
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* TOOL 1: 1RM TO 10RM CALCULATOR */}
      {activeTool === "1rm" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Inputs Panel */}
          <div className="glass-panel p-6 rounded-3xl space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-white/5">
              <Dumbbell className="h-5 w-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Parametri Test Carico</h3>
            </div>

            {/* Cali vs Gym toggle */}
            <div>
              <label className="text-xs text-slate-300 block mb-2 font-medium">Modalità Esercizio</label>
              <div className="mat-segment-track flex p-1">
                <button
                  onClick={() => setIsWeightedCali(true)}
                  className={`mat-segment-item flex-1 text-center ${
                    isWeightedCali ? "mat-segment-item-active" : ""
                  }`}
                >
                  Calisthenics Zavorrato
                </button>
                <button
                  onClick={() => setIsWeightedCali(false)}
                  className={`mat-segment-item flex-1 text-center ${
                    !isWeightedCali ? "mat-segment-item-active" : ""
                  }`}
                >
                  Bilanciere / Palestra
                </button>
              </div>
            </div>

            {isWeightedCali && (
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-medium">
                  Peso Corporeo Atleta (kg)
                </label>
                <input
                  type="number"
                  step={0.5}
                  value={bodyweight}
                  onChange={(e) => setBodyweight(Number(e.target.value))}
                  className="w-full glass-panel px-3.5 py-2.5 rounded-xl text-xs text-white font-mono"
                />
              </div>
            )}

            <div>
              <label className="text-xs text-slate-300 block mb-1 font-medium">
                {isWeightedCali ? "Zavorra Aggiunta Utilizzata (kg)" : "Carico Sollevato sul Bilanciere (kg)"}
              </label>
              <input
                type="number"
                step={0.5}
                value={calcWeight}
                onChange={(e) => setCalcWeight(Number(e.target.value))}
                className="w-full glass-panel px-3.5 py-2.5 rounded-xl text-base font-mono font-bold text-emerald-400"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs text-slate-300 font-medium">Ripetizioni Completate</label>
                <span className="font-mono text-xs text-emerald-400 font-bold">{calcReps} reps</span>
              </div>
              <input
                type="range"
                min={1}
                max={12}
                value={calcReps}
                onChange={(e) => setCalcReps(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-400 leading-relaxed">
              Formula Gold-Standard combinata <strong>Brzycki & Epley</strong> con compensazione
              biomeccanica del bodyweight per trazioni e dip zavorrati.
            </div>
          </div>

          {/* Results: 1RM Hero & Scaled 1RM-10RM Table */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-3xl space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider block">
                  {isWeightedCali ? "Massimale Zavorra 1RM Stimato" : "Massimale Totale 1RM Stimato"}
                </span>
                <div className="text-4xl font-black text-white mt-1 font-mono tracking-tight">
                  +{isWeightedCali ? (oneRepMaxResult.addedWeight1RMKg ?? oneRepMaxResult.estimated1RM) : oneRepMaxResult.estimated1RM} <span className="text-xl text-emerald-400 font-normal">kg</span>
                </div>
                {isWeightedCali && (
                  <span className="text-[11px] text-slate-300 mt-1 block">
                    Carico di sistema totale (BW + Zavorra): {oneRepMaxResult.estimated1RM} kg
                  </span>
                )}
              </div>

              <div className="p-5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider block">
                  Zona Allenante Ipertrofia (6-8RM)
                </span>
                <div className="text-3xl font-black text-cyan-200 mt-1 font-mono tracking-tight">
                  +{isWeightedCali ? (oneRepMaxResult.scaledTable[5]?.addedWeightKg ?? 0) : (oneRepMaxResult.scaledTable[5]?.totalLoadKg ?? 0)} - +{isWeightedCali ? (oneRepMaxResult.scaledTable[7]?.addedWeightKg ?? 0) : (oneRepMaxResult.scaledTable[7]?.totalLoadKg ?? 0)} kg
                </div>
                <span className="text-[11px] text-slate-300 mt-1 block">
                  Intensità ottimale per volume e densità neuromuscolare
                </span>
              </div>
            </div>

            {/* Scaled Table 1RM to 10RM */}
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">
                Progressione Carichi Scalati (1RM &rarr; 10RM)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {oneRepMaxResult.scaledTable.map((item) => (
                  <div
                    key={item.rm}
                    className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-center font-mono hover:border-emerald-500/40 transition-all"
                  >
                    <span className="text-[10px] text-slate-400 block font-sans font-semibold">
                      {item.rm} RM ({item.percent1RM}%)
                    </span>
                    <span className="text-lg font-black text-white mt-0.5 block">
                      +{isWeightedCali ? (item.addedWeightKg ?? item.totalLoadKg) : item.totalLoadKg} <span className="text-[10px] font-normal text-slate-400">kg</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOOL 2: RUNNING VDOT & RACE PREDICTOR */}
      {activeTool === "running" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-3xl space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-white/5">
              <Footprints className="h-5 w-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white">Test di Riferimento Recente</h3>
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1 font-medium">Distanza Test (km)</label>
              <input
                type="number"
                step={0.1}
                value={baseDistanceKm}
                onChange={(e) => setBaseDistanceKm(Number(e.target.value))}
                className="w-full glass-panel px-3.5 py-2.5 rounded-xl text-xs text-white font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-medium">Minuti</label>
                <input
                  type="number"
                  value={baseTimeMinutes}
                  onChange={(e) => setBaseTimeMinutes(Number(e.target.value))}
                  className="w-full glass-panel px-3 py-2 rounded-xl text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-medium">Secondi</label>
                <input
                  type="number"
                  max={59}
                  value={baseTimeSeconds}
                  onChange={(e) => setBaseTimeSeconds(Number(e.target.value))}
                  className="w-full glass-panel px-3 py-2 rounded-xl text-xs text-white font-mono"
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-center">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">
                Punteggio VDOT Jack Daniels Stimato
              </span>
              <div className="text-4xl font-black text-white mt-1 font-mono">
                {Math.max(30, Math.min(85, Math.round((29.5 + 5.0 * ((baseDistanceKm * 1000) / (Math.max(1, baseTotalSecs) / 60)) * 0.0038) * 10) / 10))}
              </div>
              <span className="text-[11px] text-slate-300 mt-1 block">
                Passo riferimento: {Math.floor((baseTotalSecs / Math.max(0.1, baseDistanceKm)) / 60)}:{String(Math.round((baseTotalSecs / Math.max(0.1, baseDistanceKm)) % 60)).padStart(2, "0")}/km
              </span>
            </div>
          </div>

          <div className="lg:col-span-2 glass-panel p-6 rounded-3xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-400" />
                Previsioni Tempi Gare (Formula Riegel Ottimizzata)
              </h3>
              <span className="text-xs font-mono text-slate-400">Atleta Ibrido</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {runningPred.predictions.map((p) => (
                <div
                  key={p.distanceName}
                  className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between hover:border-cyan-500/30 transition-all"
                >
                  <div>
                    <h5 className="font-bold text-white text-sm">{p.distanceName}</h5>
                    <span className="text-[11px] font-mono text-slate-400">{p.distanceKm} km</span>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-lg font-black text-cyan-300 block">{p.predictedTimeFormatted}</span>
                    <span className="text-[11px] text-slate-400">Passo {p.paceMinKmFormatted}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pace Training Zones */}
            <div className="pt-4 border-t border-white/5">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">
                Zone Passo di Allenamento Suggerite
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
                <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] text-emerald-400 block">Z2 EASY / LENTO</span>
                  <span className="text-xs font-bold text-white mt-1 block">{runningPred.trainingPaces.easyPace}</span>
                </div>
                <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] text-cyan-400 block">Z3 MARATONA</span>
                  <span className="text-xs font-bold text-white mt-1 block">{runningPred.trainingPaces.marathonPace}</span>
                </div>
                <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] text-amber-400 block">Z4 SOGLIA (LT)</span>
                  <span className="text-xs font-bold text-white mt-1 block">{runningPred.trainingPaces.thresholdPace}</span>
                </div>
                <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] text-rose-400 block">Z5 INTERVALS VO2</span>
                  <span className="text-xs font-bold text-white mt-1 block">{runningPred.trainingPaces.intervalPace}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOOL 3: RECOVERY READINESS PREDICTOR */}
      {activeTool === "recovery" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-white/5">
              <Heart className="h-5 w-5 text-rose-400" />
              <h3 className="text-base font-bold text-white">Feedback Post-Workout</h3>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs text-slate-300">DOMS & Dolori Muscolari (1-5)</label>
                <span className="font-mono text-xs text-amber-400 font-bold">{recDoms}/5</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={recDoms}
                onChange={(e) => setRecDoms(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs text-slate-300">Affaticamento Gambe (1-5)</label>
                <span className="font-mono text-xs text-rose-400 font-bold">{recLegFatigue}/5</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={recLegFatigue}
                onChange={(e) => setRecLegFatigue(Number(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs text-slate-300">Ore di Sonno Effettive</label>
                <span className="font-mono text-xs text-cyan-400 font-bold">{recSleep} ore</span>
              </div>
              <input
                type="range"
                min={4}
                max={10}
                step={0.5}
                value={recSleep}
                onChange={(e) => setRecSleep(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs text-slate-300">RPE Sforzo Percepito (1-10)</label>
                <span className="font-mono text-xs text-emerald-400 font-bold">{recRpe}/10</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={recRpe}
                onChange={(e) => setRecRpe(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="lg:col-span-2 glass-panel p-6 rounded-3xl space-y-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <h3 className="text-base font-bold text-white">Indice di Readiness & Recupero</h3>
                <span className="text-xs font-mono text-slate-400">Apple Health Battery Model</span>
              </div>

              {/* Large Score Banner */}
              <div className="mt-5 p-6 rounded-3xl bg-black/40 border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="text-center sm:text-left">
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                    Stato Organico Attuale
                  </span>
                  <div className={`text-6xl font-black mt-1 font-mono tracking-tighter ${
                    recoveryResult.readinessScore > 75
                      ? "text-emerald-400"
                      : recoveryResult.readinessScore > 45
                      ? "text-amber-400"
                      : "text-rose-400"
                  }`}>
                    {recoveryResult.readinessScore}%
                  </div>
                  <span className="text-sm font-bold text-white mt-1 block">
                    {recoveryResult.status}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-center font-mono">
                  <span className="text-[10px] text-slate-400 block uppercase">Tempo di Recupero Ottimale</span>
                  <span className="text-2xl font-black text-cyan-300 mt-1 block">
                    {recoveryResult.hoursToFullRecovery} ORE
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Prima del prossimo carico ad alta intensità
                  </span>
                </div>
              </div>

              <div className="mt-5 p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-xs text-slate-300 leading-relaxed">
                <strong className="text-emerald-400 block mb-1">Raccomandazione AI Coach:</strong>
                {recoveryResult.recommendation}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOOL 4: PUSH-UP PROXIMITY REP COUNTER */}
      {activeTool === "pushups" && (
        <div className="max-w-xl mx-auto glass-panel p-8 rounded-3xl text-center space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">Contatore Push-Up Smart Proximity</h3>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-full glass-pill text-slate-300 hover:text-white"
            >
              {soundEnabled ? <Volume2 className="h-4 w-4 text-emerald-400" /> : <VolumeX className="h-4 w-4 text-slate-500" />}
            </button>
          </div>

          <p className="text-xs text-slate-400">
            Posiziona il telefono sul pavimento sotto il petto. Tocca lo schermo con il naso/petto o premi il pulsante per incrementare le rep.
          </p>

          {/* Interactive Tap Area with Apple Fitness Ring look */}
          <div
            onClick={handlePushupTapOrProximity}
            className={`w-56 h-56 mx-auto rounded-full flex flex-col items-center justify-center cursor-pointer transition-all select-none shadow-2xl relative ${
              isCounting
                ? "bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border-4 border-emerald-400 hover:scale-[1.02] active:scale-95 shadow-emerald-500/25"
                : "bg-white/[0.03] border-4 border-white/10 opacity-70"
            }`}
          >
            <span className="text-6xl font-black text-white font-mono tracking-tighter">
              {pushupCount}
            </span>
            <span className="text-xs font-mono text-slate-400 mt-1 uppercase tracking-wider">
              / {pushupTarget} TARGET
            </span>
            {isCounting && (
              <span className="absolute bottom-4 text-[10px] font-mono text-emerald-300 animate-pulse">
                TOCCA COL PETTO
              </span>
            )}
          </div>

          {/* Sensitivity & Target Controls */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                <Sliders className="h-3.5 w-3.5 text-cyan-400" />
                Sensibilità Sensore Prossimità
              </span>
              <span className="font-mono text-cyan-400 font-bold">Livello {proximitySensitivity}/5</span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              value={proximitySensitivity}
              onChange={(e) => setProximitySensitivity(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Actions: Start, Pause, Reset */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setIsCounting(!isCounting)}
              className={`px-6 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg ${
                isCounting
                  ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
                  : "bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-emerald-500/20"
              }`}
            >
              {isCounting ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              <span>{isCounting ? "Pausa" : "Inizia Serie"}</span>
            </button>

            <button
              onClick={() => {
                setPushupCount(0);
                setIsCounting(false);
              }}
              className="px-4 py-3 rounded-2xl glass-pill text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Resetta</span>
            </button>
          </div>
        </div>
      )}

      {/* TOOL 5: MULTI-SPORT LOAD & MET ESTIMATOR */}
      {activeTool === "multisport" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-white/5">
              <Waves className="h-5 w-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white">Configura Attività Sportiva</h3>
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1 font-medium">Seleziona Sport</label>
              <select
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value as SportType)}
                className="w-full glass-panel px-3 py-2.5 rounded-xl text-xs text-white bg-slate-900"
              >
                <option value="Calcio a 5">Calcio a 5 (Intervals/Indoor)</option>
                <option value="Nuoto in piscina">Nuoto in Piscina</option>
                <option value="Nuoto al mare">Nuoto al Mare (Open Water)</option>
                <option value="Passeggiata">Passeggiata Rigenerante</option>
                <option value="CrossFit / Hyrox">CrossFit / Hyrox</option>
                <option value="Ciclismo / Gravel">Ciclismo / Gravel</option>
                <option value="Other">Altro Sport</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1 font-medium">
                Durata Allenamento: <span className="font-mono text-cyan-400 font-bold">{sportMinutes} min</span>
              </label>
              <input
                type="range"
                min={15}
                max={180}
                step={5}
                value={sportMinutes}
                onChange={(e) => setSportMinutes(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-2 font-medium">Intensità Percepita</label>
              <div className="mat-segment-track flex p-1">
                {(["Light", "Moderate", "Hard"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setSportIntensity(lvl)}
                    className={`mat-segment-item flex-1 text-center ${
                      sportIntensity === lvl ? "mat-segment-item-active" : ""
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 glass-panel p-6 rounded-3xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Flame className="h-5 w-5 text-amber-400" />
                Stima Dispendio Energetico & Elettroliti
              </h3>
              <span className="text-xs font-mono text-slate-400">MET Valutato: {currentMet}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block">
                  Calorie Bruciate Stimate
                </span>
                <div className="text-3xl font-black text-white mt-1 font-mono">
                  {estimatedCaloriesBurned} <span className="text-sm font-normal text-amber-400">kcal</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-center">
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">
                  Perdita Liquidi Stimata
                </span>
                <div className="text-3xl font-black text-cyan-300 mt-1 font-mono">
                  {estimatedSweatMl} <span className="text-sm font-normal text-cyan-400">ml</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block">
                  Reintegro Sodio Consigliato
                </span>
                <div className="text-3xl font-black text-emerald-300 mt-1 font-mono">
                  {estimatedSodiumReplenishMg} <span className="text-sm font-normal text-emerald-400">mg</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-xs text-slate-300 leading-relaxed">
              Consiglio idratazione: assumi circa {Math.round(estimatedSweatMl * 1.2)}ml d&apos;acqua nelle 2 ore
              successive all&apos;attività di {selectedSport.toLowerCase()} con una punta di sale marino o elettroliti
              per favorire il recupero neuromuscolare e prevenire crampi.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
