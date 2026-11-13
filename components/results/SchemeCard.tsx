"use client";

import React from "react";
import Link from "next/link";
import { Match, Language } from "@/lib/types";
import { t } from "@/lib/i18n";
import { EligibilityBadge } from "./EligibilityBadge";
import { SchemeIcon } from "./SchemeIcon";

interface SchemeCardProps {
  match: Match;
  language?: Language;
  onSpeak?: (text: string) => void;
  isSpeaking?: boolean;
}

export function SchemeCard({
  match,
  language = "hi",
  onSpeak,
  isSpeaking = false,
}: SchemeCardProps) {
  const schemeName = language === "en" && match.name_en ? match.name_en : match.name_hi || match.schemeId;
  const benefitText = language === "en" ? match.benefit_text_hi : match.benefit_text_hi;

  const handleSpeakClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onSpeak) {
      const speechText = `${schemeName}. ${match.reason_hi || ""}. ${benefitText || ""}`;
      onSpeak(speechText);
    }
  };

  return (
    <div className="w-full bg-white rounded-card border-2 border-neel/20 p-5 shadow-sm my-3 flex flex-col gap-3 transition-all hover:border-neel/40">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-dhuli flex items-center justify-center shrink-0">
            <SchemeIcon category={match.category} />
          </div>
          <div>
            <h3 className="font-heading font-bold text-heading text-neel leading-snug">
              {schemeName}
            </h3>
            {benefitText && (
              <p className="font-body text-small text-neel/75 mt-0.5">
                {benefitText}
              </p>
            )}
          </div>
        </div>

        <EligibilityBadge status={match.status} language={language} />
      </div>

      {match.reason_hi && (
        <div className="bg-dhuli/60 rounded-input p-3 border border-neel/10">
          <p className="font-body text-body text-neel/90">
            <span className="font-bold">{language === "hi" ? "कारण: " : "Reason: "}</span>
            {match.reason_hi}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-neel/10">
        <Link
          href={`/scheme/${match.schemeId}`}
          className="min-h-touch px-6 py-2 rounded-full bg-haldi text-neel font-heading font-bold text-body flex items-center justify-center gap-2 hover:bg-haldi/90 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neel"
        >
          <span>{t("view_details", language)}</span>
          <span aria-hidden="true">→</span>
        </Link>

        {onSpeak && (
          <button
            type="button"
            onClick={handleSpeakClick}
            aria-label={isSpeaking ? t("stop_speaking", language) : `${schemeName} ${t("read_aloud", language)}`}
            className={`min-h-touch min-w-[56px] rounded-full border-2 border-neel/20 flex items-center justify-center text-neel transition-all active:scale-95 ${
              isSpeaking ? "bg-haldi animate-pulse" : "bg-white hover:bg-dhuli"
            }`}
          >
            <span className="text-2xl" role="img" aria-hidden="true">
              {isSpeaking ? "⏹️" : "🔊"}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
