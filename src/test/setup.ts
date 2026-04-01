import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Firebase
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn().mockReturnValue({
    currentUser: null,
    signOut: vi.fn(),
  }),
  signInWithPopup: vi.fn(),
  onAuthStateChanged: vi.fn(),
  GoogleAuthProvider: class {},
}));

vi.mock('firebase/firestore', () => ({
  Timestamp: class MockTimestamp {
    seconds: number;
    nanoseconds: number;

    constructor(seconds: number, nanoseconds: number) {
      this.seconds = seconds;
      this.nanoseconds = nanoseconds;
    }

    static fromDate(date: Date) {
      return new MockTimestamp(Math.floor(date.getTime() / 1000), date.getMilliseconds() * 1_000_000);
    }

    toDate() {
      return new Date((this.seconds * 1000) + Math.floor(this.nanoseconds / 1_000_000));
    }
  },
  getFirestore: vi.fn(),
  collection: vi.fn().mockReturnValue('mock-collection'),
  doc: vi.fn().mockReturnValue('mock-doc'),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  onSnapshot: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  serverTimestamp: vi.fn().mockReturnValue('mock-timestamp'),
  getDocFromServer: vi.fn(),
}));

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(),
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  uploadBytesResumable: vi.fn(),
  getDownloadURL: vi.fn(),
  deleteObject: vi.fn(),
}));
