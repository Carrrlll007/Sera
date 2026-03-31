import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  orderBy, 
  onSnapshot
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "./firebase";
import { TimelineEvent, TimelineEventType, EntityType } from "../types";

const COLLECTION = "timeline";

export const timelineService = {
  /**
   * Logs a new event to the timeline.
   * Can be stored in a root collection for cross-entity views 
   * or potentially as a subcollection if needed.
   */
  async logEvent(params: {
    householdId: string;
    authorId: string;
    authorName?: string;
    entityId: string;
    entityType: EntityType;
    type: TimelineEventType;
    description: string;
    metadata?: any;
  }) {
    try {
      await addDoc(collection(db, COLLECTION), {
        ...params,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, COLLECTION);
    }
  },

  /**
   * Subscribes to all events for a specific household.
   */
  subscribeToHouseholdTimeline(householdId: string, callback: (events: TimelineEvent[]) => void) {
    const q = query(
      collection(db, COLLECTION),
      where("householdId", "==", householdId),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as TimelineEvent[];
      callback(events);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, COLLECTION);
    });
  },

  /**
   * Subscribes to events for a specific entity (e.g., a specific Case).
   */
  subscribeToEntityTimeline(
    params: {
      householdId: string;
      entityId: string;
      entityType: EntityType;
    },
    callback: (events: TimelineEvent[]) => void
  ) {
    const q = query(
      collection(db, COLLECTION),
      where("householdId", "==", params.householdId),
      where("entityId", "==", params.entityId),
      where("entityType", "==", params.entityType),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as TimelineEvent[];
      callback(events);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, COLLECTION);
    });
  }
};
