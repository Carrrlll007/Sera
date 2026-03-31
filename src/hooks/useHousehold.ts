import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../app/providers/AuthProvider";
import { householdService } from "../services/householdService";
import { Household, HouseholdMember, MemberRole } from "../types";
import { toast } from "sonner";
import { canManageMembers } from "../utils/permissions";

export function useHousehold() {
  const { user, household, members, userRole, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(authLoading);
  }, [authLoading]);

  const currentMember = useMemo(() => 
    members.find(m => m.uid === user?.uid), 
    [members, user?.uid]
  );

  const addMember = async (memberData: Omit<HouseholdMember, "id" | "joinedAt">) => {
    if (!household?.id) return;
    if (!canManageMembers(userRole)) {
      toast.error("You don't have permission to add members");
      return;
    }
    try {
      await householdService.addMember(household.id, memberData);
      toast.success("Member added successfully");
    } catch (error) {
      toast.error("Failed to add member");
    }
  };

  const updateMemberRole = async (memberId: string, role: MemberRole) => {
    if (!household?.id) return;
    if (!canManageMembers(userRole)) {
      toast.error("You don't have permission to change roles");
      return;
    }
    try {
      await householdService.updateMemberRole(household.id, memberId, role);
      toast.success("Role updated");
    } catch (error) {
      toast.error("Failed to update role");
    }
  };

  const removeMember = async (memberId: string, uid: string) => {
    if (!household?.id) return;
    if (!canManageMembers(userRole)) {
      toast.error("You don't have permission to remove members");
      return;
    }
    try {
      await householdService.removeMember(household.id, memberId, uid);
      toast.success("Member removed");
    } catch (error) {
      toast.error("Failed to remove member");
    }
  };

  return {
    household,
    members,
    currentMember,
    userRole,
    isLoading,
    addMember,
    updateMemberRole,
    removeMember
  };
}
