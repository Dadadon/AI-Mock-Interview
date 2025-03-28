import { cn } from "@/lib/utils";
import { ComponentProps } from "react";

interface BadgeProps extends ComponentProps<"div"> {
  variant?: "default" | "outline";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variant === "default" && "bg-primary-200 text-dark-100 border-transparent",
        variant === "outline" && "border-primary-200 text-primary-200",
        className
      )}
      {...props}
    />
  );
}