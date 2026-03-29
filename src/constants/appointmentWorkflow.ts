import { AppointmentState, AppointmentChecklistItem } from "../types";

export const VALID_APPOINTMENT_TRANSITIONS: Record<AppointmentState, AppointmentState[]> = {
  "scheduled": ["needs-confirmation", "confirmed", "preparation-needed", "cancelled"],
  "needs-confirmation": ["confirmed", "cancelled"],
  "confirmed": ["preparation-needed", "prepped", "in-progress", "cancelled"],
  "preparation-needed": ["prepped", "cancelled"],
  "prepped": ["in-progress", "cancelled"],
  "in-progress": ["completed", "no-show", "follow-up-needed"],
  "completed": ["follow-up-needed"],
  "follow-up-needed": ["completed"],
  "cancelled": ["scheduled"],
  "no-show": ["scheduled", "follow-up-needed"]
};

export interface AppointmentTemplate {
  prepItems: string[];
  followUpItems: string[];
  confirmationRequired: boolean;
}

export const APPOINTMENT_TEMPLATES: Record<string, AppointmentTemplate> = {
  "medical": {
    prepItems: [
      "Confirm insurance coverage",
      "Bring current medications list",
      "Fast for 8 hours (if required)",
      "Bring ID and insurance card"
    ],
    followUpItems: [
      "Upload visit summary",
      "Schedule follow-up appointment",
      "Order prescribed medications"
    ],
    confirmationRequired: true
  },
  "legal": {
    prepItems: [
      "Gather relevant documents",
      "Prepare list of questions",
      "Review previous correspondence"
    ],
    followUpItems: [
      "Review meeting notes",
      "Sign and return documents",
      "Update case status"
    ],
    confirmationRequired: true
  },
  "school": {
    prepItems: [
      "Review child's recent progress",
      "Prepare questions for teacher",
      "Check school calendar for conflicts"
    ],
    followUpItems: [
      "Discuss meeting with child",
      "Implement teacher's suggestions",
      "Schedule next check-in"
    ],
    confirmationRequired: false
  },
  "default": {
    prepItems: ["Confirm location and time", "Prepare relevant notes"],
    followUpItems: ["Log outcome", "Set next steps"],
    confirmationRequired: false
  }
};

export function getAppointmentTemplate(type: string): AppointmentTemplate {
  const normalizedType = type.toLowerCase();
  if (normalizedType.includes('med') || normalizedType.includes('doc') || normalizedType.includes('health')) {
    return APPOINTMENT_TEMPLATES.medical;
  }
  if (normalizedType.includes('legal') || normalizedType.includes('law') || normalizedType.includes('court')) {
    return APPOINTMENT_TEMPLATES.legal;
  }
  if (normalizedType.includes('school') || normalizedType.includes('teacher') || normalizedType.includes('parent')) {
    return APPOINTMENT_TEMPLATES.school;
  }
  return APPOINTMENT_TEMPLATES.default;
}

export function getNextRecommendedAction(state: AppointmentState): string {
  switch (state) {
    case "scheduled":
      return "Check if preparation is needed for this appointment.";
    case "needs-confirmation":
      return "Call the provider to confirm the appointment.";
    case "preparation-needed":
      return "Complete the prep checklist items.";
    case "prepped":
      return "Ready for the appointment. Remember to bring your documents.";
    case "in-progress":
      return "Take notes and ask about follow-up steps.";
    case "completed":
      return "Log any follow-up tasks or documents from the visit.";
    case "follow-up-needed":
      return "Complete the follow-up actions recommended by the provider.";
    default:
      return "Keep your calendar updated.";
  }
}
