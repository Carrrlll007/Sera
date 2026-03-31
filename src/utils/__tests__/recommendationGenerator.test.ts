import { describe, expect, it } from "vitest";
import { generateRecommendations } from "../recommendationGenerator";

const timestamp = (iso: string) => ({
  toDate: () => new Date(iso),
});

describe("generateRecommendations", () => {
  it("uses only existing routes for trust-critical recommendation actions", () => {
    const recommendations = generateRecommendations(
      [
        {
          id: "task-1",
          title: "Submit claim",
          description: "Submit claim today",
          status: "pending",
          type: "case",
          priority: "urgent",
          householdId: "household-1",
          authorId: "user-1",
          createdAt: timestamp("2026-03-01T09:00:00.000Z") as any,
          updatedAt: timestamp("2026-03-01T09:00:00.000Z") as any,
        }
      ],
      [
        {
          id: "case-1",
          title: "Insurance appeal",
          description: "Appeal denied claim",
          category: "insurance",
          status: "ready-to-submit",
          priority: "high",
          householdId: "household-1",
          authorId: "user-1",
          createdAt: timestamp("2026-03-01T09:00:00.000Z") as any,
          updatedAt: timestamp("2026-03-01T09:00:00.000Z") as any,
        }
      ],
      [
        {
          id: "appointment-1",
          title: "Appeal review",
          provider: "Advisor",
          date: timestamp("2099-01-02T10:00:00.000Z") as any,
          state: "scheduled",
          householdId: "household-1",
          authorId: "user-1",
          type: "consultation",
          createdAt: timestamp("2026-03-01T09:00:00.000Z") as any,
          updatedAt: timestamp("2026-03-01T09:00:00.000Z") as any,
        }
      ],
      [],
      new Date("2099-01-01T10:00:00.000Z")
    );

    expect(recommendations.every((recommendation) =>
      ["/documents", "/calendar", "/tasks", "/cases"].includes(recommendation.actionRoute || "")
    )).toBe(true);
  });
});
