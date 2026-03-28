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
  Timestamp
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { Appointment, AppointmentStatus } from "../types";

const COLLECTION = "appointments";

export const appointmentService = {
  async createAppointment(data: Partial<Appointment>) {
    try {
      const docRef = await addDoc(collection(db, COLLECTION), {
        ...data,
        status: data.status || "scheduled",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, COLLECTION);
    }
  },

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
