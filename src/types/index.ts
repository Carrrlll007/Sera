import { Timestamp } from "firebase/firestore";

/**
 * SHARED DOMAIN TYPES
 */

export type Priority = "low" | "medium" | "high" | "urgent";

export type EntityType = "task" | "case" | "appointment" | "document" | "reminder";

/**
 * HOUSEHOLD & MEMBERSHIP
 */

export type MemberRole = "admin" | "member" | "child" | "caregiver";

export interface HouseholdMember {
  id: string; // Document ID
  uid: string; // Firebase Auth UID
  displayName: string;
  email: string;
  photoURL?: string;
  role: MemberRole;
  joinedAt: Timestamp;
}

export interface Household {
  id: string;
  name: string;
  ownerId: string; // UID of the creator
  members: string[]; // Array of UIDs for quick security rule checks
  createdAt: Timestamp;
  updatedAt: Timestamp;
  metadata?: {
    timezone?: string;
    preferences?: Record<string, any>;
  };
}

/**
 * TASKS
 */

export type TaskStatus = "pending" | "in-progress" | "completed" | "exception" | "archived";
export type TaskType = "appointment" | "document" | "case" | "other" | "manual";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  type: TaskType;
  priority: Priority;
  
  // Scoping
  householdId: string;
  authorId: string; // UID
  assigneeId?: string; // UID
  personId?: string; // UID of the person the task is for (e.g. child)
  
  // Links
  caseId?: string;
  documentId?: string;
  appointmentId?: string;
  
  dueDate?: Timestamp;
  completedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  metadata?: {
    source?: "ai" | "manual";
    tags?: string[];
    externalLink?: string;
  };
}

/**
 * CASES
 */

export type CaseCategory = 
  | "medical" 
  | "insurance" 
  | "legal" 
  | "finance" 
  | "education" 
  | "home" 
  | "travel" 
  | "other";

export type CaseStatus = 
  | "new" 
  | "active" 
  | "waiting-on-document" 
  | "waiting-on-response" 
  | "ready-to-submit" 
  | "submitted" 
  | "resolved" 
  | "archived";

export interface Case {
  id: string;
  title: string;
  description: string;
  category: CaseCategory;
  status: CaseStatus;
  priority: Priority;
  
  householdId: string;
  authorId: string;
  assigneeId?: string;
  personId?: string; // Who this case is for (e.g. child, parent)
  
  dueDate?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  metadata?: {
    organizationName?: string; // e.g. "Blue Cross"
    referenceNumber?: string;
    contactPerson?: string;
    nextRecommendedAction?: string;
    lastActionTaken?: string;
  };
}

/**
 * APPOINTMENTS
 */

export type AppointmentState = 
  | "scheduled" 
  | "needs-confirmation" 
  | "confirmed"
  | "preparation-needed" 
  | "prepped"
  | "in-progress"
  | "completed" 
  | "cancelled" 
  | "no-show"
  | "follow-up-needed";

export interface AppointmentChecklistItem {
  id: string;
  text: string;
  isCompleted: boolean;
  type: "prep" | "follow-up";
}

export interface Appointment {
  id: string;
  title: string;
  provider: string; // Doctor, Lawyer, etc.
  location?: string;
  date: Timestamp;
  durationMinutes?: number;
  state: AppointmentState;
  
  householdId: string;
  authorId: string;
  personId?: string; // UID of the person the appointment is for
  
  // Links
  caseId?: string;
  documentIds?: string[]; // Multiple documents can be linked
  
  notes?: string;
  type: string; // e.g. "Checkup", "Consultation", "Legal", "School"
  
  // Workflow fields
  checklist?: AppointmentChecklistItem[];
  confirmationRequired?: boolean;
  confirmedAt?: Timestamp;
  
  metadata?: {
    nextRecommendedAction?: string;
    followUpTaskId?: string;
    prepTaskId?: string;
    remindersGenerated?: boolean;
  };
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * DOCUMENTS
 */

export type DocumentStatus = "uploaded" | "analyzed" | "analysis-failed" | "actioned" | "archived";

export interface Document {
  id: string;
  name: string;
  url: string; // Firebase Storage Download URL
  storagePath: string; // Path in Storage
  mimeType: string;
  size: number;
  status: DocumentStatus;
  
  householdId: string;
  authorId: string;
  personId?: string; // Who this document belongs to
  
  // Links
  caseId?: string;
  taskId?: string;
  appointmentId?: string;
  
  metadata?: {
    summary?: string;
    detectedDates?: string[];
    extractedEntities?: Array<{ name: string; type: string }>;
    nextAction?: string;
    category?: string;
    analysisError?: string;
  };
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * REMINDERS
 */

export type ReminderType = "nudge" | "deadline" | "preparation" | "follow-up";

export interface Reminder {
  id: string;
  title: string;
  targetDate: Timestamp;
  type: ReminderType;
  
  householdId: string;
  authorId: string;
  
  // Link to any entity
  linkedEntityId: string;
  linkedEntityType: EntityType;
  
  isCompleted: boolean;
  notifiedAt?: Timestamp;
  createdAt: Timestamp;
}

/**
 * TIMELINE & HISTORY
 */

export type TimelineEventType = 
  | "created" 
  | "status_change" 
  | "comment" 
  | "document_added" 
  | "action_taken" 
  | "ai_insight";

export interface TimelineEvent {
  id: string;
  householdId: string;
  authorId: string;
  
  // Target entity
  entityId: string;
  entityType: EntityType;
  
  type: TimelineEventType;
  description: string;
  authorName?: string; // Cached for display
  
  metadata?: {
    oldStatus?: string;
    newStatus?: string;
    documentUrl?: string;
    commentText?: string;
  };
  
  createdAt: Timestamp;
}

/**
 * RECOMMENDATIONS
 */

export type RecommendationPriority = "low" | "medium" | "high" | "critical";

export type RecommendationType = 
  | "stale_case"
  | "missing_document"
  | "appointment_prep"
  | "urgent_deadline"
  | "follow_up_needed"
  | "ai_insight";

export interface Recommendation {
  id: string;
  type: RecommendationType;
  priority: RecommendationPriority;
  title: string;
  description: string;
  
  // Links to source entities
  linkedEntityId?: string;
  linkedEntityType?: EntityType;
  
  // Action metadata
  actionLabel?: string;
  actionRoute?: string;
  
  // Explainability
  reasoning: string;
  
  createdAt: number; // Local timestamp
}

/**
 * AI & ACTION PLANNING
 */

export interface AIAction {
  type: EntityType;
  action: "create" | "update" | "query";
  title: string;
  description: string;
  priority: Priority;
  data: any; // The payload for the service call
  reasoning: string;
  linkedEntityId?: string; // If updating or linking to existing
}

export interface AIActionPlan {
  intent: string;
  summary: string;
  confidence: number;
  actions: AIAction[];
  suggestedQuestions: string[]; // For follow-up
}

export interface ChatActionPlan {
  id: string;
  householdId: string;
  authorId: string;
  
  prompt: string;
  summary: string;
  plan: AIActionPlan;
  
  status: "pending" | "executed" | "cancelled";
  createdAt: Timestamp;
}
