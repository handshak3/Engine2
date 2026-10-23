"use client";

import React, { useState } from "react";
import {
  RaceReport,
  CheckInRecord,
  DayMealPlan,
  FoodItem,
  Recipe,
  UserSettings,
} from "@/lib/types";
import {
  Trophy,
  UtensilsCrossed,
  Calendar,
  Activity,
  Footprints,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  Award,
  Clock,
  Heart,
  Droplets,
  Scale,
  Bed,
  Check,
  X,
  PieChart,
  BarChart3,
  Flame,
  Zap,
} from "lucide-react";

interface ReportsViewProps {
  raceReports: RaceReport[];
  checkIns: Record<string, CheckInRecord>;
  mealPlans: Record<string, DayMealPlan>;
  foods: FoodItem[];
  recipes: Recipe[];
  settings: UserSettings;
  onAddRaceReport: (report: RaceReport) => void;
  onUpdateRaceReport: (report: RaceReport) => void;
  onDeleteRaceReport: (id: string) => void;
  onUpdateCheckIn: (date: string, checkIn: CheckInRecord) => void;
  onUpdateSettings: (s: UserSettings) => void;
}

export default function ReportsView({
  raceReports,
  checkIns,
  mealPlans,
  foods,
  recipes,
  settings,
  onAddRaceReport,
  onUpdateRaceReport,
  onDeleteRaceReport,
  onUpdateCheckIn,
  onUpdateSettings,
}: ReportsViewProps) {
  const [subTab, setSubTab] = useState<"races" | "culinary" | "checkin">("races");

  // Retroactive check-in state
  const [checkInDate, setCheckInDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  const activeCheckIn: CheckInRecord = checkIns[checkInDate] || {
    date: checkInDate,
    weightKg: settings.athleteWeightKg,
    restingHr: 50,
    hrv: 70,
    sleepHours: 7.5,
    sleepQuality: 4,
    domsScore: 1,
    legFatigueScore: 1,
    stressLevel: 2,
    notes: "",
  };

  // Form state for editing check-in
  const [editWeight, setEditWeight] = useState(activeCheckIn.weightKg || settings.athleteWeightKg);
  const [editRhr, setEditRhr] = useState(activeCheckIn.restingHr || 50);
  const [editHrv, setEditHrv] = useState(activeCheckIn.hrv || 70);
  const [editSleep, setEditSleep] = useState(activeCheckIn.sleepHours || 7.5);
  const [editDoms, setEditDoms] = useState(activeCheckIn.domsScore || 1);
  const [editLegFatigue, setEditLegFatigue] = useState(activeCheckIn.legFatigueScore || 1);
  const [editNotes, setEditNotes] = useState(activeCheckIn.notes || "");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSelectCheckInDate = (dt: string) => {
    setCheckInDate(dt);
    const rec = checkIns[dt] || {
      date: dt,
      weightKg: settings.athleteWeightKg,
      restingHr: 50,
      hrv: 70,
      sleepHours: 7.5,
      sleepQuality: 4,
      domsScore: 1,
      legFatigueScore: 1,
      stressLevel: 2,
      notes: "",
    };
    setEditWeight(rec.weightKg || settings.athleteWeightKg);
    setEditRhr(rec.restingHr || 50);
    setEditHrv(rec.hrv || 70);
    setEditSleep(rec.sleepHours || 7.5);
    setEditDoms(rec.domsScore || 1);
    setEditLegFatigue(rec.legFatigueScore || 1);
    setEditNotes(rec.notes || "");
    setSaveSuccess(false);
  };

  const handleSaveCheckIn = () => {
    const updated: CheckInRecord = {
      date: checkInDate,
      weightKg: editWeight,
      restingHr: editRhr,
      hrv: editHrv,
      sleepHours: editSleep,
      domsScore: editDoms,
      legFatigueScore: editLegFatigue,
      notes: editNotes.trim(),
    };
    onUpdateCheckIn(checkInDate, updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // New Race Report Modal
  const [isAddingRace, setIsAddingRace] = useState(false);
  const [raceName, setRaceName] = useState("");
  const [raceDate, setRaceDate] = useState(new Date().toISOString().slice(0, 10));
  const [raceDistanceKm, setRaceDistanceKm] = useState(21.1);
  const [raceTime, setRaceTime] = useState("1:28:30");
  const [racePace, setRacePace] = useState("4:11/km");
  const [raceHr, setRaceHr] = useState(172);
  const [raceFueling, setRaceFueling] = useState("2 gel maltodestrine + 500ml acqua con sale");
  const [raceRating, setRaceRating] = useState(8);
  const [raceNotes, setRaceNotes] = useState("");

  const handleSaveRace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!raceName.trim()) return;
    const r: RaceReport = {
      id: `rr-${Date.now()}`,
      name: raceName.trim(),
      date: raceDate,
      distanceKm: Number(raceDistanceKm),
      finishTime: raceTime.trim(),
      averagePace: racePace.trim(),
      averageHr: Number(raceHr),
      fuelingStrategy: raceFueling.trim(),
      performanceRating: Number(raceRating),
      notes: raceNotes.trim(),
    };
    onAddRaceReport(r);
    setIsAddingRace(false);
    setRaceName("");
  };

  // Culinary analytics extraction
  const foodUsageCount: Record<string, { food: FoodItem; count: number; totalGrams: number }> = {};
  const recipeUsageCount: Record<string, { recipe: Recipe; count: number }> = {};

  Object.values(mealPlans).forEach((dayPlan) => {
    dayPlan.meals.forEach((meal) => {
      meal.items.forEach((item) => {
        if (item.type === "food") {
          const food = foods.find((f) => f.id === item.targetId);
          if (food) {
            if (!foodUsageCount[food.id]) {
              foodUsageCount[food.id] = { food, count: 0, totalGrams: 0 };
            }
            foodUsageCount[food.id].count += 1;
            foodUsageCount[food.id].totalGrams += item.amountGrams;
          }
        } else if (item.type === "recipe") {
          const rec = recipes.find((r) => r.id === item.targetId);
          if (rec) {
            if (!recipeUsageCount[rec.id]) {
              recipeUsageCount[rec.id] = { recipe: rec, count: 0 };
            }
            recipeUsageCount[rec.id].count += 1;
          }
        }
      });
    });
  });

  const topFoods = Object.values(foodUsageCount).sort((a, b) => b.count - a.count).slice(0, 6);
  const topRecipes = Object.values(recipeUsageCount).sort((a, b) => b.count - a.count).slice(0, 6);

  const getRelativeDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    return d.toISOString().slice(0, 10);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="glass-panel-elevated p-6 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-400 mb-1.5">
              <Award className="h-4 w-4" />
              <span>Biomarkers & Performance Analytics</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Report Gare, Nutrizione & Check-in
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Monitora i risultati in gara con strategie di fueling, estrai le tue abitudini alimentari e correggi
              i check-in fisici anche per i giorni passati.
            </p>
          </div>

          {/* Segmented control tabs */}
          <div className="mat-segment-track flex p-1.5 self-start md:self-center">
            <button
              onClick={() => setSubTab("races")}
              className={`mat-segment-item flex items-center gap-2 ${
                subTab === "races" ? "mat-segment-item-active" : ""
              }`}
            >
              <Trophy className="h-4 w-4" />
              <span>Report Gare ({raceReports.length})</span>
            </button>
            <button
              onClick={() => setSubTab("culinary")}
              className={`mat-segment-item flex items-center gap-2 ${
                subTab === "culinary" ? "mat-segment-item-active" : ""
              }`}
            >
              <UtensilsCrossed className="h-4 w-4" />
              <span>Abitudini Piatti</span>
            </button>
            <button
              onClick={() => setSubTab("checkin")}
              className={`mat-segment-item flex items-center gap-2 ${
                subTab === "checkin" ? "mat-segment-item-active" : ""
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>Check-in Storico</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: RACE REPORTS */}
      {subTab === "races" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-400" />
              Storico Gare Ufficiali & Time Trial
            </h3>

            <button
              onClick={() => setIsAddingRace(true)}
              className="px-4 py-2 rounded-2xl mat-fab-primary text-xs font-bold flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>+ Nuovo Report Gara</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {raceReports.map((race) => (
              <div
                key={race.id}
                className="glass-panel p-5 rounded-3xl space-y-4 hover:border-amber-500/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <span className="text-xs font-mono text-amber-400 font-bold flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {race.date}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        Voto: {race.performanceRating}/10
                      </span>
                      <button
                        onClick={() => onDeleteRaceReport(race.id)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <h4 className="text-lg font-bold text-white mt-3">{race.name}</h4>

                  {/* Race stats row */}
                  <div className="mt-3 grid grid-cols-3 gap-2 p-3 rounded-2xl bg-black/40 border border-white/5 font-mono text-center text-xs">
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase">Distanza</span>
                      <span className="font-extrabold text-white text-sm">{race.distanceKm} km</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-cyan-400 block uppercase">Tempo</span>
                      <span className="font-extrabold text-cyan-300 text-sm">{race.finishTime}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-emerald-400 block uppercase">Passo Medio</span>
                      <span className="font-extrabold text-emerald-300 text-sm">{race.averagePace}</span>
                    </div>
                  </div>

                  {/* Fueling strategy */}
                  {race.fuelingStrategy && (
                    <div className="mt-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                      <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold mb-0.5">
                        Strategia di Fueling & Idratazione:
                      </span>
                      <p className="text-slate-300">{race.fuelingStrategy}</p>
                    </div>
                  )}

                  {race.notes && (
                    <p className="mt-2 text-xs text-slate-400 italic">
                      &ldquo;{race.notes}&rdquo;
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Freq. Cardiaca Media:</span>
                  <span className="font-bold text-rose-400 flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5 fill-rose-500/20" />
                    {race.averageHr || 170} bpm
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Modal: Add Race Report */}
          {isAddingRace && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
              <div className="w-full max-w-lg rounded-3xl glass-panel-elevated p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-amber-400" />
                    <h3 className="text-base font-bold text-white">Nuovo Report Gara</h3>
                  </div>
                  <button onClick={() => setIsAddingRace(false)} className="p-1 rounded-full text-slate-400 hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveRace} className="space-y-3.5 text-xs">
                  <div>
                    <label className="text-slate-300 block mb-1 font-medium">Nome della Gara o Test</label>
                    <input
                      type="text"
                      required
                      placeholder="Es. Mezza Maratona di Milano, 10k PB Test..."
                      value={raceName}
                      onChange={(e) => setRaceName(e.target.value)}
                      className="w-full glass-panel px-3.5 py-2.5 rounded-xl text-xs text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-300 block mb-1 font-medium">Data</label>
                      <input
                        type="date"
                        value={raceDate}
                        onChange={(e) => setRaceDate(e.target.value)}
                        className="w-full glass-panel px-3 py-2 rounded-xl text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 block mb-1 font-medium">Distanza (km)</label>
                      <input
                        type="number"
                        step={0.1}
                        value={raceDistanceKm}
                        onChange={(e) => setRaceDistanceKm(Number(e.target.value))}
                        className="w-full glass-panel px-3 py-2 rounded-xl text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-slate-300 block mb-1 font-medium">Tempo Finale</label>
                      <input
                        type="text"
                        placeholder="1:28:30"
                        value={raceTime}
                        onChange={(e) => setRaceTime(e.target.value)}
                        className="w-full glass-panel px-3 py-2 rounded-xl text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 block mb-1 font-medium">Passo Medio</label>
                      <input
                        type="text"
                        placeholder="4:11/km"
                        value={racePace}
                        onChange={(e) => setRacePace(e.target.value)}
                        className="w-full glass-panel px-3 py-2 rounded-xl text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 block mb-1 font-medium">FC Media</label>
                      <input
                        type="number"
                        value={raceHr}
                        onChange={(e) => setRaceHr(Number(e.target.value))}
                        className="w-full glass-panel px-3 py-2 rounded-xl text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1 font-medium">Strategia di Fueling (Gel, Acqua, Sodio)</label>
                    <input
                      type="text"
                      placeholder="Es. Gel maltodestrine ogni 35 min + 150ml acqua con elettroliti"
                      value={raceFueling}
                      onChange={(e) => setRaceFueling(e.target.value)}
                      className="w-full glass-panel px-3 py-2 rounded-xl text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1 font-medium">Voto Prestazione (1-10)</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={raceRating}
                      onChange={(e) => setRaceRating(Number(e.target.value))}
                      className="w-full glass-panel px-3 py-2 rounded-xl text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1 font-medium">Note & Sensazioni</label>
                    <textarea
                      rows={2}
                      placeholder="Es. Gambe brillanti fino al km 16, poi leggero calo di cadenza..."
                      value={raceNotes}
                      onChange={(e) => setRaceNotes(e.target.value)}
                      className="w-full glass-panel p-2.5 rounded-xl text-xs text-white"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setIsAddingRace(false)}
                      className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                    >
                      Annulla
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-2xl mat-fab-primary text-xs font-bold"
                    >
                      Salva Report Gara
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: CULINARY HABITS & TOP FOODS */}
      {subTab === "culinary" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Foods */}
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-white/5">
              <BarChart3 className="h-5 w-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Alimenti Più Consumati</h3>
            </div>

            <div className="space-y-3">
              {topFoods.map((item, idx) => (
                <div
                  key={item.food.id}
                  className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold flex items-center justify-center text-xs">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-white">{item.food.name}</span>
                      <span className="text-[10px] font-mono text-cyan-400 block uppercase">
                        {item.food.category} &middot; {item.food.kcal} kcal/100g
                      </span>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <span className="font-extrabold text-emerald-400 text-sm">{item.count} volte</span>
                    <span className="text-[10px] text-slate-400 block">{item.totalGrams}g totali</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Recipes */}
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-white/5">
              <UtensilsCrossed className="h-5 w-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white">Ricette Più Cucinate</h3>
            </div>

            <div className="space-y-3">
              {topRecipes.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 font-mono">
                  Nessuna ricetta inserita nei meal plan di recente. Crea ricette nel Ricettario!
                </div>
              ) : (
                topRecipes.map((item, idx) => (
                  <div
                    key={item.recipe.id}
                    className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold flex items-center justify-center text-xs">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="font-bold text-white">{item.recipe.name}</span>
                        <span className="text-[10px] font-mono text-slate-400 block">
                          {item.recipe.kcalPerServing} kcal &middot; P:{item.recipe.proteinPerServing}g
                        </span>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <span className="font-extrabold text-cyan-300 text-sm">{item.count} preparazioni</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: RETROACTIVE CHECK-IN EDITOR */}
      {subTab === "checkin" && (
        <div className="max-w-2xl mx-auto glass-panel p-6 rounded-3xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Check-in Fisico & Recupero</h3>
            </div>
            {saveSuccess && (
              <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1">
                <Check className="h-4 w-4" /> Salvato!
              </span>
            )}
          </div>

          <p className="text-xs text-slate-300">
            Puoi compilare o modificare il check-in di oggi o di qualsiasi giorno passato selezionando la data:
          </p>

          {/* Quick Date Selectors (Material 2027 Chips) */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { label: "Oggi", val: getRelativeDate(0) },
              { label: "Ieri", val: getRelativeDate(1) },
              { label: "-2 giorni", val: getRelativeDate(2) },
              { label: "-3 giorni", val: getRelativeDate(3) },
              { label: "-7 giorni", val: getRelativeDate(7) },
            ].map((p) => (
              <button
                key={p.label}
                onClick={() => handleSelectCheckInDate(p.val)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  checkInDate === p.val
                    ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/50 font-bold"
                    : "glass-pill text-slate-400 hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}

            <input
              type="date"
              value={checkInDate}
              onChange={(e) => handleSelectCheckInDate(e.target.value)}
              className="glass-panel px-3 py-1 rounded-xl text-xs text-white font-mono"
            />
          </div>

          {/* Check-in fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-300 block mb-1">Peso Mattutino (kg)</label>
              <input
                type="number"
                step={0.1}
                value={editWeight}
                onChange={(e) => setEditWeight(Number(e.target.value))}
                className="w-full glass-panel px-3.5 py-2.5 rounded-xl text-xs text-white font-mono font-bold"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 block mb-1">Freq. a Riposo (RHR)</label>
              <input
                type="number"
                value={editRhr}
                onChange={(e) => setEditRhr(Number(e.target.value))}
                className="w-full glass-panel px-3.5 py-2.5 rounded-xl text-xs text-white font-mono font-bold"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 block mb-1">HRV (ms)</label>
              <input
                type="number"
                value={editHrv}
                onChange={(e) => setEditHrv(Number(e.target.value))}
                className="w-full glass-panel px-3.5 py-2.5 rounded-xl text-xs text-white font-mono font-bold text-cyan-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-300 block mb-1">Ore Sonno: {editSleep}h</label>
              <input
                type="range"
                min={4}
                max={11}
                step={0.5}
                value={editSleep}
                onChange={(e) => setEditSleep(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 block mb-1">DOMS Muscolari: {editDoms}/5</label>
              <input
                type="range"
                min={1}
                max={5}
                value={editDoms}
                onChange={(e) => setEditDoms(Number(e.target.value))}
                className="w-full accent-amber-400"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 block mb-1">Fatica Gambe: {editLegFatigue}/5</label>
              <input
                type="range"
                min={1}
                max={5}
                value={editLegFatigue}
                onChange={(e) => setEditLegFatigue(Number(e.target.value))}
                className="w-full accent-rose-400"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-300 block mb-1">Note Fisiche o Sensazioni di Recupero</label>
            <textarea
              rows={2}
              placeholder="Es. Leggera pesantezza ai polpacci post corsa..."
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="w-full glass-panel p-3 rounded-xl text-xs text-white placeholder-slate-500"
            />
          </div>

          <button
            onClick={handleSaveCheckIn}
            className="w-full py-3 rounded-2xl mat-fab-primary text-xs font-bold transition-all"
          >
            Salva Check-in ({checkInDate})
          </button>
        </div>
      )}
    </div>
  );
}
