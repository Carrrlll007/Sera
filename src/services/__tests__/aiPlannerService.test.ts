import { afterEach, describe, expect, it, vi } from "vitest";
import { aiPlannerService } from "../aiPlannerService";

describe("aiPlannerService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts prompts to the secure planning endpoint and returns the structured plan", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        ok: true,
        plan: {
          intent: "task_creation",
          summary: "Create one task.",
          confidence: 0.92,
          actions: [
            {
              type: "task",
              action: "create",
              title: "Call the insurer",
              description: "Follow up on the claim.",
              priority: "high",
              data: { type: "case" },
              reasoning: "A follow-up task is the next concrete step.",
            },
          ],
          suggestedQuestions: [],
        },
      }),
    } as unknown as Response);

    const plan = await aiPlannerService.planActions("Call the insurer");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/ai/plan",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    );
    expect(plan.summary).toBe("Create one task.");
    expect(plan.actions).toHaveLength(1);
  });

  it("surfaces backend errors instead of returning a fake fallback plan", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({
        ok: false,
        error: "AI planning is unavailable right now.",
      }),
    } as unknown as Response);

    await expect(aiPlannerService.planActions("Call the insurer")).rejects.toThrow(
      "AI planning is unavailable right now."
    );
  });
});
