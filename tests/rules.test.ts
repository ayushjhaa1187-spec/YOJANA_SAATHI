import { describe, it, expect } from "vitest";
import {
  evaluate,
  matchAll,
  nextQuestionField,
  mergeProfile,
  createEmptyProfile,
} from "../lib/rules";
import { getSchemes, getScheme } from "../lib/data";
import { Profile, Scheme, Match } from "../lib/types";

describe("Pure Deterministic Rules Engine (lib/rules.ts)", () => {
  const schemes = getSchemes();

  it("1. widowed, age 58, BPL, female -> widow_pension eligible", () => {
    const profile: Profile = {
      ...createEmptyProfile(),
      marital_status: "widowed",
      age: 58,
      income_category: "BPL",
      gender: "female",
    };
    const widowPension = getScheme("widow_pension")!;
    const match = evaluate(profile, widowPension);
    expect(match.status).toBe("eligible");
    expect(match.missing).toEqual([]);
    expect(match.reason_hi).toContain("आप विधवा हैं");
    expect(match.reason_hi).toContain("आपकी उम्र 40 से ज़्यादा है");
    expect(match.reason_hi).toContain("आपकी आय कम है");
  });

  it("2. widowed, age 35, BPL -> widow_pension not_eligible", () => {
    const profile: Profile = {
      ...createEmptyProfile(),
      marital_status: "widowed",
      age: 35,
      income_category: "BPL",
    };
    const widowPension = getScheme("widow_pension")!;
    const match = evaluate(profile, widowPension);
    expect(match.status).toBe("not_eligible");
  });

  it('3. widowed, age null, BPL -> widow_pension maybe, missing ["age"]', () => {
    const profile: Profile = {
      ...createEmptyProfile(),
      marital_status: "widowed",
      age: null,
      income_category: "BPL",
    };
    const widowPension = getScheme("widow_pension")!;
    const match = evaluate(profile, widowPension);
    expect(match.status).toBe("maybe");
    expect(match.missing).toContain("age");
    expect(match.reason_hi).toContain("आपकी उम्र जाननी है");
  });

  it("4. age 65, BPL -> old_age_pension eligible", () => {
    const profile: Profile = {
      ...createEmptyProfile(),
      age: 65,
      income_category: "BPL",
    };
    const oldAgePension = getScheme("old_age_pension")!;
    const match = evaluate(profile, oldAgePension);
    expect(match.status).toBe("eligible");
    expect(match.missing).toEqual([]);
    expect(match.reason_hi).toContain("आपकी उम्र 60 से ज़्यादा है");
    expect(match.reason_hi).toContain("आपकी आय कम है");
  });

  it("5. nextQuestionField returns the most commonly missing field among maybe matches", () => {
    const matches: Match[] = [
      {
        schemeId: "s1",
        status: "maybe",
        reason_hi: "",
        missing: ["age", "income_category"],
      },
      {
        schemeId: "s2",
        status: "maybe",
        reason_hi: "",
        missing: ["income_category", "gender"],
      },
      {
        schemeId: "s3",
        status: "maybe",
        reason_hi: "",
        missing: ["income_category"],
      },
      {
        schemeId: "s4",
        status: "eligible",
        reason_hi: "",
        missing: [],
      },
    ];
    expect(nextQuestionField(matches)).toBe("income_category");
  });

  it("6. matchAll puts eligible before maybe and orders by benefit_rank", () => {
    // Profile: female, 58, widowed, BPL, has_pucca_house: false
    const profile: Profile = {
      ...createEmptyProfile(),
      gender: "female",
      age: 58,
      marital_status: "widowed",
      income_category: "BPL",
      has_pucca_house: false,
    };
    const matches = matchAll(profile, schemes);
    
    // not_eligible schemes (like old_age_pension where age >= 60 fails) must be omitted
    expect(matches.some((m) => m.schemeId === "old_age_pension")).toBe(false);
    expect(matches.length).toBeGreaterThan(0);

    // Verify ordering: all eligible before any maybe
    let seenMaybe = false;
    for (const match of matches) {
      if (match.status === "maybe") {
        seenMaybe = true;
      }
      if (seenMaybe) {
        expect(match.status).toBe("maybe");
      }
    }

    // Verify benefit_rank sorting within the eligible group
    const eligibleMatches = matches.filter((m) => m.status === "eligible");
    for (let i = 0; i < eligibleMatches.length - 1; i++) {
      const sA = getScheme(eligibleMatches[i].schemeId)!;
      const sB = getScheme(eligibleMatches[i + 1].schemeId)!;
      expect(sA.benefit_rank).toBeLessThanOrEqual(sB.benefit_rank);
    }
  });

  it("7. mergeProfile: a non-null value overwrites, null does not erase", () => {
    const current: Profile = {
      ...createEmptyProfile(),
      age: 58,
      marital_status: "widowed",
      gender: null,
    };
    const incoming: Partial<Profile> = {
      age: null, // should not erase 58
      marital_status: "married", // should overwrite "widowed"
      gender: "female", // should update null to "female"
    };
    const merged = mergeProfile(current, incoming);
    expect(merged.age).toBe(58);
    expect(merged.marital_status).toBe("married");
    expect(merged.gender).toBe("female");
  });

  it("8. evaluate is deterministic: the same input twice gives deep-equal output", () => {
    const profile: Profile = {
      ...createEmptyProfile(),
      age: 58,
      marital_status: "widowed",
      income_category: "BPL",
    };
    const widowPension = getScheme("widow_pension")!;
    const match1 = evaluate(profile, widowPension);
    const match2 = evaluate(profile, widowPension);
    expect(match1).toEqual(match2);
  });

  it("9. an all-null profile returns no eligible schemes and no crashes", () => {
    const emptyProfile = createEmptyProfile();
    const matches = matchAll(emptyProfile, schemes);
    expect(matches.every((m) => m.status !== "eligible")).toBe(true);
    expect(matches.every((m) => m.status === "maybe")).toBe(true);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('10. a scheme with state "Bihar" vs profile state "UP" -> not_eligible', () => {
    const inlineScheme: Scheme = {
      id: "bihar_state_pension",
      name_en: "Bihar State Pension",
      name_hi: "बिहार राज्य पेंशन",
      category: "pension",
      benefit_text_en: "State pension benefit",
      benefit_text_hi: "राज्य पेंशन फ़ायदा",
      apply_url: "https://serviceonline.bihar.gov.in",
      state: "Bihar",
      conditions: [{ field: "income_category", op: "in", value: ["BPL", "low"] }],
      document_ids: [],
      benefit_rank: 1,
      verified: false,
    };

    const upProfile: Profile = {
      ...createEmptyProfile(),
      state: "UP",
      income_category: "BPL",
    };
    const matchDiffState = evaluate(upProfile, inlineScheme);
    expect(matchDiffState.status).toBe("not_eligible");

    const nullStateProfile: Profile = {
      ...createEmptyProfile(),
      state: null,
      income_category: "BPL",
    };
    const matchNullState = evaluate(nullStateProfile, inlineScheme);
    expect(matchNullState.status).toBe("maybe");
    expect(matchNullState.missing).toContain("state");

    const biharProfile: Profile = {
      ...createEmptyProfile(),
      state: "Bihar",
      income_category: "BPL",
    };
    const matchSameState = evaluate(biharProfile, inlineScheme);
    expect(matchSameState.status).toBe("eligible");
    expect(matchSameState.missing).toEqual([]);
  });

  it("11. demo profile matches output", () => {
    const demoProfile: Profile = {
      ...createEmptyProfile(),
      age: 58,
      gender: "female",
      marital_status: "widowed",
      has_land: false,
      income_category: "BPL",
    };
    const matches = matchAll(demoProfile, schemes);
    console.log("DEMO_PROFILE_RESULTS:", JSON.stringify(matches.slice(0, 3), null, 2));
    expect(matches.length).toBeGreaterThanOrEqual(3);
  });
});
