"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { SchemeCard } from "@/components/results/SchemeCard";
import { OfflineBanner } from "@/components/feedback/OfflineBanner";
import { useConversation } from "@/components/ConversationProvider";
import { useSpeak } from "@/hooks/useSpeak";
import { t } from "@/lib/i18n";
import { Match } from "@/lib/types";

export default function ResultsPage() {
  const router = useRouter();
  const { state, dispatch } = useConversation();
  const { speak, cancel, speaking } = useSpeak();

  const [showAll, setShowAll] = useState(false);
  const [activeSpeakingSchemeId, setActiveSpeakingSchemeId] = useState<string | null>(null);
  const [isReadingAll, setIsReadingAll] = useState(false);

  // If user refreshes on /results and profile has no facts and no matches, redirect to Home
  useEffect(() => {
    const hasAnyProfileFact = Object.values(state.profile).some(
      (val) => val !== null && val !== undefined
    );
    if (!hasAnyProfileFact && state.matches.length === 0) {
      router.replace("/");
    }
  }, [state.profile, state.matches, router]);

  // Cancel speech on unmount
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  // Sync speak state
  useEffect(() => {
    if (!speaking) {
      setActiveSpeakingSchemeId(null);
      setIsReadingAll(false);
    }
  }, [speaking]);

  const displayedMatches = showAll ? state.matches : state.matches.slice(0, 3);
  const hasMore = state.matches.length > 3;

  const handleSpeakAll = () => {
    if (speaking) {
      cancel();
      setIsReadingAll(false);
      return;
    }

    setIsReadingAll(true);
    const topMatches = state.matches.slice(0, 3);
    const textPieces = topMatches.map((m, i) => {
      const name = state.language === "en" && m.name_en ? m.name_en : m.name_hi || m.schemeId;
      return `${i + 1}: ${name}. ${m.reason_hi || ""}`;
    });

    const fullAnnouncement = `${t("results_title", state.language)}. ${textPieces.join(". ")}`;
    speak(fullAnnouncement, state.language);
  };

  const handleSpeakSingleScheme = (schemeId: string, text: string) => {
    if (speaking && activeSpeakingSchemeId === schemeId) {
      cancel();
      setActiveSpeakingSchemeId(null);
    } else {
      setActiveSpeakingSchemeId(schemeId);
      setIsReadingAll(false);
      speak(text, state.language);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-dhuli text-neel">
      <OfflineBanner language={state.language} />
      <Header
        language={state.language}
        onLanguageChange={(lang) => dispatch({ type: "SET_LANGUAGE", language: lang })}
        showBack
        backHref="/listen"
      />

      <main className="flex-1 flex flex-col justify-between px-4 py-4 max-w-[480px] mx-auto w-full">
        <div>
          {/* Headline & Read Aloud Controls */}
          <div className="flex items-center justify-between gap-3 mt-2 mb-4">
            <div>
              <h1 className="font-heading font-bold text-heading text-neel leading-tight">
                {t("results_title", state.language)}
              </h1>
              <p className="font-body text-small text-neel/75">
                {t("results_subtitle", state.language)}
              </p>
            </div>

            <button
              type="button"
              onClick={handleSpeakAll}
              aria-label={
                isReadingAll || speaking
                  ? t("stop_speaking", state.language)
                  : t("speak_all", state.language)
              }
              className={`min-h-touch px-4 py-2 rounded-full border-2 border-neel/20 font-heading font-bold text-body flex items-center gap-2 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neel ${
                isReadingAll
                  ? "bg-haldi animate-pulse text-neel"
                  : "bg-white text-neel hover:bg-dhuli"
              }`}
            >
              <span className="text-xl" role="img" aria-hidden="true">
                {isReadingAll ? "⏹️" : "🔊"}
              </span>
              <span>
                {isReadingAll
                  ? t("stop_speaking", state.language)
                  : t("speak_all", state.language)}
              </span>
            </button>
          </div>

          {/* Scheme Cards */}
          {displayedMatches.length > 0 ? (
            <div className="flex flex-col">
              {displayedMatches.map((match: Match) => (
                <SchemeCard
                  key={match.schemeId}
                  match={match}
                  language={state.language}
                  onSpeak={(text) => handleSpeakSingleScheme(match.schemeId, text)}
                  isSpeaking={activeSpeakingSchemeId === match.schemeId}
                />
              ))}
            </div>
          ) : (
            <div className="w-full bg-white rounded-card border-2 border-neel/15 p-6 my-4 text-center">
              <p className="font-heading font-bold text-heading text-neel mb-2">
                {t("no_schemes_found", state.language)}
              </p>
              <Link
                href="/listen"
                className="inline-block mt-3 px-6 py-3 min-h-touch rounded-full bg-haldi text-neel font-heading font-bold text-body hover:bg-haldi/90"
              >
                {t("speak_again", state.language)}
              </Link>
            </div>
          )}

          {/* More schemes toggle */}
          {hasMore && (
            <div className="text-center my-3">
              <button
                type="button"
                onClick={() => setShowAll(!showAll)}
                className="min-h-touch px-6 py-2 rounded-full border-2 border-neel/30 bg-white text-neel font-heading font-bold text-body hover:bg-dhuli active:scale-95 transition-all"
              >
                {showAll
                  ? state.language === "hi"
                    ? "कम दिखाएँ"
                    : "Show Less"
                  : `${t("more_schemes", state.language)} (${state.matches.length - 3})`}
              </button>
            </div>
          )}

          {/* Action: Speak Again button */}
          <div className="my-4 flex justify-center">
            <Link
              href="/listen"
              className="min-h-touch w-full max-w-[280px] px-6 py-3 rounded-full border-2 border-neel/30 bg-white text-neel font-heading font-bold text-body text-center flex items-center justify-center gap-2 hover:bg-dhuli active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neel"
            >
              <span>🎙️</span>
              <span>{t("speak_again", state.language)}</span>
            </Link>
          </div>
        </div>

        {/* Mandatory Department Disclaimer */}
        <footer className="mt-6 mb-2 text-center w-full">
          <p className="text-small text-neel/70 font-body">
            {t("disclaimer", state.language)}
          </p>
        </footer>
      </main>
    </div>
  );
}
