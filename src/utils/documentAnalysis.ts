import { Timestamp } from "firebase/firestore";
import { Document } from "../types";

type ExtractedEntity = { name?: string; type?: string };

export interface ExtractedDocumentData {
  summary?: string;
  deadlines?: string[];
  nextAction?: string;
  category?: string;
  extractedEntities?: ExtractedEntity[];
  metadata?: {
    summary?: string;
    detectedDates?: string[];
    nextAction?: string;
    category?: string;
    extractedEntities?: ExtractedEntity[];
  };
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const normalizeExtractedEntities = (
  entities: unknown
): NonNullable<Document["metadata"]>["extractedEntities"] => {
  if (!Array.isArray(entities)) return [];

  return entities
    .filter((entity): entity is ExtractedEntity => typeof entity === "object" && entity !== null)
    .map((entity) => ({
      name: isNonEmptyString(entity.name) ? entity.name.trim() : "Unknown",
      type: isNonEmptyString(entity.type) ? entity.type.trim() : "other",
    }));
};

export function normalizeDocumentMetadata(data: ExtractedDocumentData): Document["metadata"] {
  const nested = data.metadata ?? {};
  const summary = isNonEmptyString(data.summary)
    ? data.summary.trim()
    : isNonEmptyString(nested.summary)
      ? nested.summary.trim()
      : undefined;
  const detectedDates = (Array.isArray(data.deadlines) ? data.deadlines : nested.detectedDates ?? [])
    .filter(isNonEmptyString)
    .map((value) => value.trim());
  const nextAction = isNonEmptyString(data.nextAction)
    ? data.nextAction.trim()
    : isNonEmptyString(nested.nextAction)
      ? nested.nextAction.trim()
      : undefined;
  const category = isNonEmptyString(data.category)
    ? data.category.trim()
    : isNonEmptyString(nested.category)
      ? nested.category.trim()
      : undefined;
  const extractedEntities = normalizeExtractedEntities(
    data.extractedEntities ?? nested.extractedEntities
  );

  return {
    summary,
    detectedDates,
    nextAction,
    category,
    extractedEntities,
  };
}

export function getFirstDetectedDeadline(data: ExtractedDocumentData): Timestamp | undefined {
  const metadata = normalizeDocumentMetadata(data);
  const firstDetectedDate = metadata.detectedDates?.find(isNonEmptyString);

  if (!firstDetectedDate) return undefined;

  const parsed = new Date(firstDetectedDate);
  if (Number.isNaN(parsed.getTime())) return undefined;

  return Timestamp.fromDate(parsed);
}

export function buildDocumentAnalysisFailureMetadata(): Document["metadata"] {
  return {
    summary: "Automatic analysis was unavailable for this document.",
    nextAction: "Open the original file and review it manually.",
    analysisError: "Automatic analysis was unavailable for this document.",
  };
}
