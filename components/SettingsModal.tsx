"use client";

import React, { useState } from "react";
import { UserSettings } from "@/lib/types";
import {
  Settings,
  X,
  User,
  Heart,
  Activity,
  Sliders,
  DollarSign,
  Key,
  Flame,
  Check,
} from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSaveSettings: (newSettings: UserSettings) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}: SettingsModalProps) {
  const [formData, setFormData] = useState<UserSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Impostazioni Atleta & Nutrizione</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-6 my-4 pr-1 text-xs">
          {/* Section 1: Athlete Biometrics */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
              <User className="h-4 w-4 text-emerald-400" />
              <span>Parametri Biometrici</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Peso (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.athleteWeightKg}
                  onChange={(e) => setFormData({ ...formData, athleteWeightKg: Number(e.target.value) })}
                  className="w-full rounded border border-slate-700 bg-slate-800 p-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Altezza (cm)</label>
                <input
                  type="number"
                  value={formData.athleteHeightCm}
                  onChange={(e) => setFormData({ ...formData, athleteHeightCm: Number(e.target.value) })}
                  className="w-full rounded border border-slate-700 bg-slate-800 p-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Età</label>
                <input
                  type="number"
                  value={formData.athleteAge}
                  onChange={(e) => setFormData({ ...formData, athleteAge: Number(e.target.value) })}
                  className="w-full rounded border border-slate-700 bg-slate-800 p-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">% Massa Grassa (BF)</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.bodyFatPercentage || 12}
                  onChange={(e) => setFormData({ ...formData, bodyFatPercentage: Number(e.target.value) })}
                  className="w-full rounded border border-slate-700 bg-slate-800 p-2 text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Nutrition Standard & Macro-Cycling (User Choice: tutto disattivabile e settabile) */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
              <Heart className="h-4 w-4 text-rose-400" />
              <span>Standard Nutrizionale Gold Standard & Macro-Cycling</span>
            </h4>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <div>
                <span className="font-semibold text-white block">Formula Mifflin-St Jeor Dinamica:</span>
                <span className="text-[11px] text-slate-400">
                  Calcola BMR e TDEE in base all&apos;attività reale da intervals.icu.
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.useMifflinStJeor}
                onChange={(e) => setFormData({ ...formData, useMifflinStJeor: e.target.checked })}
                className="h-4 w-4 rounded border-slate-700 text-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <div>
                <span className="font-semibold text-white block">Macro-Cycling Dinamico Attivo:</span>
                <span className="text-[11px] text-slate-400">
                  Alza i carboidrati nei giorni di corsa lunga e adegua le proteine nei giorni di forza.
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.macroCyclingEnabled}
                onChange={(e) => setFormData({ ...formData, macroCyclingEnabled: e.target.checked })}
                className="h-4 w-4 rounded border-slate-700 text-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Carboidrati Running Day (g/kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.runningDayCarbsPerKg}
                  onChange={(e) => setFormData({ ...formData, runningDayCarbsPerKg: Number(e.target.value) })}
                  className="w-full rounded border border-slate-700 bg-slate-800 p-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Carboidrati Strength Day (g/kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.strengthDayCarbsPerKg}
                  onChange={(e) => setFormData({ ...formData, strengthDayCarbsPerKg: Number(e.target.value) })}
                  className="w-full rounded border border-slate-700 bg-slate-800 p-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Proteine Target (g/kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.proteinPerKg}
                  onChange={(e) => setFormData({ ...formData, proteinPerKg: Number(e.target.value) })}
                  className="w-full rounded border border-slate-700 bg-slate-800 p-2 text-white font-mono"
                />
              </div>
            </div>

            {/* Sodium & Salt target */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              <div>
                <label className="text-slate-400 block mb-1">Sodio Base Giornaliero (mg)</label>
                <input
                  type="number"
                  value={formData.targetSodiumMgBase}
                  onChange={(e) => setFormData({ ...formData, targetSodiumMgBase: Number(e.target.value) })}
                  className="w-full rounded border border-slate-700 bg-slate-800 p-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Sodio per ora di sudorazione (mg/ora)</label>
                <input
                  type="number"
                  value={formData.sodiumPerSweatHourMg}
                  onChange={(e) => setFormData({ ...formData, sodiumPerSweatHourMg: Number(e.target.value) })}
                  className="w-full rounded border border-slate-700 bg-slate-800 p-2 text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Goals (Weekly km, NEAT, Steps) */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-cyan-400" />
              <span>Obiettivi Running & Attività Giornaliera (NEAT / Passi)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Obiettivo Km Corsa Settimanale</label>
                <input
                  type="number"
                  value={formData.weeklyKmGoal}
                  onChange={(e) => setFormData({ ...formData, weeklyKmGoal: Number(e.target.value) })}
                  className="w-full rounded border border-slate-700 bg-slate-800 p-2 text-white font-mono"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-400">Target Passi</label>
                  <input
                    type="checkbox"
                    checked={formData.stepGoalEnabled}
                    onChange={(e) => setFormData({ ...formData, stepGoalEnabled: e.target.checked })}
                    className="rounded text-emerald-500"
                  />
                </div>
                <input
                  type="number"
                  value={formData.dailyStepGoal}
                  onChange={(e) => setFormData({ ...formData, dailyStepGoal: Number(e.target.value) })}
                  disabled={!formData.stepGoalEnabled}
                  className="w-full rounded border border-slate-700 bg-slate-800 p-2 text-white font-mono disabled:opacity-50"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-400">Target NEAT (kcal)</label>
                  <input
                    type="checkbox"
                    checked={formData.neatGoalEnabled}
                    onChange={(e) => setFormData({ ...formData, neatGoalEnabled: e.target.checked })}
                    className="rounded text-emerald-500"
                  />
                </div>
                <input
                  type="number"
                  value={formData.dailyNeatGoalKcal}
                  onChange={(e) => setFormData({ ...formData, dailyNeatGoalKcal: Number(e.target.value) })}
                  disabled={!formData.neatGoalEnabled}
                  className="w-full rounded border border-slate-700 bg-slate-800 p-2 text-white font-mono disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Section 4: intervals.icu API Configuration */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
              <Key className="h-4 w-4 text-amber-400" />
              <span>Connessione intervals.icu</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">API Key</label>
                <input
                  type="password"
                  placeholder="Inserisci chiave API intervals.icu..."
                  value={formData.intervalsApiKey || ""}
                  onChange={(e) => setFormData({ ...formData, intervalsApiKey: e.target.value })}
                  className="w-full rounded border border-slate-700 bg-slate-800 p-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Athlete ID (default: 0)</label>
                <input
                  type="text"
                  placeholder="0 oppure id atleta"
                  value={formData.intervalsAthleteId || "0"}
                  onChange={(e) => setFormData({ ...formData, intervalsAthleteId: e.target.value })}
                  className="w-full rounded border border-slate-700 bg-slate-800 p-2 text-white font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-500 shadow"
            >
              {savedSuccess ? <Check className="h-4 w-4" /> : null}
              <span>{savedSuccess ? "Salvato!" : "Salva Impostazioni"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
