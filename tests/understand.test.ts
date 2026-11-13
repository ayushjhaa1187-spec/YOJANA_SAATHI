import { describe, it, expect } from "vitest";
import { handleUnderstand } from "../lib/understand";
import { createEmptyProfile } from "../lib/rules";
import { QUESTION_BANK } from "../lib/questions";

describe("POST /api/understand (Step 5)", () => {
  it("empty transcript returns 400 INVALID_INPUT", async () => {
    const fakeExtractor = async () => ({});
    const handler = (req: Request) => handleUnderstand(req, fakeExtractor);

    const req = new Request("http://localhost/api/understand", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript: "   ",
        language: "hi",
      }),
    });

    const res = await handler(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.code).toBe("INVALID_INPUT");
  });

  it("valid output merges correctly into profile", async () => {
    const fakeExtractor = async () => ({
      marital_status: "widowed",
      dependents: 2,
      has_land: false,
      age: 58,
      gender: "female",
      income_category: "BPL",
      state: null,
      district: null,
      has_ration_card: null,
      has_pucca_house: null,
    });
    const handler = (req: Request) => handleUnderstand(req, fakeExtractor);

    const req = new Request("http://localhost/api/understand", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript: "Mera pati nahi rahe, do bachche hain, zameen nahi hai, umar 58 saal hai",
        language: "hi",
        currentProfile: createEmptyProfile(),
      }),
    });

    const res = await handler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.profile.marital_status).toBe("widowed");
    expect(data.profile.age).toBe(58);
    expect(data.profile.dependents).toBe(2);
    expect(data.profile.has_land).toBe(false);
  });

  it("invalid JSON once then valid succeeds on retry", async () => {
    let callCount = 0;
    const fakeExtractor = async () => {
      callCount++;
      if (callCount === 1) {
        return "invalid non-object json or malformed structure";
      }
      return {
        age: 65,
        gender: "male",
        marital_status: "married",
        has_land: null,
        income_category: "low",
        state: null,
        district: null,
        dependents: null,
        has_ration_card: null,
        has_pucca_house: null,
      };
    };

    const handler = (req: Request) => handleUnderstand(req, fakeExtractor);

    const req = new Request("http://localhost/api/understand", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript: "Meri umar 65 saal hai",
        language: "hi",
      }),
    });

    const res = await handler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(callCount).toBe(2); // Retried once
    expect(data.profile.age).toBe(65);
    expect(data.profile.income_category).toBe("low");
  });

  it("invalid output twice returns 502 LLM_FAILED", async () => {
    const fakeExtractor = async () => {
      return { invalid_field: 12345 }; // Fails ProfileSchema
    };

    const handler = (req: Request) => handleUnderstand(req, fakeExtractor);

    const req = new Request("http://localhost/api/understand", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript: "kuch samajh nahi aa raha",
        language: "hi",
      }),
    });

    const res = await handler(req);
    expect(res.status).toBe(502);
    const data = await res.json();
    expect(data.error.code).toBe("LLM_FAILED");
  });

  it("null never erases known values in currentProfile", async () => {
    const fakeExtractor = async () => ({
      age: null, // should NOT erase 58
      income_category: "BPL", // should update
      gender: null, // should NOT erase female
      marital_status: null,
      has_land: null,
      state: null,
      district: null,
      dependents: null,
      has_ration_card: null,
      has_pucca_house: null,
    });

    const handler = (req: Request) => handleUnderstand(req, fakeExtractor);

    const current = {
      ...createEmptyProfile(),
      age: 58,
      gender: "female" as const,
      marital_status: "widowed" as const,
    };

    const req = new Request("http://localhost/api/understand", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript: "BPL card hai",
        language: "hi",
        currentProfile: current,
      }),
    });

    const res = await handler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.profile.age).toBe(58);
    expect(data.profile.gender).toBe("female");
    expect(data.profile.marital_status).toBe("widowed");
    expect(data.profile.income_category).toBe("BPL");
  });

  it("nextQuestion comes from the static question bank", async () => {
    // Only widowed is extracted -> age and income_category are missing for widow_pension
    const fakeExtractor = async () => ({
      marital_status: "widowed",
      gender: "female",
      age: null,
      income_category: null,
      has_land: null,
      state: null,
      district: null,
      dependents: null,
      has_ration_card: null,
      has_pucca_house: null,
    });

    const handler = (req: Request) => handleUnderstand(req, fakeExtractor);

    const req = new Request("http://localhost/api/understand", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript: "Pati nahi rahe",
        language: "hi",
      }),
    });

    const res = await handler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.nextQuestion).toBeDefined();
    expect(data.nextQuestion.field).toBeDefined();
    const bankQuestion = QUESTION_BANK[data.nextQuestion.field as keyof typeof QUESTION_BANK];
    expect(bankQuestion).toBeDefined();
    expect(data.nextQuestion.text_hi).toBe(bankQuestion?.text_hi);
  });
});
