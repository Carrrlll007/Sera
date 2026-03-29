import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../app/providers/AuthProvider";
import { useHousehold } from "./useHousehold";
import { caseService } from "../services/caseService";
import { Case, CaseStatus, TimelineEvent } from "../types";
import { toast } from "sonner";
import { canUserView, canUserEdit } from "../utils/permissions";

export function useCases() {
  const { user, household } = useAuth();
  const { userRole } = useHousehold();
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!household?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = caseService.subscribeToHouseholdCases(
      household.id, 
      (newCases) => {
        setCases(newCases);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [household?.id]);

  const visibleCases = useMemo(() => {
    if (!user?.uid) return [];
    return cases.filter(c => canUserView(user.uid, userRole, c));
  }, [cases, user?.uid, userRole]);

  const createCase = async (data: Partial<Case>) => {
    if (!user?.uid || !household?.id) return;
    try {
      const caseId = await caseService.createCase(
        data, 
        user.uid, 
        user.displayName || "User", 
        household.id
      );
      toast.success("Case created successfully");
      return caseId;
    } catch (error) {
      toast.error("Failed to create case");
    }
  };

  const updateCaseStatus = async (caseId: string, status: CaseStatus, reason?: string) => {
    if (!user?.uid || !household?.id) return;
    
    const c = cases.find(item => item.id === caseId);
    if (c && !canUserEdit(user.uid, userRole, c)) {
      toast.error("You don't have permission to update this case");
      return;
    }

    try {
      await caseService.updateCaseStatus(
        caseId, 
        status, 
        user.uid, 
        user.displayName || "User", 
        household.id,
        reason
      );
      toast.success(`Case updated to ${status}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to update case status";
      toast.error(msg);
    }
  };

  const addCaseNote = async (caseId: string, note: string) => {
    if (!user?.uid || !household?.id) return;
    
    const c = cases.find(item => item.id === caseId);
    if (c && !canUserEdit(user.uid, userRole, c)) {
      toast.error("You don't have permission to add notes to this case");
      return;
    }

    try {
      await caseService.addCaseNote(
        caseId, 
        note, 
        user.uid, 
        user.displayName || "User", 
        household.id
      );
      toast.success("Note added");
    } catch (error) {
      toast.error("Failed to add note");
    }
  };

  const subscribeToCase = (caseId: string, callback: (c: Case) => void) => {
    return caseService.subscribeToCase(caseId, callback);
  };

  const subscribeToCaseTimeline = (caseId: string, callback: (events: TimelineEvent[]) => void) => {
    return caseService.subscribeToCaseTimeline(caseId, callback);
  };

  return {
    cases: visibleCases,
    allCases: cases,
    isLoading,
    createCase,
    updateCaseStatus,
    addCaseNote,
    subscribeToCase,
    subscribeToCaseTimeline
  };
}
