import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "./firebase";
import { Reminder, ReminderType, EntityType } from "../types";

const COLLECTION = "reminders";

export const reminderService = {
  /**
   * Creates a new reminder.
   */
  async createReminder(data: Partial<Reminder>, authorId: string, householdId: string) {
    try {
      const docRef = await addDoc(collection(db, COLLECTION), {
        ...data,
        isCompleted: false,
        authorId,
        householdId,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, COLLECTION);
    }
  },

  /**
   * Toggles completion status of a reminder.
   */
  async toggleReminder(id: string, isCompleted: boolean) {
    try {
      const docRef = doc(db, COLLECTION, id);
      await updateDoc(docRef, { isCompleted });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION}/${id}`);
    }
  },

  /**
   * Deletes a reminder.
   */
  async deleteReminder(id: string) {
    try {
      await deleteDoc(doc(db, COLLECTION, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${COLLECTION}/${id}`);
    }
  },

  /**
   * Subscribes to all reminders for a specific household.
   */
  subscribeToHouseholdReminders(householdId: string, callback: (reminders: Reminder[]) => void) {
    const q = query(
      collection(db, COLLECTION),
      where("householdId", "==", householdId),
      orderBy("targetDate", "asc")
    );

    return onSnapshot(q, (snapshot) => {
      const reminders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Reminder[];
      callback(reminders);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, COLLECTION);
    });
  }
};
