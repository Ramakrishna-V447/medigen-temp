
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const getChatResponse = async (userMessage: string): Promise<string> => {
  if (!apiKey) {
    return "AI service unavailable (Missing Key).";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userMessage,
      config: {
        systemInstruction: `You are 'MediGen Assistant', a strict and precise Indian healthcare assistant.
        
        CORE INSTRUCTION: Provide ONLY the essential information requested. Do not use filler sentences, pleasantries, or long explanations unless asked.

        GUIDELINES:
        1. DIRECT ANSWERS: Start directly with the answer. No "Here is the information", "Namaste", or "I can help with that".
        2. FORMAT: Use bullet points for readability.
        3. CONTENT: For medicines, provide ONLY:
           - Primary Use
           - Key Dosage (Adults)
           - Major Side Effects
           - Approx Generic Price (₹)
        4. RESTRICTIONS: 
           - NO Medical Diagnosis.
           - NO conversational filler.
           - If unsafe, simply say: "Consult a doctor immediately."
        5. AUDIENCE: Simple English for Indian users. Keep it short.
        `,
      }
    });

    return response.text || "No response generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Server connection failed.";
  }
};
