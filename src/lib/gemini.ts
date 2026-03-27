import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function parseUserIntent(message: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: message,
    config: {
      systemInstruction: `You are Operator, an AI life-admin agent. 
      Your goal is to parse user requests into structured tasks.
      Task types: appointment, document, case, other.
      Status: pending.
      Priority: low, medium, high.
      
      Extract the following:
      - title: Short descriptive title
      - description: Detailed description of what needs to be done
      - type: One of the task types
      - priority: Based on urgency
      - dueDate: If mentioned (ISO 8601)
      - metadata: Any other relevant info (provider name, contact info, etc.)`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          type: { type: Type.STRING },
          priority: { type: Type.STRING },
          dueDate: { type: Type.STRING },
          metadata: { type: Type.OBJECT }
        },
        required: ["title", "description", "type", "priority"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function extractDocumentData(base64Data: string, mimeType: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType } },
        { text: "Extract all relevant information from this document for a life-admin agent. Focus on dates, deadlines, names, and required actions." }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          type: { type: Type.STRING },
          deadlines: { type: Type.ARRAY, items: { type: Type.STRING } },
          summary: { type: Type.STRING },
          metadata: { type: Type.OBJECT }
        }
      }
    }
  });

  return JSON.parse(response.text);
}
