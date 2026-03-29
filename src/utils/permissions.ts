import { MemberRole, Task, Case, Appointment, Document, HouseholdMember } from "../types";

/**
 * Visibility Rules:
 * - Admin: Can see everything in the household.
 * - Member: Access to their own items + shared items (where personId is null).
 * - Caregiver: Access to items assigned to them + items for children.
 * - Child: Access to items where they are the personId.
 */

export const canUserView = (
  userUid: string,
  userRole: MemberRole,
  entity: Task | Case | Appointment | Document
): boolean => {
  if (userRole === "admin") return true;

  // If the user is the author or assignee, they can always see it
  if (entity.authorId === userUid) return true;
  
  // Check if it's a task or case with an assignee
  if ('assigneeId' in entity && entity.assigneeId === userUid) return true;

  // Shared household items (no specific person assigned)
  const personId = (entity as any).personId;
  if (!personId) return true;

  // If the entity is FOR the user
  if (personId === userUid) return true;

  // Caregivers can see items for children
  if (userRole === "caregiver") {
    // This assumes we have a way to know if personId is a child
    // For now, let's assume they can see items where they are the assignee
    return 'assigneeId' in entity && entity.assigneeId === userUid;
  }

  return false;
};

export const canUserEdit = (
  userUid: string,
  userRole: MemberRole,
  entity: Task | Case | Appointment | Document
): boolean => {
  if (userRole === "admin") return true;
  
  // Authors can edit their own items
  if (entity.authorId === userUid) return true;

  // Assignees can update status but maybe not delete
  if ('assigneeId' in entity && entity.assigneeId === userUid) return true;

  return false;
};

export const canManageMembers = (userRole: MemberRole): boolean => {
  return userRole === "admin";
};

export const getRoleLabel = (role: MemberRole): string => {
  switch (role) {
    case "admin": return "Household Admin";
    case "member": return "Adult Member";
    case "child": return "Child / Dependent";
    case "caregiver": return "Caregiver / Support";
    default: return "Guest";
  }
};
