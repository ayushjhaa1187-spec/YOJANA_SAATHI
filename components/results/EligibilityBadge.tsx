"use client";

import React from "react";
import { MatchStatus, Language } from "@/lib/types";
import { t } from "@/lib/i18n";

interface EligibilityBadgeProps {
  status: MatchStatus;
  language?: Language;
}

export function EligibilityBadge({
  status,
  language = "hi",
}: EligibilityBadgeProps) {
  if (status === "eligible") {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-tulsi text-white font-heading font-bold text-small shadow-sm"
        aria-label={t("status_eligible", language)}
      >
        <span aria-hidden="true" className="font-extrabold text-base">
          ✓
        </span>
        <span>{t("status_eligible", language)}</span>
      </span>
    );
  }

  if (status === "maybe") {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-kesar text-white font-heading font-bold text-small shadow-sm"
        aria-label={t("status_maybe", language)}
      >
        <span aria-hidden="true" className="font-extrabold text-base">
          ?
        </span>
        <span>{t("status_maybe", language)}</span>
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neel/20 text-neel font-heading font-bold text-small"
      aria-label={t("status_not_eligible", language)}
    >
      <span aria-hidden="true">✕</span>
      <span>{t("status_not_eligible", language)}</span>
    </span>
  );
}
