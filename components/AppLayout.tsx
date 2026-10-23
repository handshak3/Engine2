"use client";

import React, { useState } from "react";
import {
  Dumbbell,
  UtensilsCrossed,
  Package,
  Sliders,
  Trophy,
  Settings,
  ChevronLeft,
  ChevronRight,
  CloudRain,
  Sun,
  MapPin,
  Footprints,
  BookOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { UserSettings } from "@/lib/types";
import { WorkoutWeatherCheck } from "@/lib/weather";
import LocationModal from "./LocationModal";
import SettingsModal from "./SettingsModal";

export type NavTab = "workouts" | "nutrition" | "recipes" | "pantry" | "calculators" | "reports";

interface AppLayoutProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  settings: UserSettings;
  onUpdateSettings: (s: UserSettings) => void;
  weather: WorkoutWeatherCheck | null;
  onRefreshWeather: () => void;
  onLocationChange: (name: string, lat: number, lon: number) => void;
  scheduledTime: string;
  onTimeChange: (time: string) => void;
  children: React.ReactNode;
}

export default function AppLayout({
  activeTab,
  onTabChange,
  settings,
  onUpdateSettings,
  weather,
  onLocationChange,
  children,
}: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(
    settings.desktopSidebarCollapsed || false
  );
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const toggleSidebar = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    onUpdateSettings({ ...settings, desktopSidebarCollapsed: next });
  };

  const navItems = [
    { id: "workouts", label: "Allenamento", icon: Dumbbell, accent: "emerald" },
    { id: "nutrition", label: "Meal Plan", icon: UtensilsCrossed, accent: "emerald" },
    { id: "recipes", label: "Ricettario", icon: BookOpen, accent: "cyan" },
    { id: "pantry", label: "Dispensa & Spesa", icon: Package, accent: "amber" },
    { id: "calculators", label: "Calcolatori & Tools", icon: Sliders, accent: "indigo" },
    { id: "reports", label: "Report & Check-In", icon: Trophy, accent: "purple" },
  ] as const;

  return (
    <div className="min-h-screen bg-[#040711] text-slate-100 flex flex-col md:flex-row antialiased selection:bg-emerald-500 selection:text-white relative">
      {/* SIDEBAR NAVIGATION (Desktop & Tablet) - Material 2027 x Apple Frosted Glass */}
      <aside
        className={`hidden md:flex flex-col glass-panel sticky top-0 h-screen transition-all duration-300 z-30 shrink-0 m-3 rounded-3xl ${
          sidebarCollapsed ? "w-[72px]" : "w-[250px]"
        }`}
      >
        {/* Brand & Collapse Button */}
        <div className="h-20 flex items-center justify-between px-4 border-b border-white/[0.06]">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 flex items-center justify-center font-black text-black text-lg shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                E
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-white font-sans flex items-center gap-0.5">
                  ENGINE<span className="text-emerald-400">.</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono tracking-wider block">HYBRID OS</span>
              </div>
            </div>
          ) : (
            <div className="mx-auto h-10 w-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 flex items-center justify-center font-black text-black text-lg shadow-[0_0_20px_rgba(16,185,129,0.4)]">
              E
            </div>
          )}

          {/* Sidebar Collapse Toggle */}
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-xl text-slate-400 hover:bg-white/[0.08] hover:text-white transition-all active:scale-95"
            title={sidebarCollapsed ? "Espandi menu" : "Comprimi menu"}
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-4 px-2.5 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all relative group ${
                  isActive
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-[0_4px_20px_rgba(16,185,129,0.35)] border border-white/20"
                    : "text-slate-400 hover:bg-white/[0.06] hover:text-slate-100 border border-transparent"
                } ${sidebarCollapsed ? "justify-center px-0" : ""}`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? "text-white" : "text-slate-400 group-hover:text-emerald-400"
                  }`}
                />
                {!sidebarCollapsed && <span className="truncate tracking-tight">{item.label}</span>}

                {/* Subtle active glow dot on right */}
                {isActive && !sidebarCollapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Settings Card */}
        <div className="p-3 border-t border-white/[0.06]">
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className={`w-full flex items-center gap-3 p-3 rounded-2xl text-xs font-medium text-slate-400 hover:bg-white/[0.06] hover:text-white transition-all active:scale-95 ${
              sidebarCollapsed ? "justify-center p-2.5" : ""
            }`}
            title="Impostazioni & Profilo"
          >
            <Settings className="h-4 w-4 shrink-0 text-slate-400" />
            {!sidebarCollapsed && <span className="font-semibold">Impostazioni</span>}
          </button>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION - Apple VisionOS Floating Pill */}
      <div className="md:hidden fixed bottom-3 left-4 right-4 z-40 glass-panel-elevated rounded-3xl p-1.5 flex justify-around shadow-2xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center py-1.5 px-2 rounded-2xl text-[10px] font-medium transition-all ${
                isActive ? "text-emerald-400 bg-white/[0.08] shadow-sm font-bold scale-105" : "text-slate-400"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="truncate max-w-[55px] mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
        {/* TOP BAR CONTRACT: Apple Dynamic Island Floating Header */}
        <header className="h-16 px-4 md:px-8 sticky top-3 z-20 flex items-center justify-between gap-4 mx-3 my-2 glass-panel rounded-2xl">
          {/* Zone 1: Location Badge with Apple Precision */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsLocationModalOpen(true)}
              className="flex items-center gap-2 text-xs font-semibold text-slate-200 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-emerald-500/60 hover:bg-white/[0.08] transition-all shrink-0 active:scale-95"
              title="Cambia località"
            >
              <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span className="truncate max-w-[130px] sm:max-w-[200px]">
                {settings.currentLocationName || "Località"}
              </span>
              <span className="text-[10px] text-emerald-400/80 font-mono underline ml-0.5">Modifica</span>
            </button>
          </div>

          {/* Zone 2: Weather Rain & Temperature Pill */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono">
            {weather ? (
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition-all shadow-sm ${
                  weather.willRain
                    ? "border-amber-500/40 bg-amber-950/40 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                    : "border-white/[0.08] bg-white/[0.04] text-slate-200"
                }`}
                title={weather.verdictMessage}
              >
                {weather.willRain ? (
                  <CloudRain className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                ) : (
                  <Sun className="h-3.5 w-3.5 text-emerald-400" />
                )}
                <span className="font-semibold text-white">
                  {weather.targetHourFormatted}: {weather.tempC}°C
                </span>
                <span className="text-slate-400">
                  &middot; {weather.rainProbability}% pioggia ({weather.rainMm}mm)
                </span>
              </div>
            ) : null}
          </div>

          {/* Zone 3: Daily Steps & Settings Profile Action */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Steps Badge from intervals.icu */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-slate-300 shadow-sm">
              <Footprints className="h-3.5 w-3.5 text-emerald-400" />
              <span className="font-bold text-white tracking-tight">
                {settings.intervalsDailySteps ? settings.intervalsDailySteps.toLocaleString("it-IT") : "8.450"}
              </span>
              <span className="text-[10px] text-slate-500">passi</span>
            </div>

            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-2 rounded-xl border border-white/[0.08] bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] hover:border-emerald-500/50 transition-all active:scale-95"
              title="Apri Impostazioni"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Content Area with Apple Motion transitions */}
        <main className="p-3 md:p-6 max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.995 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* LOCATION MODAL */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentLocationName={settings.currentLocationName}
        onSelectLocation={onLocationChange}
      />

      {/* SETTINGS MODAL */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={onUpdateSettings}
      />
    </div>
  );
}
