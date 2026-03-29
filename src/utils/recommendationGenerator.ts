import { Task, Case, Appointment, Document, Recommendation } from "../types";
import { differenceInDays, isTomorrow, isBefore, addDays } from "date-fns";

/**
 * Deterministic Recommendations Generator
 * 
 * This function takes the current state of the application entities
 * and returns a list of explainable recommendations.
 */
export const generateRecommendations = (
  tasks: Task[],
  cases: Case[],
  appointments: Appointment[],
  documents: Document[],
  now: Date = new Date()
): Recommendation[] => {
  const recs: Recommendation[] = [];

  // Rule 1: Stale Cases
  // Logic: Active/Waiting cases with no updates for 7+ days
  cases.forEach((c) => {
    if (["active", "waiting-on-response"].includes(c.status)) {
      const lastUpdate = c.updatedAt.toDate();
      const daysSinceUpdate = differenceInDays(now, lastUpdate);
      if (daysSinceUpdate >= 7) {
        recs.push({
          id: `stale-case-${c.id}`,
          type: "stale_case",
          priority: "medium",
          title: `Follow up on "${c.title}"`,
          description: `This case has been active for ${daysSinceUpdate} days without an update.`,
          linkedEntityId: c.id,
          linkedEntityType: "case",
          actionLabel: "View Case",
          actionRoute: `/cases/${c.id}`,
          reasoning: `Status is "${c.status}" and last updated ${daysSinceUpdate} days ago.`,
          createdAt: Date.now(),
        });
      }
    }
  });

  // Rule 2: Missing Documents for Submission
  // Logic: Case is ready to submit but has 0 linked documents
  cases.forEach((c) => {
    if (c.status === "ready-to-submit") {
      const linkedDocs = documents.filter((d) => d.caseId === c.id);
      if (linkedDocs.length === 0) {
        recs.push({
          id: `missing-doc-${c.id}`,
          type: "missing_document",
          priority: "high",
          title: `Attach documents to "${c.title}"`,
          description: `This case is ready to submit but has no documents attached.`,
          linkedEntityId: c.id,
          linkedEntityType: "case",
          actionLabel: "Add Document",
          actionRoute: `/cases/${c.id}`,
          reasoning: `Case status is "ready-to-submit" but linked document count is 0.`,
          createdAt: Date.now(),
        });
      }
    }
  });

  // Rule 3: Appointment Preparation
  // Logic: Appointment tomorrow that isn't in a 'prepped' or 'completed' state
  appointments.forEach((a) => {
    const apptDate = a.date.toDate();
    if (isTomorrow(apptDate) && !["prepped", "completed", "cancelled"].includes(a.state)) {
      recs.push({
        id: `appt-prep-${a.id}`,
        type: "appointment_prep",
        priority: "high",
        title: `Prepare for "${a.title}"`,
        description: `You have an appointment tomorrow at ${a.provider} that needs preparation.`,
        linkedEntityId: a.id,
        linkedEntityType: "appointment",
        actionLabel: "View Details",
        actionRoute: `/appointments/${a.id}`,
        reasoning: `Appointment is tomorrow and current state is "${a.state}".`,
        createdAt: Date.now(),
      });
    }
  });

  // Rule 4: Urgent Deadlines
  // Logic: Task is urgent priority OR due within 48 hours
  tasks.forEach((t) => {
    if (t.status === "completed" || t.status === "archived") return;
    
    const isUrgent = t.priority === "urgent";
    const dueDate = t.dueDate?.toDate();
    const isDueSoon = dueDate && isBefore(dueDate, addDays(now, 2));

    if (isUrgent || isDueSoon) {
      recs.push({
        id: `urgent-task-${t.id}`,
        type: "urgent_deadline",
        priority: isUrgent ? "critical" : "high",
        title: `Action required: ${t.title}`,
        description: isUrgent 
          ? "This task is marked as urgent priority." 
          : `This task is due on ${dueDate?.toLocaleDateString()}.`,
        linkedEntityId: t.id,
        linkedEntityType: "task",
        actionLabel: "Resolve",
        actionRoute: `/tasks`,
        reasoning: isUrgent ? "Priority is 'urgent'." : "Due date is within 48 hours.",
        createdAt: Date.now(),
      });
    }
  });

  // Rule 5: Follow-up Gap
  // Logic: Unresolved finance/medical cases with no active tasks
  cases.forEach((c) => {
    if (["medical", "insurance", "finance"].includes(c.category) && !["resolved", "archived"].includes(c.status)) {
      const linkedTasks = tasks.filter(t => t.caseId === c.id && t.status !== "completed");
      if (linkedTasks.length === 0) {
        recs.push({
          id: `follow-up-${c.id}`,
          type: "follow_up_needed",
          priority: "medium",
          title: `Plan next steps for "${c.title}"`,
          description: `This ${c.category} case is unresolved and has no active tasks.`,
          linkedEntityId: c.id,
          linkedEntityType: "case",
          actionLabel: "Add Task",
          actionRoute: `/cases/${c.id}`,
          reasoning: `Category is "${c.category}" and active task count is 0.`,
          createdAt: Date.now(),
        });
      }
    }
  });

  // Priority Sorting
  const priorityMap = { critical: 0, high: 1, medium: 2, low: 3 };
  return recs.sort((a, b) => priorityMap[a.priority] - priorityMap[b.priority]);
};
