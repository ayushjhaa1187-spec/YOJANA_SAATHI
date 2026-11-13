import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleUnderstand, MAX_TRANSCRIPT_LENGTH } from "../lib/understand";
import { clearRateLimitStore } from "../lib/rateLimit";
import { LLMTimeoutError } from "../lib/llm";

describe("Phase A: Backend Robustness", () => {
  beforeEach(() => {
    clearRateLimitStore();
    vi.restoreAllMocks();
  });

  it("rejects oversized transcript exceeding MAX_TRANSCRIPT_LENGTH with 400 INVALID_INPUT", async () => {
    const fakeExtractor = vi.fn().mockResolvedValue({});
    const longTranscript = "a".repeat(MAX_TRANSCRIPT_LENGTH + 1);

    const req = new Request("http://localhost/api/understand", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript: longTranscript,
        language: "hi",
      }),
    });

    const res = await handleUnderstand(req, fakeExtractor);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.code).toBe("INVALID_INPUT");
    expect(data.error.message).toContain("maximum length");
    expect(fakeExtractor).not.toHaveBeenCalled();
  });

  it("triggers rate limit with 429 RATE_LIMITED when threshold exceeded", async () => {
    const fakeExtractor = vi.fn().mockResolvedValue({
      age: 58,
      gender: "female",
      marital_status: "widowed",
      has_land: false,
      income_category: "BPL",
      state: null,
      district: null,
      dependents: null,
      has_ration_card: null,
      has_pucca_house: null,
    });

    const ip = "192.168.1.100";
    // Fire 30 requests to consume limit
    for (let i = 0; i < 30; i++) {
      const req = new Request("http://localhost/api/understand", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": ip,
        },
        body: JSON.stringify({
          transcript: "Valid transcript text",
          language: "hi",
        }),
      });
      const res = await handleUnderstand(req, fakeExtractor);
      expect(res.status).toBe(200);
    }

    // 31st request must trigger 429 RATE_LIMITED
    const blockedReq = new Request("http://localhost/api/understand", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": ip,
      },
      body: JSON.stringify({
        transcript: "Valid transcript text",
        language: "hi",
      }),
    });

    const blockedRes = await handleUnderstand(blockedReq, fakeExtractor);
    expect(blockedRes.status).toBe(429);
    const blockedData = await blockedRes.json();
    expect(blockedData.error.code).toBe("RATE_LIMITED");
    expect(blockedRes.headers.get("Retry-After")).toBeDefined();
  });

  it("maps LLM timeout to 502 LLM_FAILED", async () => {
    const timingOutExtractor = vi.fn().mockRejectedValue(new LLMTimeoutError());

    const req = new Request("http://localhost/api/understand", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript: "Slow speech processing",
        language: "hi",
      }),
    });

    const res = await handleUnderstand(req, timingOutExtractor);
    expect(res.status).toBe(502);
    const data = await res.json();
    expect(data.error.code).toBe("LLM_FAILED");
    expect(data.error.message).toContain("timed out");
  });

  it("never logs transcript text to console (privacy verification)", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const SECRET_TEXT = "CONFIDENTIAL_SENSITIVE_TRANSCRIPT_DATA_9988";
    const failingExtractor = vi.fn().mockRejectedValue(new Error("Generic error"));

    const req = new Request("http://localhost/api/understand", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript: SECRET_TEXT,
        language: "hi",
      }),
    });

    await handleUnderstand(req, failingExtractor);

    // Verify console calls did not leak the secret text
    const allCalls = [
      ...errorSpy.mock.calls.flat(),
      ...logSpy.mock.calls.flat(),
    ];

    for (const callArg of allCalls) {
      const text = typeof callArg === "string" ? callArg : JSON.stringify(callArg);
      expect(text).not.toContain(SECRET_TEXT);
    }
  });

  it("ignores unknown fields in currentProfile safely", async () => {
    const fakeExtractor = vi.fn().mockResolvedValue({
      age: 58,
      gender: "female",
      marital_status: "widowed",
      has_land: false,
      income_category: "BPL",
      state: null,
      district: null,
      dependents: null,
      has_ration_card: null,
      has_pucca_house: null,
    });

    const req = new Request("http://localhost/api/understand", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript: "Normal speech",
        language: "hi",
        currentProfile: {
          age: 50,
          injected_field: "should_be_ignored",
          malicious_payload: { foo: "bar" },
        },
      }),
    });

    const res = await handleUnderstand(req, fakeExtractor);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.profile.age).toBe(58);
    expect((data.profile as any).injected_field).toBeUndefined();
    expect((data.profile as any).malicious_payload).toBeUndefined();
  });
});
