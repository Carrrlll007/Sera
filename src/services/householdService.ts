import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  query, 
  where, 
  onSnapshot,
  getDocs,
  Timestamp
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { Household, HouseholdMember } from "../types";

const COLLECTION = "households";

export const householdService = {
  async getOrCreateHousehold(uid: string, displayName: string) {
    try {
      const q = query(collection(db, COLLECTION), where("members", "array-contains", uid));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        const newHousehold = {
          name: `${displayName || 'My'} Household`,
          members: [uid],
          createdAt: serverTimestamp()
        };
        const docRef = await addDoc(collection(db, COLLECTION), newHousehold);
        return { id: docRef.id, ...newHousehold } as any as Household;
      } else {
        return { id: snap.docs[0].id, ...snap.docs[0].data() } as any as Household;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, COLLECTION);
    }
  },

  subscribeToHousehold(id: string, callback: (household: Household) => void) {
    const docRef = doc(db, COLLECTION, id);
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() } as Household);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `${COLLECTION}/${id}`);
    });
  },

  subscribeToHouseholdMembers(householdId: string, callback: (members: HouseholdMember[]) => void) {
    const q = query(collection(db, COLLECTION, householdId, "members"));
    return onSnapshot(q, (snapshot) => {
      const members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any as HouseholdMember));
      callback(members);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `${COLLECTION}/${householdId}/members`);
    });
  }
};
