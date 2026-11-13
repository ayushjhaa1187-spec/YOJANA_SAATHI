"use client";

import React from "react";
import Link from "next/link";
import { Language } from "@/lib/types";
import { t } from "@/lib/i18n";
import { LanguagePicker } from "./LanguagePicker";

interface HeaderProps {
  language?: Language;
  onLanguageChange?: (lang: Language) => void;
  showBack?: boolean;
  onBack?: () => void;
  backHref?: string;
  rightAction?: React.ReactNode;
}

export function Header({
  language = "hi",
  onLanguageChange,
  showBack = false,
  onBack,
  backHref,
  rightAction,
}: HeaderProps) {
  return (
    <header className="w-full max-w-[480px] mx-auto pt-4 px-4 pb-2 flex items-center justify-between gap-2 border-b-2 border-neel/10">
      <div className="flex items-center gap-2">
        {showBack && (
          backHref ? (
            <Link
              href={backHref}
              className="inline-flex items-center justify-center min-h-[56px] min-w-[56px] rounded-full border-2 border-neel/20 bg-white text-neel hover:bg-dhuli active:scale-95 transition-transform"
              aria-label={t("back", language)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </Link>
          ) : (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center justify-center min-h-[56px] min-w-[56px] rounded-full border-2 border-neel/20 bg-white text-neel hover:bg-dhuli active:scale-95 transition-transform"
              aria-label={t("back", language)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
          )
        )}

        <div className="flex flex-col">
          <Link href="/" className="inline-block">
            <span className="font-heading font-bold text-heading text-neel tracking-tight">
              {t("app_title", language)}
            </span>
          </Link>
          <span className="text-small text-neel/70 leading-none">
            {t("app_subtitle", language)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {rightAction}
        <LanguagePicker
          currentLang={language}
          onLanguageChange={onLanguageChange}
        />
      </div>
    </header>
  );
}
