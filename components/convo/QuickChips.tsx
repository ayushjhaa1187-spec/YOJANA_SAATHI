"use client";

import React from "react";
import { Language, QuestionOption } from "@/lib/types";

interface QuickChipsProps {
  options: QuestionOption[];
  onPick: (value: any) => void;
  language?: Language;
  disabled?: boolean;
}

export function QuickChips({
  options,
  onPick,
  language = "hi",
  disabled = false,
}: QuickChipsProps) {
  if (!options || options.length === 0) return null;

  return (
    <div className="w-full flex flex-wrap gap-2 my-3 justify-center">
      {options.map((opt, idx) => {
        const label = language === "en" ? opt.label_en : opt.label_hi;
        return (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => onPick(opt.value)}
            className="min-h-touch px-5 py-3 rounded-full border-2 border-neel/30 bg-white text-neel font-heading font-bold text-body shadow-sm hover:bg-haldi hover:border-haldi active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neel disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
