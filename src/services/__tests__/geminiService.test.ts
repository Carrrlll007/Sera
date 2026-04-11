import { afterEach, describe, expect, it, vi } from "vitest";
import { extractDocumentData } from "../geminiService";

describe("geminiService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts document analysis requests to the secure backend endpoint", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        ok: true,
        analysis: {
          summary: "Insurance claim letter",
          keyPoints: ["Claim number 12345"],
          actions: ["Submit the missing receipt"],
          deadlines: ["2026-05-01"],
          category: "insurance",
          extractedEntities: [{ name: "Blue Cross", type: "provider" }],
        },
      }),
    } as unknown as Response);

    const result = await extractDocumentData("ZmFrZS1iYXNlNjQ=", "application/pdf", "claim.pdf");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/documents/analyze",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    );
    expect(result).toEqual({
      summary: "Insurance claim letter",
      deadlines: ["2026-05-01"],
      nextAction: "Submit the missing receipt",
      category: "insurance",
      extractedEntities: [{ name: "Blue Cross", type: "provider" }],
    });
  });

  it("throws the backend error when analysis is unavailable", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({
        ok: false,
        error: "Document analysis is unavailable right now.",
      }),
    } as unknown as Response);

    await expect(
      extractDocumentData("ZmFrZS1iYXNlNjQ=", "application/pdf", "claim.pdf")
    ).rejects.toThrow("Document analysis is unavailable right now.");
  });
});
