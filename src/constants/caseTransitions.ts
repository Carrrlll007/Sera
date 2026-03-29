import { CaseStatus } from "../types";

/**
 * DEFINES VALID STATUS TRANSITIONS FOR CASES
 */
export const VALID_CASE_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  "new": ["active", "archived"],
  "active": ["waiting-on-document", "waiting-on-response", "ready-to-submit", "archived"],
  "waiting-on-document": ["active", "ready-to-submit", "archived"],
  "waiting-on-response": ["active", "resolved", "archived"],
  "ready-to-submit": ["submitted", "active", "archived"],
  "submitted": ["waiting-on-response", "resolved", "archived"],
  "resolved": ["archived"],
  "archived": ["active"] // Allow re-opening
};

/**
 * GENERATES RECOMMENDED NEXT ACTIONS BASED ON CASE STATUS
 */
export const getNextRecommendedAction = (status: CaseStatus): string => {
  switch (status) {
    case "new":
      return "Review case details and move to 'Active' to start tracking.";
    case "active":
      return "Identify missing documents or required responses to move forward.";
    case "waiting-on-document":
      return "Upload the requested document or follow up with the provider.";
    case "waiting-on-response":
      return "Check for updates from the organization. If no response in 3 days, follow up.";
    case "ready-to-submit":
      return "Final review of all documents and submit the claim/application.";
    case "submitted":
      return "Wait for confirmation of receipt. Log any reference numbers received.";
    case "resolved":
      return "Case is complete. Archive to keep your dashboard clean.";
    case "archived":
      return "No actions needed. Case is archived.";
    default:
      return "Review case status.";
  }
};
