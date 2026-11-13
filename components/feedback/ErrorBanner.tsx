"use client";

import React from "react";
import { Language } from "@/lib/types";
import { t } from "@/lib/i18n";

interface ErrorBannerProps {
  message: string;
  language?: Language;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function ErrorBanner({
  message,
  language = "hi",
  onRetry,
  onDismiss,
}: ErrorBannerProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="w-full bg-mirchi/10 border-2 border-mirchi rounded-card p-4 my-3 text-neel flex flex-col gap-2 shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-mirchi text-xl font-bold" aria-hidden="true">
            ⚠️
          </span>
          <p className="font-body text-body font-medium text-mirchi">{message}</p>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-neel/60 hover:text-neel text-heading p-1"
            aria-label="Dismiss error"
          >
            ×
          </button>
        )}
      </div>

      {onRetry && (
        <div className="flex justify-end mt-1">
          <button
            type="button"
            onClick={onRetry}
            className="px-4 py-2 min-h-touch rounded-full bg-mirchi text-white font-heading font-bold text-small hover:bg-mirchi/90 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neel"
          >
            {t("retry", language)}
          </button>
        </div>
      )}
    </div>
  );
}
