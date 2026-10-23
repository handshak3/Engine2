import { NextRequest, NextResponse } from "next/server";
import { ai } from "@/lib/gemini";
import { Type } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const { foodName, portionGrams = 100 } = await req.json();

    if (!foodName || typeof foodName !== "string") {
      return NextResponse.json({ error: "Food name required" }, { status: 400 });
    }

    const prompt = `
Sei un database nutrizionale scientifico.
Fornisci una stima accuratissima dei valori nutrizionali per il seguente alimento: "${foodName}".
La stima deve riferirsi a 100 grammi di prodotto, ma calcola anche i valori per la porzione richiesta di ${portionGrams}g.
Determina anche la categoria prevalente dell'alimento tra:
- "proteico" (alto contenuto proteico come carne, pesce, uova, tofu, seitan, latticini magri)
- "glucidico" (carboidrati complessi/semplici come riso, pasta, patate, pane, cereali, frutta)
- "lipidico" (grassi sani, olio, frutta secca, semi, burro)
- "verdura" (verdure a basso apporto calorico, ricche di fibre e micronutrienti)
- "mix" (alimenti composti con macro distribuiti)
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            normalizedName: { type: Type.STRING },
            category: { type: Type.STRING, description: "proteico, glucidico, lipidico, verdura, or mix" },
            servingGrams: { type: Type.NUMBER },
            per100g: {
              type: Type.OBJECT,
              properties: {
                kcal: { type: Type.NUMBER },
                protein: { type: Type.NUMBER },
                carbs: { type: Type.NUMBER },
                fat: { type: Type.NUMBER },
                fiber: { type: Type.NUMBER },
                sodiumMg: { type: Type.NUMBER },
              },
              required: ["kcal", "protein", "carbs", "fat"],
            },
            forServing: {
              type: Type.OBJECT,
              properties: {
                kcal: { type: Type.NUMBER },
                protein: { type: Type.NUMBER },
                carbs: { type: Type.NUMBER },
                fat: { type: Type.NUMBER },
                fiber: { type: Type.NUMBER },
                sodiumMg: { type: Type.NUMBER },
              },
              required: ["kcal", "protein", "carbs", "fat"],
            },
            packageStandardSizeGrams: { type: Type.NUMBER, description: "Formato confezione tipico (es. 500 per pasta, 250 per ricotta, ecc.)" },
            estimatedPriceEuro: { type: Type.NUMBER },
            confidenceExplanation: { type: Type.STRING },
          },
          required: ["normalizedName", "category", "per100g", "forServing"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("Food estimate error:", error);
    return NextResponse.json({ error: error.message || "Failed to estimate food macros" }, { status: 500 });
  }
}
