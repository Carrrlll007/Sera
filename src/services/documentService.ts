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
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage, handleFirestoreError, OperationType } from "./firebase";
import { Document, DocumentStatus } from "../types";
import { timelineService } from "./timelineService";

const COLLECTION = "documents";

export const documentService = {
  /**
   * Uploads a file to storage and creates a document record in Firestore.
   * Supports progress tracking via a callback.
   */
  uploadDocument(
    file: File, 
    authorId: string, 
    householdId: string,
    data: Partial<Document> = {},
    onProgress?: (progress: number) => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const storagePath = `households/${householdId}/documents/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, storagePath);
        
        // 1. Start Resumable Upload
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onProgress) onProgress(progress);
          },
          (error) => {
            handleFirestoreError(error, OperationType.WRITE, COLLECTION);
            reject(error);
          },
          async () => {
            try {
              // 2. Get Download URL
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);

              // 3. Create Firestore Record
              const docRef = await addDoc(collection(db, COLLECTION), {
                ...data,
                name: file.name,
                url: downloadUrl,
                storagePath,
                mimeType: file.type,
                size: file.size,
                status: "uploaded",
                authorId,
                householdId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });

              // 4. Log Timeline Event
              await timelineService.logEvent({
                householdId,
                authorId,
                entityId: docRef.id,
                entityType: "document",
                type: "document_added",
                description: `Document "${file.name}" uploaded.`,
                metadata: { documentUrl: downloadUrl }
              });

              resolve(docRef.id);
            } catch (error) {
              handleFirestoreError(error, OperationType.WRITE, COLLECTION);
              reject(error);
            }
          }
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, COLLECTION);
        reject(error);
      }
    });
  },

  /**
   * Updates document metadata (e.g., after AI analysis).
   */
  async updateDocument(id: string, data: Partial<Document>, authorId: string, householdId: string) {
    try {
      const docRef = doc(db, COLLECTION, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });

      if (data.status === "analyzed") {
        await timelineService.logEvent({
          householdId,
          authorId,
          entityId: id,
          entityType: "document",
          type: "action_taken",
          description: `Document analysis completed.`,
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION}/${id}`);
    }
  },

  /**
   * Deletes a document from Firestore and Storage.
   */
  async deleteDocument(id: string, storagePath: string, authorId: string, householdId: string) {
    try {
      // 1. Delete from Storage
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);

      // 2. Delete from Firestore
      const docRef = doc(db, COLLECTION, id);
      await deleteDoc(docRef);

      // 3. Log Timeline Event
      await timelineService.logEvent({
        householdId,
        authorId,
        entityId: id,
        entityType: "document",
        type: "action_taken",
        description: `Document deleted.`,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${COLLECTION}/${id}`);
    }
  },

  /**
   * Subscribes to all documents for a specific household.
   */
  subscribeToHouseholdDocuments(householdId: string, callback: (documents: Document[]) => void) {
    const q = query(
      collection(db, COLLECTION),
      where("householdId", "==", householdId),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {
      const documents = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Document[];
      callback(documents);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, COLLECTION);
    });
  }
};
