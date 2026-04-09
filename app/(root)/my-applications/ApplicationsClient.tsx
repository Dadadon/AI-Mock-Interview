"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

// ── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  Application["status"],
  { label: string; className: string }
> = {
  complete: { label: "Complete", className: "bg-jamaica-green/15 text-jamaica-green" },
  interview_pending: { label: "Awaiting Interview", className: "bg-jamaica-gold/15 text-jamaica-gold" },
  interview_incomplete: { label: "Call Ended Early", className: "bg-orange-500/15 text-orange-400" },
  ineligible: { label: "Ineligible", className: "bg-destructive-100/15 text-destructive-100" },
};

function scoreColor(score: number) {
  if (score >= 75) return "text-jamaica-green";
  if (score >= 50) return "text-jamaica-gold";
  return "text-destructive-100";
}

function scoreBarColor(score: number) {
  if (score >= 75) return "bg-jamaica-green";
  if (score >= 50) return "bg-jamaica-gold";
  return "bg-destructive-100";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-JM", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="card-border">
      <div className="card p-4 rounded-2xl text-center space-y-0.5">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-light-400 uppercase tracking-widest">{label}</p>
        {sub && <p className="text-xs text-light-600">{sub}</p>}
      </div>
    </div>
  );
}

function CategoryBar({ name, score, comment }: { name: string; score: number; comment: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-light-300 font-medium">{name}</span>
        <span className={`font-bold ${scoreColor(score)}`}>{score}/100</span>
      </div>
      <div className="h-1.5 rounded-full bg-dark-300 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${scoreBarColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
      {comment && (
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-xs text-light-600 hover:text-light-400 transition-colors flex items-center gap-1 mt-0.5"
        >
          {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {open ? "Hide feedback" : "View feedback"}
        </button>
      )}
      {open && comment && (
        <p className="text-xs text-light-400 leading-relaxed pt-0.5">{comment}</p>
      )}
    </div>
  );
}

function ApplicationCard({ app }: { app: Application }) {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_CONFIG[app.status] ?? { label: app.status, className: "bg-dark-300 text-light-400" };
  const hasFeedback = app.status === "complete" && !!app.interviewFeedback;

  return (
    <div className="card-border">
      <div className="card rounded-2xl overflow-hidden">
        {/* Header row */}
        <button
          className="w-full p-4 flex items-start gap-4 text-left hover:bg-white/[0.02] transition-colors"
          onClick={() => hasFeedback && setExpanded((v) => !v)}
          disabled={!hasFeedback}
        >
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold capitalize">{app.jobTitle}</p>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${status.className}`}>
                {status.label}
              </span>
            </div>
            <p className="text-xs text-light-400">{formatDate(app.createdAt)}</p>

            {/* Score pills */}
            <div className="flex items-center gap-3 flex-wrap pt-0.5">
              {app.eligibilityScore !== undefined && (
                <span className="text-xs text-light-400">
                  Eligibility:{" "}
                  <span className={`font-bold ${scoreColor(app.eligibilityScore)}`}>
                    {app.eligibilityScore}%
                  </span>
                </span>
              )}
              {app.interviewScore !== undefined && (
                <span className="text-xs text-light-400">
                  Interview:{" "}
                  <span className={`font-bold ${scoreColor(app.interviewScore)}`}>
                    {app.interviewScore}/100
                  </span>
                </span>
              )}
            </div>
          </div>

          {hasFeedback && (
            <div className="shrink-0 mt-1">
              {expanded
                ? <ChevronUp className="w-4 h-4 text-light-400" />
                : <ChevronDown className="w-4 h-4 text-light-400" />}
            </div>
          )}
        </button>

        {/* Expanded feedback */}
        {expanded && hasFeedback && app.interviewFeedback && (
          <div className="px-4 pb-5 space-y-5 border-t border-input">
            {/* Summary */}
            {app.interviewFeedback.finalAssessment && (
              <div className="pt-4 space-y-1">
                <p className="text-xs text-light-400 uppercase tracking-widest">Assessment</p>
                <p className="text-sm text-light-100 leading-relaxed">
                  {app.interviewFeedback.finalAssessment}
                </p>
              </div>
            )}

            {/* Category breakdown */}
            {app.interviewFeedback.categoryScores?.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs text-light-400 uppercase tracking-widest">Score Breakdown</p>
                {app.interviewFeedback.categoryScores.map((cat) => (
                  <CategoryBar key={cat.name} {...cat} />
                ))}
              </div>
            )}

            {/* Strengths & improvements side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {app.interviewFeedback.strengths?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-light-400 uppercase tracking-widest">Strengths</p>
                  <ul className="space-y-1">
                    {app.interviewFeedback.strengths.map((s) => (
                      <li key={s} className="text-xs text-light-100 flex gap-1.5">
                        <span className="text-jamaica-green mt-0.5">✓</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {app.interviewFeedback.areasForImprovement?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-light-400 uppercase tracking-widest">To Improve</p>
                  <ul className="space-y-1">
                    {app.interviewFeedback.areasForImprovement.map((a) => (
                      <li key={a} className="text-xs text-light-100 flex gap-1.5">
                        <span className="text-jamaica-gold mt-0.5">→</span>
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ApplicationsClient({ applications }: { applications: Application[] }) {
  const completed = applications.filter((a) => a.status === "complete" && a.interviewScore !== undefined);
  const scores = completed.map((a) => a.interviewScore!);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : null;
  const bestScore = scores.length > 0 ? Math.max(...scores) : null;

  // Aggregate improvement areas & strengths across all completed interviews
  const allImprovements = completed.flatMap((a) => a.interviewFeedback?.areasForImprovement ?? []);
  const allStrengths = completed.flatMap((a) => a.interviewFeedback?.strengths ?? []);

  const topN = (arr: string[], n: number) => {
    const counts: Record<string, number> = {};
    arr.forEach((item) => {
      const key = item.toLowerCase().trim();
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([key]) => arr.find((s) => s.toLowerCase().trim() === key) ?? key);
  };

  const recurringImprovements = topN(allImprovements, 5);
  const recurringStrengths = topN(allStrengths, 5);

  // Score trend data (completed only, sorted oldest first for chart)
  const trendData = [...completed]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((a) => ({ label: a.jobTitle, score: a.interviewScore!, date: formatDate(a.createdAt) }));

  if (applications.length === 0) {
    return (
      <div className="card-border">
        <div className="card p-12 rounded-3xl text-center space-y-2">
          <p className="text-2xl">📋</p>
          <p className="font-semibold">No applications yet</p>
          <p className="text-sm text-light-400">
            Visit the{" "}
            <a href="/marketplace" className="text-jamaica-green hover:text-white transition-colors">
              marketplace
            </a>{" "}
            to find your first opportunity.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Stats ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Applications" value={applications.length} />
        <StatCard label="Completed" value={completed.length} sub="with interview score" />
        <StatCard label="Avg Score" value={avgScore !== null ? `${avgScore}/100` : "—"} />
        <StatCard label="Best Score" value={bestScore !== null ? `${bestScore}/100` : "—"} />
      </div>

      {/* ── Score trend ────────────────────────────────────────────────── */}
      {trendData.length > 0 && (
        <div className="card-border">
          <div className="card p-5 rounded-3xl space-y-4">
            <h2 className="font-bold text-sm uppercase tracking-widest text-light-400">
              Interview Score Trend
            </h2>
            <div className="flex items-end gap-3 overflow-x-auto pb-1">
              {trendData.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 shrink-0" style={{ minWidth: 56 }}>
                  <span className={`text-xs font-bold ${scoreColor(d.score)}`}>{d.score}</span>
                  <div className="w-10 rounded-t-md relative" style={{ height: 80 }}>
                    <div
                      className={`absolute bottom-0 left-0 right-0 rounded-t-md transition-all duration-500 ${scoreBarColor(d.score)}`}
                      style={{ height: `${d.score}%` }}
                    />
                    <div className="absolute inset-0 rounded-t-md bg-dark-300" style={{ zIndex: -1 }} />
                  </div>
                  <span
                    className="text-[10px] text-light-600 text-center leading-tight"
                    style={{ maxWidth: 56 }}
                    title={d.label}
                  >
                    {d.label.length > 12 ? d.label.slice(0, 11) + "…" : d.label}
                  </span>
                  <span className="text-[9px] text-light-600">{d.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Recurring insights ─────────────────────────────────────────── */}
      {completed.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {recurringStrengths.length > 0 && (
            <div className="card-border">
              <div className="card p-5 rounded-3xl space-y-3">
                <h2 className="font-bold text-sm uppercase tracking-widest text-light-400">
                  Consistent Strengths
                </h2>
                <ul className="space-y-2">
                  {recurringStrengths.map((s) => (
                    <li key={s} className="flex items-start gap-2 text-sm text-light-100">
                      <span className="text-jamaica-green mt-0.5 shrink-0">✓</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          {recurringImprovements.length > 0 && (
            <div className="card-border">
              <div className="card p-5 rounded-3xl space-y-3">
                <h2 className="font-bold text-sm uppercase tracking-widest text-light-400">
                  Areas to Work On
                </h2>
                <ul className="space-y-2">
                  {recurringImprovements.map((a) => (
                    <li key={a} className="flex items-start gap-2 text-sm text-light-100">
                      <span className="text-jamaica-gold mt-0.5 shrink-0">→</span>
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Application list ───────────────────────────────────────────── */}
      <div className="space-y-3">
        <h2 className="font-bold text-sm uppercase tracking-widest text-light-400">All Applications</h2>
        {applications.map((app) => (
          <ApplicationCard key={app.id} app={app} />
        ))}
      </div>
    </div>
  );
}
