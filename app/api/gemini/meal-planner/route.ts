import { NextRequest, NextResponse } from "next/server";
import { ai } from "@/lib/gemini";
import { Type } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      startDate,
      endDate,
      spendLevel = "normal", // economic, normal, expensive
      zeroWastePantry = true,
      pantryItems = [],
      dailyTargets = { kcal: 2600, protein: 160, carbs: 320, fat: 75, sodiumMg: 2500 },
      wheyIntegration = true,
      athletePreferences = "",
    } = body;

    const prompt = `
Sei un nutrizionista sportivo di livello mondiale specializzato in atleti ibridi (corsa di resistenza, endurance e forza/calisthenics).
Genera un piano alimentare dettagliato dal ${startDate} al ${endDate}.

Linee Guida Fondamentali:
1. NON inserire alimenti casuali slegati per fare quadrare i macro. Inserisci VERE E PROPRIE RICETTE strutturate, gustose e bilanciate.
2. ${
      zeroWastePantry
        ? "OPZIONE SVUOTA DISPENSA ATTIVA: Dai priorità assoluta agli ingredienti attualmente presenti nella dispensa dell'atleta per consumarli prima che scadano o finiscano."
        : "Utilizza ingredienti vari e di alta qualità."
    }
3. Livello di spesa richiesto: ${spendLevel.toUpperCase()} (economico = cibi nutrienti a basso costo come uova, legumi, riso, fiocchi d'avena; normale = bilanciato; costoso = tagli pregiati, salmone fresco, frutti di bosco, alimenti speciali).
4. Dosi Micronutrienti per Atleta Ibrido:
   - Assicurare adeguato sodio/sale (circa ${dailyTargets.sodiumMg || 2500}mg/giorno) e potassio per compensare la perdita idrosalina della corsa/sudorazione.
5. ${
      wheyIntegration
        ? "Se a fine giornata mancano proteine per raggiungere il target (${dailyTargets.protein}g), integra specificamente uno shake di proteine Whey con i grammi esatti mancanti."
        : ""
    }
6. Ingredienti in Dispensa Disponibili:
${pantryItems.map((p: any) => `- ${p.name}: ${p.qty} ${p.unit || "g"} (prezzo: €${p.price || 0})`).join("\n")}

Preferenze aggiuntive atleta: ${athletePreferences || "Nessuna preferenza particolare"}
Target giornalieri medi: Calorie ${dailyTargets.kcal} kcal | Proteine ${dailyTargets.protein}g | Carboidrati ${dailyTargets.carbs}g | Grassi ${dailyTargets.fat}g | Sodio ${dailyTargets.sodiumMg || 2500}mg.

Restituisci una struttura JSON rigorosa con i giorni pianificati, i pasti (Colazione, Pranzo, Spuntino, Cena), le ricette con dosi in grammi e i macro per pasto.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            days: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING },
                  dayLabel: { type: Type.STRING },
                  notes: { type: Type.STRING },
                  meals: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        type: { type: Type.STRING, description: "breakfast, lunch, snack, or dinner" },
                        title: { type: Type.STRING, description: "Nome della ricetta o del piatto" },
                        instructions: { type: Type.STRING, description: "Breve preparazione" },
                        kcal: { type: Type.NUMBER },
                        protein: { type: Type.NUMBER },
                        carbs: { type: Type.NUMBER },
                        fat: { type: Type.NUMBER },
                        sodiumMg: { type: Type.NUMBER },
                        usesPantry: { type: Type.BOOLEAN },
                        isWheyIntegration: { type: Type.BOOLEAN },
                        ingredients: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              name: { type: Type.STRING },
                              grams: { type: Type.NUMBER },
                              isFromPantry: { type: Type.BOOLEAN },
                              estimatedCost: { type: Type.NUMBER },
                            },
                            required: ["name", "grams"],
                          },
                        },
                      },
                      required: ["type", "title", "ingredients", "kcal", "protein", "carbs", "fat"],
                    },
                  },
                  dailyTotal: {
                    type: Type.OBJECT,
                    properties: {
                      kcal: { type: Type.NUMBER },
                      protein: { type: Type.NUMBER },
                      carbs: { type: Type.NUMBER },
                      fat: { type: Type.NUMBER },
                      sodiumMg: { type: Type.NUMBER },
                    },
                    required: ["kcal", "protein", "carbs", "fat"],
                  },
                },
                required: ["date", "meals", "dailyTotal"],
              },
            },
            summaryAdvice: { type: Type.STRING },
          },
          required: ["days"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("Meal planner error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate meal plan" }, { status: 500 });
  }
}
