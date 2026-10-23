import { NextRequest, NextResponse } from "next/server";
import { ai } from "@/lib/gemini";
import { Type } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const { foodName, kcal, protein, carbs, fat } = await req.json();

    if (!foodName) {
      return NextResponse.json({ error: "foodName is required" }, { status: 400 });
    }

    const prompt = `
Sei un esperto di classificazione nutrizionale.
Dato l'alimento "${foodName}" con valori per 100g: ${kcal || 0} kcal, Proteine: ${protein || 0}g, Carboidrati: ${carbs || 0}g, Grassi: ${fat || 0}g.
Determina la corretta categoria primaria tra le seguenti opzioni esatte:
- "proteico": fonti prevalentemente proteiche (carne, pesce, uova, albume, bresaola, yogurt greco, fiocchi di latte, seitan, soia, proteine in polvere)
- "glucidico": fonti primarie di carboidrati complessi o zuccheri (riso, avena, pasta, pane, patate, cereali, frutta fresca/disidratata, miele, gallette)
- "lipidico": fonti primarie di grassi (olio d'oliva, burro, frutta secca, mandorle, noci, burro d'arachidi, semi, avocado)
- "verdura": ortaggi e verdure a foglia o fibrosi a basso apporto energetico (spinaci, zucchine, broccoli, insalata, finocchi, cetrioli, pomodori)
- "mix": alimenti compositi con ripartizione equilibrata o piatti pronti (es. pizza, lasagna, barrette bilanciate)
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            correctedCategory: { type: Type.STRING, description: "proteico, glucidico, lipidico, verdura, or mix" },
            rationale: { type: Type.STRING },
          },
          required: ["correctedCategory", "rationale"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("Food category fix error:", error);
    return NextResponse.json({ error: error.message || "Failed to fix category" }, { status: 500 });
  }
}
