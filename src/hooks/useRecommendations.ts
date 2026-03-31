import { useMemo } from "react";
import { useTasks } from "./useTasks";
import { useCases } from "./useCases";
import { useAppointments } from "./useAppointments";
import { useDocuments } from "./useDocuments";
import { Recommendation, Task, Case, Appointment, Document } from "../types";
import { generateRecommendations } from "../utils/recommendationGenerator";

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
    return generateRecommendations(tasks, cases, appointments, documents);
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
