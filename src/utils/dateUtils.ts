import { Timestamp } from "firebase/firestore";

/**
 * Safely converts a Firestore timestamp (or Date, or string) to a JavaScript Date object.
 */
export function toDate(date: any): Date | null {
  if (!date) return null;
  
  // If it's already a Date object
  if (date instanceof Date) return date;
  
  // If it's a Firestore Timestamp object
  if (typeof date.toDate === 'function') return date.toDate();
  
  // If it's a plain object that looks like a Timestamp (e.g. from JSON serialization)
  if (date.seconds !== undefined && date.nanoseconds !== undefined) {
    try {
      return new Timestamp(date.seconds, date.nanoseconds).toDate();
    } catch (e) {
      return null;
    }
  }
  
  // Fallback for strings or numbers
  const parsed = new Date(date);
  return isNaN(parsed.getTime()) ? null : parsed;
}
