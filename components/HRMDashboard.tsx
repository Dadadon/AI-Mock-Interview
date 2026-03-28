"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import dayjs from "dayjs";

import { db } from "@/firebase/client";

interface HRMDashboardProps {
  employerId: string;
  initialApplications: Application[];
}

const getScoreColor = (score: number) => {
  if (score >= 75) return "text-green-400";
  if (score >= 50) return "text-yellow-400";
  return "text-red-400";
};

const HRMDashboard = ({ employerId, initialApplications }: HRMDashboardProps) => {
  const [applications, setApplications] =
    useState<Application[]>(initialApplications);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, "applications"),
      where("employerId", "==", employerId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apps = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Application[];
      setApplications(apps);
    });

    return () => unsubscribe();
  }, [employerId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">HRM Dashboard</h1>
          <p className="text-light-400 text-sm mt-1">
            {applications.length} applicant
            {applications.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-light-400">Live</span>
        </div>
      </div>

      {/* Empty state */}
      {applications.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-light-400">
            No applications yet. Share your job listings to start receiving
            candidates.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-input">
          <table className="w-full">
            <thead>
              <tr className="border-b border-input bg-dark-200/40 text-left">
                <th className="px-4 py-3 text-xs font-medium text-light-400 uppercase tracking-wide">
                  Applicant
                </th>
                <th className="px-4 py-3 text-xs font-medium text-light-400 uppercase tracking-wide">
                  Role
                </th>
                <th className="px-4 py-3 text-xs font-medium text-light-400 uppercase tracking-wide">
                  Score
                </th>
                <th className="px-4 py-3 text-xs font-medium text-light-400 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-medium text-light-400 uppercase tracking-wide">
                  Date
                </th>
                <th className="px-4 py-3 text-xs font-medium text-light-400 uppercase tracking-wide">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr
                  key={app.id}
                  className="border-b border-input/50 hover:bg-dark-200/30 transition-colors"
                >
                  <td className="px-4 py-4 font-medium">{app.applicantName}</td>
                  <td className="px-4 py-4 text-sm text-light-400 capitalize">
                    {app.jobTitle}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`font-bold text-lg ${getScoreColor(app.score)}`}
                    >
                      {app.score}
                    </span>
                    <span className="text-light-400 text-sm">/100</span>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        app.status === "reviewed"
                          ? "bg-green-400/20 text-green-400"
                          : "bg-primary-200/20 text-primary-200"
                      }`}
                    >
                      {app.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-light-400">
                    {dayjs(app.createdAt).format("MMM D, YYYY h:mm A")}
                  </td>
                  <td className="px-4 py-4">
                    <button
                      className="text-primary-200 text-sm hover:underline"
                      onClick={() =>
                        setSelectedApp(
                          selectedApp?.id === app.id ? null : app
                        )
                      }
                    >
                      {selectedApp?.id === app.id ? "Close" : "Review"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Transcript / Detail Panel */}
      {selectedApp && (
        <div className="card-border">
          <div className="card p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">
                  {selectedApp.applicantName}
                </h3>
                <p className="text-light-400 text-sm">
                  {selectedApp.jobTitle} &bull; Score:{" "}
                  <span
                    className={`font-bold ${getScoreColor(selectedApp.score)}`}
                  >
                    {selectedApp.score}/100
                  </span>
                </p>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="text-light-400 hover:text-light-100 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {selectedApp.summary && (
              <div>
                <h4 className="text-sm font-medium text-light-400 mb-1">
                  AI Summary
                </h4>
                <p className="text-sm">{selectedApp.summary}</p>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium text-light-400 mb-2">
                Call Transcript
              </h4>
              <div className="bg-dark-300/50 rounded-lg p-4 max-h-64 overflow-y-auto">
                <p className="text-sm whitespace-pre-wrap">
                  {selectedApp.transcript || "No transcript available."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRMDashboard;
