"use client";

import React from "react";
import { useOnline } from "@/hooks/useOnline";
import { t } from "@/lib/i18n";
import { Language } from "@/lib/types";

export function OfflineBanner({ language = "hi" }: { language?: Language }) {
  const isOnline = useOnline();

  if (isOnline) return null;

  return (
    <div
      role="alert"
      className="w-full bg-kesar text-white text-center py-2 px-4 text-small font-medium font-body sticky top-0 z-50 shadow-md flex items-center justify-center gap-2"
    >
      <span aria-hidden="true">⚠️</span>
      <span>{t("offline_notice", language)}</span>
    </div>
  );
}
