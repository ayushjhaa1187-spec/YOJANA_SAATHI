import { Profile, Match, Language } from "./types";
import { createEmptyProfile } from "./rules";

export type ConversationStatus =
  | "idle"
  | "listening"
  | "thinking"
  | "asking"
  | "done"
  | "error";

export type ConversationState = {
  language: Language;
  transcripts: string[];
  profile: Profile;
  nextQuestion: {
    field: keyof Profile;
    text_hi: string;
    text?: string;
    text_en?: string;
    options?: any[];
  } | null;
  followUpCount: number; // max 3
  matches: Match[];
  selectedSchemeId: string | null;
  status: ConversationStatus;
  error: { code: string; message_hi: string } | null;
};

export type ConversationAction =
  | { type: "SET_LANGUAGE"; language: Language }
  | { type: "ADD_TRANSCRIPT"; text: string }
  | {
      type: "PROFILE_UPDATED";
      profile: Profile;
      nextQuestion: ConversationState["nextQuestion"];
    }
  | { type: "MATCHES_READY"; matches: Match[] }
  | { type: "SELECT_SCHEME"; id: string }
  | { type: "SET_STATUS"; status: ConversationStatus }
  | { type: "INCREMENT_FOLLOW_UP" }
  | { type: "ERROR"; error: ConversationState["error"] }
  | { type: "RESET" };

export function createInitialState(language: Language = "hi"): ConversationState {
  return {
    language,
    transcripts: [],
    profile: createEmptyProfile(),
    nextQuestion: null,
    followUpCount: 0,
    matches: [],
    selectedSchemeId: null,
    status: "idle",
    error: null,
  };
}

export function conversationReducer(
  state: ConversationState,
  action: ConversationAction
): ConversationState {
  switch (action.type) {
    case "SET_LANGUAGE":
      return {
        ...state,
        language: action.language,
      };

    case "ADD_TRANSCRIPT":
      return {
        ...state,
        transcripts: [...state.transcripts, action.text],
      };

    case "PROFILE_UPDATED":
      return {
        ...state,
        profile: action.profile,
        nextQuestion: action.nextQuestion,
        error: null,
      };

    case "MATCHES_READY":
      return {
        ...state,
        matches: action.matches,
      };

    case "SELECT_SCHEME":
      return {
        ...state,
        selectedSchemeId: action.id,
      };

    case "SET_STATUS":
      return {
        ...state,
        status: action.status,
      };

    case "INCREMENT_FOLLOW_UP":
      return {
        ...state,
        followUpCount: state.followUpCount + 1,
      };

    case "ERROR":
      return {
        ...state,
        status: "error",
        error: action.error,
      };

    case "RESET":
      return createInitialState(state.language);

    default:
      return state;
  }
}
