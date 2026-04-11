import { useMemo } from "react";
import { useTasks } from "./useTasks";
import { useCases } from "./useCases";
import { useAppointments } from "./useAppointments";
import { useReminders } from "./useReminders";
import { useDocuments } from "./useDocuments";
import { useTimeline } from "./useTimeline";
import { useRecommendations } from "./useRecommendations";
import { toDate } from "../utils/dateUtils";
import { isSameDay, isWithinInterval, addDays, startOfDay, endOfDay } from "date-fns";
import { Task, Case, Appointment, Reminder, Document, TimelineEvent, Recommendation } from "../types";

export function useDashboard() {
  const { tasks, isLoading: tasksLoading } = useTasks();
  const { cases, isLoading: casesLoading } = useCases();
  const { appointments, isLoading: appointmentsLoading } = useAppointments();
  const { reminders, isLoading: remindersLoading } = useReminders();
  const { documents, isLoading: documentsLoading } = useDocuments();
  const { events, isLoading: timelineLoading } = useTimeline(5);
  const { recommendations: engineRecommendations } = useRecommendations(undefined, {
    tasks,
    cases,
    appointments,
    documents
  });

  const isLoading = 
    tasksLoading || 
    casesLoading || 
    appointmentsLoading || 
    remindersLoading || 
    documentsLoading || 
    timelineLoading;

  const { today, startOfToday, endOfToday, endOfWeek } = useMemo(() => {
    const current = new Date();
    return {
      today: current,
      startOfToday: startOfDay(current),
      endOfToday: endOfDay(current),
      endOfWeek: endOfDay(addDays(current, 7)),
    };
  }, []);

  const attentionToday = useMemo(() => {
    const urgentTasks = tasks.filter(t => 
      t.status === 'pending' && 
      (t.priority === 'urgent' || (t.dueDate && isSameDay(toDate(t.dueDate)!, today)))
    );

    const todayAppointments = appointments.filter(a => 
      a.state !== 'cancelled' && 
      isSameDay(toDate(a.date)!, today)
    );

    const todayReminders = reminders.filter(r => 
      !r.isCompleted && 
      isSameDay(toDate(r.targetDate)!, today)
    );

    return {
      tasks: urgentTasks,
      appointments: todayAppointments,
      reminders: todayReminders,
      total: urgentTasks.length + todayAppointments.length + todayReminders.length
    };
  }, [tasks, appointments, reminders, today]);

  const urgentThisWeek = useMemo(() => {
    const interval = { start: startOfToday, end: endOfWeek };
    
    const weekTasks = tasks.filter(t => 
      t.status === 'pending' && 
      t.dueDate && 
      isWithinInterval(toDate(t.dueDate)!, interval) &&
      !isSameDay(toDate(t.dueDate)!, today)
    );

    const weekAppointments = appointments.filter(a => 
      a.state !== 'cancelled' && 
      isWithinInterval(toDate(a.date)!, interval) &&
      !isSameDay(toDate(a.date)!, today)
    );

    return {
      tasks: weekTasks,
      appointments: weekAppointments,
      total: weekTasks.length + weekAppointments.length
    };
  }, [tasks, appointments, endOfWeek, startOfToday, today]);

  const unresolvedAndWaiting = useMemo(() => {
    const waitingCases = cases.filter(c => 
      c.status === 'waiting-on-document' || c.status === 'waiting-on-response'
    );

    const pendingDocs = documents.filter(d => 
      d.status === 'uploaded' || d.status === 'analyzed' || d.status === 'analysis-failed'
    );

    return {
      cases: waitingCases,
      documents: pendingDocs,
      total: waitingCases.length + pendingDocs.length
    };
  }, [cases, documents]);

  return {
    isLoading,
    attentionToday,
    urgentThisWeek,
    unresolvedAndWaiting,
    recommendations: engineRecommendations,
    recentActivity: events
  };
}
