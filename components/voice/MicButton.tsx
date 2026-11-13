"use client";

import React from "react";
import { Language } from "@/lib/types";
import { t } from "@/lib/i18n";

export type MicStatus = "idle" | "listening" | "processing" | "error";

interface MicButtonProps {
  status?: MicStatus;
  language?: Language;
  onStart?: () => void;
  onStop?: () => void;
  onClick?: () => void;
  disabled?: boolean;
}

export function MicButton({
  status = "idle",
  language = "hi",
  onStart,
  onStop,
  onClick,
  disabled = false,
}: MicButtonProps) {
  const handleClick = () => {
    if (disabled) return;
    if (onClick) {
      onClick();
      return;
    }
    if (status === "listening") {
      onStop?.();
    } else {
      onStart?.();
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "listening":
        return t("mic_listening", language);
      case "processing":
        return t("mic_processing", language);
      case "error":
        return t("mic_error", language);
      case "idle":
      default:
        return t("mic_tap_to_speak", language);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center">
        {/* Slow ripple motion only when listening, disabled by prefers-reduced-motion */}
        {status === "listening" && (
          <span
            className="absolute inline-flex w-[160px] h-[160px] rounded-full bg-haldi opacity-40 animate-ping motion-reduce:hidden"
            aria-hidden="true"
          />
        )}

        <button
          type="button"
          onClick={handleClick}
          disabled={disabled || status === "processing"}
          aria-label={getStatusText()}
          className={`relative z-10 w-[160px] h-[160px] rounded-full bg-haldi text-neel flex flex-col items-center justify-center font-heading font-bold transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neel ${
            status === "listening" ? "shadow-mic-active ring-4 ring-neel" : "shadow-mic"
          } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
        >
          {status === "listening" ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="text-neel animate-pulse"
              aria-hidden="true"
            >
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : status === "processing" ? (
            <svg
              className="animate-spin text-neel"
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="52"
              height="52"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-neel"
              aria-hidden="true"
            >
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          )}

          <span className="font-heading font-bold text-small text-neel mt-2 px-2 text-center leading-tight">
            {getStatusText()}
          </span>
        </button>
      </div>
    </div>
  );
}
