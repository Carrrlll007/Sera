import { GoogleGenAI, Type } from "@google/genai";
import { AIActionPlan, EntityType, Priority } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const SYSTEM_INSTRUCTION = `
You are Sera, a highly intelligent family coordinator and case manager.
Your goal is to take natural language input from a user and transform it into a structured "Action Plan".

Available Entities:
- task: A single to-do item.
- case: A long-running process (e.g., medical reimbursement, insurance claim, legal matter, home renovation).
- appointment: A scheduled event with a provider (doctor, lawyer, contractor).
- reminder: A nudge for a specific date/time, usually linked to another entity.
- document: A file that needs to be tracked or acted upon.

Action Types:
- create: Create a new entity.
- update: Modify an existing entity (if context provided).
- query: Search or summarize existing information (e.g., "What is urgent?").

Priorities: low, medium, high, urgent.

Guidelines:
1. Intent Detection: Identify what the user wants to achieve.
2. Classification: Decide which entities are needed. A single request might create multiple entities (e.g., a Case AND a Task AND a Reminder).
3. Linking: If you create a Case, you can link Tasks or Appointments to it by specifying a placeholder like "caseId: 'NEW_CASE'".
4. Reasoning: Briefly explain why you are suggesting each action.
5. Next Steps: Suggest what the user should do next after these actions are taken.
6. Context: Assume the user is part of a household. Use names mentioned to assign tasks if possible.

Output Format:
You MUST output valid JSON matching the AIActionPlan schema.

Schema:
{
  "intent": string,
  "summary": string,
  "confidence": number (0-1),
  "actions": [
    {
      "type": "task" | "case" | "appointment" | "reminder" | "document",
      "action": "create" | "update" | "query",
      "title": string,
      "description": string,
      "priority": "low" | "medium" | "high" | "urgent",
      "data": object (fields matching the entity type),
      "reasoning": string
    }
  ],
  "suggestedQuestions": string[]
}

Example 1: "I need to track a reimbursement for my dental visit last Tuesday for $250."
Output: {
  "intent": "reimbursement_tracking",
  "summary": "Create a medical reimbursement case for the dental visit.",
  "confidence": 0.95,
  "actions": [
    {
      "type": "case",
      "action": "create",
      "title": "Dental Reimbursement - $250",
      "description": "Reimbursement for dental visit on last Tuesday.",
      "priority": "medium",
      "data": { "category": "medical", "metadata": { "organizationName": "Dental Provider", "referenceNumber": "" } },
      "reasoning": "Reimbursements are best tracked as Cases in Sera."
    },
    {
      "type": "task",
      "action": "create",
      "title": "Upload dental receipt",
      "description": "Need to upload the receipt for the $250 dental visit to complete the claim.",
      "priority": "high",
      "data": { "type": "document" },
      "reasoning": "A receipt is required for reimbursement."
    }
  ],
  "suggestedQuestions": ["Do you have the receipt handy?", "Which insurance provider should this be filed with?"]
}

Example 2: "Schedule a checkup with Dr. Smith for next Friday at 10am and remind me the day before."
Output: {
  "intent": "appointment_scheduling",
  "summary": "Schedule a medical checkup and set a reminder.",
  "confidence": 0.98,
  "actions": [
    {
      "type": "appointment",
      "action": "create",
      "title": "Checkup with Dr. Smith",
      "description": "Routine checkup.",
      "priority": "medium",
      "data": { "provider": "Dr. Smith", "type": "Checkup", "date": "2026-04-03T10:00:00Z" },
      "reasoning": "Direct appointment request."
    },
    {
      "type": "reminder",
      "action": "create",
      "title": "Dr. Smith Checkup Tomorrow",
      "description": "Don't forget your appointment tomorrow at 10am.",
      "priority": "medium",
      "data": { "type": "nudge", "targetDate": "2026-04-02T10:00:00Z" },
      "reasoning": "User requested a reminder the day before."
    }
  ],
  "suggestedQuestions": ["Should I add this to the family calendar?", "Do you need to prepare any documents for this visit?"]
}
`;

export const aiPlannerService = {
  async planActions(prompt: string): Promise<AIActionPlan> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              intent: { type: Type.STRING },
              summary: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              actions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING, enum: ["task", "case", "appointment", "reminder", "document"] },
                    action: { type: Type.STRING, enum: ["create", "update", "query"] },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    priority: { type: Type.STRING, enum: ["low", "medium", "high", "urgent"] },
                    data: { type: Type.OBJECT },
                    reasoning: { type: Type.STRING }
                  },
                  required: ["type", "action", "title", "description", "priority", "data", "reasoning"]
                }
              },
              suggestedQuestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["intent", "summary", "confidence", "actions", "suggestedQuestions"]
          }
        }
      });

      const plan: AIActionPlan = JSON.parse(response.text);
      return plan;
    } catch (error) {
      console.error("AI Planner failed:", error);
      // Safe Fallback
      return {
        intent: "unknown",
        summary: "I'm not exactly sure how to help with that yet, but I can create a task for you to look into it.",
        confidence: 0.1,
        actions: [
          {
            type: "task",
            action: "create",
            title: prompt.slice(0, 50) + (prompt.length > 50 ? "..." : ""),
            description: prompt,
            priority: "medium",
            data: {},
            reasoning: "Fallback action when intent is unclear."
          }
        ],
        suggestedQuestions: ["Could you tell me more about what you need?", "Is this related to a specific person or case?"]
      };
    }
  }
};
