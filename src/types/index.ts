import { Timestamp } from "firebase/firestore";

export type TaskStatus = "pending" | "in-progress" | "completed" | "exception";
export type TaskType = "appointment" | "document" | "case" | "other";
export type Priority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id?: string;
  title: string;
  description: string;
  status: TaskStatus;
  type: TaskType;
  dueDate?: Timestamp;
  priority: Priority;
  householdId: string;
  authorId: string;
  assigneeId?: string;
  caseId?: string;
  documentId?: string;
  metadata?: any;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type CaseStatus = "new" | "in-progress" | "waiting-on-document" | "waiting-on-response" | "ready-to-submit" | "submitted" | "resolved" | "escalated";

export interface Case {
  id: string;
  title: string;
  category: string;
  status: CaseStatus;
  priority: Priority;
  householdId: string;
  authorId: string;
  assigneeId?: string;
  description: string;
  dueDate?: Timestamp;
  metadata?: any;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type AppointmentStatus = "scheduled" | "needs-confirmation" | "preparation-needed" | "completed" | "follow-up-needed";

export interface Appointment {
  id?: string;
  title: string;
  provider: string;
  date: Timestamp;
  status: AppointmentStatus;
  personId: string;
  householdId: string;
  documentId?: string;
  notes?: string;
  location?: string;
  type: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Document {
  id: string;
  name: string;
  url: string;
  type: string;
  category?: string;
  householdId: string;
  authorId: string;
  personId?: string;
  caseId?: string;
  taskId?: string;
  metadata?: {
    summary?: string;
    extractedEntities?: any[];
    detectedDates?: string[];
    nextAction?: string;
  };
  createdAt: Timestamp;
}

export interface HouseholdMember {
  id: string;
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role: "admin" | "member" | "child" | "caregiver";
}

export interface Household {
  id: string;
  name: string;
  members: string[]; // UIDs
  createdAt: Timestamp;
}

export interface Reminder {
  id: string;
  title: string;
  targetDate: Timestamp;
  type: "nudge" | "deadline" | "preparation";
  linkedEntityId: string;
  linkedEntityType: "task" | "case" | "appointment" | "document";
  householdId: string;
  isCompleted: boolean;
  createdAt: Timestamp;
}

export interface TimelineEvent {
  id: string;
  entityId: string;
  entityType: "task" | "case" | "appointment" | "document";
  type: "created" | "status_change" | "comment" | "document_added" | "action_taken";
  description: string;
  authorId: string;
  metadata?: any;
  createdAt: Timestamp;
}
