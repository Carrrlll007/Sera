import { describe, expect, it } from "vitest";
import { Timestamp } from "firebase/firestore";
import {
  buildDocumentAnalysisFailureMetadata,
  getFirstDetectedDeadline,
  normalizeDocumentMetadata
} from "../documentAnalysis";

describe("documentAnalysis", () => {
  it("normalizes extracted document metadata into the UI shape", () => {
    const metadata = normalizeDocumentMetadata({
      summary: "Claim form for reimbursement",
      deadlines: ["2026-04-05"],
      metadata: {
        nextAction: "Submit to insurer",
        category: "insurance",
        extractedEntities: [{ name: "Blue Cross", type: "provider" }]
      }
    });

    expect(metadata).toEqual({
      summary: "Claim form for reimbursement",
      detectedDates: ["2026-04-05"],
      nextAction: "Submit to insurer",
      category: "insurance",
      extractedEntities: [{ name: "Blue Cross", type: "provider" }]
    });
  });

  it("returns the first parseable detected deadline as a timestamp", () => {
    const deadline = getFirstDetectedDeadline({
      deadlines: ["2026-04-07T10:00:00.000Z"]
    });

    expect(deadline).toBeInstanceOf(Timestamp);
    expect(deadline?.toDate().toISOString()).toBe("2026-04-07T10:00:00.000Z");
  });

  it("builds a truthful fallback metadata payload for analysis failures", () => {
    expect(buildDocumentAnalysisFailureMetadata()).toEqual({
      summary: "Automatic analysis was unavailable for this document.",
      nextAction: "Open the original file and review it manually.",
      analysisError: "Automatic analysis was unavailable for this document."
    });
  });
});
