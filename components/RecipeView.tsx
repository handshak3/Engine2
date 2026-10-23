"use client";

import React, { useState } from "react";
import { Recipe, RecipeIngredient, FoodItem } from "@/lib/types";
import {
  UtensilsCrossed,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  Camera,
  Search,
  Check,
  X,
  Loader2,
  ChefHat,
  Flame,
  Euro,
  Layers,
  FileText,
} from "lucide-react";

interface RecipeViewProps {
  recipes: Recipe[];
  foods: FoodItem[];
  onAddRecipe: (recipe: Recipe) => void;
  onUpdateRecipe: (recipe: Recipe) => void;
  onDeleteRecipe: (recipeId: string) => void;
  onAddFood: (food: FoodItem) => void;
}

export default function RecipeView({
  recipes,
  foods,
  onAddRecipe,
  onUpdateRecipe,
  onDeleteRecipe,
  onAddFood,
}: RecipeViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Recipe Form state
  const [formName, setFormName] = useState("");
  const [formServings, setFormServings] = useState(1);
  const [formCategory, setFormCategory] = useState("Pranzo");
  const [formInstructions, setFormInstructions] = useState("");
  const [formIngredients, setFormIngredients] = useState<RecipeIngredient[]>([]);

  // Add ingredient selector state inside recipe form
  const [selectedFoodId, setSelectedFoodId] = useState<string>("");
  const [selectedGrams, setSelectedGrams] = useState<number>(100);
  const [unregisteredFoodName, setUnregisteredFoodName] = useState("");
  const [isAddingUnregistered, setIsAddingUnregistered] = useState(false);

  // AI Import modal
  const [showAiImportModal, setShowAiImportModal] = useState(false);
  const [importText, setImportText] = useState("");
  const [importImageBase64, setImportImageBase64] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Open recipe editor
  const handleOpenEditor = (recipe?: Recipe) => {
    if (recipe) {
      setEditingRecipe(recipe);
      setFormName(recipe.name);
      setFormServings(recipe.servings || 1);
      setFormCategory(recipe.category || "Pranzo");
      setFormInstructions(recipe.instructions || "");
      setFormIngredients([...recipe.ingredients]);
      setIsCreatingNew(false);
    } else {
      setEditingRecipe(null);
      setFormName("");
      setFormServings(1);
      setFormCategory("Pranzo");
      setFormInstructions("");
      setFormIngredients([]);
      setIsCreatingNew(true);
    }
  };

  // Add ingredient to active form
  const handleAddIngredient = () => {
    if (!selectedFoodId && !unregisteredFoodName.trim()) return;

    if (selectedFoodId) {
      const food = foods.find((f) => f.id === selectedFoodId);
      if (!food) return;
      setFormIngredients((prev) => [
        ...prev,
        {
          foodId: food.id,
          foodName: food.name,
          grams: selectedGrams,
        },
      ]);
      setSelectedFoodId("");
      setSelectedGrams(100);
    } else if (unregisteredFoodName.trim()) {
      // Auto-register new food item
      const newFoodId = `f-auto-${Date.now()}`;
      const newFood: FoodItem = {
        id: newFoodId,
        name: unregisteredFoodName.trim(),
        kcal: 150,
        protein: 10,
        carbs: 15,
        fat: 4,
        category: "mix",
        packageSizeGrams: 500,
        priceEuro: 2.5,
        storageQty: 0,
        unit: "g",
        isNewAdded: true,
      };
      onAddFood(newFood);
      setFormIngredients((prev) => [
        ...prev,
        {
          foodId: newFoodId,
          foodName: newFood.name,
          grams: selectedGrams,
        },
      ]);
      setUnregisteredFoodName("");
      setIsAddingUnregistered(false);
    }
  };

  const handleRemoveIngredient = (index: number) => {
    setFormIngredients((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Save Recipe
  const handleSaveRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || formIngredients.length === 0) return;

    let totalKcal = 0;
    let totalP = 0;
    let totalC = 0;
    let totalF = 0;
    let totalSodium = 0;
    let totalCost = 0;

    formIngredients.forEach((ing) => {
      const food = foods.find((f) => f.id === ing.foodId);
      if (food) {
        totalKcal += (food.kcal * ing.grams) / 100;
        totalP += (food.protein * ing.grams) / 100;
        totalC += (food.carbs * ing.grams) / 100;
        totalF += (food.fat * ing.grams) / 100;
        totalSodium += ((food.sodiumMg || 0) * ing.grams) / 100;
        totalCost += (food.priceEuro * ing.grams) / (food.packageSizeGrams || 1000);
      }
    });

    const s = Math.max(1, formServings);

    const recipeObj: Recipe = {
      id: editingRecipe ? editingRecipe.id : `r-${Date.now()}`,
      name: formName.trim(),
      servings: s,
      category: formCategory,
      instructions: formInstructions.trim(),
      ingredients: formIngredients,
      kcalPerServing: Math.round(totalKcal / s),
      proteinPerServing: Math.round(totalP / s),
      carbsPerServing: Math.round(totalC / s),
      fatPerServing: Math.round(totalF / s),
      sodiumMgPerServing: Math.round(totalSodium / s),
      estimatedCostPerServing: Math.round((totalCost / s) * 100) / 100,
    };

    if (editingRecipe) {
      onUpdateRecipe(recipeObj);
    } else {
      onAddRecipe(recipeObj);
    }

    setEditingRecipe(null);
    setIsCreatingNew(false);
  };

  // AI Recipe Import
  const handleImportAiRecipe = async () => {
    if (!importText.trim() && !importImageBase64) return;
    setIsImporting(true);
    try {
      const res = await fetch("/api/gemini/recipe-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: importText,
          base64Image: importImageBase64,
          existingFoods: foods,
        }),
      });
      const data = await res.json();
      if (data && data.title) {
        const mappedIngredients: RecipeIngredient[] = [];
        (data.ingredients || []).forEach((ing: {
          name: string;
          matchedRegisteredFood?: string;
          grams?: number;
          estimatedPer100g?: {
            kcal?: number;
            protein?: number;
            carbs?: number;
            fat?: number;
            fiber?: number;
            sodiumMg?: number;
            category?: string;
          };
        }) => {
          let matchedFood = foods.find(
            (f) =>
              f.name.toLowerCase() === (ing.matchedRegisteredFood || "").toLowerCase() ||
              f.name.toLowerCase() === ing.name.toLowerCase()
          );

          if (!matchedFood) {
            matchedFood = {
              id: `f-import-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              name: ing.name,
              kcal: ing.estimatedPer100g?.kcal || 120,
              protein: ing.estimatedPer100g?.protein || 8,
              carbs: ing.estimatedPer100g?.carbs || 15,
              fat: ing.estimatedPer100g?.fat || 3,
              fiber: ing.estimatedPer100g?.fiber || 1,
              sodiumMg: ing.estimatedPer100g?.sodiumMg || 50,
              category: (ing.estimatedPer100g?.category as FoodItem["category"]) || "mix",
              packageSizeGrams: 500,
              priceEuro: 2.0,
              storageQty: 0,
              unit: "g",
              isNewAdded: true,
            };
            onAddFood(matchedFood);
          }

          mappedIngredients.push({
            foodId: matchedFood.id,
            foodName: matchedFood.name,
            grams: ing.grams || 100,
          });
        });

        setEditingRecipe(null);
        setFormName(data.title);
        setFormServings(data.servings || 1);
        setFormCategory("Pranzo");
        setFormInstructions(data.instructions || "");
        setFormIngredients(mappedIngredients);
        setIsCreatingNew(true);
        setShowAiImportModal(false);
        setImportText("");
        setImportImageBase64(null);
      }
    } catch (err) {
      console.error("Import error:", err);
    } finally {
      setIsImporting(false);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImportImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredRecipes = recipes.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Hero Glass Banner */}
      <div className="glass-panel-elevated p-6 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-emerald-400 mb-1.5">
              <ChefHat className="h-4 w-4" />
              <span>Smart Culinary Engine &middot; Hybrid Fuel</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Ricettario & Preparazioni
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Crea piatti bilanciati usando i cibi della dispensa con dosaggi precisi, oppure acquisisci ricette
              all&apos;istante con l&apos;AI multimodale da testo o foto.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowAiImportModal(true)}
              className="px-4 py-2.5 rounded-2xl border border-cyan-400/30 bg-cyan-500/15 text-cyan-200 text-xs font-semibold flex items-center gap-2 hover:bg-cyan-500/25 transition-all shadow-sm"
            >
              <Camera className="h-4 w-4" />
              <span>Importa Foto / Testo (AI)</span>
            </button>

            <button
              onClick={() => handleOpenEditor()}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold flex items-center gap-2 hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/20"
            >
              <Plus className="h-4 w-4" />
              <span>Crea Nuova Ricetta</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Cerca ricetta per nome (es. Risotto, Porridge, Pollo al curry)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full glass-panel pl-11 pr-4 py-3 rounded-2xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500/50 transition-all"
        />
      </div>

      {/* Recipes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredRecipes.map((recipe) => (
          <div
            key={recipe.id}
            className="glass-panel p-5 rounded-3xl flex flex-col justify-between hover:border-emerald-500/30 transition-all group"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-300">
                    {recipe.category || "Pasto"} &middot; {recipe.servings}{" "}
                    {recipe.servings === 1 ? "porzione" : "porzioni"}
                  </span>
                </div>
                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleOpenEditor(recipe)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-white/5 transition-colors"
                    title="Modifica ricetta"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteRecipe(recipe.id)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-white/5 transition-colors"
                    title="Elimina ricetta"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <h4 className="text-base font-bold text-white mt-3 group-hover:text-emerald-300 transition-colors">
                {recipe.name}
              </h4>

              {/* Per-serving Macros (Apple Fitness Style) */}
              <div className="mt-3.5 grid grid-cols-4 gap-1.5 p-2.5 rounded-2xl bg-black/40 border border-white/5 font-mono text-center text-xs">
                <div>
                  <span className="text-[9px] text-slate-400 block tracking-wider">KCAL</span>
                  <span className="font-extrabold text-white text-sm">{recipe.kcalPerServing}</span>
                </div>
                <div>
                  <span className="text-[9px] text-emerald-400/80 block tracking-wider">PRO</span>
                  <span className="font-extrabold text-emerald-400 text-sm">{recipe.proteinPerServing}g</span>
                </div>
                <div>
                  <span className="text-[9px] text-cyan-400/80 block tracking-wider">CARB</span>
                  <span className="font-extrabold text-cyan-400 text-sm">{recipe.carbsPerServing}g</span>
                </div>
                <div>
                  <span className="text-[9px] text-amber-400/80 block tracking-wider">FAT</span>
                  <span className="font-extrabold text-amber-400 text-sm">{recipe.fatPerServing}g</span>
                </div>
              </div>

              {/* Ingredients preview */}
              <div className="mt-3.5 space-y-1.5">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">
                  Ingredienti:
                </span>
                <ul className="text-xs text-slate-300 space-y-1">
                  {recipe.ingredients.slice(0, 4).map((ing, idx) => (
                    <li key={idx} className="flex justify-between items-center text-[11px] font-mono py-0.5 border-b border-white/5 last:border-0">
                      <span className="truncate max-w-[190px] text-slate-200">{ing.foodName}</span>
                      <span className="text-slate-400">{ing.grams}g</span>
                    </li>
                  ))}
                  {recipe.ingredients.length > 4 && (
                    <li className="text-[10px] text-slate-400 italic pt-1">
                      + altri {recipe.ingredients.length - 4} ingredienti...
                    </li>
                  )}
                </ul>
              </div>

              {recipe.instructions && (
                <p className="mt-3 text-[11px] text-slate-400 italic line-clamp-2 bg-white/[0.02] p-2 rounded-xl">
                  &ldquo;{recipe.instructions}&rdquo;
                </p>
              )}
            </div>

            <div className="mt-4 pt-3.5 border-t border-white/5 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 flex items-center gap-1">
                <Euro className="h-3 w-3 text-emerald-400" />
                Costo stimato:
              </span>
              <strong className="text-emerald-400 font-bold">
                €{recipe.estimatedCostPerServing ? recipe.estimatedCostPerServing.toFixed(2) : "0.00"} / porz.
              </strong>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: CREATE / EDIT RECIPE */}
      {(isCreatingNew || editingRecipe) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl glass-panel-elevated p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <ChefHat className="h-5 w-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">
                  {editingRecipe ? "Modifica Ricetta" : "Crea Nuova Ricetta"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setEditingRecipe(null);
                  setIsCreatingNew(false);
                }}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRecipe} className="flex-1 overflow-y-auto space-y-4 my-4 pr-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="text-xs text-slate-300 block mb-1 font-medium">Nome Ricetta</label>
                  <input
                    type="text"
                    required
                    placeholder="Es. Pancake Proteici Avena & Mirtilli"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full glass-panel px-3.5 py-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 block mb-1 font-medium">Numero Porzioni</label>
                  <input
                    type="number"
                    min={1}
                    value={formServings}
                    onChange={(e) => setFormServings(Math.max(1, Number(e.target.value)))}
                    className="w-full glass-panel px-3.5 py-2.5 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1 font-medium">Istruzioni di Preparazione</label>
                <textarea
                  rows={2}
                  placeholder="Es. Cuoci in padella a fuoco medio per 3 minuti per lato..."
                  value={formInstructions}
                  onChange={(e) => setFormInstructions(e.target.value)}
                  className="w-full glass-panel p-3 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* Ingredients Builder */}
              <div className="p-4 rounded-2xl glass-panel space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Ingredienti della Ricetta ({formIngredients.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingUnregistered(!isAddingUnregistered)}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-medium"
                  >
                    {isAddingUnregistered ? "Scegli da lista registrati" : "+ Alimento non ancora registrato"}
                  </button>
                </div>

                {/* Add ingredient controls */}
                <div className="flex flex-wrap items-end gap-2.5">
                  {!isAddingUnregistered ? (
                    <div className="flex-1 min-w-[200px]">
                      <label className="text-[11px] text-slate-400 block mb-1">Seleziona Alimento</label>
                      <select
                        value={selectedFoodId}
                        onChange={(e) => setSelectedFoodId(e.target.value)}
                        className="w-full glass-panel px-3 py-2 rounded-xl text-xs text-white bg-slate-900"
                      >
                        <option value="">-- Scegli alimento registrato --</option>
                        {foods.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name} ({f.kcal} kcal, P:{f.protein}g)
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="flex-1 min-w-[200px]">
                      <label className="text-[11px] text-slate-400 block mb-1">
                        Nuovo Alimento (verrà registrato in archivio)
                      </label>
                      <input
                        type="text"
                        placeholder="Nome alimento (es. Farina di Riso, Albume)..."
                        value={unregisteredFoodName}
                        onChange={(e) => setUnregisteredFoodName(e.target.value)}
                        className="w-full glass-panel px-3 py-2 rounded-xl text-xs text-white"
                      />
                    </div>
                  )}

                  <div className="w-24">
                    <label className="text-[11px] text-slate-400 block mb-1">Grammi</label>
                    <input
                      type="number"
                      value={selectedGrams}
                      onChange={(e) => setSelectedGrams(Math.max(5, Number(e.target.value)))}
                      className="w-full glass-panel px-3 py-2 rounded-xl text-xs text-white font-mono"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddIngredient}
                    className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-400 transition-colors"
                  >
                    Aggiungi
                  </button>
                </div>

                {/* Ingredients list in form */}
                <div className="space-y-1.5 pt-2">
                  {formIngredients.map((ing, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs"
                    >
                      <span className="font-medium text-white">{ing.foodName}</span>
                      <div className="flex items-center gap-3 font-mono">
                        <span className="text-slate-300">{ing.grams}g</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredient(idx)}
                          className="text-slate-500 hover:text-rose-400 p-1"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setEditingRecipe(null);
                    setIsCreatingNew(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold hover:from-emerald-400 hover:to-teal-400 shadow-lg shadow-emerald-500/20"
                >
                  Salva Ricetta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AI RECIPE IMPORT (TEXT / CAMERA / IMAGE) */}
      {showAiImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-lg rounded-3xl glass-panel-elevated p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <Camera className="h-5 w-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Importa Ricetta da Testo o Fotocamera</h3>
              </div>
              <button
                onClick={() => setShowAiImportModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <p className="text-slate-300">
                Incolla il testo di una ricetta o carica/scatta una foto di un ricettario. L&apos;AI abbinerà
                automaticamente gli ingredienti al tuo database e creerà quelli mancanti.
              </p>

              <div>
                <label className="text-slate-300 block mb-1.5 font-medium">Incolla testo ricetta:</label>
                <textarea
                  rows={4}
                  placeholder="Es. 'Risotto ai funghi e parmigiano: 100g riso carnaroli, 150g funghi, 20g parmigiano, 10g burro...'"
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  className="w-full glass-panel p-3 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1.5 font-medium">Oppure carica foto / scatta con fotocamera:</label>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageFileChange}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:bg-white/10 file:text-cyan-300 file:text-xs file:font-semibold"
                />
                {importImageBase64 && (
                  <div className="mt-2 text-emerald-400 text-[11px] flex items-center gap-1.5">
                    <Check className="h-4 w-4" /> Immagine pronta per l&apos;analisi AI
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleImportAiRecipe}
              disabled={isImporting || (!importText.trim() && !importImageBase64)}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 py-3 text-xs font-bold text-white hover:from-cyan-400 hover:to-blue-400 disabled:opacity-40 transition-all shadow-lg shadow-cyan-500/20"
            >
              {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Analizza & Importa Ricetta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
