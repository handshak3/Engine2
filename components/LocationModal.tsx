"use client";

import React, { useState } from "react";
import { Search, MapPin, X, Loader2, Check } from "lucide-react";
import { searchLocations, GeocodingResult } from "@/lib/weather";

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocationName: string;
  onSelectLocation: (name: string, lat: number, lon: number) => void;
}

export default function LocationModal({
  isOpen,
  onClose,
  currentLocationName,
  onSelectLocation,
}: LocationModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await searchLocations(query.trim());
      setResults(res);
      if (res.length === 0) {
        setError("Nessuna località trovata. Prova con un'altra città.");
      }
    } catch {
      setError("Errore nella ricerca della località");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseBrowserLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocalizzazione non supportata dal browser");
      return;
    }
    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        onSelectLocation("Posizione Attuale GPS", latitude, longitude);
        setIsLoading(false);
        onClose();
      },
      () => {
        setError("Accesso alla posizione negato o non disponibile");
        setIsLoading(false);
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-emerald-400" />
            <h3 className="text-lg font-semibold text-white">Cambia Località</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="my-4 text-xs text-slate-400">
          Località attuale: <span className="font-semibold text-emerald-400">{currentLocationName}</span>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cerca città (es. Milano, Roma, Monza)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/80 pl-9 pr-3 py-2 text-sm text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cerca"}
          </button>
        </form>

        <button
          type="button"
          onClick={handleUseBrowserLocation}
          className="w-full mb-4 flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 py-2.5 text-xs font-medium text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <MapPin className="h-4 w-4 text-cyan-400" />
          Usa posizione GPS del dispositivo
        </button>

        {error && <div className="text-xs text-rose-400 mb-3">{error}</div>}

        <div className="max-h-60 overflow-y-auto space-y-1.5">
          {results.map((loc, idx) => (
            <button
              key={idx}
              onClick={() => {
                onSelectLocation(loc.name, loc.latitude, loc.longitude);
                onClose();
              }}
              className="w-full flex items-center justify-between rounded-lg border border-slate-800 bg-slate-800/40 px-3 py-2.5 text-left text-xs text-slate-200 hover:border-emerald-500 hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{loc.name}</span>
              </div>
              <Check className="h-4 w-4 text-emerald-400 opacity-0 group-hover:opacity-100" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
