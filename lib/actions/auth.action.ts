"use server";

import { auth, db } from "@/firebase/admin";
import { cookies } from "next/headers";

// Session duration (1 week)
const SESSION_DURATION = 60 * 60 * 24 * 7;

// Set session cookie
export async function setSessionCookie(idToken: string) {
  const cookieStore = await cookies();

  // Create session cookie
  const sessionCookie = await auth.createSessionCookie(idToken, {
    expiresIn: SESSION_DURATION * 1000, // milliseconds
  });

  // Set cookie in the browser
  cookieStore.set("session", sessionCookie, {
    maxAge: SESSION_DURATION,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
  });
}

export async function signUp(params: SignUpParams) {
  const { uid, name, email, role } = params;

  try {
    // check if user exists in db
    const userRecord = await db.collection("users").doc(uid).get();
    if (userRecord.exists)
      return {
        success: false,
        message: "User already exists. Please sign in.",
      };

    // save user to db
    await db.collection("users").doc(uid).set({
      name,
      email,
      role: role || "applicant",
    });

    return {
      success: true,
      message: "Account created successfully. Please sign in.",
    };
  } catch (error: any) {
    console.error("Error creating user:", error);

    // Handle Firebase specific errors
    if (error.code === "auth/email-already-exists") {
      return {
        success: false,
        message: "This email is already in use",
      };
    }

    return {
      success: false,
      message: "Failed to create account. Please try again.",
    };
  }
}

export async function signIn(params: SignInParams) {
  const { email, idToken } = params;

  try {
    const userRecord = await auth.getUserByEmail(email);
    if (!userRecord)
      return {
        success: false,
        message: "User does not exist. Create an account.",
      };

    await setSessionCookie(idToken);
  } catch (error: any) {
    console.log("");

    return {
      success: false,
      message: "Failed to log into account. Please try again.",
    };
  }
}

// Sign out user by clearing the session cookie
export async function signOut() {
  const cookieStore = await cookies();

  cookieStore.delete("session");
}

// Get current user from session cookie
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();

  const sessionCookie = cookieStore.get("session")?.value;
  if (!sessionCookie) return null;

  try {
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);

    // get user info from db
    const userRecord = await db
      .collection("users")
      .doc(decodedClaims.uid)
      .get();
    if (!userRecord.exists) return null;

    return {
      ...userRecord.data(),
      id: userRecord.id,
      role: userRecord.data()?.role || "applicant",
    } as User;
  } catch (error) {
    console.log(error);

    // Invalid or expired session
    return null;
  }
}

// Check if user is authenticated
export async function isAuthenticated() {
  const user = await getCurrentUser();
  return !!user;
}

export async function updateUserResume(params: {
  userId: string;
  resumeUrl: string;
  resumeText: string;
  resumeFileName: string;
  resumeSummary?: string;
  resumeSkills?: string[];
  resumeExperienceSummary?: string;
  resumeEducation?: string;
  resumeYearsExperience?: string;
}) {
  try {
    const {
      userId, resumeUrl, resumeText, resumeFileName,
      resumeSummary, resumeSkills, resumeExperienceSummary,
      resumeEducation, resumeYearsExperience,
    } = params;

    const update: Record<string, unknown> = { resumeUrl, resumeText, resumeFileName };
    if (resumeSummary !== undefined) update.resumeSummary = resumeSummary;
    if (resumeSkills !== undefined) update.resumeSkills = resumeSkills;
    if (resumeExperienceSummary !== undefined) update.resumeExperienceSummary = resumeExperienceSummary;
    if (resumeEducation !== undefined) update.resumeEducation = resumeEducation;
    if (resumeYearsExperience !== undefined) update.resumeYearsExperience = resumeYearsExperience;

    await db.collection("users").doc(userId).update(update);
    return { success: true };
  } catch (error) {
    console.error("[updateUserResume] Error:", error);
    return { success: false };
  }
}

export async function updateUserPhoto(params: {
  userId: string;
  photoUrl: string;
}) {
  try {
    await db.collection("users").doc(params.userId).update({
      photoUrl: params.photoUrl,
    });
    return { success: true };
  } catch (error) {
    console.error("[updateUserPhoto] Error:", error);
    return { success: false };
  }
}
