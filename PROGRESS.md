# Yojana Saathi - Progress Log

## Summary
Autonomous implementation log tracking progress across build steps per README.md section 15.

---

## Step 3: Pure Deterministic Rules Engine
- **Status:** COMPLETED
- **What was done:**
  - Implemented `lib/rules.ts` with pure functions: `evaluate`, `matchAll`, `nextQuestionField`, `buildReasonHi` (Hindi templates only), `mergeProfile`, and state-specific scheme handling.
  - Implemented 11 tests in `tests/rules.test.ts` covering all required scenarios: widowed 58 BPL eligible, widowed 35 not_eligible, widowed age null maybe, age 65 BPL eligible, nextQuestionField, matchAll ordering, mergeProfile, determinism, all-null profile, state mismatch, and demo profile verification.
  - Verified with `npm test` (20 passed) and `npm run build` (success).
- **Assumed:**
  - When state is specified on a scheme but null in profile, it is treated as a missing `"state"` field (resulting in `maybe`).
- **To Check:**
  - Verify that top 3 demo profile results match expectations (`widow_pension`, `pmjay`, `nfsa_ration`).

---

## Step 4: Core Matching & Data API Routes
- **Status:** COMPLETED
- **What was done:**
  - Implemented `app/api/match/route.ts`: accepts `{ profile }`, validates partial profile with `ProfileSchema`, fills missing keys with null, runs `matchAll`, and returns formatted matches.
  - Implemented `app/api/schemes/[id]/documents/route.ts`: returns required documents for a scheme or 404 `NOT_FOUND`.
  - Implemented `app/api/centers/route.ts`: returns centers filtered by `district`, falling back to all centers if unknown or omitted.
  - Implemented direct route handler tests in `tests/routes.test.ts` (7 tests covering valid match, invalid input, document checklist, 404, and center district filtering).
  - All 27 tests passed; `npm run build` succeeded.
- **Assumed:**
  - `POST /api/match` allows partial profiles and fills omitted fields with `null`.
- **To Check:**
  - Check that HTTP 400 with `{ error: { code: "INVALID_INPUT" } }` is returned on malformed payload.

---

## Step 5: Speech Understanding API & LLM Extraction
- **Status:** COMPLETED
- **What was done:**
  - Implemented `lib/prompts.ts` with strict extraction system prompt (no inferences, Bhojpuri/Hindi dialect patterns, JSON-only).
  - Implemented `lib/questions.ts` with static question bank per README section 7.5.
  - Implemented `lib/llm.ts` with `extractJson` using `@google/genai` (structured JSON mode, temp 0, safe missing key error handling without leaking secrets).
  - Implemented `lib/understand.ts` and `app/api/understand/route.ts` with injectable extractor, Zod validation, retry on invalid JSON, `mergeProfile`, deterministic scheme matching, and question bank selection.
  - Implemented `tests/understand.test.ts` covering valid merging, 1-retry on invalid response, 502 `LLM_FAILED` on repeated invalid response, immutability of non-null fields, 400 `INVALID_INPUT` on empty transcript, and question bank lookup.
  - Added `scripts/try-understand.ts` for testing against the real Gemini API.
  - All 33 tests passed; production build succeeded.
- **Assumed:**
  - If `GEMINI_API_KEY` is not present, route handler returns 502 with code `LLM_FAILED`, triggering guided mode on the client.
- **To Check:**
  - Test `/api/understand` with curl or `scripts/try-understand.ts` once real `GEMINI_API_KEY` is set in `.env.local`:
    ```bash
    curl -X POST http://localhost:3000/api/understand \
      -H "Content-Type: application/json" \
      -d '{"language":"hi","transcript":"Mera pati nahi rahe, do bachche hain, zameen nahi hai. Meri umar 58 saal hai."}'
    ```

---

## Step 6: Frontend Plumbing & Conversation State
- **Status:** COMPLETED
- **What was done:**
  - Implemented `lib/api.ts`: typed wrappers for `/api/understand`, `/api/match`, `/api/schemes/:id/documents`, and `/api/centers`, with 10s timeout, 1 retry, returning `{ ok: true, data } | { ok: false, error }` (never throws).
  - Implemented `hooks/useOnline.ts`: tracks online/offline status with browser listeners.
  - Implemented `hooks/useSpeak.ts`: browser `speechSynthesis` queue with cancellation, language detection, and Hindi voice fallback check.
  - Implemented `hooks/useSpeechRecognition.ts`: Web Speech API wrapper with auto-stop on ~2s silence, error mapping, and text confirmation without premature sending.
  - Implemented `lib/conversation.ts` and `components/ConversationProvider.tsx`: `useReducer` managing pure in-memory state (only language stored in localStorage).
  - Wrapped `app/layout.tsx` with `<ConversationProvider>`.
  - Implemented `tests/conversation.test.ts`: 8 unit tests covering all reducer actions.
  - All 41 tests passed; production build succeeded.
- **Assumed:**
  - DemoButton feeds text directly into Listen flow rather than triggering speech synthesis.
- **To Check:**
  - Verify `useSpeechRecognition` behaves properly on non-Chrome browsers (falls back gracefully to textarea).

---
