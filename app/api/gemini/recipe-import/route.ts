import { NextRequest, NextResponse } from "next/server";
import { ai } from "@/lib/gemini";
import { Type } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const { text, base64Image, mimeType = "image/jpeg", existingFoods = [] } = await req.json();

    if (!text && !base64Image) {
      return NextResponse.json({ error: "Either text or base64Image must be provided" }, { status: 400 });
    }

    const parts: any[] = [];
    if (base64Image) {
      // Remove data URL prefix if present
      const cleanBase64 = base64Image.replace(/^data:image\/[a-zA-Z]+;base64,/, "");
      parts.push({
        inlineData: {
          data: cleanBase64,
          mimeType,
        },
      });
    }

    const promptText = `
Sei un assistente per atleti che estrae ricette complete da testo o da fotografie/scansioni di ricettari e etichette.
Analizza il contenuto fornito ed estrai:
1. Nome della ricetta
2. Numero di porzioni
3. Istruzioni passo-passo
4. Lista di ingredienti con quantità in grammi o millilitri stimati.
5. Per ogni ingrediente, verifica se corrisponde a uno degli alimenti già registrati dall'utente (forniti qui sotto). Se corrisponde, segnala matchedFoodName. Se non è presente, fornisci una stima nutrizionale per 100g (kcal, proteine, carboidrati, grassi, fibre, sodio) in modo da registrarlo semi-automaticamente.

Alimenti già registrati nel database dell'utente:
${existingFoods.slice(0, 150).map((f: any) => `- ${f.name} (${f.kcal || 0} kcal, P:${f.protein || 0}g, C:${f.carbs || 0}g, F:${f.fat || 0}g)`).join("\n")}

Testo ricetta fornito dall'utente (se presente):
${text || ""}
`;

    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            servings: { type: Type.NUMBER },
            instructions: { type: Type.STRING },
            ingredients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  grams: { type: Type.NUMBER },
                  matchedRegisteredFood: { type: Type.STRING, description: "Nome alimento registrato coincidente, se trovato, altrimenti stringa vuota" },
                  isNewFood: { type: Type.BOOLEAN, description: "True se non presente nel database utente" },
                  estimatedPer100g: {
                    type: Type.OBJECT,
                    properties: {
                      kcal: { type: Type.NUMBER },
                      protein: { type: Type.NUMBER },
                      carbs: { type: Type.NUMBER },
                      fat: { type: Type.NUMBER },
                      fiber: { type: Type.NUMBER },
                      sodiumMg: { type: Type.NUMBER },
                      category: { type: Type.STRING, description: "proteico, glucidico, lipidico, verdura, or mix" },
                    },
                  },
                },
                required: ["name", "grams", "isNewFood"],
              },
            },
            totalMacrosPerServing: {
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
          },
          required: ["title", "servings", "ingredients", "totalMacrosPerServing"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("Recipe import error:", error);
    return NextResponse.json({ error: error.message || "Failed to parse recipe" }, { status: 500 });
  }
}
