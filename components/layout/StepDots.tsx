"use client";

import React from "react";
import { Language } from "@/lib/types";
import { t } from "@/lib/i18n";

interface StepDotsProps {
  currentStep: number;
  totalSteps?: number;
  language?: Language;
}

export function StepDots({
  currentStep,
  totalSteps = 3,
  language = "hi",
}: StepDotsProps) {
  return (
    <div
      className="flex items-center justify-center gap-2 my-2"
      aria-label={t("step_indicator", language, {
        current: Math.min(currentStep + 1, totalSteps),
        total: totalSteps,
      })}
    >
      {Array.from({ length: totalSteps }).map((_, index) => {
        const isDone = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <span
            key={index}
            className={`w-3 h-3 rounded-full transition-all ${
              isCurrent
                ? "bg-neel w-7 h-3 rounded-full ring-2 ring-neel/30"
                : isDone
                ? "bg-tulsi"
                : "bg-neel/20"
            }`}
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
}
