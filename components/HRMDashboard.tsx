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
import { Users, TrendingUp } from "lucide-react";

import { db } from "@/firebase/client";

interface HRMDashboardProps {
  employerId: string;
  initialApplications: Application[];
}

// Jamaica-palette score colours
const getScoreColor = (score: number) => {
  if (score >= 75) return "text-jamaica-green";
  if (score >= 50) return "text-jamaica-gold";
  return "text-destructive-100";
};

const getScoreBg = (score: number) => {
  if (score >= 75) return "bg-jamaica-green/15 text-jamaica-green";
  if (score >= 50) return "bg-jamaica-gold/15 text-jamaica-gold";
  return "bg-destructive-100/15 text-destructive-100";
};

const HRMDashboard = ({ employerId, initialApplications }: HRMDashboardProps) => {
  const [applications, setApplications] =
    useState<Application[]>(initialApplications);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  // ── Real-time listener ──────────────────────────────────────────────
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

  // ── Stats ───────────────────────────────────────────────────────────
  const avgScore =
    applications.length > 0
      ? Math.round(
          applications.reduce((sum, a) => sum + (a.score || 0), 0) /
            applications.length
        )
      : 0;

  const topApplicant =
    applications.length > 0
      ? applications.reduce((best, a) =>
          (a.score || 0) > (best.score || 0) ? a : best
        )
      : null;

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            HRM Dashboard
          </h1>
          <p className="text-light-400 text-sm mt-1">
            Applicant pipeline — real-time AI screening results
          </p>
        </div>
        <div className="flex items-center gap-2 bg-dark-300 px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-jamaica-green animate-pulse" />
          <span className="text-xs font-semibold text-light-400">Live</span>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-border">
          <div className="card px-5 py-4 flex items-center gap-4">
            <div className="p-2 rounded-xl bg-jamaica-green/15">
              <Users className="w-5 h-5 text-jamaica-green" />
            </div>
            <div>
              <p className="text-2xl font-extrabold">{applications.length}</p>
              <p className="text-xs text-light-400">Total Applicants</p>
            </div>
          </div>
        </div>

        <div className="card-border">
          <div className="card px-5 py-4 flex items-center gap-4">
            <div className="p-2 rounded-xl bg-jamaica-gold/15">
              <TrendingUp className="w-5 h-5 text-jamaica-gold" />
            </div>
            <div>
              <p className={`text-2xl font-extrabold ${getScoreColor(avgScore)}`}>
                {avgScore}
                <span className="text-sm font-normal text-light-400">/100</span>
              </p>
              <p className="text-xs text-light-400">Avg. AI Score</p>
            </div>
          </div>
        </div>

        <div className="card-border">
          <div className="card px-5 py-4 flex items-center gap-4">
            <div className="p-2 rounded-xl bg-jamaica-green/15">
              <span className="text-lg">🏆</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">
                {topApplicant?.applicantName ?? "—"}
              </p>
              <p className="text-xs text-light-400">
                Top Score:{" "}
                <span className={`font-bold ${getScoreColor(topApplicant?.score ?? 0)}`}>
                  {topApplicant?.score ?? "—"}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      {applications.length === 0 ? (
        <div className="card-border">
          <div className="card p-12 text-center">
            <p className="text-light-400">
              No applications yet. Share your job listings to start receiving
              screened candidates.
            </p>
          </div>
        </div>
      ) : (
        <div className="card-border w-full">
          <div className="overflow-x-auto rounded-3xl">
            <table className="w-full">
              <thead>
                <tr className="border-b border-jamaica-green/20 bg-jamaica-green/8 text-left">
                  <th className="px-5 py-3.5 text-xs font-bold text-light-400 uppercase tracking-widest">
                    Applicant
                  </th>
                  <th className="px-5 py-3.5 text-xs font-bold text-light-400 uppercase tracking-widest">
                    Role
                  </th>
                  <th className="px-5 py-3.5 text-xs font-bold text-light-400 uppercase tracking-widest">
                    AI Score
                  </th>
                  <th className="px-5 py-3.5 text-xs font-bold text-light-400 uppercase tracking-widest">
                    Status
                  </th>
                  <th className="px-5 py-3.5 text-xs font-bold text-light-400 uppercase tracking-widest">
                    Date
                  </th>
                  <th className="px-5 py-3.5 text-xs font-bold text-light-400 uppercase tracking-widest">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr
                    key={app.id}
                    className="border-b border-jamaica-green/10 hover:bg-jamaica-green/5 transition-colors"
                  >
                    <td className="px-5 py-4 font-semibold">{app.applicantName}</td>
                    <td className="px-5 py-4 text-sm text-light-400 capitalize">
                      {app.jobTitle}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-bold ${getScoreBg(app.score)}`}
                      >
                        {app.score}
                        <span className="text-xs font-normal opacity-70">/100</span>
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                          app.status === "reviewed"
                            ? "bg-jamaica-gold/20 text-jamaica-gold"
                            : "bg-jamaica-green/20 text-jamaica-green"
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-light-400">
                      {dayjs(app.createdAt).format("MMM D, YYYY · h:mm A")}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        className="text-jamaica-green text-sm font-semibold hover:text-jamaica-gold transition-colors"
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
        </div>
      )}

      {/* ── Transcript panel ── */}
      {selectedApp && (
        <div className="card-border w-full">
          <div className="card p-6 space-y-5 rounded-3xl">
            {/* Panel header */}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-xl">{selectedApp.applicantName}</h3>
                <p className="text-light-400 text-sm mt-0.5">
                  {selectedApp.jobTitle} &bull;{" "}
                  <span className="font-bold">AI Score: </span>
                  <span className={`font-extrabold ${getScoreColor(selectedApp.score)}`}>
                    {selectedApp.score}/100
                  </span>
                </p>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="text-light-400 hover:text-light-100 text-xl leading-none transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Gold divider */}
            <div className="h-px bg-gradient-to-r from-jamaica-gold/50 via-jamaica-green/30 to-transparent" />

            {/* AI Summary */}
            {selectedApp.summary && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-jamaica-gold mb-2">
                  AI Summary
                </h4>
                <p className="text-sm leading-relaxed text-light-400">
                  {selectedApp.summary}
                </p>
              </div>
            )}

            {/* Transcript */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-jamaica-gold mb-2">
                Call Transcript
              </h4>
              <div className="bg-dark-300/60 border border-jamaica-green/15 rounded-2xl p-4 max-h-64 overflow-y-auto">
                <p className="text-sm whitespace-pre-wrap leading-relaxed text-light-400">
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
