import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";
import type { AIActionPlan } from "../types";

const actionSchema = z.object({
  type: z.enum(["task", "case", "appointment", "reminder"]),
  action: z.literal("create"),
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  data: z.record(z.string(), z.unknown()).default({}),
  reasoning: z.string().trim().min(1),
  linkedEntityId: z.string().trim().optional(),
});

const actionPlanSchema = z.object({
  intent: z.string().trim().min(1),
  summary: z.string().trim().min(1),
  confidence: z.number().min(0).max(1),
  actions: z.array(actionSchema).min(1),
  suggestedQuestions: z.array(z.string().trim().min(1)).default([]),
});

const contextSchema = z.record(z.string(), z.unknown());

export const planRequestSchema = z.object({
  input: z.string().trim().min(1, "input is required"),
  context: contextSchema.optional(),
});

export const documentAnalyzeRequestSchema = z
  .object({
    text: z.string().trim().optional(),
    base64Data: z.string().trim().optional(),
    mimeType: z.string().trim().optional(),
    filename: z.string().trim().optional(),
    context: contextSchema.optional(),
  })
  .superRefine((value, issueCtx) => {
    if (!value.text && !value.base64Data) {
      issueCtx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide either text or base64Data for document analysis.",
        path: ["text"],
      });
    }

    if (value.base64Data && !value.mimeType) {
      issueCtx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "mimeType is required when base64Data is provided.",
        path: ["mimeType"],
      });
    }
  });

const extractedEntitySchema = z.object({
  name: z.string().trim().min(1),
  type: z.string().trim().min(1),
});

const documentAnalysisSchema = z.object({
  summary: z.string().trim().min(1),
  keyPoints: z.array(z.string().trim().min(1)).default([]),
  actions: z.array(z.string().trim().min(1)).default([]),
  deadlines: z.array(z.string().trim().min(1)).default([]),
  category: z.string().trim().optional(),
  extractedEntities: z.array(extractedEntitySchema).default([]),
});

export type DocumentAnalysisResult = z.infer<typeof documentAnalysisSchema>;

export class AIServiceError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly clientMessage: string,
    cause?: unknown
  ) {
    super(clientMessage, { cause });
    this.name = "AIServiceError";
  }
}

const PLAN_SYSTEM_INSTRUCTION = `
You are Sera, a calm life-admin assistant for individuals and families.
Turn a user's request into a structured plan of concrete create actions that Sera can save.

Allowed action types:
- task
- case
- appointment
- reminder

Rules:
1. Return only "create" actions. Do not return query or update actions.
2. Prefer tasks when the request is ambiguous.
3. Only propose cases for multi-step processes like claims, applications, or reimbursements.
4. Only propose appointments when the user is clearly asking to schedule or track a date-based event.
5. Use reminders only for clear follow-up or deadline nudges.
6. Do not claim that anything has already been created.
7. Keep titles short, descriptions useful, and reasoning specific.
8. Use ISO 8601 timestamps when you provide dates.
9. If important details are missing, include follow-up questions in suggestedQuestions, but still return the best minimal actionable plan you can.
`;

const DOCUMENT_SYSTEM_INSTRUCTION = `
You are Sera's document analysis service.
Read the provided document content and extract only what is grounded in that content.

Return JSON with:
- summary: concise description of the document
- keyPoints: concrete facts worth reviewing
- actions: concrete follow-up actions supported by the document
- deadlines: dates or deadlines mentioned in the document, preferably ISO 8601 when possible
- category: a short category like insurance, medical, finance, legal, education, home, travel, or other
- extractedEntities: names and types for key people, providers, or organizations mentioned

Do not invent missing facts. If a field is unknown, return an empty array or omit the optional value.
`;

function formatZodError(error: z.ZodError) {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
      return `${path}${issue.message}`;
    })
    .join("; ");
}

function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new AIServiceError(503, "Server AI is not configured. Add GEMINI_API_KEY.");
  }

  return new GoogleGenAI({ apiKey });
}

function getModel() {
  return process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
}

function buildContextSuffix(context?: Record<string, unknown>) {
  if (!context || Object.keys(context).length === 0) {
    return "";
  }

  return `\n\nContext:\n${JSON.stringify(context)}`;
}

function parseModelJson<T>(rawText: string, schema: z.ZodType<T>, errorMessage: string): T {
  try {
    const parsed = JSON.parse(rawText);
    return schema.parse(parsed);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AIServiceError(502, errorMessage, error);
    }

    throw new AIServiceError(502, errorMessage, error);
  }
}

export function parsePlanRequest(input: unknown) {
  try {
    return planRequestSchema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AIServiceError(400, formatZodError(error), error);
    }

    throw error;
  }
}

export function parseDocumentAnalyzeRequest(input: unknown) {
  try {
    return documentAnalyzeRequestSchema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AIServiceError(400, formatZodError(error), error);
    }

    throw error;
  }
}

export async function generateActionPlan(
  input: string,
  context?: Record<string, unknown>
): Promise<AIActionPlan> {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: getModel(),
      contents: `${input}${buildContextSuffix(context)}`,
      config: {
        systemInstruction: PLAN_SYSTEM_INSTRUCTION,
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
                  type: {
                    type: Type.STRING,
                    enum: ["task", "case", "appointment", "reminder"],
                  },
                  action: { type: Type.STRING, enum: ["create"] },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  priority: {
                    type: Type.STRING,
                    enum: ["low", "medium", "high", "urgent"],
                  },
                  data: { type: Type.OBJECT },
                  reasoning: { type: Type.STRING },
                  linkedEntityId: { type: Type.STRING },
                },
                required: ["type", "action", "title", "description", "priority", "data", "reasoning"],
              },
            },
            suggestedQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["intent", "summary", "confidence", "actions", "suggestedQuestions"],
        },
      },
    });

    return parseModelJson(
      response.text,
      actionPlanSchema,
      "AI planning returned an invalid response."
    );
  } catch (error) {
    if (error instanceof AIServiceError) {
      throw error;
    }

    console.error("AI planning failed:", error);
    throw new AIServiceError(502, "AI planning is unavailable right now.", error);
  }
}

export async function analyzeDocument(
  payload: z.infer<typeof documentAnalyzeRequestSchema>
): Promise<DocumentAnalysisResult> {
  try {
    const ai = getAiClient();
    const contents = payload.base64Data
      ? {
          parts: [
            {
              inlineData: {
                data: payload.base64Data,
                mimeType: payload.mimeType!,
              },
            },
            {
              text: `Analyze this document for Sera.${payload.filename ? ` Filename: ${payload.filename}.` : ""}${buildContextSuffix(payload.context)}`,
            },
          ],
        }
      : `${payload.text}${buildContextSuffix(payload.context)}`;

    const response = await ai.models.generateContent({
      model: getModel(),
      contents,
      config: {
        systemInstruction: DOCUMENT_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            keyPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            actions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            deadlines: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            category: { type: Type.STRING },
            extractedEntities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  type: { type: Type.STRING },
                },
                required: ["name", "type"],
              },
            },
          },
          required: ["summary", "keyPoints", "actions", "deadlines", "extractedEntities"],
        },
      },
    });

    return parseModelJson(
      response.text,
      documentAnalysisSchema,
      "Document analysis returned an invalid response."
    );
  } catch (error) {
    if (error instanceof AIServiceError) {
      throw error;
    }

    console.error("Document analysis failed:", error);
    throw new AIServiceError(502, "Document analysis is unavailable right now.", error);
  }
}
