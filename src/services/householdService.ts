import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc,
  getDocs,
  serverTimestamp, 
  query, 
  where, 
  onSnapshot,
  Timestamp
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "./firebase";
import { Household, HouseholdMember, MemberRole } from "../types";

const COLLECTION = "households";

export const householdService = {
  /**
   * Creates a new household and adds the creator as an admin member.
   */
  async createHousehold(name: string, ownerId: string, ownerEmail: string, ownerDisplayName: string) {
    try {
      // 1. Create Household
      const householdRef = await addDoc(collection(db, COLLECTION), {
        name,
        ownerId,
        members: [ownerId],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 2. Create Initial Member Record
      const memberRef = await addDoc(collection(db, COLLECTION, householdRef.id, "members"), {
        uid: ownerId,
        displayName: ownerDisplayName,
        email: ownerEmail,
        role: "admin",
        joinedAt: serverTimestamp(),
      });

      return { householdId: householdRef.id, memberId: memberRef.id };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, COLLECTION);
    }
  },

  /**
   * Retrieves a household by its ID.
   */
  async getHousehold(id: string): Promise<Household | null> {
    try {
      const docRef = doc(db, COLLECTION, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Household;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${COLLECTION}/${id}`);
      return null;
    }
  },

  /**
   * Subscribes to a household's members list.
   */
  subscribeToHouseholdMembers(householdId: string, callback: (members: HouseholdMember[]) => void) {
    const q = query(
      collection(db, COLLECTION, householdId, "members")
    );

    return onSnapshot(q, (snapshot) => {
      const members = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as HouseholdMember[];
      callback(members);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `${COLLECTION}/${householdId}/members`);
    });
  },

  /**
   * Finds a household by a member's UID.
   */
  async findHouseholdByMember(uid: string): Promise<Household | null> {
    try {
      const q = query(
        collection(db, COLLECTION),
        where("members", "array-contains", uid)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Household;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLLECTION);
      return null;
    }
  },

  /**
   * Invites a new member to the household (simulated for now by direct addition).
   */
  async addMember(householdId: string, memberData: Omit<HouseholdMember, "id" | "joinedAt">) {
    try {
      const householdRef = doc(db, COLLECTION, householdId);
      const householdSnap = await getDoc(householdRef);
      
      if (!householdSnap.exists()) throw new Error("Household not found");
      
      const currentMembers = householdSnap.data().members || [];
      if (!currentMembers.includes(memberData.uid)) {
        await updateDoc(householdRef, {
          members: [...currentMembers, memberData.uid],
          updatedAt: serverTimestamp()
        });
      }

      const memberRef = await addDoc(collection(db, COLLECTION, householdId, "members"), {
        ...memberData,
        joinedAt: serverTimestamp()
      });

      return memberRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `${COLLECTION}/${householdId}/members`);
    }
  },

  /**
   * Updates a member's role.
   */
  async updateMemberRole(householdId: string, memberId: string, role: MemberRole) {
    try {
      const memberRef = doc(db, COLLECTION, householdId, "members", memberId);
      await updateDoc(memberRef, { role });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION}/${householdId}/members/${memberId}`);
    }
  },

  /**
   * Removes a member from the household.
   */
  async removeMember(householdId: string, memberId: string, uid: string) {
    try {
      // 1. Remove from members subcollection
      await updateDoc(doc(db, COLLECTION, householdId, "members", memberId), {
        role: "archived" // Soft delete or actual delete
      });

      // 2. Remove UID from household members array
      const householdRef = doc(db, COLLECTION, householdId);
      const householdSnap = await getDoc(householdRef);
      if (householdSnap.exists()) {
        const currentMembers = householdSnap.data().members || [];
        await updateDoc(householdRef, {
          members: currentMembers.filter((id: string) => id !== uid),
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${COLLECTION}/${householdId}/members/${memberId}`);
    }
  }
};
