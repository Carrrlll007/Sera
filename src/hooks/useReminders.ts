import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../app/providers/AuthProvider';
import { reminderService } from '../services/reminderService';
import { Reminder } from '../types';

export const useReminders = () => {
  const { user, household } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!household) return;
    setIsLoading(true);
    return reminderService.subscribeToHouseholdReminders(household.id, (data) => {
      setReminders(data);
      setIsLoading(false);
    });
  }, [household]);

  const createReminder = useCallback(async (data: Partial<Reminder>) => {
    if (!user || !household) return null;
    return reminderService.createReminder(data, user.uid, household.id);
  }, [user, household]);

  const toggleReminder = useCallback(async (id: string, isCompleted: boolean) => {
    return reminderService.toggleReminder(id, isCompleted);
  }, []);

  const deleteReminder = useCallback(async (id: string) => {
    return reminderService.deleteReminder(id);
  }, []);

  return {
    reminders,
    isLoading,
    createReminder,
    toggleReminder,
    deleteReminder
  };
};
