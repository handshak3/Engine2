"use client";

import React, { useState } from "react";
import {
  DayMealPlan,
  MealItemPortion,
  FoodItem,
  Recipe,
  UserSettings,
} from "@/lib/types";
import {
  calculateWheySupplementation,
} from "@/lib/nutrition";
import {
  Calendar,
  Sparkles,
  ArrowLeftRight,
  Plus,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  UtensilsCrossed,
  Package,
  X,
  AlertCircle,
  TrendingUp,
  Loader2,
} from "lucide-react";

let idCounter = 1;
function makeId(prefix: string) {
  return `${prefix}-${idCounter++}`;
}

interface MealPlanViewProps {
  mealPlans: Record<string, DayMealPlan>;
  foods: FoodItem[];
  recipes: Recipe[];
  settings: UserSettings;
  onUpdateMealPlan: (date: string, plan: DayMealPlan) => void;
  onUpdateFood: (food: FoodItem) => void;
  onOpenRecipeModal: () => void;
}

export default function MealPlanView({
  mealPlans,
  foods,
  recipes,
  settings,
  onUpdateMealPlan,
  onUpdateFood,
}: MealPlanViewProps) {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [viewMode, setViewMode] = useState<"day" | "week">("week");

  // Modal for adding items
  const [activeMealType, setActiveMealType] = useState<"breakfast" | "lunch" | "snack" | "dinner" | null>(null);
  const [foodCategoryFilter, setFoodCategoryFilter] = useState<string>("all");
  const [onlyPantryFilter, setOnlyPantryFilter] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [customGrams, setCustomGrams] = useState(100);

  // Quick edit food in storage modal
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null);
  const [editPrice, setEditPrice] = useState(0);
  const [editQty, setEditQty] = useState(0);

  // AI Meal Planner dialog
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiSpendLevel, setAiSpendLevel] = useState<"economic" | "normal" | "expensive">(settings.defaultSpendLevel || "normal");
  const [aiZeroWaste, setAiZeroWaste] = useState(settings.zeroWastePantryDefault !== false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Drag and drop state for desktop
  const [draggedItem, setDraggedItem] = useState<{
    fromDate: string;
    fromMealType: string;
    item: MealItemPortion;
  } | null>(null);

  // Current day meal plan
  const currentPlan: DayMealPlan = mealPlans[selectedDate] || {
    date: selectedDate,
    targetKcal: 2600,
    targetProtein: 160,
    targetCarbs: 320,
    targetFat: 70,
    targetSodiumMg: 2500,
    meals: [
      { id: "m-1", type: "breakfast", label: "Colazione", items: [] },
      { id: "m-2", type: "lunch", label: "Pranzo", items: [] },
      { id: "m-3", type: "snack", label: "Spuntino", items: [] },
      { id: "m-4", type: "dinner", label: "Cena", items: [] },
    ],
  };

  // Compute total macros for current day
  const allItems = currentPlan.meals.flatMap((m) => m.items);
  const currentTotalKcal = allItems.reduce((acc, i) => acc + i.kcal, 0);
  const currentTotalProtein = allItems.reduce((acc, i) => acc + i.protein, 0);
  const currentTotalCarbs = allItems.reduce((acc, i) => acc + i.carbs, 0);
  const currentTotalFat = allItems.reduce((acc, i) => acc + i.fat, 0);
  const currentTotalSodium = allItems.reduce((acc, i) => acc + (i.sodiumMg || 0), 0);
  const currentDayCost = allItems.reduce((acc, i) => acc + (i.priceEuro || 0), 0);

  // Calculate 7-day week window based on selectedDate
  const curr = new Date(selectedDate);
  const dayOfWeek = (curr.getDay() + 6) % 7; // Monday = 0
  const monday = new Date(curr);
  monday.setDate(curr.getDate() - dayOfWeek);

  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    weekDates.push(d.toISOString().slice(0, 10));
  }

  // Weekly expense stats
  const weeklyTotalCost = weekDates.reduce((sum, dt) => {
    const p = mealPlans[dt];
    if (!p) return sum;
    const dayItems = p.meals.flatMap((m) => m.items);
    return sum + dayItems.reduce((s, it) => s + (it.priceEuro || 0), 0);
  }, 0);
  const weeklyAverageDailyCost = Math.round((weeklyTotalCost / 7) * 100) / 100;

  // Whey supplementation calculation
  const wheyCheck = calculateWheySupplementation(
    currentTotalProtein,
    currentPlan.targetProtein,
    settings.wheyProteinPerScoopGrams || 25
  );

  // SWAP LUNCH WITH DINNER
  const handleSwapLunchDinner = (date: string) => {
    const plan = mealPlans[date] || currentPlan;
    const lunchIndex = plan.meals.findIndex((m) => m.type === "lunch");
    const dinnerIndex = plan.meals.findIndex((m) => m.type === "dinner");

    if (lunchIndex >= 0 && dinnerIndex >= 0) {
      const newMeals = [...plan.meals];
      const tempItems = newMeals[lunchIndex].items;
      newMeals[lunchIndex] = { ...newMeals[lunchIndex], items: newMeals[dinnerIndex].items };
      newMeals[dinnerIndex] = { ...newMeals[dinnerIndex], items: tempItems };

      const updated = { ...plan, meals: newMeals };
      onUpdateMealPlan(date, updated);
    }
  };

  // AUTO INTEGRATE WHEY
  const handleAutoAddWhey = () => {
    if (!wheyCheck.needed) return;

    let wheyFood = foods.find((f) => /whey|proteine in polvere/i.test(f.name));
    if (!wheyFood) {
      wheyFood = foods.find((f) => f.category === "proteico") || foods[0];
    }

    const grams = wheyCheck.gramsToAdd || 30;
    const portion: MealItemPortion = {
      id: makeId("whey-auto"),
      type: "food",
      targetId: wheyFood.id,
      name: `${wheyFood.name} (${wheyCheck.scoops} scoop)`,
      amountGrams: grams,
      kcal: Math.round((wheyFood.kcal * grams) / 100),
      protein: Math.round((wheyFood.protein * grams) / 100),
      carbs: Math.round((wheyFood.carbs * grams) / 100),
      fat: Math.round((wheyFood.fat * grams) / 100),
      sodiumMg: Math.round(((wheyFood.sodiumMg || 0) * grams) / 100),
      priceEuro: Math.round(((wheyFood.priceEuro * grams) / (wheyFood.packageSizeGrams || 1000)) * 100) / 100,
      isWheyAutoAdded: true,
    };

    const targetMealType = currentPlan.meals.find((m) => m.type === "snack") ? "snack" : "dinner";
    const newMeals = currentPlan.meals.map((m) => {
      if (m.type === targetMealType) {
        return { ...m, items: [...m.items, portion] };
      }
      return m;
    });

    onUpdateMealPlan(selectedDate, { ...currentPlan, meals: newMeals });
  };

  // DOSE HALF PACK
  const handleAddFoodWithHalfPack = (food: FoodItem) => {
    if (!activeMealType) return;
    const halfPackGrams = Math.round((food.packageSizeGrams || 500) / 2);
    addFoodPortion(food, halfPackGrams, true);
  };

  const addFoodPortion = (food: FoodItem, grams: number, halfPack = false) => {
    if (!activeMealType) return;
    const portion: MealItemPortion = {
      id: makeId("mi"),
      type: "food",
      targetId: food.id,
      name: halfPack ? `${food.name} (Metà Pacco)` : food.name,
      amountGrams: grams,
      halfPack,
      kcal: Math.round((food.kcal * grams) / 100),
      protein: Math.round((food.protein * grams) / 100),
      carbs: Math.round((food.carbs * grams) / 100),
      fat: Math.round((food.fat * grams) / 100),
      sodiumMg: Math.round(((food.sodiumMg || 0) * grams) / 100),
      priceEuro: Math.round(((food.priceEuro * grams) / (food.packageSizeGrams || 1000)) * 100) / 100,
    };

    const newMeals = currentPlan.meals.map((m) => {
      if (m.type === activeMealType) {
        return { ...m, items: [...m.items, portion] };
      }
      return m;
    });

    onUpdateMealPlan(selectedDate, { ...currentPlan, meals: newMeals });
    setActiveMealType(null);
  };

  const addRecipePortion = (recipe: Recipe) => {
    if (!activeMealType) return;
    const portion: MealItemPortion = {
      id: makeId("mr"),
      type: "recipe",
      targetId: recipe.id,
      name: recipe.name,
      amountGrams: 350,
      servings: 1,
      kcal: recipe.kcalPerServing,
      protein: recipe.proteinPerServing,
      carbs: recipe.carbsPerServing,
      fat: recipe.fatPerServing,
      sodiumMg: recipe.sodiumMgPerServing,
      priceEuro: recipe.estimatedCostPerServing,
    };

    const newMeals = currentPlan.meals.map((m) => {
      if (m.type === activeMealType) {
        return { ...m, items: [...m.items, portion] };
      }
      return m;
    });

    onUpdateMealPlan(selectedDate, { ...currentPlan, meals: newMeals });
    setActiveMealType(null);
  };

  const handleRemoveMealItem = (mealType: string, itemId: string) => {
    const newMeals = currentPlan.meals.map((m) => {
      if (m.type === mealType) {
        return { ...m, items: m.items.filter((i) => i.id !== itemId) };
      }
      return m;
    });
    onUpdateMealPlan(selectedDate, { ...currentPlan, meals: newMeals });
  };

  const handleSaveStorageEdit = () => {
    if (!editingFood) return;
    const updated: FoodItem = {
      ...editingFood,
      priceEuro: editPrice,
      storageQty: editQty,
    };
    onUpdateFood(updated);
    setEditingFood(null);
  };

  const filteredFoods = foods.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = foodCategoryFilter === "all" || f.category === foodCategoryFilter;
    const matchesPantry = !onlyPantryFilter || f.storageQty > 0;
    return matchesSearch && matchesCategory && matchesPantry;
  });

  const handleRunAiPlanner = async () => {
    setIsGeneratingAi(true);
    try {
      const res = await fetch("/api/gemini/meal-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: selectedDate,
          endDate: weekDates[6],
          spendLevel: aiSpendLevel,
          zeroWastePantry: aiZeroWaste,
          pantryItems: foods.filter((f) => f.storageQty > 0).map((f) => ({
            name: f.name,
            qty: f.storageQty,
            unit: f.unit,
            price: f.priceEuro,
          })),
          dailyTargets: {
            kcal: currentPlan.targetKcal,
            protein: currentPlan.targetProtein,
            carbs: currentPlan.targetCarbs,
            fat: currentPlan.targetFat,
            sodiumMg: currentPlan.targetSodiumMg,
          },
          wheyIntegration: settings.autoWheySupplementation,
        }),
      });

      const data = await res.json();
      if (data && data.days) {
        data.days.forEach((d: any, dayIdx: number) => {
          if (d.date) {
            const dayPlan: DayMealPlan = {
              date: d.date,
              targetKcal: d.dailyTotal?.kcal || currentPlan.targetKcal,
              targetProtein: d.dailyTotal?.protein || currentPlan.targetProtein,
              targetCarbs: d.dailyTotal?.carbs || currentPlan.targetCarbs,
              targetFat: d.dailyTotal?.fat || currentPlan.targetFat,
              targetSodiumMg: d.dailyTotal?.sodiumMg || currentPlan.targetSodiumMg,
              notes: d.notes,
              meals: (d.meals || []).map((m: any, idx: number) => ({
                id: `ai-m-${d.date}-${idx}`,
                type: m.type || "lunch",
                label: m.type === "breakfast" ? "Colazione" : m.type === "lunch" ? "Pranzo" : m.type === "snack" ? "Spuntino" : "Cena",
                items: [
                  {
                    id: makeId(`ai-it-${dayIdx}-${idx}`),
                    type: "recipe",
                    targetId: "r-ai",
                    name: m.title || "Ricetta AI",
                    amountGrams: 350,
                    kcal: m.kcal || 500,
                    protein: m.protein || 30,
                    carbs: m.carbs || 60,
                    fat: m.fat || 15,
                    sodiumMg: m.sodiumMg || 400,
                    priceEuro: 2.5,
                  },
                ],
              })),
            };
            onUpdateMealPlan(d.date, dayPlan);
          }
        });
        setShowAiModal(false);
      }
    } catch (err) {
      console.error("AI Planner error:", err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Glassmorphic Cupertino Panel */}
      <div className="rounded-3xl glass-panel p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Date controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() - 1);
                setSelectedDate(d.toISOString().slice(0, 10));
              }}
              className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.08] transition-all active:scale-95"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2.5 bg-white/[0.04] border border-white/[0.08] px-3.5 py-1.5 rounded-xl shadow-sm">
              <Calendar className="h-4 w-4 text-emerald-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-white font-mono focus:outline-none"
              />
            </div>

            <button
              onClick={() => {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() + 1);
                setSelectedDate(d.toISOString().slice(0, 10));
              }}
              className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.08] transition-all active:scale-95"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Weekly Cost & Stima Spesa Metric - Apple Financial Aesthetics */}
          <div className="flex items-center gap-6 text-xs font-mono">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <DollarSign className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">SPESA GIORNO</span>
                <strong className="text-white text-sm">€{currentDayCost.toFixed(2)}</strong>
              </div>
            </div>

            <div className="flex items-center gap-2 border-l border-white/[0.06] pl-6">
              <div className="p-1.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">MEDIA SETTIMANALE</span>
                <strong className="text-cyan-300 text-sm">€{weeklyAverageDailyCost.toFixed(2)}/giorno</strong>
              </div>
            </div>
          </div>

          {/* Action buttons: AI Planner, Swap Lunch/Dinner, View Switch */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => handleSwapLunchDinner(selectedDate)}
              className="flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/[0.08] px-3.5 py-2 text-xs font-semibold text-slate-200 hover:border-cyan-400 hover:text-cyan-300 hover:bg-white/[0.08] transition-all active:scale-95 shadow-sm"
              title="Scambia contenuto Pranzo con Cena"
            >
              <ArrowLeftRight className="h-3.5 w-3.5 text-cyan-400" />
              <span>Swap Pranzo ⇄ Cena</span>
            </button>

            <button
              onClick={() => setShowAiModal(true)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-xs font-bold text-white hover:opacity-95 transition-all shadow-[0_4px_16px_rgba(16,185,129,0.3)] active:scale-95"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Planning AI (Svuota Dispensa)</span>
            </button>

            <div className="flex p-1 bg-white/[0.04] rounded-xl border border-white/[0.08] text-xs">
              <button
                onClick={() => setViewMode("week")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  viewMode === "week" ? "bg-white/[0.12] text-white font-bold shadow-sm" : "text-slate-400 hover:text-white"
                }`}
              >
                Settimana PC
              </button>
              <button
                onClick={() => setViewMode("day")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  viewMode === "day" ? "bg-white/[0.12] text-white font-bold shadow-sm" : "text-slate-400 hover:text-white"
                }`}
              >
                Giorno
              </button>
            </div>
          </div>
        </div>

        {/* Macro Targets Progress Cards */}
        <div className="mt-6 pt-5 border-t border-white/[0.06] grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <span className="text-[10px] text-slate-400 font-sans block uppercase">CALORIE TOTALI</span>
            <span className="text-lg font-black font-mono text-white mt-0.5 block">
              {currentTotalKcal} <span className="text-xs text-slate-500 font-normal">/ {currentPlan.targetKcal}</span>
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <span className="text-[10px] text-slate-400 font-sans block uppercase">PROTEINE</span>
            <span className="text-lg font-black font-mono text-emerald-400 mt-0.5 block">
              {currentTotalProtein}g <span className="text-xs text-slate-500 font-normal">/ {currentPlan.targetProtein}g</span>
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <span className="text-[10px] text-slate-400 font-sans block uppercase">CARBOIDRATI</span>
            <span className="text-lg font-black font-mono text-cyan-400 mt-0.5 block">
              {currentTotalCarbs}g <span className="text-xs text-slate-500 font-normal">/ {currentPlan.targetCarbs}g</span>
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <span className="text-[10px] text-slate-400 font-sans block uppercase">GRASSI SANI</span>
            <span className="text-lg font-black font-mono text-amber-400 mt-0.5 block">
              {currentTotalFat}g <span className="text-xs text-slate-500 font-normal">/ {currentPlan.targetFat}g</span>
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <span className="text-[10px] text-slate-400 font-sans block uppercase">SODIO / SALE ENDURANCE</span>
            <span className="text-lg font-black font-mono text-slate-200 mt-0.5 block">
              {currentTotalSodium}mg <span className="text-xs text-slate-500 font-normal">/ {currentPlan.targetSodiumMg}mg</span>
            </span>
          </div>
        </div>

        {/* WHEY SUPPLEMENTATION CALLOUT */}
        {wheyCheck.needed && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-950/25 text-xs shadow-sm">
            <div className="flex items-center gap-2.5 text-emerald-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>
                Mancano <strong>{wheyCheck.missingGrams}g di proteine</strong> al target ({currentTotalProtein}/{currentPlan.targetProtein}g).
              </span>
            </div>
            <button
              onClick={handleAutoAddWhey}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-3.5 py-1.5 text-xs font-bold text-white hover:opacity-95 transition-all shadow-[0_2px_12px_rgba(16,185,129,0.3)] active:scale-95"
            >
              <span>+ Integra con Whey ({wheyCheck.scoops} scoop &middot; {wheyCheck.gramsToAdd}g)</span>
            </button>
          </div>
        )}
      </div>

      {/* VIEW: DESKTOP 7-DAY WEEK VIEW (DRAG & DROP / FULL MATRIX) */}
      {viewMode === "week" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-2">
            <span className="font-medium">VISTA SETTIMANALE COMPLETA &middot; Trascina o riorganizza i pasti tra i giorni:</span>
            <span className="font-mono text-emerald-400 font-bold">Lunedì - Domenica</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {weekDates.map((dateStr) => {
              const dayPlan = mealPlans[dateStr] || {
                date: dateStr,
                targetKcal: 2600,
                targetProtein: 160,
                targetCarbs: 320,
                targetFat: 70,
                targetSodiumMg: 2500,
                meals: [
                  { id: `m-${dateStr}-1`, type: "breakfast", label: "Colazione", items: [] },
                  { id: `m-${dateStr}-2`, type: "lunch", label: "Pranzo", items: [] },
                  { id: `m-${dateStr}-3`, type: "snack", label: "Spuntino", items: [] },
                  { id: `m-${dateStr}-4`, type: "dinner", label: "Cena", items: [] },
                ],
              };

              const dObj = new Date(dateStr);
              const dayName = dObj.toLocaleDateString("it-IT", { weekday: "short" });
              const dayNum = dObj.getDate();
              const isSelected = dateStr === selectedDate;
              const isToday = dateStr === new Date().toISOString().slice(0, 10);

              const dayKcal = dayPlan.meals.flatMap((m) => m.items).reduce((s, it) => s + it.kcal, 0);

              return (
                <div
                  key={dateStr}
                  className={`rounded-2xl border p-3.5 flex flex-col justify-between transition-all ${
                    isSelected
                      ? "border-emerald-500/80 bg-slate-900 shadow-xl ring-2 ring-emerald-500/40"
                      : "glass-panel hover:border-white/[0.12]"
                  }`}
                >
                  <div className="pb-2.5 border-b border-white/[0.06] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-sans">
                        {dayName}
                      </span>
                      <h4 className="text-base font-extrabold text-white tracking-tight">
                        {dayNum} {isToday ? <span className="text-[10px] text-emerald-400 font-mono font-bold">Oggi</span> : null}
                      </h4>
                    </div>
                    <button
                      onClick={() => setSelectedDate(dateStr)}
                      className="text-[10px] font-mono font-semibold text-cyan-400 hover:text-cyan-300 underline"
                    >
                      Dettaglio
                    </button>
                  </div>

                  <div className="my-2.5 space-y-2 flex-1">
                    {dayPlan.meals.map((meal) => (
                      <div
                        key={meal.id}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                          if (draggedItem && (draggedItem.fromDate !== dateStr || draggedItem.fromMealType !== meal.type)) {
                            const sourcePlan = mealPlans[draggedItem.fromDate];
                            if (sourcePlan) {
                              const cleanSourceMeals = sourcePlan.meals.map((m) =>
                                m.type === draggedItem.fromMealType
                                  ? { ...m, items: m.items.filter((i) => i.id !== draggedItem.item.id) }
                                  : m
                              );
                              onUpdateMealPlan(draggedItem.fromDate, { ...sourcePlan, meals: cleanSourceMeals });
                            }

                            const destMeals = dayPlan.meals.map((m) =>
                              m.type === meal.type ? { ...m, items: [...m.items, draggedItem.item] } : m
                            );
                            onUpdateMealPlan(dateStr, { ...dayPlan, meals: destMeals });
                            setDraggedItem(null);
                          }
                        }}
                        className="rounded-xl bg-white/[0.02] p-2 border border-white/[0.05]"
                      >
                        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 mb-1">
                          <span>{meal.label}</span>
                          <span className="font-mono text-emerald-400/90">{meal.items.reduce((s, it) => s + it.kcal, 0)} kcal</span>
                        </div>

                        <div className="space-y-1">
                          {meal.items.map((it) => (
                            <div
                              key={it.id}
                              draggable
                              onDragStart={() =>
                                setDraggedItem({
                                  fromDate: dateStr,
                                  fromMealType: meal.type,
                                  item: it,
                                })
                              }
                              className="cursor-grab active:cursor-grabbing rounded-lg p-1.5 bg-white/[0.04] text-[11px] text-slate-200 line-clamp-1 border border-white/[0.06] hover:border-emerald-500/80 flex items-center justify-between transition-colors shadow-sm"
                            >
                              <span className="truncate pr-1">{it.name}</span>
                              <span className="font-mono text-[9px] text-slate-400 shrink-0">
                                {it.amountGrams}g
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>Totale:</span>
                    <strong className="text-white font-bold">{dayKcal} kcal</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW: DAY VIEW (DETAILED MEAL EDITOR) */}
      <div className="rounded-3xl glass-panel p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2.5">
            <UtensilsCrossed className="h-5 w-5 text-emerald-400" />
            <span>Pasti del Giorno &middot; {selectedDate}</span>
          </h3>
          <span className="text-xs font-mono text-slate-400 bg-white/[0.04] px-3 py-1 rounded-full border border-white/[0.06]">
            {currentPlan.isHighCarbDay ? "Carb-Cycling: Giorno High Carb" : "Target Standard"}
          </span>
        </div>

        {/* Meals list */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentPlan.meals.map((meal) => {
            const mealKcal = meal.items.reduce((s, it) => s + it.kcal, 0);
            const mealProtein = meal.items.reduce((s, it) => s + it.protein, 0);
            const mealCarbs = meal.items.reduce((s, it) => s + it.carbs, 0);
            const mealFat = meal.items.reduce((s, it) => s + it.fat, 0);

            return (
              <div
                key={meal.id}
                className="rounded-2xl border border-white/[0.06] bg-slate-950/70 p-5 flex flex-col justify-between shadow"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                    <h4 className="text-base font-bold text-white tracking-tight">{meal.label}</h4>
                    <span className="text-xs font-mono text-emerald-400 font-semibold bg-white/[0.04] px-2.5 py-0.5 rounded-full border border-white/[0.06]">
                      {mealKcal} kcal &middot; P:{mealProtein}g C:{mealCarbs}g F:{mealFat}g
                    </span>
                  </div>

                  {/* Meal items */}
                  <div className="mt-3.5 space-y-2.5">
                    {meal.items.length === 0 ? (
                      <div className="text-xs text-slate-500 italic py-3 text-center">Nessun alimento o ricetta inserita.</div>
                    ) : (
                      meal.items.map((item) => {
                        const foodRef = foods.find((f) => f.id === item.targetId);

                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs hover:border-white/[0.12] transition-colors"
                          >
                            <div className="flex-1 min-w-0 pr-2">
                              <div className="flex items-center gap-2 font-semibold text-white truncate">
                                {/* Corrected icon alignment with shrink-0 */}
                                {item.type === "recipe" ? (
                                  <UtensilsCrossed className="h-4 w-4 text-cyan-400 shrink-0" />
                                ) : (
                                  <Package className="h-4 w-4 text-emerald-400 shrink-0" />
                                )}
                                <span className="truncate">{item.name}</span>
                              </div>
                              <div className="text-[10px] font-mono text-slate-400 mt-1">
                                {item.amountGrams}g &middot; {item.kcal} kcal &middot; P:{item.protein}g C:{item.carbs}g F:{item.fat}g
                                {item.priceEuro ? ` &middot; €${item.priceEuro.toFixed(2)}` : ""}
                              </div>
                            </div>

                            {/* Storage Quick edit & Delete */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              {foodRef && (
                                <button
                                  onClick={() => {
                                    setEditingFood(foodRef);
                                    setEditPrice(foodRef.priceEuro);
                                    setEditQty(foodRef.storageQty);
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-white/[0.06] transition-colors"
                                  title="Modifica prezzo e scorte in dispensa"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleRemoveMealItem(meal.type, item.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/[0.06] transition-colors"
                                title="Rimuovi dal pasto"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Add item button */}
                <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                  <button
                    onClick={() => {
                      setActiveMealType(meal.type);
                      setSearchQuery("");
                    }}
                    className="flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/[0.08] px-3.5 py-2 text-xs font-semibold text-slate-200 hover:border-emerald-500 hover:text-white hover:bg-white/[0.08] transition-all active:scale-95 shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Aggiungi Alimento o Ricetta</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL: ADD FOOD / RECIPE WITH FILTERS & HALF PACK */}
      {activeMealType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl glass-panel-elevated p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <h3 className="text-base font-bold text-white">
                Aggiungi al pasto: <span className="text-emerald-400 capitalize">{activeMealType}</span>
              </h3>
              <button onClick={() => setActiveMealType(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Filters */}
            <div className="my-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Cerca alimento o ricetta..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 min-w-[200px] rounded-xl border border-white/[0.08] bg-slate-900 px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none"
                />

                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <span>Grammi:</span>
                  <input
                    type="number"
                    value={customGrams}
                    onChange={(e) => setCustomGrams(Math.max(10, Number(e.target.value)))}
                    className="w-20 rounded-xl border border-white/[0.08] bg-slate-900 px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* Category Segmented control */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1 p-1 bg-white/[0.03] border border-white/[0.06] rounded-xl text-xs">
                  {[
                    { id: "all", label: "Tutti" },
                    { id: "proteico", label: "Proteico" },
                    { id: "glucidico", label: "Glucidico" },
                    { id: "lipidico", label: "Lipidico" },
                    { id: "verdura", label: "Verdura" },
                    { id: "mix", label: "Mix" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setFoodCategoryFilter(cat.id)}
                      className={`px-3 py-1 rounded-lg text-xs transition-all ${
                        foodCategoryFilter === cat.id
                          ? "bg-emerald-600 text-white font-bold shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyPantryFilter}
                    onChange={(e) => setOnlyPantryFilter(e.target.checked)}
                    className="rounded border-slate-700 text-emerald-500"
                  />
                  <span>Solo in Dispensa</span>
                </label>
              </div>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {recipes.length > 0 && foodCategoryFilter === "all" && !onlyPantryFilter && (
                <div className="mb-4">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1.5">
                    RICETTE REGISTRATE:
                  </span>
                  <div className="space-y-2">
                    {recipes
                      .filter((r) => r.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((recipe) => (
                        <div
                          key={recipe.id}
                          className="flex items-center justify-between p-3 rounded-xl border border-white/[0.06] bg-slate-950 hover:border-cyan-500 text-xs shadow-sm"
                        >
                          <div>
                            <span className="font-semibold text-white">{recipe.name}</span>
                            <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                              {recipe.kcalPerServing} kcal &middot; P:{recipe.proteinPerServing}g C:{recipe.carbsPerServing}g F:{recipe.fatPerServing}g
                              {recipe.estimatedCostPerServing ? ` &middot; €${recipe.estimatedCostPerServing.toFixed(2)}` : ""}
                            </div>
                          </div>
                          <button
                            onClick={() => addRecipePortion(recipe)}
                            className="rounded-xl bg-cyan-600 px-3.5 py-1.5 font-bold text-white hover:bg-cyan-500 shadow-sm transition-all"
                          >
                            + Aggiungi
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Foods list */}
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1.5">
                ALIMENTI DISPONIBILI:
              </span>
              {filteredFoods.map((food) => (
                <div
                  key={food.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-white/[0.06] bg-slate-950/80 hover:border-emerald-500 text-xs shadow-sm"
                >
                  <div className="flex-1 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{food.name}</span>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">[{food.category}]</span>
                      {food.storageQty > 0 ? (
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">In dispensa: {food.storageQty}g</span>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono">Esaurito</span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 mt-1">
                      Per {customGrams}g: {Math.round((food.kcal * customGrams) / 100)} kcal &middot; P:
                      {Math.round((food.protein * customGrams) / 100)}g C:
                      {Math.round((food.carbs * customGrams) / 100)}g F:
                      {Math.round((food.fat * customGrams) / 100)}g
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleAddFoodWithHalfPack(food)}
                      className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-[11px] font-medium text-slate-200 hover:border-emerald-400 hover:text-white transition-all active:scale-95"
                      title={`Aggiunge metà pacco (${Math.round((food.packageSizeGrams || 500) / 2)}g)`}
                    >
                      Metà Pacco ({Math.round((food.packageSizeGrams || 500) / 2)}g)
                    </button>

                    <button
                      onClick={() => addFoodPortion(food, customGrams, false)}
                      className="rounded-xl bg-emerald-600 px-3.5 py-1.5 font-bold text-white hover:bg-emerald-500 shadow-sm transition-all active:scale-95"
                    >
                      + {customGrams}g
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PRICE & QUANTITY IN STORAGE */}
      {editingFood && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-sm rounded-3xl glass-panel-elevated p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <h3 className="text-sm font-bold text-white">Modifica Dispensa: {editingFood.name}</h3>
              <button onClick={() => setEditingFood(null)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Prezzo confezione (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editPrice}
                  onChange={(e) => setEditPrice(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/[0.08] bg-slate-900 p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Quantità disponibile nello storage ({editingFood.unit})</label>
                <input
                  type="number"
                  value={editQty}
                  onChange={(e) => setEditQty(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/[0.08] bg-slate-900 p-2.5 text-white font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.06]">
              <button
                onClick={() => setEditingFood(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Annulla
              </button>
              <button
                onClick={handleSaveStorageEdit}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-500 shadow transition-all active:scale-95"
              >
                Salva Modifiche
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SMART AI MEAL PLANNER */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl glass-panel-elevated p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">AI Meal Planner & Svuota Dispensa</h3>
              </div>
              <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <p className="text-slate-300 leading-relaxed">
                Genera un piano di ricette autentiche per i giorni selezionati, dosando i micronutrienti per atleta ibrido e integrando le Whey se mancano proteine.
              </p>

              <div>
                <label className="text-slate-400 block mb-1 font-medium">Budget / Livello di spesa:</label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-white/[0.04] border border-white/[0.06] rounded-2xl text-center">
                  {(["economic", "normal", "expensive"] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setAiSpendLevel(lvl)}
                      className={`py-2 rounded-xl text-xs capitalize transition-all ${
                        aiSpendLevel === lvl
                          ? "bg-emerald-600 text-white font-bold shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {lvl === "economic" ? "Economica" : lvl === "normal" ? "Normale" : "Costosa"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white block">Opzione Svuota Dispensa:</span>
                  <span className="text-[11px] text-slate-400">
                    Usa prima gli ingredienti attualmente aperti o in scadenza nello storage.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={aiZeroWaste}
                  onChange={(e) => setAiZeroWaste(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 text-emerald-500"
                />
              </div>

              <div>
                <span className="text-slate-400 block mb-1 font-medium">Intervallo di generazione:</span>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] font-mono text-white text-xs">
                  Dal {selectedDate} al {weekDates[6]} (Settimana corrente)
                </div>
              </div>
            </div>

            <button
              onClick={handleRunAiPlanner}
              disabled={isGeneratingAi}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-xs font-bold text-white hover:opacity-95 disabled:opacity-50 transition-all shadow-[0_4px_16px_rgba(16,185,129,0.3)] active:scale-95"
            >
              {isGeneratingAi ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Genera Piano Pasti Completo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
