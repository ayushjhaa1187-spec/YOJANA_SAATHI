"use client";

import React from "react";
import { Language } from "@/lib/types";
import { t } from "@/lib/i18n";

interface DemoButtonProps {
  language?: Language;
  onClick?: () => void;
  loading?: boolean;
}

export function DemoButton({
  language = "hi",
  onClick,
  loading = false,
}: DemoButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="w-full max-w-[320px] min-h-[56px] px-6 py-3 rounded-full border-2 border-neel/30 bg-white text-neel font-heading font-bold text-body shadow-sm hover:bg-dhuli active:scale-95 transition-all flex items-center justify-center gap-3 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neel disabled:opacity-60 disabled:cursor-not-allowed"
      aria-label={t("demo_button", language)}
    >
      <span className="text-2xl" role="img" aria-hidden="true">
        ▶️
      </span>
      <span>
        {loading ? t("demo_loading", language) : t("demo_button", language)}
      </span>
    </button>
  );
}
