"use client";

import React, { useState } from "react";
import { CloudRain, Sun, Clock, MapPin, Umbrella, RefreshCw } from "lucide-react";
import { WorkoutWeatherCheck } from "@/lib/weather";

interface WeatherWidgetProps {
  weather: WorkoutWeatherCheck | null;
  scheduledTime: string;
  onTimeChange: (newTime: string) => void;
  onOpenLocationModal: () => void;
  onRefreshWeather: () => void;
  isLoading?: boolean;
}

export default function WeatherWidget({
  weather,
  scheduledTime,
  onTimeChange,
  onOpenLocationModal,
  onRefreshWeather,
  isLoading = false,
}: WeatherWidgetProps) {
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [tempTime, setTempTime] = useState(scheduledTime);

  if (!weather) return null;

  const handleSaveTime = () => {
    onTimeChange(tempTime);
    setIsEditingTime(false);
  };

  return (
    <div className="rounded-3xl glass-panel p-6 shadow-2xl relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar: Location and Scheduled workout time */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/[0.06] relative z-10">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenLocationModal}
            className="flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/[0.08] px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:border-emerald-500/50 hover:bg-white/[0.08] transition-all active:scale-95 shadow-sm"
            title="Cambia località"
          >
            <MapPin className="h-3.5 w-3.5 text-emerald-400" />
            <span className="truncate max-w-[170px] sm:max-w-[240px]">{weather.locationName}</span>
            <span className="text-[10px] text-emerald-400 font-mono underline ml-1">Modifica</span>
          </button>

          <button
            onClick={onRefreshWeather}
            disabled={isLoading}
            className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-2 text-slate-400 hover:bg-white/[0.08] hover:text-white transition-all active:scale-95"
            title="Aggiorna meteo"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-emerald-400" : ""}`} />
          </button>
        </div>

        {/* Workout hour control */}
        <div className="flex items-center gap-2.5 bg-white/[0.03] border border-white/[0.06] px-3 py-1.5 rounded-2xl">
          <Clock className="h-4 w-4 text-cyan-400" />
          <span className="text-xs text-slate-400 font-medium">Orario allenamento:</span>
          {isEditingTime ? (
            <div className="flex items-center gap-1.5">
              <input
                type="time"
                value={tempTime}
                onChange={(e) => setTempTime(e.target.value)}
                className="rounded-lg border border-emerald-500/80 bg-slate-900 px-2 py-0.5 text-xs font-mono text-white focus:outline-none"
              />
              <button
                onClick={handleSaveTime}
                className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-500 transition-all shadow-sm"
              >
                Salva
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setTempTime(scheduledTime);
                setIsEditingTime(true);
              }}
              className="flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-white/[0.06] px-3 py-1 text-xs font-mono font-bold text-cyan-300 hover:border-cyan-400 hover:bg-white/[0.1] transition-all active:scale-95 shadow-sm"
            >
              <span>{weather.targetHourFormatted}</span>
              <span className="text-[10px] text-slate-400">✎</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Verdict Card - Cupertino Dynamic Status */}
      <div
        className={`mt-5 rounded-2xl p-5 border transition-all relative z-10 shadow-lg ${
          weather.willRain
            ? weather.rainSeverity === "heavy"
              ? "border-rose-500/40 bg-gradient-to-r from-rose-950/40 to-slate-900/40 text-rose-100 shadow-[0_4px_24px_rgba(244,63,94,0.15)]"
              : "border-amber-500/40 bg-gradient-to-r from-amber-950/40 to-slate-900/40 text-amber-100 shadow-[0_4px_24px_rgba(245,158,11,0.15)]"
            : "border-emerald-500/40 bg-gradient-to-r from-emerald-950/30 to-slate-900/30 text-emerald-100 shadow-[0_4px_24px_rgba(16,185,129,0.12)]"
        }`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-2xl border ${
              weather.willRain
                ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
            }`}
          >
            {weather.willRain ? (
              <Umbrella className="h-6 w-6 shrink-0" />
            ) : (
              <Sun className="h-6 w-6 shrink-0" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2.5 font-bold text-sm">
              <span className="tracking-tight">
                {weather.willRain ? "Rischio Pioggia Rilevato" : "Condizioni Ottimali per l'Uscita"}
              </span>
              <span className="text-xs font-mono font-medium text-slate-300 bg-white/[0.08] px-2.5 py-0.5 rounded-full border border-white/[0.06]">
                {weather.tempC}°C &middot; {weather.rainProbability}% prob. ({weather.rainMm} mm)
              </span>
            </div>
            <p className="mt-1.5 text-xs text-slate-300 leading-relaxed font-normal">
              {weather.verdictMessage}
            </p>

            {weather.suggestedAlternativeHour && (
              <div className="mt-3">
                <button
                  onClick={() => onTimeChange(weather.suggestedAlternativeHour!)}
                  className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:opacity-95 transition-all shadow-[0_2px_12px_rgba(16,185,129,0.3)] active:scale-95"
                >
                  Sposta allenamento alle {weather.suggestedAlternativeHour}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hourly Rain & Temp Chart - Apple Weather Curve */}
      <div className="mt-6 relative z-10">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-3 px-1">
          <span className="font-medium">Previsioni orarie (fai clic su un&apos;ora per impostarla):</span>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span className="flex items-center gap-1.5 text-cyan-300">
              <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-t from-cyan-600 to-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.4)]"></span>
              Pioggia %
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full border-2 border-emerald-400"></span>
              Orario Allenamento
            </span>
          </div>
        </div>

        {/* Scrollable hourly bars with glass elevation */}
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-2 min-w-[760px] h-36 items-end pt-4 px-2">
            {weather.hourlyPoints.map((point) => {
              const barHeightPct = Math.max(10, point.rainProbability);
              const isWo = point.isWorkoutHour;

              return (
                <button
                  key={point.hour}
                  onClick={() => onTimeChange(`${String(point.hour).padStart(2, "0")}:00`)}
                  className={`group relative flex-1 flex flex-col items-center justify-end rounded-2xl p-1.5 transition-all duration-200 active:scale-95 ${
                    isWo
                      ? "bg-white/[0.09] ring-2 ring-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)]"
                      : "hover:bg-white/[0.05]"
                  }`}
                  title={`${point.hour}:00 - ${point.weatherDescription}, ${point.tempC}°C, Pioggia: ${point.rainProbability}% (${point.rainMm}mm)`}
                >
                  {/* Rain Icon */}
                  {point.rainProbability >= 40 && (
                    <CloudRain className="h-3.5 w-3.5 text-cyan-400 mb-1 animate-bounce" />
                  )}

                  {/* Temperature */}
                  <span className="text-[10px] font-mono font-semibold text-slate-300 mb-1.5 group-hover:text-white">
                    {point.tempC}°
                  </span>

                  {/* Rain Bar with Material 2027 Gradient */}
                  <div className="w-full bg-slate-800/60 rounded-xl overflow-hidden flex flex-col justify-end h-20 p-0.5">
                    <div
                      style={{ height: `${barHeightPct}%` }}
                      className={`w-full rounded-lg transition-all ${
                        point.rainProbability >= 60
                          ? "bg-gradient-to-t from-rose-600 to-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.4)]"
                          : point.rainProbability >= 30
                          ? "bg-gradient-to-t from-amber-600 to-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                          : "bg-gradient-to-t from-cyan-600/80 to-cyan-400/80 shadow-[0_0_8px_rgba(6,182,212,0.2)]"
                      }`}
                    />
                  </div>

                  {/* Hour label */}
                  <span
                    className={`mt-2 text-[10px] font-mono ${
                      isWo ? "font-bold text-emerald-400 scale-110" : "text-slate-400"
                    }`}
                  >
                    {String(point.hour).padStart(2, "0")}h
                  </span>

                  {/* Rain mm */}
                  <span className="text-[9px] font-mono font-semibold text-cyan-300 h-3">
                    {point.rainMm > 0 ? `${point.rainMm}m` : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
