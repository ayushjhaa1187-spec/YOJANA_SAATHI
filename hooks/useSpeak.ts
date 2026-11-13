"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Language } from "@/lib/types";

export interface UseSpeakReturn {
  speak: (text: string, lang?: Language) => void;
  cancel: () => void;
  speaking: boolean;
  hasHindiVoice: boolean;
  supported: boolean;
}

export function useSpeak(): UseSpeakReturn {
  const [speaking, setSpeaking] = useState(false);
  const [hasHindiVoice, setHasHindiVoice] = useState(true);
  const [supported, setSupported] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSupported(false);
      return;
    }

    setSupported(true);

    const checkVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const hindiVoice = voices.find(
        (v) => v.lang === "hi-IN" || v.lang.startsWith("hi")
      );
      setHasHindiVoice(!!hindiVoice);
    };

    checkVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = checkVoices;
    }

    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const cancel = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  }, []);

  const speak = useCallback(
    (text: string, lang: Language = "hi") => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        return;
      }

      // Starting a new utterance cancels the previous one
      window.speechSynthesis.cancel();

      if (!text || !text.trim()) {
        setSpeaking(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;

      const langCode = lang === "hi" ? "hi-IN" : "en-IN";
      utterance.lang = langCode;

      const voices = window.speechSynthesis.getVoices();
      const matchingVoice = voices.find(
        (v) => v.lang === langCode || v.lang.startsWith(lang)
      );
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      utterance.onstart = () => {
        setSpeaking(true);
      };

      utterance.onend = () => {
        setSpeaking(false);
      };

      utterance.onerror = (event) => {
        // "interrupted" or "canceled" are normal when user clicks cancel or talks again
        if (event.error !== "interrupted" && event.error !== "canceled") {
          console.error("speechSynthesis error:", event.error);
        }
        setSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    },
    []
  );

  return {
    speak,
    cancel,
    speaking,
    hasHindiVoice,
    supported,
  };
}
