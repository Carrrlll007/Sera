import type { AIActionPlan } from "../types";

interface PlanResponse {
  ok: boolean;
  plan?: AIActionPlan;
  error?: string;
}

export const aiPlannerService = {
  async planActions(input: string, context?: Record<string, unknown>): Promise<AIActionPlan> {
    const response = await fetch("/api/ai/plan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input, context }),
    });

    const payload = (await response.json().catch(() => null)) as PlanResponse | null;

    if (!response.ok || !payload?.ok || !payload.plan) {
      throw new Error(payload?.error || "AI planning is unavailable right now.");
    }

    return payload.plan;
  },
};
