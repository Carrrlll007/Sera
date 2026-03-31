import { describe, expect, it, vi, beforeEach } from "vitest";
import { onSnapshot, orderBy, query, where } from "firebase/firestore";
import { timelineService } from "../timelineService";

describe("timelineService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("scopes entity timeline subscriptions by household, entity id, and entity type", () => {
    (onSnapshot as any).mockReturnValue(() => {});

    timelineService.subscribeToEntityTimeline(
      {
        householdId: "household-1",
        entityId: "case-1",
        entityType: "case",
      },
      vi.fn()
    );

    expect(where).toHaveBeenCalledWith("householdId", "==", "household-1");
    expect(where).toHaveBeenCalledWith("entityId", "==", "case-1");
    expect(where).toHaveBeenCalledWith("entityType", "==", "case");
    expect(orderBy).toHaveBeenCalledWith("createdAt", "desc");
    expect(query).toHaveBeenCalled();
  });
});
