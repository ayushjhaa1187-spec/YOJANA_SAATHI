"use client";

import React from "react";
import { Language } from "@/lib/types";
import { t } from "@/lib/i18n";

interface TranscriptBoxProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  language?: Language;
  placeholder?: string;
}

export function TranscriptBox({
  value,
  onChange,
  onSubmit,
  disabled = false,
  language = "hi",
  placeholder,
}: TranscriptBoxProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-2 my-2">
      <label
        htmlFor="transcript-input"
        className="font-heading font-bold text-body text-neel flex items-center justify-between"
      >
        <span>{t("transcript_label", language)}</span>
        <span className="text-small text-neel/60 font-body font-normal">
          {t("or_type", language)}
        </span>
      </label>

      <textarea
        id="transcript-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder || t("transcript_placeholder", language)}
        rows={3}
        className="w-full p-4 rounded-input border-2 border-neel/20 bg-white text-neel font-body text-body resize-none focus-visible:outline-none focus-visible:border-neel focus-visible:ring-2 focus-visible:ring-neel disabled:opacity-60 disabled:bg-dhuli"
      />

      <div className="flex justify-end mt-1">
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="min-h-touch min-w-[120px] px-6 py-2 rounded-full bg-haldi text-neel font-heading font-bold text-body shadow-sm hover:bg-haldi/90 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neel disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t("transcript_send", language)}
        </button>
      </div>
    </form>
  );
}
