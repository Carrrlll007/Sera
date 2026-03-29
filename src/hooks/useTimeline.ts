import { useState, useEffect } from "react";
import { useAuth } from "../app/providers/AuthProvider";
import { timelineService } from "../services/timelineService";
import { TimelineEvent } from "../types";

export function useTimeline(limitCount: number = 10) {
  const { household } = useAuth();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!household?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    // Note: timelineService.subscribeToHouseholdTimeline currently doesn't support limit
    // We might want to add it or just slice the result.
    const unsubscribe = timelineService.subscribeToHouseholdTimeline(
      household.id,
      (newEvents) => {
        setEvents(newEvents.slice(0, limitCount));
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [household?.id, limitCount]);

  return {
    events,
    isLoading
  };
}
