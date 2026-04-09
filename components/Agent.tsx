"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import { interviewer } from "@/constants";
import { createFeedback } from "@/lib/actions/general.action";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

const Agent = ({
  userName,
  userId,
  interviewId,
  feedbackId,
  type,
  questions,
  jobId,
  employerId,
  jobTitle,
  screeningQuestions,
  applicationId,
}: AgentProps) => {
  const router = useRouter();
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");
  // Tracks whether the user has committed to starting — prevents re-showing
  // the choice UI if the call status briefly returns to INACTIVE after errors.
  const [hasCommitted, setHasCommitted] = useState(false);

  // Show the "Start Now / Save for Later" choice only for job_apply before
  // the user has clicked "Start Screening".
  const showPreCallChoice =
    type === "job_apply" &&
    callStatus === CallStatus.INACTIVE &&
    !hasCommitted;

  // ── Vapi event listeners ─────────────────────────────────────────
  useEffect(() => {
    const onCallStart = () => setCallStatus(CallStatus.ACTIVE);
    const onCallEnd = () => setCallStatus(CallStatus.FINISHED);

    const onMessage = (message: Message) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        setMessages((prev) => [
          ...prev,
          { role: message.role, content: message.transcript },
        ]);
      }
    };

    const onSpeechStart = () => setIsSpeaking(true);
    const onSpeechEnd = () => setIsSpeaking(false);
    const onError = (error: Error) => {
      // Vapi sometimes emits a plain object instead of an Error instance.
      // Stringify it so the details are always visible in the console.
      const detail =
        error instanceof Error
          ? error.message
          : JSON.stringify(error, null, 2);
      console.error("[Vapi error]", detail, error);

      // Surface the error to the user and reset so they can retry
      toast.error(
        detail?.includes("token") || detail === "{}"
          ? "Could not start call — check your Vapi token in .env.local"
          : `Call error: ${detail || "unknown Vapi error"}`
      );
      setCallStatus(CallStatus.INACTIVE);
      setHasCommitted(false);
    };

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("error", onError);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("error", onError);
    };
  }, []);

  // ── Post-call routing ────────────────────────────────────────────
  useEffect(() => {
    if (messages.length > 0) {
      setLastMessage(messages[messages.length - 1].content);
    }

    const handleGenerateFeedback = async (msgs: SavedMessage[]) => {
      const { success, feedbackId: id } = await createFeedback({
        interviewId: interviewId!,
        userId: userId!,
        transcript: msgs,
        feedbackId,
      });

      if (success && id) {
        router.push(`/interview/${interviewId}/feedback`);
      } else {
        router.push("/");
      }
    };

    if (callStatus === CallStatus.FINISHED) {
      if (type === "generate") {
        router.push("/");
      } else if (type === "job_apply") {
        router.push(`/apply/${jobId}/processing?applicationId=${applicationId ?? ""}`);
      } else if (applicationId && jobId) {
        // Job interview — wait for webhook to score before showing result
        router.push(`/apply/${jobId}/processing?applicationId=${applicationId}`);
      } else {
        handleGenerateFeedback(messages);
      }
    }
  }, [messages, callStatus, feedbackId, interviewId, jobId, router, type, userId]);

  // ── Call handlers ────────────────────────────────────────────────
  const handleCall = async () => {
    // Pre-flight env check — fail fast with a clear message
    if (!process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN) {
      toast.error("NEXT_PUBLIC_VAPI_WEB_TOKEN is not set in .env.local");
      return;
    }

    const practiceWorkflowId = process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID;
    const screeningWorkflowId = process.env.NEXT_PUBLIC_VAPI_SCREENING_WORKFLOW_ID;

    if (type === "generate" && !practiceWorkflowId) {
      toast.error("NEXT_PUBLIC_VAPI_WORKFLOW_ID is not set in .env.local");
      return;
    }
    if (type === "job_apply" && !screeningWorkflowId) {
      toast.error("NEXT_PUBLIC_VAPI_SCREENING_WORKFLOW_ID is not set in .env.local");
      return;
    }

    setCallStatus(CallStatus.CONNECTING);

    if (type === "generate") {
      await vapi.start(practiceWorkflowId!, {
        variableValues: {
          username: userName,
          userid: userId,
          scenario: "practice",
        },
      });
    } else if (type === "job_apply") {
      const formattedScreening =
        screeningQuestions && screeningQuestions.length > 0
          ? screeningQuestions.map((q) => `- ${q}`).join("\n")
          : "";

      await vapi.start(screeningWorkflowId!, {
        variableValues: {
          username: userName,
          userid: userId,
          jobId: jobId || "",
          employerId: employerId || "",
          jobTitle: jobTitle || "",
          screeningQuestions: formattedScreening,
        },
        metadata: {
          userId: userId || "",
          jobId: jobId || "",
          employerId: employerId || "",
          applicantName: userName,
          jobTitle: jobTitle || "",
          applicationId: applicationId || "",
          callPhase: "screening",
        },
      });
    } else {
      const formattedQuestions =
        questions?.map((q) => `- ${q}`).join("\n") ?? "";

      const serverUrl = process.env.NEXT_PUBLIC_VAPI_SERVER_URL;

      await vapi.start(
        {
          ...interviewer,
          ...(serverUrl ? { server: { url: `${serverUrl}/api/vapi/webhook` } } : {}),
        },
        {
          variableValues: {
            questions: formattedQuestions,
            userId: userId || "",
            jobId: jobId || "",
            employerId: employerId || "",
            username: userName,
            jobTitle: jobTitle || "",
            applicationId: applicationId || "",
          },
          metadata: {
            userId: userId || "",
            jobId: jobId || "",
            employerId: employerId || "",
            applicantName: userName,
            jobTitle: jobTitle || "",
            applicationId: applicationId || "",
            callPhase: "interview",
          },
        }
      );
    }
  };

  const handleStartNow = () => {
    setHasCommitted(true);
    handleCall();
  };

  const handleSaveForLater = () => {
    toast.success("Got it! You can apply any time from the Marketplace.");
    router.push("/marketplace");
  };

  const handleDisconnect = () => {
    setCallStatus(CallStatus.FINISHED);
    vapi.stop();
  };

  // ── Render ───────────────────────────────────────────────────────
  return (
    <>
      <div className="call-view">
        {/* AI Interviewer Card */}
        <div className="card-interviewer">
          <div className="avatar">
            <Image
              src="/ai-avatar.png"
              alt="AI Interviewer"
              width={65}
              height={54}
              className="object-cover"
            />
            {isSpeaking && <span className="animate-speak" />}
          </div>
          <h3>AI Interviewer</h3>
        </div>

        {/* User Profile Card */}
        <div className="card-border">
          <div className="card-content">
            <Image
              src="/user-avatar.png"
              alt="Your profile"
              width={539}
              height={539}
              className="rounded-full object-cover size-[120px]"
            />
            <h3>{userName}</h3>
          </div>
        </div>
      </div>

      {/* Live transcript */}
      {messages.length > 0 && (
        <div className="transcript-border">
          <div className="transcript">
            <p
              key={lastMessage}
              className={cn(
                "transition-opacity duration-500 opacity-0",
                "animate-fadeIn opacity-100"
              )}
            >
              {lastMessage}
            </p>
          </div>
        </div>
      )}

      {/* ── Controls ── */}
      <div className="w-full flex flex-col items-center gap-4">

        {/* Pre-call choice panel (job_apply only, before the user commits) */}
        {showPreCallChoice ? (
          <div className="card-border w-full max-w-md">
            <div className="card p-6 space-y-4 text-center rounded-3xl">
              <p className="text-sm text-light-400">
                Ready for your{" "}
                <span className="text-white font-semibold">2-minute AI screening</span>{" "}
                for <span className="text-jamaica-gold font-semibold">{jobTitle}</span>?
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  className="btn-call relative px-6 py-3 rounded-full font-bold text-sm"
                  onClick={handleStartNow}
                >
                  Start Screening Now
                </button>
                <button
                  className="btn-secondary px-6 py-3 rounded-full font-bold text-sm"
                  onClick={handleSaveForLater}
                >
                  Not Ready? Save for Later
                </button>
              </div>

              <p className="text-xs text-light-600">
                Your result is sent to the employer only after the call ends.
              </p>
            </div>
          </div>
        ) : callStatus !== "ACTIVE" ? (
          /* Standard call button (generate / interview types, or after commitment) */
          <button
            className="relative btn-call"
            onClick={handleCall}
            disabled={callStatus === CallStatus.CONNECTING}
          >
            <span
              className={cn(
                "absolute animate-ping rounded-full opacity-75 bg-jamaica-green h-full w-full",
                callStatus !== "CONNECTING" && "hidden"
              )}
            />
            <span className="relative">
              {callStatus === "INACTIVE" || callStatus === "FINISHED"
                ? "Call"
                : ". . ."}
            </span>
          </button>
        ) : (
          /* Active call — disconnect */
          <button className="btn-disconnect" onClick={handleDisconnect}>
            End
          </button>
        )}
      </div>
    </>
  );
};

export default Agent;
