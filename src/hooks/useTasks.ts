import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../app/providers/AuthProvider";
import { useHousehold } from "./useHousehold";
import { taskService } from "../services/taskService";
import { Task, TaskStatus } from "../types";
import { toast } from "sonner";
import { canUserView, canUserEdit } from "../utils/permissions";

/**
 * Custom hook for managing household tasks.
 * Demonstrates the usage of the refactored taskService.
 */
export function useTasks() {
  const { user, household } = useAuth();
  const { userRole } = useHousehold();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!household?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = taskService.subscribeToHouseholdTasks(
      household.id, 
      (newTasks) => {
        setTasks(newTasks);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [household?.id]);

  const visibleTasks = useMemo(() => {
    if (!user?.uid) return [];
    return tasks.filter(task => canUserView(user.uid, userRole, task));
  }, [tasks, user?.uid, userRole]);

  const createTask = async (data: Partial<Task>) => {
    if (!user?.uid || !household?.id) return;
    try {
      const taskId = await taskService.createTask(data, user.uid, household.id);
      toast.success("Task created successfully");
      return taskId;
    } catch (error) {
      toast.error("Failed to create task");
    }
  };

  const updateTask = async (taskId: string, data: Partial<Task>) => {
    if (!user?.uid || !household?.id) return;
    
    const task = tasks.find(t => t.id === taskId);
    if (task && !canUserEdit(user.uid, userRole, task)) {
      toast.error("You don't have permission to edit this task");
      return;
    }

    try {
      await taskService.updateTask(taskId, data, user.uid, household.id);
      if (data.status) {
        toast.success(`Task marked as ${data.status}`);
      } else {
        toast.success("Task updated");
      }
    } catch (error) {
      toast.error("Failed to update task");
    }
  };

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    return updateTask(taskId, { status });
  };

  const deleteTask = async (taskId: string) => {
    if (!user?.uid) return;
    
    const task = tasks.find(t => t.id === taskId);
    if (task && !canUserEdit(user.uid, userRole, task)) {
      toast.error("You don't have permission to delete this task");
      return;
    }

    try {
      await taskService.deleteTask(taskId);
      toast.success("Task deleted");
    } catch (error) {
      toast.error("Failed to delete task");
    }
  };

  return {
    tasks: visibleTasks,
    allTasks: tasks, // For admin views if needed
    isLoading,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask
  };
}
