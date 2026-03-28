"use client";

import { useState, useMemo } from "react";
import { SlidersHorizontal } from "lucide-react";
import JobCard from "@/components/JobCard";

type JobType = "all" | "gig" | "job";

const TYPE_LABELS: Record<JobType, string> = {
  all: "All Types",
  gig: "Gigs",
  job: "Jobs",
};

interface MarketplaceViewProps {
  jobs: Job[];
}

const MarketplaceView = ({ jobs }: MarketplaceViewProps) => {
  const [selectedParish, setSelectedParish] = useState<string>("All");
  const [selectedType, setSelectedType] = useState<JobType>("all");

  // Derive the parishes that actually have listings (sorted alphabetically)
  const availableParishes = useMemo(() => {
    const parishes = Array.from(new Set(jobs.map((j) => j.parish))).sort();
    return ["All", ...parishes];
  }, [jobs]);

  const filtered = useMemo(
    () =>
      jobs.filter((job) => {
        const parishMatch =
          selectedParish === "All" || job.parish === selectedParish;
        const typeMatch =
          selectedType === "all" || job.type === selectedType;
        return parishMatch && typeMatch;
      }),
    [jobs, selectedParish, selectedType]
  );

  return (
    <div className="space-y-8">
      {/* ── Filter bar ── */}
      <div className="card-border w-full">
        <div className="card px-6 py-5 space-y-5 rounded-3xl">
          <div className="flex items-center gap-2 text-sm font-semibold text-light-400">
            <SlidersHorizontal className="w-4 h-4 text-jamaica-gold" />
            Filter Positions
          </div>

          {/* Type chips */}
          <div className="flex flex-wrap gap-2">
            {(Object.keys(TYPE_LABELS) as JobType[]).map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`type-chip ${
                  selectedType === type
                    ? "type-chip-active"
                    : "type-chip-inactive"
                }`}
              >
                {TYPE_LABELS[type]}
              </button>
            ))}
          </div>

          {/* Parish chips */}
          <div className="flex flex-wrap gap-2">
            {availableParishes.map((parish) => (
              <button
                key={parish}
                onClick={() => setSelectedParish(parish)}
                className={`parish-chip ${
                  selectedParish === parish
                    ? "parish-chip-active"
                    : "parish-chip-inactive"
                }`}
              >
                {parish}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Results count ── */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-light-400">
          Showing{" "}
          <span className="font-semibold text-light-100">{filtered.length}</span>{" "}
          of{" "}
          <span className="font-semibold text-light-100">{jobs.length}</span>{" "}
          position{jobs.length !== 1 ? "s" : ""}
          {selectedParish !== "All" && (
            <>
              {" "}in{" "}
              <span className="text-jamaica-gold font-semibold">
                {selectedParish}
              </span>
            </>
          )}
        </p>

        {(selectedParish !== "All" || selectedType !== "all") && (
          <button
            onClick={() => {
              setSelectedParish("All");
              setSelectedType("all");
            }}
            className="text-xs text-light-400 hover:text-jamaica-gold transition-colors"
          >
            Clear filters ✕
          </button>
        )}
      </div>

      {/* ── Job grid ── */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-light-400">
            No positions match your filter. Try a different parish or type.
          </p>
        </div>
      ) : (
        <div className="interviews-section">
          {filtered.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MarketplaceView;
