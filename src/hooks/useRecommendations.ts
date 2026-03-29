import { useMemo } from "react";
import { useTasks } from "./useTasks";
import { useCases } from "./useCases";
import { useAppointments } from "./useAppointments";
import { useDocuments } from "./useDocuments";
import { toDate } from "../utils/dateUtils";
import { Recommendation, Task, Case, Appointment, Document } from "../types";
import { differenceInDays, isTomorrow, isBefore, addDays } from "date-fns";

interface RecommendationsInput {
  tasks?: Task[];
  cases?: Case[];
  appointments?: Appointment[];
  documents?: Document[];
}

export const useRecommendations = (
  filter?: { entityId?: string; entityType?: string },
  inputData?: RecommendationsInput
) => {
  const { tasks: hookTasks } = useTasks();
  const { cases: hookCases } = useCases();
  const { appointments: hookAppointments } = useAppointments();
  const { documents: hookDocuments } = useDocuments();

  const tasks = inputData?.tasks ?? hookTasks;
  const cases = inputData?.cases ?? hookCases;
  const appointments = inputData?.appointments ?? hookAppointments;
  const documents = inputData?.documents ?? hookDocuments;

  const allRecommendations = useMemo(() => {
    const recs: Recommendation[] = [];
    const now = new Date();

    // 1. Stale Cases: Active for > 7 days without update
    cases.forEach((c) => {
      if (["active", "waiting-on-response"].includes(c.status)) {
        const lastUpdate = toDate(c.updatedAt)!;
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
            reasoning: `Case status is "${c.status}" and was last updated on ${lastUpdate.toLocaleDateString()}.`,
            createdAt: Date.now(),
          });
        }
      }
    });

    // 2. Missing Documents: Case ready-to-submit but no documents linked
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
            reasoning: `Status is "ready-to-submit" but document count is 0.`,
            createdAt: Date.now(),
          });
        }
      }
    });

    // 3. Appointment Prep: Appointment tomorrow with no prep
    appointments.forEach((a) => {
      const apptDate = toDate(a.date)!;
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
          reasoning: `Appointment is tomorrow (${apptDate.toLocaleDateString()}) and state is "${a.state}".`,
          createdAt: Date.now(),
        });
      }
    });

    // 4. Urgent Deadlines: Tasks due soon or urgent
    tasks.forEach((t) => {
      if (t.status === "completed" || t.status === "archived") return;
      
      const isUrgent = t.priority === "urgent";
      const dueDate = toDate(t.dueDate);
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
          reasoning: isUrgent ? "Priority is set to urgent." : "Due date is within 48 hours.",
          createdAt: Date.now(),
        });
      }
    });

    // 5. Unresolved Finance/Insurance cases with no follow-up tasks
    cases.forEach((c) => {
      if (["medical", "insurance", "finance"].includes(c.category) && c.status !== "resolved" && c.status !== "archived") {
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
            reasoning: `Category is "${c.category}", status is "${c.status}", and active task count is 0.`,
            createdAt: Date.now(),
          });
        }
      }
    });

    // Sort by priority
    const priorityMap = { critical: 0, high: 1, medium: 2, low: 3 };
    return recs.sort((a, b) => priorityMap[a.priority] - priorityMap[b.priority]);
  }, [tasks, cases, appointments, documents]);

  const recommendations = useMemo(() => {
    if (!filter) return allRecommendations;
    return allRecommendations.filter(rec => {
      const matchesId = filter.entityId ? rec.linkedEntityId === filter.entityId : true;
      const matchesType = filter.entityType ? rec.linkedEntityType === filter.entityType : true;
      return matchesId && matchesType;
    });
  }, [allRecommendations, filter]);

  return {
    recommendations,
    count: recommendations.length,
  };
};
