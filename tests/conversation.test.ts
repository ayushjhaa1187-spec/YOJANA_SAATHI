import { describe, it, expect } from "vitest";
import {
  conversationReducer,
  createInitialState,
} from "../lib/conversation";
import { Profile, Match } from "../lib/types";

describe("Conversation Reducer (lib/conversation.ts)", () => {
  it("initializes with default state in Hindi", () => {
    const state = createInitialState("hi");
    expect(state.language).toBe("hi");
    expect(state.transcripts).toEqual([]);
    expect(state.profile.age).toBeNull();
    expect(state.followUpCount).toBe(0);
    expect(state.status).toBe("idle");
    expect(state.error).toBeNull();
  });

  it("handles SET_LANGUAGE", () => {
    const state = createInitialState("hi");
    const next = conversationReducer(state, {
      type: "SET_LANGUAGE",
      language: "en",
    });
    expect(next.language).toBe("en");
  });

  it("handles ADD_TRANSCRIPT", () => {
    const state = createInitialState("hi");
    const next = conversationReducer(state, {
      type: "ADD_TRANSCRIPT",
      text: "Mera pati nahi rahe",
    });
    expect(next.transcripts).toEqual(["Mera pati nahi rahe"]);

    const next2 = conversationReducer(next, {
      type: "ADD_TRANSCRIPT",
      text: "Umar 58 saal hai",
    });
    expect(next2.transcripts).toEqual([
      "Mera pati nahi rahe",
      "Umar 58 saal hai",
    ]);
  });

  it("handles PROFILE_UPDATED", () => {
    const state = createInitialState("hi");
    const newProfile: Profile = {
      ...state.profile,
      age: 58,
      marital_status: "widowed",
    };
    const nextQuestion = {
      field: "income_category" as const,
      text_hi: "क्या आपके पास BPL कार्ड है?",
    };

    const next = conversationReducer(state, {
      type: "PROFILE_UPDATED",
      profile: newProfile,
      nextQuestion,
    });

    expect(next.profile.age).toBe(58);
    expect(next.profile.marital_status).toBe("widowed");
    expect(next.nextQuestion?.field).toBe("income_category");
    expect(next.error).toBeNull();
  });

  it("handles MATCHES_READY", () => {
    const state = createInitialState("hi");
    const matches: Match[] = [
      {
        schemeId: "widow_pension",
        status: "eligible",
        reason_hi: "आप विधवा हैं",
        missing: [],
      },
    ];

    const next = conversationReducer(state, {
      type: "MATCHES_READY",
      matches,
    });

    expect(next.matches.length).toBe(1);
    expect(next.matches[0].schemeId).toBe("widow_pension");
  });

  it("handles SELECT_SCHEME and SET_STATUS", () => {
    const state = createInitialState("hi");
    const next = conversationReducer(state, {
      type: "SELECT_SCHEME",
      id: "widow_pension",
    });
    expect(next.selectedSchemeId).toBe("widow_pension");

    const statusNext = conversationReducer(next, {
      type: "SET_STATUS",
      status: "listening",
    });
    expect(statusNext.status).toBe("listening");
  });

  it("handles INCREMENT_FOLLOW_UP", () => {
    const state = createInitialState("hi");
    expect(state.followUpCount).toBe(0);

    const step1 = conversationReducer(state, { type: "INCREMENT_FOLLOW_UP" });
    expect(step1.followUpCount).toBe(1);

    const step2 = conversationReducer(step1, { type: "INCREMENT_FOLLOW_UP" });
    expect(step2.followUpCount).toBe(2);
  });

  it("handles ERROR and RESET", () => {
    const state = createInitialState("hi");
    const errState = conversationReducer(state, {
      type: "ERROR",
      error: { code: "LLM_FAILED", message_hi: "समझ नहीं पाए" },
    });
    expect(errState.status).toBe("error");
    expect(errState.error?.code).toBe("LLM_FAILED");

    const resetState = conversationReducer(errState, { type: "RESET" });
    expect(resetState.status).toBe("idle");
    expect(resetState.error).toBeNull();
    expect(resetState.followUpCount).toBe(0);
    expect(resetState.transcripts).toEqual([]);
  });
});
