"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { StepDots } from "@/components/layout/StepDots";
import { MicButton } from "@/components/voice/MicButton";
import { TranscriptBox } from "@/components/voice/TranscriptBox";
import { QuestionCard } from "@/components/convo/QuestionCard";
import { QuickChips } from "@/components/convo/QuickChips";
import { ErrorBanner } from "@/components/feedback/ErrorBanner";
import { OfflineBanner } from "@/components/feedback/OfflineBanner";
import { Loader } from "@/components/feedback/Loader";
import { useConversation } from "@/components/ConversationProvider";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeak } from "@/hooks/useSpeak";
import { api } from "@/lib/api";
import { t } from "@/lib/i18n";
import { QUESTION_BANK } from "@/lib/questions";
import { Profile, QuestionOption } from "@/lib/types";
import { mergeProfile } from "@/lib/rules";

const GUIDED_FIELDS: (keyof Profile)[] = [
  "age",
  "marital_status",
  "income_category",
  "has_land",
];

const SAVITRI_DEMO_TEXT =
  "मेरा पति नहीं रहे, दो बच्चे हैं, ज़मीन नहीं है। मेरी उम्र 58 साल है।";

function ListenScreenContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, dispatch } = useConversation();

  const [textInput, setTextInput] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGuidedMode, setIsGuidedMode] = useState(false);
  const [guidedStep, setGuidedStep] = useState(0);

  const { hasHindiVoice } = useSpeak();

  const {
    supported: speechSupported,
    listening,
    transcript,
    start: startListening,
    stop: stopListening,
    error: speechError,
    resetTranscript,
  } = useSpeechRecognition(state.language);

  // Sync recognition transcript into textInput
  useEffect(() => {
    if (transcript) {
      setTextInput(transcript);
    }
  }, [transcript]);

  // Handle autostart or demo query params
  useEffect(() => {
    const autostart = searchParams.get("autostart");
    const demo = searchParams.get("demo");

    if (demo === "1") {
      setTextInput(SAVITRI_DEMO_TEXT);
      handleSend(SAVITRI_DEMO_TEXT);
    } else if (autostart === "1" && speechSupported) {
      startListening();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, speechSupported]);

  // Handle speech error mapping
  useEffect(() => {
    if (speechError === "permission-denied") {
      setErrorMessage(t("error_mic_denied", state.language));
    } else if (speechError === "no-speech") {
      setErrorMessage(t("error_no_speech", state.language));
    } else if (speechError) {
      setErrorMessage(speechError);
    }
  }, [speechError, state.language]);

  const handleSend = useCallback(
    async (textToSend: string) => {
      const text = textToSend.trim();
      if (!text) return;

      if (listening) {
        stopListening();
      }

      setErrorMessage(null);
      dispatch({ type: "ADD_TRANSCRIPT", text });
      dispatch({ type: "SET_STATUS", status: "thinking" });

      const res = await api.understand({
        transcript: text,
        currentProfile: state.profile,
        language: state.language,
      });

      if (!res.ok) {
        if (res.error.code === "LLM_FAILED") {
          // Switch to guided mode
          setIsGuidedMode(true);
          const isDemo =
            searchParams.get("demo") === "1" ||
            text.includes("pati nahi rahe") ||
            text.includes("पति नहीं रहे");

          if (isDemo) {
            const demoExtracted: Profile = {
              ...state.profile,
              marital_status: "widowed",
              gender: "female",
              age: 58,
              has_land: false,
              dependents: 2,
            };
            dispatch({
              type: "PROFILE_UPDATED",
              profile: demoExtracted,
              nextQuestion: null,
            });
            // Point guided mode directly to income_category follow-up
            const incomeIndex = GUIDED_FIELDS.indexOf("income_category");
            setGuidedStep(incomeIndex >= 0 ? incomeIndex : 0);
          } else {
            setGuidedStep(0);
          }

          setErrorMessage(t("error_llm_failed", state.language));
          dispatch({ type: "SET_STATUS", status: "asking" });
        } else {
          setErrorMessage(res.error.message || t("retry", state.language));
          dispatch({ type: "SET_STATUS", status: "error" });
        }
        return;
      }

      // Success: update profile
      const updatedProfile = res.data.profile;
      const nextQ = res.data.nextQuestion;

      dispatch({
        type: "PROFILE_UPDATED",
        profile: updatedProfile,
        nextQuestion: nextQ,
      });

      // Match schemes
      const matchRes = await api.match({ profile: updatedProfile });
      if (matchRes.ok) {
        dispatch({ type: "MATCHES_READY", matches: matchRes.data.matches });
      }

      setTextInput("");
      resetTranscript();

      // Check loop: if followUpCount < 3 and nextQuestion exists, ask it
      if (nextQ && state.followUpCount < 3) {
        dispatch({ type: "INCREMENT_FOLLOW_UP" });
        dispatch({ type: "SET_STATUS", status: "asking" });
      } else {
        dispatch({ type: "SET_STATUS", status: "done" });
        router.push("/results");
      }
    },
    [listening, stopListening, dispatch, state.profile, state.language, state.followUpCount, resetTranscript, router]
  );

  // Guided Mode answer handler
  const handleGuidedAnswer = async (value: any) => {
    const currentField = GUIDED_FIELDS[guidedStep];
    const updatedProfile = mergeProfile(state.profile, { [currentField]: value });

    dispatch({
      type: "PROFILE_UPDATED",
      profile: updatedProfile,
      nextQuestion: null,
    });

    const nextStep = guidedStep + 1;
    if (nextStep < GUIDED_FIELDS.length) {
      setGuidedStep(nextStep);
    } else {
      // Completed guided questions -> run match and go to results
      dispatch({ type: "SET_STATUS", status: "thinking" });
      const matchRes = await api.match({ profile: updatedProfile });
      if (matchRes.ok) {
        dispatch({ type: "MATCHES_READY", matches: matchRes.data.matches });
      }
      dispatch({ type: "SET_STATUS", status: "done" });
      router.push("/results");
    }
  };

  const handleMicToggle = () => {
    if (listening) {
      stopListening();
    } else {
      setErrorMessage(null);
      startListening();
    }
  };

  const currentGuidedField = GUIDED_FIELDS[guidedStep];
  const guidedQuestionData = currentGuidedField ? QUESTION_BANK[currentGuidedField] : null;

  return (
    <div className="flex flex-col min-h-screen bg-dhuli text-neel">
      <OfflineBanner language={state.language} />
      <Header
        language={state.language}
        onLanguageChange={(lang) => dispatch({ type: "SET_LANGUAGE", language: lang })}
        showBack
        backHref="/"
      />

      <main className="flex-1 flex flex-col justify-between px-4 py-4 max-w-[480px] mx-auto w-full">
        {/* Accessible live region for dynamic screen-reader status announcements */}
        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {errorMessage
            ? errorMessage
            : listening
            ? t("mic_listening", state.language)
            : state.status === "thinking"
            ? t("mic_processing", state.language)
            : isGuidedMode && guidedQuestionData
            ? guidedQuestionData[state.language === "en" && guidedQuestionData.text_en ? "text_en" : "text_hi"]
            : state.nextQuestion
            ? state.nextQuestion[state.language === "en" && state.nextQuestion.text_en ? "text_en" : "text_hi"]
            : ""}
        </div>

        <div>
          {/* Follow-up step dots (max 3) */}
          <StepDots
            currentStep={isGuidedMode ? guidedStep : state.followUpCount}
            totalSteps={isGuidedMode ? GUIDED_FIELDS.length : 3}
            language={state.language}
          />

          {/* Fallback notice if device lacks Hindi TTS voice */}
          {state.language === "hi" && !hasHindiVoice && (
            <div className="w-full text-center py-2 px-3 my-2 rounded-card bg-kesar/10 border border-kesar/20 text-small text-kesar font-medium">
              ℹ️ {t("no_hindi_tts_notice", state.language)}
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <ErrorBanner
              message={errorMessage}
              language={state.language}
              onDismiss={() => setErrorMessage(null)}
              onRetry={() => {
                setErrorMessage(null);
                if (textInput.trim()) handleSend(textInput);
              }}
            />
          )}

          {/* Loader */}
          {state.status === "thinking" && <Loader language={state.language} />}

          {/* Question Display */}
          {isGuidedMode && guidedQuestionData ? (
            <div className="flex flex-col">
              <h1 className="sr-only">{t("listen_title", state.language)}</h1>
              <QuestionCard
                text_hi={guidedQuestionData.text_hi}
                text_en={guidedQuestionData.text_en}
                language={state.language}
                autoSpeak
              />
              <QuickChips
                options={guidedQuestionData.options || []}
                onPick={handleGuidedAnswer}
                language={state.language}
                disabled={state.status === "thinking"}
              />
            </div>
          ) : state.nextQuestion ? (
            <div className="flex flex-col">
              <h1 className="sr-only">{t("listen_title", state.language)}</h1>
              <QuestionCard
                text_hi={state.nextQuestion.text_hi}
                text_en={state.nextQuestion.text_en}
                language={state.language}
                autoSpeak
              />
              {state.nextQuestion.options && (
                <QuickChips
                  options={state.nextQuestion.options as QuestionOption[]}
                  onPick={(val) => {
                    handleSend(String(val));
                  }}
                  language={state.language}
                  disabled={state.status === "thinking"}
                />
              )}
            </div>
          ) : (
            <div className="w-full bg-white rounded-card border-2 border-neel/15 p-4 my-3">
              <h1 className="font-heading font-bold text-heading text-neel mb-1">
                {t("listen_title", state.language)}
              </h1>
              <p className="font-body text-body text-neel/80">
                {t("listen_initial_prompt", state.language)}
              </p>
            </div>
          )}
        </div>

        {/* Center: Mic Button (only shown if speech is supported and permission not denied) */}
        <div className="my-6 flex flex-col items-center">
          {speechSupported && speechError !== "permission-denied" ? (
            <MicButton
              status={
                listening
                  ? "listening"
                  : state.status === "thinking"
                  ? "processing"
                  : state.status === "error"
                  ? "error"
                  : "idle"
              }
              language={state.language}
              onClick={handleMicToggle}
              disabled={state.status === "thinking"}
            />
          ) : (
            <div className="w-full text-center py-2 px-4 rounded-full bg-white border-2 border-neel/20 text-small text-neel/80 font-medium">
              ℹ️ {t("wispr_fallback_note", state.language)}
            </div>
          )}
        </div>

        {/* Bottom: Always visible editable Transcript Box (Wispr Flow target) + Send button */}
        <div className="w-full">
          <TranscriptBox
            value={textInput}
            onChange={setTextInput}
            onSubmit={() => handleSend(textInput)}
            disabled={state.status === "thinking"}
            language={state.language}
          />

          <p className="text-small text-neel/60 font-body text-center mt-2">
            {t("disclaimer", state.language)}
          </p>
        </div>
      </main>
    </div>
  );
}

export default function ListenPage() {
  return (
    <Suspense fallback={<Loader />}>
      <ListenScreenContent />
    </Suspense>
  );
}
