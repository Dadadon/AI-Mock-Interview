import Link from "next/link";
import dayjs from "dayjs";
import { MapPin, DollarSign, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const JobCard = ({ job }: JobCardProps) => {
  const formattedDate = dayjs(job.createdAt).format("MMM D, YYYY");

  // Gig = gold badge (Jamaica flag palette), Job = green badge
  const badgeClasses =
    job.type === "gig"
      ? "bg-jamaica-gold text-black"
      : "bg-jamaica-green/20 text-jamaica-green";

  return (
    <div className="card-border w-[360px] max-sm:w-full min-h-96">
      <div className="card-interview flex flex-col justify-between">
        <div>
          {/* Type badge */}
          <div
            className={`absolute top-0 right-0 px-3 py-1.5 rounded-bl-2xl text-xs font-bold uppercase tracking-wider ${badgeClasses}`}
          >
            {job.type}
          </div>

          {/* Category */}
          <p className="text-[10px] font-bold uppercase tracking-widest text-jamaica-gold/80 mb-2">
            {job.category}
          </p>

          {/* Title */}
          <h3 className="text-lg font-bold capitalize leading-snug">
            {job.title}
          </h3>

          {/* Meta details */}
          <div className="flex flex-col gap-2 mt-4">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 shrink-0 text-jamaica-gold" />
              <span className="text-light-400">{job.parish}, Jamaica</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="w-4 h-4 shrink-0 text-jamaica-gold" />
              <span className="text-light-400">{job.pay}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 shrink-0 text-jamaica-gold" />
              <span className="text-light-400">Posted {formattedDate}</span>
            </div>
          </div>

          {/* Description */}
          <p className="line-clamp-3 mt-4 text-sm text-light-400 leading-relaxed">
            {job.description}
          </p>
        </div>

        {/* CTA */}
        <Button asChild className="btn-primary w-full mt-4">
          <Link href={`/apply/${job.id}`}>Apply Now</Link>
        </Button>
      </div>
    </div>
  );
};

export default JobCard;
