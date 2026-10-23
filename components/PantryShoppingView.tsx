"use client";

import React, { useState } from "react";
import {
  FoodItem,
  ShoppingListItem,
  ShoppingExtraItem,
  DayMealPlan,
} from "@/lib/types";
import {
  Package,
  ShoppingCart,
  Search,
  ArrowUpDown,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Barcode,
  Loader2,
  DollarSign,
  Tag,
  X,
  Layers,
  Wand2,
  PackageCheck,
  Check,
  SlidersHorizontal,
} from "lucide-react";

interface PantryShoppingViewProps {
  foods: FoodItem[];
  shoppingExtras: ShoppingExtraItem[];
  mealPlans: Record<string, DayMealPlan>;
  onUpdateFood: (food: FoodItem) => void;
  onAddFood: (food: FoodItem) => void;
  onDeleteFood: (foodId: string) => void;
  onUpdateExtras: (extras: ShoppingExtraItem[]) => void;
}

export default function PantryShoppingView({
  foods,
  shoppingExtras,
  mealPlans,
  onUpdateFood,
  onAddFood,
  onDeleteFood,
  onUpdateExtras,
}: PantryShoppingViewProps) {
  const [activeTab, setActiveTab] = useState<"pantry" | "shopping">("pantry");

  // Pantry state: Search & Alphabetical sort
  const [pantrySearch, setPantrySearch] = useState("");
  const [sortAlphabetical, setSortAlphabetical] = useState<"asc" | "desc" | "none">("asc");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Add / Edit Food Modal
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null);
  const [isAddingFood, setIsAddingFood] = useState(false);
  const [formName, setFormName] = useState("");
  const [formKcal, setFormKcal] = useState(100);
  const [formProtein, setFormProtein] = useState(10);
  const [formCarbs, setFormCarbs] = useState(10);
  const [formFat, setFormFat] = useState(2);
  const [formFiber, setFormFiber] = useState(1);
  const [formSodium, setFormSodium] = useState(50);
  const [formCategory, setFormCategory] = useState<FoodItem["category"]>("proteico");
  const [formPackageSize, setFormPackageSize] = useState(500);
  const [formPrice, setFormPrice] = useState(2.5);
  const [formQty, setFormQty] = useState(500);

  // AI Food Estimate State
  const [isEstimatingAi, setIsEstimatingAi] = useState(false);
  const [isFixingCategory, setIsFixingCategory] = useState<string | null>(null);

  // Open Food Facts Barcode Search State
  const [offBarcode, setOffBarcode] = useState("");
  const [isSearchingOff, setIsSearchingOff] = useState(false);
  const [offMessage, setOffMessage] = useState<string | null>(null);

  // Shopping List State: "This Week" filter
  const [shoppingWeekOnly, setShoppingWeekOnly] = useState(true);
  const [showSufficientAccordion, setShowSufficientAccordion] = useState(false);

  // Extra non-food item form
  const [newExtraName, setNewExtraName] = useState("");
  const [newExtraPrice, setNewExtraPrice] = useState(2.0);
  const [newExtraCategory, setNewExtraCategory] = useState("Cucina / Casa");

  // Sorted and filtered foods
  let displayedFoods = foods.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(pantrySearch.toLowerCase());
    const matchesCat = categoryFilter === "all" || f.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  if (sortAlphabetical === "asc") {
    displayedFoods = [...displayedFoods].sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortAlphabetical === "desc") {
    displayedFoods = [...displayedFoods].sort((a, b) => b.name.localeCompare(a.name));
  }

  // Calculate shopping list from meal plans
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7)); // Monday
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const neededFoodMap: Record<string, { food: FoodItem; neededGrams: number }> = {};

  Object.values(mealPlans).forEach((dayPlan) => {
    const planDate = new Date(dayPlan.date);
    if (shoppingWeekOnly && (planDate < weekStart || planDate > weekEnd)) {
      return;
    }

    dayPlan.meals.forEach((meal) => {
      meal.items.forEach((item) => {
        if (item.type === "food") {
          const food = foods.find((f) => f.id === item.targetId);
          if (food) {
            if (!neededFoodMap[food.id]) {
              neededFoodMap[food.id] = { food, neededGrams: 0 };
            }
            neededFoodMap[food.id].neededGrams += item.amountGrams;
          }
        }
      });
    });
  });

  // Split into shopping items and sufficient storage items
  const shoppingListItems: ShoppingListItem[] = [];
  const sufficientStorageItems: ShoppingListItem[] = [];

  Object.values(neededFoodMap).forEach(({ food, neededGrams }) => {
    const inStorage = food.storageQty || 0;
    const isSufficient = inStorage >= neededGrams;

    const packSize = food.packageSizeGrams || 500;
    const def = neededGrams - inStorage;
    const packsToBuy = isSufficient ? 0 : Math.max(1, Math.ceil(def / packSize));
    const estCost = packsToBuy * (food.priceEuro || 2.0);

    const sItem: ShoppingListItem = {
      foodId: food.id,
      foodName: food.name,
      neededGrams: Math.round(neededGrams),
      inStorageGrams: Math.round(inStorage),
      toBuyPacks: packsToBuy,
      estimatedCostEuro: Math.round(estCost * 100) / 100,
      isPurchased: false,
      isSufficient,
    };

    if (isSufficient) {
      sufficientStorageItems.push(sItem);
    } else {
      shoppingListItems.push(sItem);
    }
  });

  const totalFoodCost = shoppingListItems.reduce((acc, i) => acc + (i.estimatedCostEuro || 0), 0);
  const totalExtraCost = shoppingExtras.reduce((acc, e) => acc + (e.priceEuro || 0) * (e.qty || 1), 0);
  const grandTotalCost = totalFoodCost + totalExtraCost;

  // Open Edit / Create Food Modal
  const handleOpenFoodModal = (food?: FoodItem) => {
    if (food) {
      setEditingFood(food);
      setFormName(food.name);
      setFormKcal(food.kcal);
      setFormProtein(food.protein);
      setFormCarbs(food.carbs);
      setFormFat(food.fat);
      setFormFiber(food.fiber || 1);
      setFormSodium(food.sodiumMg || 50);
      setFormCategory(food.category);
      setFormPackageSize(food.packageSizeGrams || 500);
      setFormPrice(food.priceEuro || 2.5);
      setFormQty(food.storageQty || 0);
      setIsAddingFood(false);
    } else {
      setEditingFood(null);
      setFormName("");
      setFormKcal(120);
      setFormProtein(10);
      setFormCarbs(15);
      setFormFat(3);
      setFormFiber(1);
      setFormSodium(50);
      setFormCategory("proteico");
      setFormPackageSize(500);
      setFormPrice(2.5);
      setFormQty(500);
      setIsAddingFood(true);
    }
  };

  // Save Food Item
  const handleSaveFood = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const foodObj: FoodItem = {
      id: editingFood ? editingFood.id : `f-${Date.now()}`,
      name: formName.trim(),
      kcal: Number(formKcal),
      protein: Number(formProtein),
      carbs: Number(formCarbs),
      fat: Number(formFat),
      fiber: Number(formFiber),
      sodiumMg: Number(formSodium),
      category: formCategory,
      packageSizeGrams: Number(formPackageSize),
      priceEuro: Number(formPrice),
      storageQty: Number(formQty),
      unit: "g",
      isNewAdded: !editingFood,
    };

    if (editingFood) {
      onUpdateFood(foodObj);
    } else {
      onAddFood(foodObj);
    }

    setEditingFood(null);
    setIsAddingFood(false);
  };

  // Inline Quick Storage & Price Edit
  const handleInlineStorageChange = (food: FoodItem, newQty: number) => {
    onUpdateFood({ ...food, storageQty: Math.max(0, newQty) });
  };

  const handleInlinePriceChange = (food: FoodItem, newPrice: number) => {
    onUpdateFood({ ...food, priceEuro: Math.max(0.1, newPrice) });
  };

  // AI Estimate for Unknown Food
  const handleAiEstimateFood = async () => {
    if (!formName.trim()) return;
    setIsEstimatingAi(true);
    try {
      const res = await fetch("/api/gemini/food-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foodName: formName.trim() }),
      });
      const data = await res.json();
      if (data) {
        if (data.kcal) setFormKcal(data.kcal);
        if (data.protein) setFormProtein(data.protein);
        if (data.carbs) setFormCarbs(data.carbs);
        if (data.fat) setFormFat(data.fat);
        if (data.fiber) setFormFiber(data.fiber);
        if (data.sodiumMg) setFormSodium(data.sodiumMg);
        if (data.category) setFormCategory(data.category);
        if (data.packageSizeGrams) setFormPackageSize(data.packageSizeGrams);
        if (data.priceEuro) setFormPrice(data.priceEuro);
      }
    } catch (err) {
      console.error("AI Estimate error:", err);
    } finally {
      setIsEstimatingAi(false);
    }
  };

  // AI Fix Category for newly added foods
  const handleAiFixCategory = async (food: FoodItem) => {
    setIsFixingCategory(food.id);
    try {
      const res = await fetch("/api/gemini/food-category-fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foodName: food.name, currentCategory: food.category }),
      });
      const data = await res.json();
      if (data && data.category) {
        onUpdateFood({ ...food, category: data.category });
      }
    } catch (err) {
      console.error("Category fix error:", err);
    } finally {
      setIsFixingCategory(null);
    }
  };

  // Search OpenFoodFacts
  const handleSearchOpenFoodFacts = async () => {
    if (!offBarcode.trim()) return;
    setIsSearchingOff(true);
    setOffMessage(null);
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(offBarcode.trim())}.json`);
      const data = await res.json();
      if (data && data.status === 1 && data.product) {
        const prod = data.product;
        const nut = prod.nutriments || {};
        const pName = prod.product_name || "Alimento OFF";
        const kcal = Math.round(nut["energy-kcal_100g"] || 0);
        const p = Math.round((nut["proteins_100g"] || 0) * 10) / 10;
        const c = Math.round((nut["carbohydrates_100g"] || 0) * 10) / 10;
        const f = Math.round((nut["fat_100g"] || 0) * 10) / 10;
        const fib = Math.round((nut["fiber_100g"] || 0) * 10) / 10;
        const sod = Math.round((nut["sodium_100g"] || 0) * 1000);

        let cat: FoodItem["category"] = "mix";
        if (p > 15 && p > c) cat = "proteico";
        else if (c > 30) cat = "carboidrato";
        else if (f > 15) cat = "grasso";

        const newFood: FoodItem = {
          id: `f-off-${Date.now()}`,
          name: pName,
          barcode: offBarcode.trim(),
          kcal,
          protein: p,
          carbs: c,
          fat: f,
          fiber: fib,
          sodiumMg: sod,
          category: cat,
          packageSizeGrams: 500,
          priceEuro: 2.5,
          storageQty: 500,
          unit: "g",
          isNewAdded: true,
        };
        onAddFood(newFood);
        setOffMessage(`Aggiunto "${pName}" con successo da OpenFoodFacts!`);
        setOffBarcode("");
      } else {
        setOffMessage("Prodotto non trovato nel database Open Food Facts.");
      }
    } catch {
      setOffMessage("Errore durante la ricerca su Open Food Facts.");
    } finally {
      setIsSearchingOff(false);
    }
  };

  // Add Shopping Extra
  const handleAddExtra = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExtraName.trim()) return;
    const newExtra: ShoppingExtraItem = {
      id: `ex-${Date.now()}`,
      name: newExtraName.trim(),
      priceEuro: Number(newExtraPrice),
      category: newExtraCategory,
      isPurchased: false,
      qty: 1,
    };
    onUpdateExtras([...shoppingExtras, newExtra]);
    setNewExtraName("");
    setNewExtraPrice(2.0);
  };

  const handleToggleExtraPurchased = (id: string) => {
    const updated = shoppingExtras.map((ex) =>
      ex.id === id ? { ...ex, isPurchased: !ex.isPurchased } : ex
    );
    onUpdateExtras(updated);
  };

  const handleDeleteExtra = (id: string) => {
    onUpdateExtras(shoppingExtras.filter((ex) => ex.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Material 2027 Segmented Control */}
      <div className="glass-panel-elevated p-6 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-400 mb-1.5">
              <Package className="h-4 w-4" />
              <span>Dispensa & Smart Procurement 2027</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Dispensa, Storage & Spesa
            </h2>
            <p className="text-sm text-slate-300 mt-1">
              Giacenze in tempo reale, sincronizzazione Open Food Facts e calcolo spesa con isolamento articoli non-food.
            </p>
          </div>

          {/* Segmented Control Pill (Apple x Material 2027) */}
          <div className="mat-segment-track flex items-center p-1.5 self-start md:self-center">
            <button
              onClick={() => setActiveTab("pantry")}
              className={`mat-segment-item flex items-center gap-2 ${
                activeTab === "pantry" ? "mat-segment-item-active" : ""
              }`}
            >
              <Package className="h-4 w-4" />
              <span>Dispensa ({foods.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("shopping")}
              className={`mat-segment-item flex items-center gap-2 ${
                activeTab === "shopping" ? "mat-segment-item-active" : ""
              }`}
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Shopping List ({shoppingListItems.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: PANTRY */}
      {activeTab === "pantry" && (
        <div className="space-y-5">
          {/* Controls Bar: Search, Category Chips, Sort, Add, Barcode */}
          <div className="glass-panel p-4 rounded-3xl space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cerca per nome alimento..."
                  value={pantrySearch}
                  onChange={(e) => setPantrySearch(e.target.value)}
                  className="w-full glass-panel pl-11 pr-4 py-2.5 rounded-2xl text-xs text-white placeholder-slate-400 focus:border-cyan-500/50"
                />
              </div>

              {/* Alphabetical Sort Toggle */}
              <button
                onClick={() =>
                  setSortAlphabetical((prev) =>
                    prev === "asc" ? "desc" : prev === "desc" ? "none" : "asc"
                  )
                }
                className="px-3.5 py-2.5 rounded-2xl glass-pill text-xs font-semibold text-slate-200 flex items-center gap-1.5 hover:bg-white/10 transition-colors"
                title="Ordina alfabeticamente"
              >
                <ArrowUpDown className="h-3.5 w-3.5 text-cyan-400" />
                <span>Ordine: {sortAlphabetical === "asc" ? "A-Z" : sortAlphabetical === "desc" ? "Z-A" : "Standard"}</span>
              </button>

              <button
                onClick={() => handleOpenFoodModal()}
                className="px-4 py-2.5 rounded-2xl mat-fab-primary text-xs font-bold flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Nuovo Alimento</span>
              </button>
            </div>

            {/* Category Filter Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/5">
              <span className="text-[11px] font-mono text-slate-400 uppercase mr-1">Filtro:</span>
              {[
                { id: "all", label: "Tutti" },
                { id: "proteico", label: "Proteico" },
                { id: "carboidrato", label: "Carboidrato" },
                { id: "grasso", label: "Grasso" },
                { id: "vegetables", label: "Verdure" },
                { id: "mix", label: "Mix / Altro" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    categoryFilter === cat.id
                      ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/50 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Open Food Facts Barcode Quick Scan */}
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-mono text-amber-300">
                <Barcode className="h-4 w-4" />
                <span>Open Food Facts Scan:</span>
              </div>
              <input
                type="text"
                placeholder="Codice a barre (es. 8000500310427)..."
                value={offBarcode}
                onChange={(e) => setOffBarcode(e.target.value)}
                className="flex-1 min-w-[200px] glass-panel px-3 py-1.5 rounded-xl text-xs text-white placeholder-slate-500"
              />
              <button
                onClick={handleSearchOpenFoodFacts}
                disabled={isSearchingOff || !offBarcode.trim()}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-semibold hover:bg-amber-500/30 disabled:opacity-40 flex items-center gap-1.5"
              >
                {isSearchingOff ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                <span>Importa Prodotto</span>
              </button>
              {offMessage && (
                <span className="text-[11px] text-cyan-300 font-mono w-full block mt-1">
                  {offMessage}
                </span>
              )}
            </div>
          </div>

          {/* Foods Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedFoods.map((food) => {
              const inStock = (food.storageQty || 0) > 0;
              return (
                <div
                  key={food.id}
                  className="glass-panel p-4 rounded-3xl flex flex-col justify-between hover:border-white/20 transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-white/5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400">
                        {food.category}
                      </span>
                      <div className="flex items-center gap-1">
                        {food.isNewAdded && (
                          <button
                            onClick={() => handleAiFixCategory(food)}
                            disabled={isFixingCategory === food.id}
                            className="px-2 py-0.5 rounded-lg bg-violet-500/15 border border-violet-500/30 text-[10px] font-mono text-violet-300 hover:bg-violet-500/25 flex items-center gap-1"
                            title="Correggi categoria con AI"
                          >
                            {isFixingCategory === food.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Wand2 className="h-3 w-3" />
                            )}
                            Fix Cat (AI)
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenFoodModal(food)}
                          className="p-1 rounded-lg text-slate-400 hover:text-emerald-400"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteFood(food.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-white mt-2 group-hover:text-emerald-300 transition-colors">
                      {food.name}
                    </h4>

                    {/* Macros Bar */}
                    <div className="mt-2.5 grid grid-cols-4 gap-1 p-2 rounded-xl bg-black/40 border border-white/5 font-mono text-center text-[11px]">
                      <div>
                        <span className="text-[8px] text-slate-400 block">KCAL</span>
                        <span className="font-bold text-white">{food.kcal}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-emerald-400 block">PRO</span>
                        <span className="font-bold text-emerald-400">{food.protein}g</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-cyan-400 block">CARB</span>
                        <span className="font-bold text-cyan-400">{food.carbs}g</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-amber-400 block">FAT</span>
                        <span className="font-bold text-amber-400">{food.fat}g</span>
                      </div>
                    </div>
                  </div>

                  {/* Inline Storage Qty & Price controls */}
                  <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Package className="h-3 w-3 text-cyan-400" />
                        Giacenza Dispensa:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step={50}
                          value={food.storageQty || 0}
                          onChange={(e) => handleInlineStorageChange(food, Number(e.target.value))}
                          className={`w-20 glass-panel px-2 py-0.5 rounded-lg text-right text-xs font-mono font-bold ${
                            inStock ? "text-emerald-400 border-emerald-500/30" : "text-rose-400 border-rose-500/30"
                          }`}
                        />
                        <span className="text-[11px] text-slate-400">g</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400 flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-amber-400" />
                        Prezzo Confezione:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-400">€</span>
                        <input
                          type="number"
                          step={0.1}
                          value={food.priceEuro || 0}
                          onChange={(e) => handleInlinePriceChange(food, Number(e.target.value))}
                          className="w-16 glass-panel px-2 py-0.5 rounded-lg text-right text-xs font-mono font-bold text-amber-300"
                        />
                        <span className="text-[10px] text-slate-400">({food.packageSizeGrams || 500}g)</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: SMART SHOPPING LIST */}
      {activeTab === "shopping" && (
        <div className="space-y-6">
          {/* Summary Financial Metric Cards (Apple Fitness Style) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-panel p-5 rounded-3xl border-l-4 border-l-emerald-500">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                Totale Alimenti Spesa
              </span>
              <div className="text-2xl font-extrabold text-white mt-1 font-mono tracking-tight">
                €{totalFoodCost.toFixed(2)}
              </div>
              <span className="text-[11px] text-emerald-400 mt-1 block">
                {shoppingListItems.length} prodotti mancanti in dispensa
              </span>
            </div>

            <div className="glass-panel p-5 rounded-3xl border-l-4 border-l-cyan-500">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                Articoli Extra Non-Food
              </span>
              <div className="text-2xl font-extrabold text-white mt-1 font-mono tracking-tight">
                €{totalExtraCost.toFixed(2)}
              </div>
              <span className="text-[11px] text-cyan-400 mt-1 block">
                {shoppingExtras.length} articoli per casa / cucina
              </span>
            </div>

            <div className="glass-panel-elevated p-5 rounded-3xl border-l-4 border-l-amber-500">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                Stima Spesa Complessiva
              </span>
              <div className="text-3xl font-black text-amber-300 mt-1 font-mono tracking-tight">
                €{grandTotalCost.toFixed(2)}
              </div>
              <span className="text-[11px] text-slate-300 mt-1 block">
                {shoppingWeekOnly ? "Calcolata su questa settimana" : "Calcolata su tutti i piani"}
              </span>
            </div>
          </div>

          {/* Quick Filter: This Week only toggle */}
          <div className="glass-panel p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-semibold text-white">Filtro Meal Plan:</span>
              <button
                onClick={() => setShoppingWeekOnly(!shoppingWeekOnly)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  shoppingWeekOnly
                    ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                    : "glass-pill text-slate-400"
                }`}
              >
                {shoppingWeekOnly ? "Solo Questa Settimana (Lun-Dom)" : "Tutti i Piani Registrati"}
              </button>
            </div>

            <span className="text-[11px] font-mono text-slate-400">
              Sottrazione automatica scorte in storage attiva
            </span>
          </div>

          {/* Section A: Needed Foods Shopping Items */}
          <div className="glass-panel p-5 rounded-3xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                Alimenti da Acquistare ({shoppingListItems.length})
              </h3>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                Totale parziale: €{totalFoodCost.toFixed(2)}
              </span>
            </div>

            {shoppingListItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 font-mono">
                Complimenti! Tutte le preparazioni di questa settimana sono coperte dalle scorte in dispensa.
              </div>
            ) : (
              <div className="space-y-2">
                {shoppingListItems.map((item) => (
                  <div
                    key={item.foodId}
                    className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <h5 className="font-bold text-white">{item.foodName}</h5>
                      <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 mt-0.5">
                        <span>Fabbisogno pasti: <strong className="text-slate-200">{item.neededGrams}g</strong></span>
                        <span>In dispensa: <strong className="text-amber-400">{item.inStorageGrams}g</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 font-mono">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block uppercase">Da comprare</span>
                        <span className="font-extrabold text-emerald-400 text-sm">
                          {item.toBuyPacks} {item.toBuyPacks === 1 ? "confezione" : "confezioni"}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block uppercase">Costo stimato</span>
                        <span className="font-extrabold text-white text-sm">€{(item.estimatedCostEuro || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section B: Collapsible Sufficient Storage Items */}
          {sufficientStorageItems.length > 0 && (
            <div className="glass-panel p-5 rounded-3xl space-y-3">
              <button
                onClick={() => setShowSufficientAccordion(!showSufficientAccordion)}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2">
                  <PackageCheck className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-200">
                    Alimenti già Sufficienti in Dispensa ({sufficientStorageItems.length})
                  </span>
                  <span className="text-[10px] font-mono bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Non occorre acquistare
                  </span>
                </div>
                {showSufficientAccordion ? (
                  <ChevronUp className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                )}
              </button>

              {showSufficientAccordion && (
                <div className="space-y-2 pt-2 border-t border-white/5">
                  {sufficientStorageItems.map((item) => {
                    const remainingAfter = item.inStorageGrams - item.neededGrams;
                    return (
                      <div
                        key={item.foodId}
                        className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-medium text-slate-300">{item.foodName}</span>
                          <span className="text-[11px] font-mono text-slate-400 block">
                            Servono: {item.neededGrams}g &middot; Hai: {item.inStorageGrams}g
                          </span>
                        </div>
                        <div className="text-right font-mono text-xs">
                          {remainingAfter === 0 ? (
                            <span className="text-[11px] text-rose-400 font-bold bg-rose-500/15 px-2 py-0.5 rounded-lg border border-rose-500/30">
                              ⚠️ Esaurito dopo questo pasto!
                            </span>
                          ) : (
                            <span className="text-[11px] text-emerald-400">
                              Rimanenza post pasti: {remainingAfter}g
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Section C: Non-food extra items */}
          <div className="glass-panel p-5 rounded-3xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Tag className="h-4 w-4 text-cyan-400" />
                  Articoli Extra Spesa (Non-Food / Casa)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Traccia carta forno, detersivo, sacchetti freezer o integratori con budget separato.
                </p>
              </div>
              <span className="text-xs font-mono text-cyan-400 font-bold">
                Totale Extra: €{totalExtraCost.toFixed(2)}
              </span>
            </div>

            {/* Quick add extra */}
            <form onSubmit={handleAddExtra} className="flex flex-wrap items-end gap-2.5">
              <div className="flex-1 min-w-[200px]">
                <label className="text-[11px] text-slate-400 block mb-1">Nome Articolo Extra</label>
                <input
                  type="text"
                  placeholder="Es. Carta forno, Sapone piatti, Shaker..."
                  value={newExtraName}
                  onChange={(e) => setNewExtraName(e.target.value)}
                  className="w-full glass-panel px-3 py-2 rounded-xl text-xs text-white"
                />
              </div>

              <div className="w-24">
                <label className="text-[11px] text-slate-400 block mb-1">Prezzo (€)</label>
                <input
                  type="number"
                  step={0.1}
                  value={newExtraPrice}
                  onChange={(e) => setNewExtraPrice(Math.max(0.1, Number(e.target.value)))}
                  className="w-full glass-panel px-3 py-2 rounded-xl text-xs text-white font-mono"
                />
              </div>

              <div className="w-36">
                <label className="text-[11px] text-slate-400 block mb-1">Categoria</label>
                <select
                  value={newExtraCategory}
                  onChange={(e) => setNewExtraCategory(e.target.value)}
                  className="w-full glass-panel px-3 py-2 rounded-xl text-xs text-white bg-slate-900"
                >
                  <option value="Cucina / Casa">Cucina / Casa</option>
                  <option value="Igiene / Cura">Igiene / Cura</option>
                  <option value="Integratori / Sport">Integratori / Sport</option>
                  <option value="Altro">Altro</option>
                </select>
              </div>

              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-cyan-500 text-white text-xs font-bold hover:bg-cyan-400 transition-colors"
              >
                + Aggiungi
              </button>
            </form>

            {/* Extra items list */}
            <div className="space-y-2 pt-2">
              {shoppingExtras.map((extra) => (
                <div
                  key={extra.id}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between text-xs ${
                    extra.isPurchased
                      ? "bg-white/[0.01] border-white/5 opacity-60"
                      : "bg-white/[0.03] border-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleExtraPurchased(extra.id)}
                      className="text-slate-400 hover:text-emerald-400"
                    >
                      {extra.isPurchased ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </button>
                    <div>
                      <span className={`font-semibold ${extra.isPurchased ? "line-through text-slate-400" : "text-white"}`}>
                        {extra.name}
                      </span>
                      <span className="text-[10px] font-mono text-cyan-400 block">
                        {extra.category || "Cucina"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 font-mono">
                    <span className="font-extrabold text-amber-300">
                      €{((extra.priceEuro ?? extra.estimatedPriceEuro ?? 0) * (extra.qty || 1)).toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleDeleteExtra(extra.id)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT FOOD ITEM WITH AI ESTIMATE */}
      {(isAddingFood || editingFood) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl glass-panel-elevated p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  {editingFood ? "Modifica Alimento" : "Nuovo Alimento in Dispensa"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setEditingFood(null);
                  setIsAddingFood(false);
                }}
                className="p-1.5 rounded-full text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFood} className="flex-1 overflow-y-auto space-y-4 my-2 pr-1">
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-medium">Nome Alimento</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Es. Salmone Selvaggio, Avena Integrale, Fesa di Tacchino..."
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="flex-1 glass-panel px-3.5 py-2.5 rounded-xl text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAiEstimateFood}
                    disabled={isEstimatingAi || !formName.trim()}
                    className="px-3 py-2.5 rounded-xl bg-violet-500/20 text-violet-300 border border-violet-500/40 text-xs font-semibold hover:bg-violet-500/30 disabled:opacity-40 flex items-center gap-1.5"
                    title="Stima calorie e macro accuratamente con IA"
                  >
                    {isEstimatingAi ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    <span>Stima con IA</span>
                  </button>
                </div>
              </div>

              {/* Category & Macros */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Kcal / 100g</label>
                  <input
                    type="number"
                    value={formKcal}
                    onChange={(e) => setFormKcal(Number(e.target.value))}
                    className="w-full glass-panel px-2.5 py-1.5 rounded-lg text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-emerald-400 block mb-0.5">Proteine (g)</label>
                  <input
                    type="number"
                    step={0.1}
                    value={formProtein}
                    onChange={(e) => setFormProtein(Number(e.target.value))}
                    className="w-full glass-panel px-2.5 py-1.5 rounded-lg text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-cyan-400 block mb-0.5">Carboidrati (g)</label>
                  <input
                    type="number"
                    step={0.1}
                    value={formCarbs}
                    onChange={(e) => setFormCarbs(Number(e.target.value))}
                    className="w-full glass-panel px-2.5 py-1.5 rounded-lg text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-amber-400 block mb-0.5">Grassi (g)</label>
                  <input
                    type="number"
                    step={0.1}
                    value={formFat}
                    onChange={(e) => setFormFat(Number(e.target.value))}
                    className="w-full glass-panel px-2.5 py-1.5 rounded-lg text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">Categoria Alimento</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as FoodItem["category"])}
                    className="w-full glass-panel px-3 py-2 rounded-xl text-xs text-white bg-slate-900"
                  >
                    <option value="proteico">Proteico</option>
                    <option value="carboidrato">Carboidrato</option>
                    <option value="grasso">Grasso</option>
                    <option value="vegetables">Verdure</option>
                    <option value="mix">Mix / Altro</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">Sodio (mg / 100g)</label>
                  <input
                    type="number"
                    value={formSodium}
                    onChange={(e) => setFormSodium(Number(e.target.value))}
                    className="w-full glass-panel px-3 py-2 rounded-xl text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* Packaging, Price, Storage */}
              <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl glass-panel">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Giacenza Dispensa (g)</label>
                  <input
                    type="number"
                    step={50}
                    value={formQty}
                    onChange={(e) => setFormQty(Number(e.target.value))}
                    className="w-full glass-panel px-2.5 py-1.5 rounded-lg text-xs text-emerald-400 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Formato Pacco (g)</label>
                  <input
                    type="number"
                    step={50}
                    value={formPackageSize}
                    onChange={(e) => setFormPackageSize(Number(e.target.value))}
                    className="w-full glass-panel px-2.5 py-1.5 rounded-lg text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Prezzo (€ / pacco)</label>
                  <input
                    type="number"
                    step={0.1}
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full glass-panel px-2.5 py-1.5 rounded-lg text-xs text-amber-300 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setEditingFood(null);
                    setIsAddingFood(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl mat-fab-primary text-xs font-bold"
                >
                  Salva Alimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
