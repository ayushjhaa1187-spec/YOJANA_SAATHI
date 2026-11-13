"use client";

import React, { useEffect } from "react";
import { Language } from "@/lib/types";
import { t } from "@/lib/i18n";
import { useSpeak } from "@/hooks/useSpeak";

interface QuestionCardProps {
  text_hi: string;
  text_en?: string;
  language?: Language;
  autoSpeak?: boolean;
}

export function QuestionCard({
  text_hi,
  text_en,
  language = "hi",
  autoSpeak = true,
}: QuestionCardProps) {
  const { speak, cancel, speaking } = useSpeak();
  const displayText = language === "en" && text_en ? text_en : text_hi;

  useEffect(() => {
    if (autoSpeak && displayText) {
      speak(displayText, language);
    }
    return () => {
      cancel();
    };
  }, [displayText, autoSpeak, language, speak, cancel]);

  const handleToggleSpeak = () => {
    if (speaking) {
      cancel();
    } else {
      speak(displayText, language);
    }
  };

  return (
    <div className="w-full bg-white rounded-card border-2 border-neel/20 p-5 shadow-sm my-3 flex items-start justify-between gap-3">
      <div className="flex-1">
        <span className="text-small text-neel/60 font-body block mb-1">
          {language === "hi" ? "सवाल:" : "Question:"}
        </span>
        <h2 className="font-heading font-bold text-question text-neel leading-snug">
          {displayText}
        </h2>
      </div>

      <button
        type="button"
        onClick={handleToggleSpeak}
        aria-label={speaking ? t("stop_speaking", language) : t("read_aloud", language)}
        className={`min-h-touch min-w-[56px] rounded-full border-2 border-neel/20 flex items-center justify-center text-neel transition-all active:scale-95 ${
          speaking ? "bg-haldi animate-pulse" : "bg-dhuli hover:bg-white"
        }`}
      >
        <span className="text-2xl" role="img" aria-hidden="true">
          {speaking ? "⏹️" : "🔊"}
        </span>
      </button>
    </div>
  );
}
