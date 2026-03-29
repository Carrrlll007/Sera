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
import { Task, TaskStatus, TaskType, Priority } from "../types";
import { timelineService } from "./timelineService";

const COLLECTION = "tasks";

export const taskService = {
  /**
   * Creates a new task and logs a timeline event.
   */
  async createTask(data: Partial<Task>, authorId: string, householdId: string) {
    try {
      const docRef = await addDoc(collection(db, COLLECTION), {
        ...data,
        status: data.status || "pending",
        priority: data.priority || "medium",
        authorId,
        householdId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await timelineService.logEvent({
        householdId,
        authorId,
        entityId: docRef.id,
        entityType: "task",
        type: "created",
        description: `Task "${data.title}" created.`,
      });

      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, COLLECTION);
    }
  },

  /**
   * Updates a task and logs a status change if applicable.
   */
  async updateTask(id: string, data: Partial<Task>, authorId: string, householdId: string) {
    try {
      const docRef = doc(db, COLLECTION, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });

      if (data.status) {
        await timelineService.logEvent({
          householdId,
          authorId,
          entityId: id,
          entityType: "task",
          type: "status_change",
          description: `Task status changed to ${data.status}.`,
          metadata: { newStatus: data.status }
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION}/${id}`);
    }
  },

  /**
   * Deletes a task.
   */
  async deleteTask(id: string) {
    try {
      await deleteDoc(doc(db, COLLECTION, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${COLLECTION}/${id}`);
    }
  },

  /**
   * Subscribes to all tasks for a specific household.
   */
  subscribeToHouseholdTasks(householdId: string, callback: (tasks: Task[]) => void) {
    const q = query(
      collection(db, COLLECTION),
      where("householdId", "==", householdId),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];
      callback(tasks);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, COLLECTION);
    });
  }
};
