import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc,
  serverTimestamp, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "./firebase";
import { Case, CaseStatus, Priority, CaseCategory } from "../types";
import { timelineService } from "./timelineService";
import { VALID_CASE_TRANSITIONS, getNextRecommendedAction } from "../constants/caseTransitions";

const COLLECTION = "cases";
const isCaseDomainError = (error: unknown) =>
  error instanceof Error &&
  (error.message === "Case not found" || error.message.startsWith("Invalid transition from "));

export const caseService = {
  /**
   * Creates a new case and logs a timeline event.
   */
  async createCase(data: Partial<Case>, authorId: string, authorName: string, householdId: string) {
    try {
      const status = data.status || "new";
      const docRef = await addDoc(collection(db, COLLECTION), {
        ...data,
        status,
        priority: data.priority || "medium",
        authorId,
        householdId,
        metadata: {
          ...data.metadata,
          nextRecommendedAction: getNextRecommendedAction(status)
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await timelineService.logEvent({
        householdId,
        authorId,
        authorName,
        entityId: docRef.id,
        entityType: "case",
        type: "created",
        description: `Case "${data.title}" created.`,
      });

      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, COLLECTION);
    }
  },

  /**
   * Updates a case and logs a status change if applicable.
   * Includes transition validation.
   */
  async updateCaseStatus(
    id: string, 
    newStatus: CaseStatus, 
    authorId: string, 
    authorName: string,
    householdId: string,
    reason?: string
  ) {
    try {
      const docRef = doc(db, COLLECTION, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) throw new Error("Case not found");
      
      const currentCase = docSnap.data() as Case;
      const currentStatus = currentCase.status;

      // 1. Validate Transition
      const allowed = VALID_CASE_TRANSITIONS[currentStatus];
      if (!allowed.includes(newStatus)) {
        throw new Error(`Invalid transition from ${currentStatus} to ${newStatus}`);
      }

      // 2. Update Case
      await updateDoc(docRef, {
        status: newStatus,
        "metadata.nextRecommendedAction": getNextRecommendedAction(newStatus),
        "metadata.lastActionTaken": reason || `Status changed to ${newStatus}`,
        updatedAt: serverTimestamp(),
      });

      // 3. Log Timeline
      await timelineService.logEvent({
        householdId,
        authorId,
        authorName,
        entityId: id,
        entityType: "case",
        type: "status_change",
        description: reason || `Case status changed from ${currentStatus} to ${newStatus}.`,
        metadata: { 
          oldStatus: currentStatus, 
          newStatus,
          reason 
        }
      });
    } catch (error) {
      if (isCaseDomainError(error)) {
        throw error;
      }
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION}/${id}`);
      throw error;
    }
  },

  /**
   * Adds a note/comment to the case timeline.
   */
  async addCaseNote(
    id: string, 
    note: string, 
    authorId: string, 
    authorName: string,
    householdId: string
  ) {
    try {
      await timelineService.logEvent({
        householdId,
        authorId,
        authorName,
        entityId: id,
        entityType: "case",
        type: "comment",
        description: note,
        metadata: { commentText: note }
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "timeline");
    }
  },

  /**
   * Updates a case's general metadata.
   */
  async updateCase(id: string, data: Partial<Case>) {
    try {
      const docRef = doc(db, COLLECTION, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION}/${id}`);
    }
  },

  /**
   * Subscribes to all cases for a specific household.
   */
  subscribeToHouseholdCases(householdId: string, callback: (cases: Case[]) => void) {
    const q = query(
      collection(db, COLLECTION),
      where("householdId", "==", householdId),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {
      const cases = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Case[];
      callback(cases);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, COLLECTION);
    });
  },

  /**
   * Subscribes to a single case.
   */
  subscribeToCase(id: string, callback: (c: Case) => void) {
    return onSnapshot(doc(db, COLLECTION, id), (snap) => {
      if (snap.exists()) {
        callback({ id: snap.id, ...snap.data() } as Case);
      }
    });
  },

  /**
   * Subscribes to the timeline events for a specific case.
   */
  subscribeToCaseTimeline(caseId: string, householdId: string, callback: (events: any[]) => void) {
    return timelineService.subscribeToEntityTimeline({
      householdId,
      entityId: caseId,
      entityType: "case",
    }, callback);
  }
};
