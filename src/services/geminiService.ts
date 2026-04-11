export interface ExtractedDocumentData {
  summary?: string;
  deadlines?: string[];
  nextAction?: string;
  category?: string;
  extractedEntities?: Array<{ name: string; type: string }>;
  metadata?: {
    summary?: string;
    detectedDates?: string[];
    nextAction?: string;
    category?: string;
    extractedEntities?: Array<{ name: string; type: string }>;
  };
}

interface DocumentAnalysisResponse {
  ok: boolean;
  analysis?: {
    summary: string;
    keyPoints: string[];
    actions: string[];
    deadlines: string[];
    category?: string;
    extractedEntities?: Array<{ name: string; type: string }>;
  };
  error?: string;
}

export async function extractDocumentData(
  base64Data: string,
  mimeType: string,
  filename?: string
): Promise<ExtractedDocumentData> {
  const response = await fetch("/api/documents/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      base64Data,
      mimeType,
      filename,
    }),
  });

  const payload = (await response.json().catch(() => null)) as DocumentAnalysisResponse | null;

  if (!response.ok || !payload?.ok || !payload.analysis) {
    throw new Error(payload?.error || "Document analysis is unavailable right now.");
  }

  return {
    summary: payload.analysis.summary,
    deadlines: payload.analysis.deadlines,
    nextAction: payload.analysis.actions[0],
    category: payload.analysis.category,
    extractedEntities: payload.analysis.extractedEntities ?? [],
  };
}
