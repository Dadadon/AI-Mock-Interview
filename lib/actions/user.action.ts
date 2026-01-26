import { db } from "@/firebase/client";
import { doc, updateDoc } from "firebase/firestore";

export async function syncUserEligibility(userId: string, data: any) {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      ...data, // Spreads location, noticePeriod, resumeUrl, etc.
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error("Profile sync error:", error);
  }
}