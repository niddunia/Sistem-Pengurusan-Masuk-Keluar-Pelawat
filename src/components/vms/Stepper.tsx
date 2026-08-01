"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepperStep {
  id: number;
  label: string;
  labelEn?: string;
}

export function Stepper({
  steps,
  current,
  language = "bm",
}: {
  steps: StepperStep[];
  current: number;
  language?: "bm" | "en";
}) {
  const progress = ((current - 1) / (steps.length - 1)) * 100;

  return (
    <div className="w-full">
      <div className="relative flex justify-between">
        {/* Background line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-white/20 rounded-full" />
        {/* Progress line */}
        <div
          className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
        {steps.map((step) => {
          const isComplete = step.id < current;
          const isCurrent = step.id === current;
          return (
            <div
              key={step.id}
              className="relative z-10 flex flex-col items-center gap-2"
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all duration-300",
                  isComplete
                    ? "bg-cyan-500 border-cyan-400 text-white shadow-lg shadow-cyan-500/40"
                    : isCurrent
                    ? "bg-white border-cyan-500 text-cyan-300 shadow-lg shadow-cyan-500/30 scale-110"
                    : "bg-white/10 border-white/30 text-white/60"
                )}
              >
                {isComplete ? <Check className="w-5 h-5" /> : step.id}
              </div>
              <span
                className={cn(
                  "text-xs font-medium text-center max-w-[80px]",
                  isCurrent ? "text-white" : isComplete ? "text-cyan-200" : "text-white/50"
                )}
              >
                {language === "en" && step.labelEn ? step.labelEn : step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
