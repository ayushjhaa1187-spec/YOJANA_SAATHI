"use client";

import React, { createContext, useContext, useReducer, useEffect } from "react";
import {
  ConversationState,
  ConversationAction,
  conversationReducer,
  createInitialState,
} from "@/lib/conversation";
import { Language } from "@/lib/types";

interface ConversationContextValue {
  state: ConversationState;
  dispatch: React.Dispatch<ConversationAction>;
}

const ConversationContext = createContext<ConversationContextValue | null>(null);

export function ConversationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(conversationReducer, undefined, () =>
    createInitialState("hi")
  );

  // Sync language with localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem("yojana_saathi_lang") as Language;
      if (savedLang === "hi" || savedLang === "en") {
        dispatch({ type: "SET_LANGUAGE", language: savedLang });
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("yojana_saathi_lang", state.language);
    }
  }, [state.language]);

  return (
    <ConversationContext.Provider value={{ state, dispatch }}>
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversation() {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error("useConversation must be used within a ConversationProvider");
  }
  return context;
}
