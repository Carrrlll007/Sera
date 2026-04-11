import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AskSeraPage } from "../AskSeraPage";
import { aiPlannerService } from "../../services/aiPlannerService";
import { useAuth } from "../../app/providers/AuthProvider";
import { useTasks } from "../../hooks/useTasks";
import { useCases } from "../../hooks/useCases";
import { useAppointments } from "../../hooks/useAppointments";
import { useReminders } from "../../hooks/useReminders";
import { useRecommendations } from "../../hooks/useRecommendations";

vi.mock("sonner", () => ({
  toast: {
    loading: vi.fn().mockReturnValue("toast-1"),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../../services/aiPlannerService", () => ({
  aiPlannerService: {
    planActions: vi.fn(),
  },
}));

vi.mock("../../app/providers/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../hooks/useTasks", () => ({
  useTasks: vi.fn(),
}));

vi.mock("../../hooks/useCases", () => ({
  useCases: vi.fn(),
}));

vi.mock("../../hooks/useAppointments", () => ({
  useAppointments: vi.fn(),
}));

vi.mock("../../hooks/useReminders", () => ({
  useReminders: vi.fn(),
}));

vi.mock("../../hooks/useRecommendations", () => ({
  useRecommendations: vi.fn(),
}));

describe("AskSeraPage", () => {
  const createTask = vi.fn().mockResolvedValue("task-1");

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useAuth).mockReturnValue({
      user: { uid: "user-1", displayName: "Alex" },
      household: { id: "household-1", name: "Home Base" },
    } as any);

    vi.mocked(useTasks).mockReturnValue({
      createTask,
    } as any);

    vi.mocked(useCases).mockReturnValue({
      createCase: vi.fn(),
    } as any);

    vi.mocked(useAppointments).mockReturnValue({
      createAppointment: vi.fn(),
    } as any);

    vi.mocked(useReminders).mockReturnValue({
      createReminder: vi.fn(),
    } as any);

    vi.mocked(useRecommendations).mockReturnValue({
      recommendations: [],
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("turns a generated plan into a saved task through the existing task hook", async () => {
    vi.mocked(aiPlannerService.planActions).mockResolvedValue({
      intent: "task_creation",
      summary: "I can create a follow-up task for that insurance claim.",
      confidence: 0.94,
      actions: [
        {
          type: "task",
          action: "create",
          title: "Follow up with the insurer",
          description: "Call Blue Cross about the reimbursement status.",
          priority: "high",
          data: { type: "case" },
          reasoning: "A follow-up call is the next actionable step.",
        },
      ],
      suggestedQuestions: [],
    });

    const user = userEvent.setup();
    render(<AskSeraPage />);

    await user.type(
      screen.getByPlaceholderText("Describe what you need Sera to organize..."),
      "I need to follow up with the insurer about the reimbursement."
    );
    await user.click(screen.getByRole("button", { name: "Send request" }));

    expect(await screen.findByText("I can create a follow-up task for that insurance claim.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Apply Plan/i }));

    await waitFor(() => {
      expect(createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Follow up with the insurer",
          description: "Call Blue Cross about the reimbursement status.",
          priority: "high",
          status: "pending",
          type: "case",
        })
      );
    });

    expect(await screen.findByText(/Plan Applied/i)).toBeInTheDocument();
  });
});
