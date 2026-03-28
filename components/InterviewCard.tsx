import dayjs from "dayjs";
import Link from "next/link";
import Image from "next/image";

import { Button } from "./ui/button";
import DisplayTechIcons from "./DisplayTechIcons";

import { cn, getRandomInterviewCover } from "@/lib/utils";
import { getFeedbackByInterviewId } from "@/lib/actions/general.action";

const InterviewCard = async ({
  interviewId,
  userId,
  role,
  type,
  techstack,
  createdAt,
}: InterviewCardProps) => {
  const feedback =
    userId && interviewId
      ? await getFeedbackByInterviewId({
          interviewId,
          userId,
        })
      : null;

  const normalizedType = /mix/gi.test(type) ? "Mixed" : type;

  // Jamaica-palette badge colours
  const badgeColor =
    {
      Behavioral: "bg-jamaica-gold/20 text-jamaica-gold",
      Mixed: "bg-light-600/30 text-light-400",
      Technical: "bg-jamaica-green/20 text-jamaica-green",
    }[normalizedType] ?? "bg-light-600/30 text-light-400";

  const formattedDate = dayjs(
    feedback?.createdAt || createdAt || Date.now()
  ).format("MMM D, YYYY");

  return (
    <div className="card-border w-[360px] max-sm:w-full min-h-96">
      {/* Glass card body — replaces old dark-gradient */}
      <div className="card-interview">
        <div>
          {/* Type Badge */}
          <div
            className={cn(
              "absolute top-0 right-0 px-3 py-1.5 rounded-bl-2xl text-xs font-bold uppercase tracking-wider",
              badgeColor
            )}
          >
            {normalizedType}
          </div>

          {/* Cover Image */}
          <Image
            src={getRandomInterviewCover()}
            alt="cover-image"
            width={90}
            height={90}
            className="rounded-full object-fit size-[90px]"
          />

          {/* Interview Role */}
          <h3 className="mt-5 capitalize">{role} Interview</h3>

          {/* Date & Score */}
          <div className="flex flex-row gap-5 mt-3">
            <div className="flex flex-row gap-2 items-center">
              <Image
                src="/calendar.svg"
                width={22}
                height={22}
                alt="calendar"
              />
              <p className="text-sm text-light-400">{formattedDate}</p>
            </div>

            <div className="flex flex-row gap-2 items-center">
              <Image src="/star.svg" width={22} height={22} alt="star" />
              <p
                className={cn(
                  "text-sm font-bold",
                  feedback?.totalScore
                    ? feedback.totalScore >= 75
                      ? "text-jamaica-green"
                      : feedback.totalScore >= 50
                        ? "text-jamaica-gold"
                        : "text-destructive-100"
                    : "text-light-400"
                )}
              >
                {feedback?.totalScore || "---"}/100
              </p>
            </div>
          </div>

          {/* Feedback or Placeholder */}
          <p className="line-clamp-2 mt-5 text-sm text-light-400 leading-relaxed">
            {feedback?.finalAssessment ||
              "You haven't taken this interview yet. Take it now to improve your skills."}
          </p>
        </div>

        <div className="flex flex-row justify-between items-center">
          <DisplayTechIcons techStack={techstack} />

          <Button className="btn-primary">
            <Link
              href={
                feedback
                  ? `/interview/${interviewId}/feedback`
                  : `/interview/${interviewId}`
              }
            >
              {feedback ? "Check Feedback" : "View Interview"}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InterviewCard;
