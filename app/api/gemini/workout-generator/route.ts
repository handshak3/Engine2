import { NextRequest, NextResponse } from "next/server";
import { ai } from "@/lib/gemini";
import { Type } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const {
      sport = "Running",
      availableMinutes = 45,
      recentWorkouts = [],
      upcomingPlanned = [],
      userDescription = "",
      fatigueLevel = "moderate", // low, moderate, high
    } = await req.json();

    const prompt = `
Sei un coach per atleti ibridi.
Crea o suggerisci un allenamento ottimale per lo sport "${sport}" considerando:
- Tempo a disposizione: ${availableMinutes} minuti.
- Livello di affaticamento attuale: ${fatigueLevel}.
- Carico e sessioni recenti svolte: ${JSON.stringify(recentWorkouts.slice(0, 5))}
- Allenamenti pianificati nei prossimi giorni: ${JSON.stringify(upcomingPlanned.slice(0, 5))}
- Descrizione a parole dell'atleta (se fornita): "${userDescription || ""}"

Requisiti:
1. Se l'atleta ha descritto l'allenamento a parole, traduci esattamente la sua descrizione in una struttura di allenamento eseguibile e formattata come script compatibile con intervals.icu (es. per corsa: riscaldamento, ripetute, recupero, defaticamento; per forza/cali: riscaldamento articolare, blocchi di lavoro serie x reps + carico, recupero).
2. Se non ha fornito descrizione, suggerisci tu l'allenamento migliore bilanciando il recupero muscolare e lo stimolo aerobico/anaerobico.
3. Lo script generato deve poter essere salvato direttamente nel calendario/piano o eseguito live con i timer di Engine.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            sport: { type: Type.STRING },
            estimatedMinutes: { type: Type.NUMBER },
            estimatedKm: { type: Type.NUMBER },
            intensity: { type: Type.STRING, description: "Light, Moderate, Hard" },
            targetTssOrLoad: { type: Type.NUMBER },
            descriptionSummary: { type: Type.STRING },
            intervalsScript: { type: Type.STRING, description: "Script formattato per intervals.icu con step (-) e ripetizioni" },
            warmup: { type: Type.STRING },
            mainSet: { type: Type.STRING },
            cooldown: { type: Type.STRING },
            rationale: { type: Type.STRING, description: "Perché questo workout è adatto al carico dell'atleta" },
          },
          required: ["title", "sport", "estimatedMinutes", "intensity", "intervalsScript", "descriptionSummary", "rationale"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("Workout generator error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate workout" }, { status: 500 });
  }
}
