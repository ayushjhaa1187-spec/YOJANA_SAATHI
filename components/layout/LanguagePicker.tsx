"use client";

import React from "react";
import { Language } from "@/lib/types";

interface LanguagePickerProps {
  currentLang?: Language;
  onLanguageChange?: (lang: Language) => void;
}

export function LanguagePicker({ currentLang = "hi", onLanguageChange }: LanguagePickerProps) {
  const [lang, setLang] = React.useState<Language>(currentLang);

  React.useEffect(() => {
    setLang(currentLang);
  }, [currentLang]);

  const toggleLanguage = () => {
    const next: Language = lang === "hi" ? "en" : "hi";
    setLang(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("yojana_saathi_lang", next);
    }
    if (onLanguageChange) {
      onLanguageChange(next);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className="inline-flex items-center justify-center min-h-[56px] min-w-[56px] px-4 py-2 rounded-full border-2 border-neel/20 bg-white text-neel font-heading font-bold text-body hover:bg-dhuli active:scale-95 transition-transform"
      aria-label={lang === "hi" ? "Switch to English" : "हिंदी में बदलें"}
    >
      <span className={lang === "hi" ? "text-neel font-bold underline" : "text-neel/60"}>
        हि
      </span>
      <span className="mx-1 text-neel/30">|</span>
      <span className={lang === "en" ? "text-neel font-bold underline" : "text-neel/60"}>
        EN
      </span>
    </button>
  );
}
