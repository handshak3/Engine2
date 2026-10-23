"use client";

import React, { useState, useEffect } from "react";
import AppLayout, { NavTab } from "@/components/AppLayout";
import WeatherWidget from "@/components/WeatherWidget";
import WorkoutView from "@/components/WorkoutView";
import MealPlanView from "@/components/MealPlanView";
import RecipeView from "@/components/RecipeView";
import PantryShoppingView from "@/components/PantryShoppingView";
import CalculatorsView from "@/components/CalculatorsView";
import ReportsView from "@/components/ReportsView";
import LocationModal from "@/components/LocationModal";
import {
  getEngineStorage,
  saveEngineStorage,
  EngineAppData,
} from "@/lib/storage";
import {
  WorkoutSession,
  DayMealPlan,
  FoodItem,
  Recipe,
  ExerciseDefinition,
  ShoppingExtraItem,
  RaceReport,
  CheckInRecord,
  UserSettings,
} from "@/lib/types";
import { WorkoutWeatherCheck, fetchWorkoutWeather } from "@/lib/weather";

export default function Home() {
  const [data, setData] = useState<EngineAppData>(() => getEngineStorage());
  const [activeTab, setActiveTab] = useState<NavTab>("workouts");
  const [weather, setWeather] = useState<WorkoutWeatherCheck | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [scheduledWorkoutTime, setScheduledWorkoutTime] = useState<string>(() => {
    const loaded = getEngineStorage();
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayWo = loaded.workouts.find((w) => w.date === todayStr);
    return todayWo?.scheduledTime || "18:00";
  });
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  const refreshWeather = async () => {
    setIsLoadingWeather(true);
    try {
      const w = await fetchWorkoutWeather(
        data.settings.latitude || 45.4642,
        data.settings.longitude || 9.19,
        data.settings.currentLocationName || "Milano, Italia",
        scheduledWorkoutTime
      );
      setWeather(w);
    } catch (err) {
      console.error("Weather error:", err);
    } finally {
      setIsLoadingWeather(false);
    }
  };

  // Fetch weather on location or scheduled time change
  useEffect(() => {
    let isMounted = true;
    async function load() {
      setIsLoadingWeather(true);
      try {
        const w = await fetchWorkoutWeather(
          data.settings.latitude || 45.4642,
          data.settings.longitude || 9.19,
          data.settings.currentLocationName || "Milano, Italia",
          scheduledWorkoutTime
        );
        if (isMounted) setWeather(w);
      } catch (err) {
        console.error("Weather error:", err);
      } finally {
        if (isMounted) setIsLoadingWeather(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [data.settings.latitude, data.settings.longitude, data.settings.currentLocationName, scheduledWorkoutTime]);

  // Sync state helper
  const updateState = (updater: (prev: EngineAppData) => EngineAppData) => {
    setData((prev) => {
      if (!prev) return prev;
      const next = updater(prev);
      saveEngineStorage(next);
      return next;
    });
  };

  // Workout handlers
  const handleUpdateWorkout = (updated: WorkoutSession) => {
    updateState((s) => ({
      ...s,
      workouts: s.workouts.map((w) => (w.id === updated.id ? updated : w)),
    }));
  };

  const handleAddWorkout = (newWo: WorkoutSession) => {
    updateState((s) => ({
      ...s,
      workouts: [newWo, ...s.workouts],
    }));
  };

  const handleAddExercise = (newEx: ExerciseDefinition) => {
    updateState((s) => ({
      ...s,
      exercises: [...s.exercises, newEx],
    }));
  };

  // Meal Plan handlers
  const handleUpdateMealPlan = (date: string, plan: DayMealPlan) => {
    updateState((s) => ({
      ...s,
      mealPlans: {
        ...s.mealPlans,
        [date]: plan,
      },
    }));
  };

  // Food handlers
  const handleUpdateFood = (updated: FoodItem) => {
    updateState((s) => ({
      ...s,
      foods: s.foods.map((f) => (f.id === updated.id ? updated : f)),
    }));
  };

  const handleAddFood = (newFood: FoodItem) => {
    updateState((s) => ({
      ...s,
      foods: [newFood, ...s.foods],
    }));
  };

  const handleDeleteFood = (foodId: string) => {
    updateState((s) => ({
      ...s,
      foods: s.foods.filter((f) => f.id !== foodId),
    }));
  };

  // Recipe handlers
  const handleAddRecipe = (recipe: Recipe) => {
    updateState((s) => ({
      ...s,
      recipes: [recipe, ...s.recipes],
    }));
  };

  const handleUpdateRecipe = (recipe: Recipe) => {
    updateState((s) => ({
      ...s,
      recipes: s.recipes.map((r) => (r.id === recipe.id ? recipe : r)),
    }));
  };

  const handleDeleteRecipe = (recipeId: string) => {
    updateState((s) => ({
      ...s,
      recipes: s.recipes.filter((r) => r.id !== recipeId),
    }));
  };

  // Shopping Extras handlers
  const handleUpdateShoppingExtras = (extras: ShoppingExtraItem[]) => {
    updateState((s) => ({
      ...s,
      shoppingExtras: extras,
    }));
  };

  // CheckIn handler
  const handleUpdateCheckIn = (date: string, checkIn: CheckInRecord) => {
    updateState((s) => ({
      ...s,
      checkIns: {
        ...s.checkIns,
        [date]: checkIn,
      },
    }));
  };

  // Race Report handlers
  const handleAddRaceReport = (r: RaceReport) => {
    updateState((s) => ({
      ...s,
      raceReports: [r, ...s.raceReports],
    }));
  };

  const handleUpdateRaceReport = (r: RaceReport) => {
    updateState((s) => ({
      ...s,
      raceReports: s.raceReports.map((item) => (item.id === r.id ? r : item)),
    }));
  };

  const handleDeleteRaceReport = (id: string) => {
    updateState((s) => ({
      ...s,
      raceReports: s.raceReports.filter((item) => item.id !== id),
    }));
  };

  // Settings & Location handlers
  const handleUpdateSettings = (newSettings: UserSettings) => {
    updateState((s) => ({
      ...s,
      settings: newSettings,
    }));
  };

  const handleLocationChange = (name: string, lat: number, lon: number) => {
    if (!data) return;
    const nextSettings: UserSettings = {
      ...data.settings,
      currentLocationName: name,
      latitude: lat,
      longitude: lon,
    };
    handleUpdateSettings(nextSettings);
  };

  const handleScheduledTimeChange = (newTime: string) => {
    setScheduledWorkoutTime(newTime);
    // Also update any workout scheduled for today
    if (data) {
      const todayStr = new Date().toISOString().slice(0, 10);
      const todayWo = data.workouts.find((w) => w.date === todayStr);
      if (todayWo) {
        handleUpdateWorkout({ ...todayWo, scheduledTime: newTime });
      }
    }
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-[#090D16] flex items-center justify-center text-slate-400 font-mono text-sm">
        Caricamento Engine OS...
      </div>
    );
  }

  return (
    <AppLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      settings={data.settings}
      onUpdateSettings={handleUpdateSettings}
      weather={weather}
      onRefreshWeather={refreshWeather}
      onLocationChange={handleLocationChange}
      scheduledTime={scheduledWorkoutTime}
      onTimeChange={handleScheduledTimeChange}
    >
      <div className="space-y-6">
        {/* Weather card displayed directly inside the Workout view or when viewing workouts */}
        {activeTab === "workouts" && (
          <WeatherWidget
            weather={weather}
            scheduledTime={scheduledWorkoutTime}
            onTimeChange={handleScheduledTimeChange}
            onOpenLocationModal={() => setIsLocationModalOpen(true)}
            onRefreshWeather={refreshWeather}
            isLoading={isLoadingWeather}
          />
        )}

        {/* Dynamic Tab Views */}
        {activeTab === "workouts" && (
          <WorkoutView
            workouts={data.workouts}
            exercises={data.exercises}
            settings={data.settings}
            weather={weather}
            onUpdateWorkout={handleUpdateWorkout}
            onAddWorkout={handleAddWorkout}
            onAddExercise={handleAddExercise}
            onUpdateSettings={handleUpdateSettings}
          />
        )}

        {activeTab === "nutrition" && (
          <MealPlanView
            mealPlans={data.mealPlans}
            foods={data.foods}
            recipes={data.recipes}
            settings={data.settings}
            onUpdateMealPlan={handleUpdateMealPlan}
            onUpdateFood={handleUpdateFood}
            onOpenRecipeModal={() => setActiveTab("recipes")}
          />
        )}

        {activeTab === "recipes" && (
          <RecipeView
            recipes={data.recipes}
            foods={data.foods}
            onAddRecipe={handleAddRecipe}
            onUpdateRecipe={handleUpdateRecipe}
            onDeleteRecipe={handleDeleteRecipe}
            onAddFood={handleAddFood}
          />
        )}

        {activeTab === "pantry" && (
          <PantryShoppingView
            foods={data.foods}
            shoppingExtras={data.shoppingExtras}
            mealPlans={data.mealPlans}
            onUpdateFood={handleUpdateFood}
            onAddFood={handleAddFood}
            onDeleteFood={handleDeleteFood}
            onUpdateExtras={handleUpdateShoppingExtras}
          />
        )}

        {activeTab === "calculators" && (
          <CalculatorsView settings={data.settings} />
        )}

        {activeTab === "reports" && (
          <ReportsView
            raceReports={data.raceReports}
            checkIns={data.checkIns}
            mealPlans={data.mealPlans}
            foods={data.foods}
            recipes={data.recipes}
            settings={data.settings}
            onAddRaceReport={handleAddRaceReport}
            onUpdateRaceReport={handleUpdateRaceReport}
            onDeleteRaceReport={handleDeleteRaceReport}
            onUpdateCheckIn={handleUpdateCheckIn}
            onUpdateSettings={handleUpdateSettings}
          />
        )}
      </div>

      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentLocationName={data.settings.currentLocationName}
        onSelectLocation={handleLocationChange}
      />
    </AppLayout>
  );
}
