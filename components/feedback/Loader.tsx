"use client";

import React from "react";
import { Language } from "@/lib/types";
import { t } from "@/lib/i18n";

interface LoaderProps {
  label?: string;
  language?: Language;
}

export function Loader({ label, language = "hi" }: LoaderProps) {
  const displayLabel = label || t("mic_processing", language);

  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center gap-3 p-6 my-4 w-full"
    >
      <div className="w-12 h-12 rounded-full border-4 border-haldi border-t-neel animate-spin" />
      <span className="font-heading font-bold text-body text-neel">
        {displayLabel}
      </span>
    </div>
  );
}
