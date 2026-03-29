import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  getDoc
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "./firebase";
import { Appointment, AppointmentState, AppointmentChecklistItem } from "../types";
import { timelineService } from "./timelineService";
import { taskService } from "./taskService";
import { reminderService } from "./reminderService";
import { getAppointmentTemplate, getNextRecommendedAction } from "../constants/appointmentWorkflow";
import { addDays, subDays } from "date-fns";

const COLLECTION = "appointments";

export const appointmentService = {
  /**
   * Creates a new appointment with automated workflow generation.
   */
  async createAppointment(data: Partial<Appointment>, authorId: string, householdId: string) {
    try {
      const template = getAppointmentTemplate(data.type || "default");
      const initialState: AppointmentState = template.confirmationRequired ? "needs-confirmation" : "scheduled";
      
      const checklist: AppointmentChecklistItem[] = [
        ...template.prepItems.map(text => ({
          id: Math.random().toString(36).substr(2, 9),
          text,
          isCompleted: false,
          type: "prep" as const
        })),
        ...template.followUpItems.map(text => ({
          id: Math.random().toString(36).substr(2, 9),
          text,
          isCompleted: false,
          type: "follow-up" as const
        }))
      ];

      const appointmentData = {
        ...data,
        state: initialState,
        checklist,
        confirmationRequired: template.confirmationRequired,
        authorId,
        householdId,
        metadata: {
          ...data.metadata,
          nextRecommendedAction: getNextRecommendedAction(initialState),
          remindersGenerated: true
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, COLLECTION), appointmentData);
      const appointmentId = docRef.id;

      // 1. Log Timeline
      await timelineService.logEvent({
        householdId,
        authorId,
        entityId: appointmentId,
        entityType: "appointment",
        type: "created",
        description: `Appointment "${data.title}" scheduled.`,
      });

      // 2. Generate Reminders (if date is provided)
      if (data.date) {
        const appointmentDate = data.date.toDate();
        
        // Confirmation reminder (2 days before)
        if (template.confirmationRequired) {
          await reminderService.createReminder({
            title: `Confirm appointment: ${data.title}`,
            targetDate: Timestamp.fromDate(subDays(appointmentDate, 2)),
            type: "nudge",
            linkedEntityId: appointmentId,
            linkedEntityType: "appointment"
          }, authorId, householdId);
        }

        // Prep reminder (1 day before)
        await reminderService.createReminder({
          title: `Prepare for: ${data.title}`,
          targetDate: Timestamp.fromDate(subDays(appointmentDate, 1)),
          type: "preparation",
          linkedEntityId: appointmentId,
          linkedEntityType: "appointment"
        }, authorId, householdId);
      }

      // 3. Create Prep Task if needed
      if (template.prepItems.length > 0) {
        const taskId = await taskService.createTask({
          title: `Prep: ${data.title}`,
          description: `Complete preparation for appointment with ${data.provider}. Check the appointment details for the full list.`,
          type: "appointment",
          priority: "medium",
          dueDate: data.date,
          appointmentId: appointmentId
        }, authorId, householdId);
        
        await updateDoc(doc(db, COLLECTION, appointmentId), {
          "metadata.prepTaskId": taskId
        });
      }

      return appointmentId;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, COLLECTION);
    }
  },

  /**
   * Updates an appointment and handles workflow transitions.
   */
  async updateAppointment(id: string, data: Partial<Appointment>, authorId: string, householdId: string) {
    try {
      const docRef = doc(db, COLLECTION, id);
      const currentDoc = await getDoc(docRef);
      const currentData = currentDoc.data() as Appointment;

      const updatedData = {
        ...data,
        updatedAt: serverTimestamp(),
      };

      // Handle state transition logic
      if (data.state && data.state !== currentData.state) {
        updatedData.metadata = {
          ...currentData.metadata,
          ...data.metadata,
          nextRecommendedAction: getNextRecommendedAction(data.state)
        };

        // Trigger follow-up task generation on completion
        if (data.state === "completed" && currentData.state !== "completed") {
          const template = getAppointmentTemplate(currentData.type);
          if (template.followUpItems.length > 0) {
            const taskId = await taskService.createTask({
              title: `Follow-up: ${currentData.title}`,
              description: `Complete follow-up actions from your visit with ${currentData.provider}.`,
              type: "appointment",
              priority: "medium",
              dueDate: Timestamp.fromDate(addDays(new Date(), 2)),
              appointmentId: id
            }, authorId, householdId);
            
            updatedData.metadata.followUpTaskId = taskId;
          }
        }
      }

      await updateDoc(docRef, updatedData);

      if (data.state && data.state !== currentData.state) {
        await timelineService.logEvent({
          householdId,
          authorId,
          entityId: id,
          entityType: "appointment",
          type: "status_change",
          description: `Appointment state changed to ${data.state}.`,
          metadata: { 
            oldStatus: currentData.state,
            newStatus: data.state 
          }
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION}/${id}`);
    }
  },

  /**
   * Toggles a checklist item.
   */
  async toggleChecklistItem(appointmentId: string, itemId: string, isCompleted: boolean, authorId: string, householdId: string) {
    try {
      const docRef = doc(db, COLLECTION, appointmentId);
      const currentDoc = await getDoc(docRef);
      const currentData = currentDoc.data() as Appointment;
      
      const updatedChecklist = currentData.checklist?.map(item => 
        item.id === itemId ? { ...item, isCompleted } : item
      );

      await updateDoc(docRef, {
        checklist: updatedChecklist,
        updatedAt: serverTimestamp()
      });

      // If all prep items are completed, suggest moving to "prepped"
      const prepItems = updatedChecklist?.filter(i => i.type === "prep") || [];
      const allPrepDone = prepItems.length > 0 && prepItems.every(i => i.isCompleted);
      
      if (allPrepDone && currentData.state === "preparation-needed") {
        await this.updateAppointment(appointmentId, { state: "prepped" }, authorId, householdId);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION}/${appointmentId}`);
    }
  },

  /**
   * Subscribes to all appointments for a specific household.
   */
  subscribeToHouseholdAppointments(householdId: string, callback: (appointments: Appointment[]) => void) {
    const q = query(
      collection(db, COLLECTION),
      where("householdId", "==", householdId),
      orderBy("date", "asc")
    );

    return onSnapshot(q, (snapshot) => {
      const appointments = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Appointment[];
      callback(appointments);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, COLLECTION);
    });
  }
};
