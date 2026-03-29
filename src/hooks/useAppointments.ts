import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../app/providers/AuthProvider";
import { useHousehold } from "./useHousehold";
import { appointmentService } from "../services/appointmentService";
import { Appointment, AppointmentState } from "../types";
import { toast } from "sonner";
import { canUserView, canUserEdit } from "../utils/permissions";

export function useAppointments() {
  const { user, household } = useAuth();
  const { userRole } = useHousehold();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!household?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = appointmentService.subscribeToHouseholdAppointments(
      household.id, 
      (newAppointments) => {
        setAppointments(newAppointments);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [household?.id]);

  const visibleAppointments = useMemo(() => {
    if (!user?.uid) return [];
    return appointments.filter(app => canUserView(user.uid, userRole, app));
  }, [appointments, user?.uid, userRole]);

  const createAppointment = async (data: Partial<Appointment>) => {
    if (!user?.uid || !household?.id) return;
    try {
      const appointmentId = await appointmentService.createAppointment(data, user.uid, household.id);
      toast.success("Appointment scheduled");
      return appointmentId;
    } catch (error) {
      toast.error("Failed to schedule appointment");
    }
  };

  const updateAppointmentState = async (appointmentId: string, state: AppointmentState) => {
    if (!user?.uid || !household?.id) return;
    
    const app = appointments.find(a => a.id === appointmentId);
    if (app && !canUserEdit(user.uid, userRole, app)) {
      toast.error("You don't have permission to update this appointment");
      return;
    }

    try {
      await appointmentService.updateAppointment(appointmentId, { state }, user.uid, household.id);
      toast.success(`Appointment marked as ${state}`);
    } catch (error) {
      toast.error("Failed to update appointment");
    }
  };

  const toggleChecklistItem = async (appointmentId: string, itemId: string, isCompleted: boolean) => {
    if (!user?.uid || !household?.id) return;
    
    const app = appointments.find(a => a.id === appointmentId);
    if (app && !canUserEdit(user.uid, userRole, app)) {
      toast.error("You don't have permission to update this checklist");
      return;
    }

    try {
      await appointmentService.toggleChecklistItem(appointmentId, itemId, isCompleted, user.uid, household.id);
    } catch (error) {
      toast.error("Failed to update checklist");
    }
  };

  return {
    appointments: visibleAppointments,
    allAppointments: appointments,
    isLoading,
    createAppointment,
    updateAppointmentState,
    toggleChecklistItem
  };
}
