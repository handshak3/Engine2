"use client";

import React, { useState } from "react";
import {
  WorkoutSession,
  ExerciseDefinition,
  SportType,
  CoachEvaluation,
  UserSettings,
} from "@/lib/types";
import {
  CheckCircle2,
  Calendar,
  Dumbbell,
  Activity,
  Footprints,
  Sparkles,
  Loader2,
  CloudRain,
  Award,
} from "lucide-react";
import { WorkoutWeatherCheck } from "@/lib/weather";

interface WorkoutViewProps {
  workouts: WorkoutSession[];
  exercises: ExerciseDefinition[];
  settings: UserSettings;
  weather: WorkoutWeatherCheck | null;
  onUpdateWorkout: (wo: WorkoutSession) => void;
  onAddWorkout: (wo: WorkoutSession) => void;
  onAddExercise: (ex: ExerciseDefinition) => void;
  onUpdateSettings: (s: UserSettings) => void;
}

export default function WorkoutView({
  workouts,
  exercises,
  settings,
  weather,
  onUpdateWorkout,
  onAddWorkout,
  onAddExercise,
}: WorkoutViewProps) {
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutSession | null>(
    workouts[0] || null
  );
  const [activeTab, setActiveTab] = useState<"list" | "generator" | "strength_stats">("list");
  const [strengthFilterWeeks, setStrengthFilterWeeks] = useState<1 | 2 | 4 | 6 | 12>(4);
  const [showPreStartModal, setShowPreStartModal] = useState(false);
  const [isEvaluatingCoach, setIsEvaluatingCoach] = useState(false);

  // Free workout generator state
  const [genSport, setGenSport] = useState<SportType>("Running");
  const [genMinutes, setGenMinutes] = useState(45);
  const [genFatigue, setGenFatigue] = useState("moderate");
  const [genUserDescription, setGenUserDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedWorkout, setGeneratedWorkout] = useState<any>(null);

  // New exercise state
  const [newExName, setNewExName] = useState("");
  const [newExCategory, setNewExCategory] = useState<ExerciseDefinition["category"]>("Calisthenics");
  const [newExWeighted, setNewExWeighted] = useState(true);

  // Calculate weekly running km
  const currentWeekWorkouts = workouts.filter((w) => {
    const d = new Date(w.date);
    const now = new Date();
    const diffDays = Math.abs((now.getTime() - d.getTime()) / (1000 * 3600 * 24));
    return diffDays <= 7 && w.completed && (w.sport === "Running" || w.sport === "Trail Running");
  });
  const weeklyActualKm = Math.round(
    currentWeekWorkouts.reduce((acc, w) => acc + (w.actualKm || w.plannedKm || 0), 0) * 10
  ) / 10;
  const weeklyKmGoal = settings.weeklyKmGoal || 45;
  const weeklyKmPercent = Math.min(100, Math.round((weeklyActualKm / weeklyKmGoal) * 100));

  // Handle Severe Coach AI evaluation
  const handleRunCoachEvaluation = async (wo: WorkoutSession) => {
    setIsEvaluatingCoach(true);
    try {
      const res = await fetch("/api/gemini/coach-eval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(wo),
      });
      const data: CoachEvaluation = await res.json();
      if (data && data.score) {
        const updated: WorkoutSession = {
          ...wo,
          coachEvaluation: {
            ...data,
            evaluatedAt: new Date().toISOString(),
          },
        };
        onUpdateWorkout(updated);
        setSelectedWorkout(updated);
      }
    } catch (err) {
      console.error("Coach eval error:", err);
    } finally {
      setIsEvaluatingCoach(false);
    }
  };

  // Handle Free Workout generation
  const handleGenerateWorkout = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/gemini/workout-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sport: genSport,
          availableMinutes: genMinutes,
          fatigueLevel: genFatigue,
          userDescription: genUserDescription,
          recentWorkouts: workouts.slice(0, 4),
        }),
      });
      const data = await res.json();
      setGeneratedWorkout(data);
    } catch (err) {
      console.error("Generator error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveGeneratedToPlan = () => {
    if (!generatedWorkout) return;
    const newWo: WorkoutSession = {
      id: `wo-gen-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      scheduledTime: "18:00",
      sport: (generatedWorkout.sport as SportType) || genSport,
      title: generatedWorkout.title || "Allenamento Personalizzato",
      script: generatedWorkout.intervalsScript || "",
      notes: generatedWorkout.descriptionSummary || "",
      plannedMinutes: generatedWorkout.estimatedMinutes || genMinutes,
      plannedKm: generatedWorkout.estimatedKm,
      plannedTss: generatedWorkout.targetTssOrLoad,
      completed: false,
    };
    onAddWorkout(newWo);
    setSelectedWorkout(newWo);
    setActiveTab("list");
    setGeneratedWorkout(null);
  };

  const handleCreateExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExName.trim()) return;
    const ex: ExerciseDefinition = {
      id: `ex-${Date.now()}`,
      name: newExName.trim(),
      category: newExCategory,
      isWeightedBodyweight: newExWeighted,
      defaultRestSecs: 120,
    };
    onAddExercise(ex);
    setNewExName("");
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Apple Fitness Metric Dials & Segmented Mode Switcher */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Running Km Goal Widget - Apple Activity Style */}
        <div className="rounded-3xl glass-panel p-5 shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <div className="flex items-center gap-2 font-semibold text-slate-200">
              <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Footprints className="h-4 w-4" />
              </div>
              <span className="tracking-tight">Obiettivo Running</span>
            </div>
            <span className="font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
              {weeklyKmPercent}%
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-3">
            <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
              {weeklyActualKm} <span className="text-xs font-normal text-slate-400">/ {weeklyKmGoal} km</span>
            </span>
            <span className="text-xs font-mono text-slate-400">
              {Math.max(0, Math.round((weeklyKmGoal - weeklyActualKm) * 10) / 10)} km rimasti
            </span>
          </div>

          {/* Luminous Apple-grade Progress Bar */}
          <div className="w-full bg-slate-800/60 h-2.5 rounded-full overflow-hidden mt-4 p-0.5 border border-white/[0.04]">
            <div
              style={{ width: `${weeklyKmPercent}%` }}
              className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 h-full rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
            />
          </div>
        </div>

        {/* Intervals.icu Steps & Active NEAT Ring */}
        <div className="rounded-3xl glass-panel p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <div className="flex items-center gap-2 font-semibold text-slate-200">
              <div className="p-1.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Activity className="h-4 w-4" />
              </div>
              <span className="tracking-tight">Passi & NEAT</span>
            </div>
            <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-500/30">
              intervals.icu
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-3">
            <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
              {settings.intervalsDailySteps ? settings.intervalsDailySteps.toLocaleString("it-IT") : "8.450"}{" "}
              <span className="text-xs font-normal text-slate-400">passi</span>
            </span>
            <span className="text-xs font-mono text-emerald-400 font-semibold">
              NEAT: ~{settings.dailyNeatGoalKcal || 450} kcal
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            Media 7 giorni: <strong className="text-slate-200 font-mono">9.820 passi/giorno</strong> (Target OK)
          </p>
        </div>

        {/* Material 2027 Segmented Tab Pill Selector */}
        <div className="rounded-3xl glass-panel p-4 flex flex-col justify-between shadow-xl">
          <div className="flex p-1 bg-white/[0.04] border border-white/[0.08] rounded-2xl gap-1">
            <button
              onClick={() => setActiveTab("list")}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                activeTab === "list"
                  ? "bg-white/[0.12] text-white shadow-sm border border-white/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sessioni
            </button>
            <button
              onClick={() => setActiveTab("generator")}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "generator"
                  ? "bg-white/[0.12] text-white shadow-sm border border-white/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              Free WO AI
            </button>
            <button
              onClick={() => setActiveTab("strength_stats")}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                activeTab === "strength_stats"
                  ? "bg-white/[0.12] text-white shadow-sm border border-white/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Forza 1-12w
            </button>
          </div>
          <div className="mt-2 text-center text-[11px] text-slate-400 font-medium">
            Coach AI Severo attivo &middot; Valutazione live e retroattiva
          </div>
        </div>
      </div>

      {/* VIEW: SESSIONS LIST & DETAIL */}
      {activeTab === "list" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Workouts Sidebar List (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-2 uppercase tracking-wider">
              <span>ALLENAMENTI IN PROGRAMMA</span>
              <span className="font-mono text-emerald-400">{workouts.length} totali</span>
            </div>

            <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
              {workouts.map((wo) => {
                const isSelected = selectedWorkout?.id === wo.id;
                return (
                  <button
                    key={wo.id}
                    onClick={() => setSelectedWorkout(wo)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all active:scale-[0.99] ${
                      isSelected
                        ? "glass-panel-elevated border-emerald-500/60 shadow-[0_8px_24px_rgba(16,185,129,0.18)]"
                        : "glass-panel hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-cyan-400 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {wo.date} &middot; {wo.scheduledTime}
                      </span>
                      {wo.completed ? (
                        <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Completato
                        </span>
                      ) : (
                        <span className="text-[11px] text-amber-400 font-semibold">Pianificato</span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-white mt-2 line-clamp-1 tracking-tight">{wo.title}</h4>

                    <div className="flex items-center gap-3 mt-2.5 text-xs text-slate-400 font-mono">
                      <span className="text-slate-300 font-semibold">{wo.sport}</span>
                      {wo.plannedKm ? <span>&middot; {wo.plannedKm} km</span> : null}
                      {wo.plannedMinutes ? <span>&middot; {wo.plannedMinutes}m</span> : null}
                      {wo.coachEvaluation && (
                        <span className="ml-auto font-black text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          ★ {wo.coachEvaluation.score}/100
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Workout Detailed View (8 cols) */}
          <div className="lg:col-span-8">
            {selectedWorkout ? (
              <div className="rounded-3xl glass-panel p-6 shadow-2xl space-y-6">
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-white/[0.06]">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1.5">
                      <span className="font-bold uppercase tracking-wider">{selectedWorkout.sport}</span>
                      <span>&middot;</span>
                      <span>{selectedWorkout.date}</span>
                      <span>&middot;</span>
                      <span className="bg-white/[0.08] px-2.5 py-0.5 rounded-full text-white font-bold border border-white/[0.08]">
                        Ore {selectedWorkout.scheduledTime}
                      </span>
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-tight">{selectedWorkout.title}</h2>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => setShowPreStartModal(true)}
                      className="flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-950/40 px-3.5 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-900/60 transition-all active:scale-95 shadow-sm"
                    >
                      <Activity className="h-4 w-4" />
                      How It Will Run
                    </button>

                    <button
                      onClick={() => handleRunCoachEvaluation(selectedWorkout)}
                      disabled={isEvaluatingCoach}
                      className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-xs font-bold text-white hover:opacity-95 disabled:opacity-50 transition-all shadow-[0_4px_16px_rgba(16,185,129,0.3)] active:scale-95"
                    >
                      {isEvaluatingCoach ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Award className="h-4 w-4" />
                      )}
                      Valutazione Coach AI (1-100)
                    </button>
                  </div>
                </div>

                {/* Severe Coach Evaluation Panel - Apple Design Award Look */}
                {selectedWorkout.coachEvaluation && (
                  <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 via-slate-900/50 to-slate-950 p-6 space-y-4 shadow-xl relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                          <Award className="h-6 w-6" />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400 block">
                            REPORT COACH SEVERO
                          </span>
                          <h4 className="text-base font-bold text-white tracking-tight">
                            {selectedWorkout.coachEvaluation.grade}
                          </h4>
                        </div>
                      </div>

                      <div className="flex items-baseline gap-1 bg-white/[0.04] px-4 py-2 rounded-2xl border border-white/[0.08]">
                        <span className="text-4xl font-black font-mono text-emerald-400 tracking-tight">
                          {selectedWorkout.coachEvaluation.score}
                        </span>
                        <span className="text-xs font-mono text-slate-400">/ 100</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed font-sans bg-white/[0.02] p-3.5 rounded-xl border border-white/[0.04]">
                      {selectedWorkout.coachEvaluation.summaryRecap}
                    </p>

                    {selectedWorkout.coachEvaluation.cadencePaceAnalysis && (
                      <div className="text-xs text-slate-300 bg-white/[0.03] p-3.5 rounded-xl border border-white/[0.06]">
                        <strong className="text-cyan-400 block mb-1">Analisi Cadenza & Zone:</strong>
                        {selectedWorkout.coachEvaluation.cadencePaceAnalysis}
                      </div>
                    )}

                    {selectedWorkout.coachEvaluation.strengthExecutionAnalysis && (
                      <div className="text-xs text-slate-300 bg-white/[0.03] p-3.5 rounded-xl border border-white/[0.06]">
                        <strong className="text-emerald-400 block mb-1">Esecuzione Forza & Serie:</strong>
                        {selectedWorkout.coachEvaluation.strengthExecutionAnalysis}
                      </div>
                    )}

                    <div className="pt-2">
                      <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-2">
                        3 Suggerimenti Tecnici Prioritari:
                      </span>
                      <ul className="space-y-1.5 text-xs text-slate-200">
                        {selectedWorkout.coachEvaluation.actionableTips.map((tip, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-emerald-400 font-bold font-mono">0{idx + 1}.</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="text-[11px] font-mono text-slate-400 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                      <span>Recupero stimato prima del prossimo massimale:</span>
                      <strong className="text-amber-400 font-bold">
                        {selectedWorkout.coachEvaluation.recoveryHoursSuggested} ore
                      </strong>
                    </div>
                  </div>
                )}

                {/* Workout Script / Instructions */}
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Script intervals.icu / Descrizione
                  </h4>
                  <pre className="p-4 rounded-2xl border border-white/[0.06] bg-slate-950/90 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed shadow-inner">
                    {selectedWorkout.script || selectedWorkout.notes || "Nessuno script dettagliato inserito."}
                  </pre>
                </div>

                {/* Strength sets if logged */}
                {selectedWorkout.sets && selectedWorkout.sets.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Serie & Carichi Registrati
                    </h4>
                    <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-slate-950/60 p-2">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="border-b border-white/[0.06] text-slate-400 text-[11px]">
                          <tr>
                            <th className="py-2.5 px-3">Esercizio</th>
                            <th className="py-2.5 px-2">Set</th>
                            <th className="py-2.5 px-2">Reps</th>
                            <th className="py-2.5 px-2">Carico / Zavorra</th>
                            <th className="py-2.5 px-2">RIR</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04] text-slate-200">
                          {selectedWorkout.sets.map((s) => (
                            <tr key={s.id} className="hover:bg-white/[0.02]">
                              <td className="py-2.5 px-3 font-semibold text-white">{s.exerciseName}</td>
                              <td className="py-2.5 px-2 text-slate-400">#{s.setNumber}</td>
                              <td className="py-2.5 px-2 font-bold text-emerald-400">{s.reps}</td>
                              <td className="py-2.5 px-2 font-semibold">
                                {s.loadKg > 0 ? `+${s.loadKg} kg` : "Bodyweight"}
                              </td>
                              <td className="py-2.5 px-2 text-slate-300">{s.rir != null ? `RIR ${s.rir}` : "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-3xl glass-panel p-12 text-center text-slate-400">
                Seleziona un allenamento dalla lista per vedere i dettagli.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW: FREE WORKOUT GENERATOR & SCRIPT WRITER */}
      {activeTab === "generator" && (
        <div className="rounded-3xl glass-panel p-6 shadow-2xl space-y-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 mb-1">
              <Sparkles className="h-4 w-4" />
              <span>FREE WORKOUT AI COACH</span>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Suggerimento Allenamento o Traduzione da Parole a Script
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Descrivi l&apos;allenamento a parole tue per convertirlo in script intervals.icu, oppure lascia che il Coach
              ne proponga uno in base al carico recente e tempo a disposizione.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1 font-medium">Sport</label>
              <select
                value={genSport}
                onChange={(e) => setGenSport(e.target.value as SportType)}
                className="w-full rounded-xl border border-white/[0.08] bg-slate-900/90 px-3 py-2 text-xs text-white"
              >
                <option value="Running">Running</option>
                <option value="Trail Running">Trail Running</option>
                <option value="Calisthenics">Calisthenics</option>
                <option value="Strength">Strength / Palestra</option>
                <option value="Calcio a 5">Calcio a 5</option>
                <option value="Nuoto in piscina">Nuoto in piscina</option>
                <option value="Nuoto al mare">Nuoto al mare</option>
                <option value="Passeggiata">Passeggiata</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1 font-medium">Tempo a disposizione (minuti)</label>
              <input
                type="number"
                value={genMinutes}
                onChange={(e) => setGenMinutes(Number(e.target.value))}
                className="w-full rounded-xl border border-white/[0.08] bg-slate-900/90 px-3 py-2 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1 font-medium">Stato affaticamento</label>
              <select
                value={genFatigue}
                onChange={(e) => setGenFatigue(e.target.value)}
                className="w-full rounded-xl border border-white/[0.08] bg-slate-900/90 px-3 py-2 text-xs text-white"
              >
                <option value="low">Basso / Fresco</option>
                <option value="moderate">Moderato</option>
                <option value="high">Elevato / Gambe appesantite</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1 font-medium">
              Descrivi a parole il workout desiderato (Opzionale):
            </label>
            <textarea
              rows={3}
              value={genUserDescription}
              onChange={(e) => setGenUserDescription(e.target.value)}
              placeholder="Es. 'Voglio fare un fartlek con 15min riscaldamento, poi 8 ripetute da 2 minuti veloci al passo dei 5k con 1 minuto di corsa lenta di recupero, e 10min defaticamento'"
              className="w-full rounded-2xl border border-white/[0.08] bg-slate-900/90 p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          <button
            onClick={handleGenerateWorkout}
            disabled={isGenerating}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-xs font-bold text-white hover:opacity-95 disabled:opacity-50 transition-all shadow-[0_4px_16px_rgba(16,185,129,0.3)] active:scale-95"
          >
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Genera Workout & Script Intervals
          </button>

          {/* Generated workout preview */}
          {generatedWorkout && (
            <div className="mt-6 rounded-2xl border border-white/[0.1] bg-slate-950 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                    Proposta AI Coach &middot; {generatedWorkout.intensity}
                  </span>
                  <h4 className="text-base font-bold text-white">{generatedWorkout.title}</h4>
                </div>
                <button
                  onClick={handleSaveGeneratedToPlan}
                  className="rounded-xl bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500 transition-colors shadow"
                >
                  Inserisci nel Piano
                </button>
              </div>

              <p className="text-xs text-slate-300">{generatedWorkout.descriptionSummary}</p>

              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                  Script Generato intervals.icu:
                </span>
                <pre className="mt-1.5 p-3.5 rounded-xl bg-slate-900/90 border border-white/[0.06] font-mono text-xs text-emerald-300 whitespace-pre-wrap">
                  {generatedWorkout.intervalsScript}
                </pre>
              </div>

              <div className="text-xs text-slate-400 italic">
                Motivazione Coach: {generatedWorkout.rationale}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW: STRENGTH EXERCISES & 1-12W PROGRESSION STATS */}
      {activeTab === "strength_stats" && (
        <div className="rounded-3xl glass-panel p-6 shadow-2xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Statistiche di Forza & Libreria Esercizi
              </h3>
              <p className="text-xs text-slate-400">
                Filtra l&apos;andamento dei carichi e delle zavorre per calisthenics e palestra da 1 a 12 settimane.
              </p>
            </div>

            {/* Timeframe filters: 1w, 2w, 4w, 6w, 12w */}
            <div className="flex items-center gap-1 p-1 bg-white/[0.04] border border-white/[0.08] rounded-xl">
              {([1, 2, 4, 6, 12] as const).map((w) => (
                <button
                  key={w}
                  onClick={() => setStrengthFilterWeeks(w)}
                  className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-all ${
                    strengthFilterWeeks === w
                      ? "bg-emerald-600 text-white shadow-sm border border-white/20"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {w}w
                </button>
              ))}
            </div>
          </div>

          {/* Add Exercise form */}
          <form
            onSubmit={handleCreateExercise}
            className="flex flex-wrap items-end gap-3 p-4 rounded-2xl border border-white/[0.06] bg-slate-950/60"
          >
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-slate-400 block mb-1">Nuovo Esercizio Personalizzato</label>
              <input
                type="text"
                placeholder="Es. Muscle-Up Zavorrato, Front Squat, OAP..."
                value={newExName}
                onChange={(e) => setNewExName(e.target.value)}
                className="w-full rounded-xl border border-white/[0.08] bg-slate-900/90 px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Categoria</label>
              <select
                value={newExCategory}
                onChange={(e) => setNewExCategory(e.target.value as any)}
                className="rounded-xl border border-white/[0.08] bg-slate-900/90 px-3 py-2 text-xs text-white"
              >
                <option value="Calisthenics">Calisthenics</option>
                <option value="Gym / Pesi">Gym / Pesi</option>
                <option value="Corpo Libero">Corpo Libero</option>
                <option value="Core / Addome">Core / Addome</option>
              </select>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                id="isWeightedCheck"
                checked={newExWeighted}
                onChange={(e) => setNewExWeighted(e.target.checked)}
                className="rounded border-slate-700 text-emerald-500"
              />
              <label htmlFor="isWeightedCheck" className="text-xs text-slate-300">
                Supporta Zavorra (BW + kg)
              </label>
            </div>
            <button
              type="submit"
              className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors shadow"
            >
              Aggiungi Esercizio
            </button>
          </form>

          {/* Exercise Progression Table */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Esercizi Registrati & Carichi Recenti ({strengthFilterWeeks} settimane)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exercises.map((ex) => (
                <div
                  key={ex.id}
                  className="rounded-2xl border border-white/[0.06] bg-slate-950/80 p-5 flex flex-col justify-between hover:border-white/[0.12] transition-colors shadow"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-bold">
                        {ex.category} {ex.isWeightedBodyweight ? "&middot; Zavorrabile" : ""}
                      </span>
                      <h4 className="text-base font-bold text-white mt-1">{ex.name}</h4>
                    </div>
                    <span className="text-xs font-mono text-slate-400">Rest: {ex.defaultRestSecs}s</span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Progressione:</span>
                    <span className="text-emerald-400 font-bold text-sm">
                      {ex.isWeightedBodyweight ? "+24 kg (5 reps)" : "95 kg (5 reps)"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PRE-START "HOW IT WILL RUN" MODAL */}
      {showPreStartModal && selectedWorkout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-lg rounded-3xl glass-panel-elevated p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Pre-Start: How It Will Run</h3>
              </div>
              <button
                onClick={() => setShowPreStartModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-slate-400">Sessione:</span>
                <p className="text-base font-bold text-white">{selectedWorkout.title}</p>
              </div>

              {/* Weather forecast for workout hour */}
              {weather && (
                <div
                  className={`p-3.5 rounded-2xl border ${
                    weather.willRain
                      ? "border-amber-500/40 bg-amber-950/40 text-amber-200"
                      : "border-emerald-500/40 bg-emerald-950/30 text-emerald-200"
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    {weather.willRain ? (
                      <CloudRain className="h-4 w-4 text-amber-400" />
                    ) : (
                      <Activity className="h-4 w-4 text-emerald-400" />
                    )}
                    <span>Previsioni per le ore {selectedWorkout.scheduledTime}:</span>
                  </div>
                  <p className="mt-1 text-xs opacity-90 leading-relaxed">{weather.verdictMessage}</p>
                </div>
              )}

              {/* Target estimates */}
              <div className="grid grid-cols-3 gap-2.5 text-center p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans uppercase">DURATA STIMATA</span>
                  <span className="text-base font-bold text-white">{selectedWorkout.plannedMinutes || 45}m</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans uppercase">DISTANZA</span>
                  <span className="text-base font-bold text-cyan-400">{selectedWorkout.plannedKm || "-"} km</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans uppercase">TSS / CARICO</span>
                  <span className="text-base font-bold text-emerald-400">{selectedWorkout.plannedTss || "~55"}</span>
                </div>
              </div>

              {/* Fueling checklist */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-1.5">
                <span className="font-bold text-slate-200 block">Idratazione & Fueling Pre-WO:</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Bevi 350-500ml di acqua con un pizzico di sale marino (300-400mg sodio) 45 minuti prima.
                  Assumi 30-40g di carboidrati a rapido assorbimento se la sessione dura oltre 45 minuti.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowPreStartModal(false)}
              className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-xs font-bold text-white hover:opacity-95 transition-all shadow-lg active:scale-95"
            >
              Chiudi & Procedi all&apos;Allenamento
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
