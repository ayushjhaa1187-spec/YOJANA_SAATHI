import { describe, it, expect } from "vitest";
import { translations, t, TranslationKey } from "@/lib/i18n";

describe("Phase C: Screen i18n & Language Switching", () => {
  it("has matching keys in both Hindi and English dictionaries", () => {
    const hiKeys = Object.keys(translations.hi).sort();
    const enKeys = Object.keys(translations.en).sort();

    expect(hiKeys).toEqual(enKeys);
    expect(hiKeys.length).toBeGreaterThan(40);
  });

  it("updates Home screen strings when switching between hi and en", () => {
    // Hindi default
    expect(t("home_headline", "hi")).toContain("सरकारी योजना");
    expect(t("home_subheadline", "hi")).toBe("बोलकर पता कीजिए।");
    expect(t("demo_button", "hi")).toBe("नमूना सुनिए");

    // English switch
    expect(t("home_headline", "en")).toContain("government schemes");
    expect(t("home_subheadline", "en")).toBe("Find out just by speaking.");
    expect(t("demo_button", "en")).toBe("Listen to Sample");
  });

  it("updates Listen screen strings when switching between hi and en", () => {
    // Hindi
    expect(t("listen_title", "hi")).toBe("अपनी बात बताइए");
    expect(t("transcript_label", "hi")).toBe("आपने कहा:");
    expect(t("transcript_send", "hi")).toBe("भेजें");

    // English
    expect(t("listen_title", "en")).toBe("Tell Us About Yourself");
    expect(t("transcript_label", "en")).toBe("You said:");
    expect(t("transcript_send", "en")).toBe("Send");
  });

  it("updates Results screen strings when switching between hi and en", () => {
    // Hindi
    expect(t("results_title", "hi")).toBe("आप इनके लिए पात्र हैं");
    expect(t("status_eligible", "hi")).toBe("पात्र");
    expect(t("status_maybe", "hi")).toBe("पुष्टि करें");
    expect(t("speak_all", "hi")).toBe("सभी सुनाएँ");

    // English
    expect(t("results_title", "en")).toBe("You Qualify For These");
    expect(t("status_eligible", "en")).toBe("Eligible");
    expect(t("status_maybe", "en")).toBe("Needs Confirmation");
    expect(t("speak_all", "en")).toBe("Read All");
  });

  it("updates Scheme detail screen strings when switching between hi and en", () => {
    // Hindi
    expect(t("scheme_benefit_heading", "hi")).toBe("फ़ायदा");
    expect(t("documents_heading", "hi")).toBe("ये कागज़ ले जाइए");
    expect(t("centers_heading", "hi")).toBe("यहाँ जाइए");

    // English
    expect(t("scheme_benefit_heading", "en")).toBe("Benefit");
    expect(t("documents_heading", "en")).toBe("Required Documents");
    expect(t("centers_heading", "en")).toBe("Where to Apply");
  });

  it("handles edge cases and fallback notices in both languages", () => {
    expect(t("error_mic_denied", "hi")).toBe("माइक की अनुमति चाहिए।");
    expect(t("error_mic_denied", "en")).toBe("Microphone permission required.");

    expect(t("wispr_fallback_note", "hi")).toBe("Wispr Flow या कीबोर्ड से बोलकर लिखें");
    expect(t("wispr_fallback_note", "en")).toBe("Dictate with Wispr Flow or type using keyboard");

    expect(t("no_hindi_tts_notice", "hi")).toContain("हिंदी आवाज़");
    expect(t("no_hindi_tts_notice", "en")).toContain("Hindi voice is not available");

    expect(t("disclaimer", "hi")).toContain("अंतिम फ़ैसला");
    expect(t("disclaimer", "en")).toContain("Final eligibility is decided");
  });

  it("interpolates parameters in step indicator correctly", () => {
    const hiStep = t("step_indicator", "hi", { current: 1, total: 3 });
    expect(hiStep).toBe("कदम 1 / 3");

    const enStep = t("step_indicator", "en", { current: 2, total: 3 });
    expect(enStep).toBe("Step 2 of 3");
  });
});
