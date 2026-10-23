import { NextRequest, NextResponse } from "next/server";
import { ai } from "@/lib/gemini";
import { Type } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const workoutData = await req.json();

    const prompt = `
Sei il Coach Tecnico di un atleta ibrido. Il tuo stile è SEVERO, ESIGENTE, SCIENTIFICO, MA CHE DÀ A CESARE QUEL CHE È DI CESARE: non regali complimenti se non meritati, evidenzi ogni calo di concentrazione, ogni deviazione dalle zone cardio o dal ritmo target, ma riconosci con rigore e precisione i punti di forza.

Dati della sessione da analizzare:
- Sport / Tipo: ${workoutData.sport || workoutData.type || "Workout"}
- Durata: ${workoutData.durationMinutes || workoutData.min || "N/A"} minuti
- Distanza: ${workoutData.distanceKm || workoutData.km || "N/A"} km
- Frequenza Cardiaca Media: ${workoutData.avgHr || workoutData.hr || "N/A"} bpm (Max: ${workoutData.maxHr || "N/A"} bpm)
- Zone Cardio / Tempo in zone: ${JSON.stringify(workoutData.hrZones || workoutData.hrz || [])}
- Cadenza Running (SPM / RPM): ${workoutData.avgCadence || workoutData.cadence || "N/A"} (Fasi / Dati: ${JSON.stringify(workoutData.cadencePhases || [])})
- Passo Medio / Zone Passo: ${workoutData.pace || workoutData.avgPace || "N/A"} (Zone passo: ${JSON.stringify(workoutData.paceZones || workoutData.pz || [])})
- Programma prescritto: ${workoutData.prescribedPlan || workoutData.script || workoutData.note || "Nessuna scheda prescritta specifica"}
- Esercizi, Serie e Ripetizioni svolte: ${JSON.stringify(workoutData.sets || workoutData.exercises || [])}
- RPE atleta (sforzo percepito 1-10): ${workoutData.rpe || "N/A"}
- Sensazioni e note dell'atleta: ${workoutData.notes || workoutData.sensations || "Nessuna nota aggiuntiva"}

Fornisci:
1. Punteggio globale da 1 a 100 (score). Sii severo: un allenamento mediocre prende 55-65, un allenamento appena sufficiente 68-74, un'ottima esecuzione 80-88, l'eccellenza assoluta 90+.
2. Analisi aderenza alla scheda e volume svolto.
3. Nel Running / Endurance: valutazione dettagliata della cadenza (SPM/RPM ideale ~175-185, se troppo bassa penalizza), rispetto delle zone di passo e cardio (es. deriva cardiaca precoce, sforamento in Z3 durante Z2, ecc.).
4. Nella Forza / Calisthenics: valutazione del carico, RIR, completamento serie, gestione recuperi.
5. 3 suggerimenti tecnici prioritari e precisi per migliorare la prossima sessione.
6. Stima del tempo di recupero consigliato in ore prima della prossima sessione intensa.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER, description: "Punteggio severo da 1 a 100" },
            grade: { type: Type.STRING, description: "Es: 'Sufficiente', 'Mediocre', 'Ottimo', 'Eccellente'" },
            summaryRecap: { type: Type.STRING, description: "Sintesi severa e diretta dell'esecuzione" },
            adherenceScore: { type: Type.INTEGER, description: "Aderenza 1-100" },
            intensityScore: { type: Type.INTEGER, description: "Gestione intensità e zone 1-100" },
            cadencePaceAnalysis: { type: Type.STRING, description: "Giudizio su cadenza SPM/RPM, ritmo e fasi" },
            strengthExecutionAnalysis: { type: Type.STRING, description: "Giudizio su serie, carichi, reps e cedimento" },
            actionableTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Suggerimenti tecnici prioritari",
            },
            recoveryHoursSuggested: { type: Type.INTEGER, description: "Ore di recupero consigliate prima del prossimo wo intenso" },
          },
          required: ["score", "grade", "summaryRecap", "adherenceScore", "intensityScore", "actionableTips", "recoveryHoursSuggested"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("Coach eval error:", error);
    return NextResponse.json({ error: error.message || "Failed to evaluate workout" }, { status: 500 });
  }
}
