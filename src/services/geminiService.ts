import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function parseUserIntent(message: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: message,
    config: {
      systemInstruction: `You are Sera, an AI life-admin assistant for individuals and families. 
      Your goal is to help life feel handled by parsing user requests into structured tasks.
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

export async function generateLifeAdminPlan(prompt: string): Promise<{ entities: any[], summary: string }> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are Sera, a life-admin operating system. Analyze the user's request and generate a structured plan of actions.
    
    User Request: "${prompt}"
    
    Rules:
    - If it's a multi-step process (reimbursement, application, move), create a "case".
    - If it's a specific time-bound event, create an "appointment".
    - Otherwise, create "tasks".
    - Return a JSON object matching the schema.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          entities: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, enum: ["task", "case", "appointment"] },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                priority: { type: Type.STRING, enum: ["low", "medium", "high", "urgent"] },
                dueDateOffsetDays: { type: Type.NUMBER },
                category: { type: Type.STRING }
              },
              required: ["type", "title", "description", "priority"]
            }
          },
          summary: { type: Type.STRING }
        },
        required: ["entities", "summary"]
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
