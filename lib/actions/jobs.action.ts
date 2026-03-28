"use server";

import { db } from "@/firebase/admin";

export async function createJob(params: CreateJobParams) {
  try {
    const jobRef = db.collection("jobs").doc();
    await jobRef.set({
      ...params,
      createdAt: new Date().toISOString(),
    });
    return { success: true, jobId: jobRef.id };
  } catch (error) {
    console.error("Error creating job:", error);
    return { success: false };
  }
}

export async function getJobs({
  limit = 20,
}: { limit?: number } = {}): Promise<Job[]> {
  const jobs = await db
    .collection("jobs")
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return jobs.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Job[];
}

export async function getJobById(jobId: string): Promise<Job | null> {
  const doc = await db.collection("jobs").doc(jobId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Job;
}

export async function getApplicationsByEmployerId(
  employerId: string
): Promise<Application[]> {
  const apps = await db
    .collection("applications")
    .where("employerId", "==", employerId)
    .orderBy("createdAt", "desc")
    .get();

  return apps.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Application[];
}

export async function getApplicationsByJobId(
  jobId: string
): Promise<Application[]> {
  const apps = await db
    .collection("applications")
    .where("jobId", "==", jobId)
    .orderBy("createdAt", "desc")
    .get();

  return apps.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Application[];
}
