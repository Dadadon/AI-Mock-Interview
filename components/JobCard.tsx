import Link from "next/link";
import dayjs from "dayjs";
import { MapPin, DollarSign, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const JobCard = ({ job }: JobCardProps) => {
  const formattedDate = dayjs(job.createdAt).format("MMM D, YYYY");

  const typeColor =
    job.type === "gig"
      ? "bg-primary-200/20 text-primary-200"
      : "bg-light-400/20 text-light-400";

  return (
    <div className="card-border w-[360px] max-sm:w-full min-h-96">
      <div className="card-interview flex flex-col justify-between">
        <div>
          {/* Type Badge */}
          <div
            className={`absolute top-0 right-0 px-3 py-1.5 rounded-bl-lg text-xs font-semibold uppercase ${typeColor}`}
          >
            {job.type}
          </div>

          {/* Category & Title */}
          <p className="text-xs text-light-400 uppercase tracking-wide mb-2">
            {job.category}
          </p>
          <h3 className="text-lg font-semibold capitalize">{job.title}</h3>

          {/* Details */}
          <div className="flex flex-col gap-2 mt-3">
            <div className="flex items-center gap-2 text-sm text-light-400">
              <MapPin className="w-4 h-4 shrink-0" />
              <span>{job.parish}, Jamaica</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-light-400">
              <DollarSign className="w-4 h-4 shrink-0" />
              <span>{job.pay}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-light-400">
              <Clock className="w-4 h-4 shrink-0" />
              <span>Posted {formattedDate}</span>
            </div>
          </div>

          {/* Description */}
          <p className="line-clamp-3 mt-4 text-sm text-light-100">
            {job.description}
          </p>
        </div>

        <Button asChild className="btn-primary w-full mt-4">
          <Link href={`/apply/${job.id}`}>Apply Now</Link>
        </Button>
      </div>
    </div>
  );
};

export default JobCard;
