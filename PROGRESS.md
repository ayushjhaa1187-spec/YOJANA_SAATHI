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

## Step 7: Listen Screen, Voice Loop & Guided Mode
- **Status:** COMPLETED
- **What was done:**
  - Implemented `app/listen/page.tsx` with full conversation controller loop per README section 9.4.
  - Implemented `components/convo/QuestionCard.tsx` (Devanagari Baloo 2 font, 28px, TTS read-aloud button).
  - Implemented `components/convo/QuickChips.tsx` (56px touch target chips, 999px radius).
  - Implemented `components/voice/TranscriptBox.tsx` (editable `<textarea>`, Wispr Flow target, confirmation Send button).
  - Implemented `components/layout/StepDots.tsx` (visual 3-step progress dots).
  - Implemented feedback components: `ErrorBanner.tsx`, `OfflineBanner.tsx`, and `Loader.tsx`.
  - Implemented GUIDED MODE: if `/api/understand` returns `LLM_FAILED`, switches to fixed questions (`age`, `marital_status`, `income_category`, `has_land`) with chips and typed inputs, merging locally with `mergeProfile` and executing `/api/match`.
  - Handled edge cases: mic denied, unsupported browser fallback, autostart, and Savitri demo text injection.
  - All 41 tests passed; production build succeeded.
- **Assumed:**
  - Guided mode asks up to 4 core profile fields in deterministic order if LLM fails or is unconfigured.
- **To Check:**
  - Test `/listen?demo=1` to observe the demo flow with zero voice hardware required.

---

## Step 8: Results Screen & Sequential Audio Announcement
- **Status:** COMPLETED
- **What was done:**
  - Implemented `components/results/EligibilityBadge.tsx` with color + icon + text (Tulsi green for eligible `✓ पात्र`, Kesar amber for needs confirmation `? पुष्टि करें`).
  - Implemented `components/results/SchemeIcon.tsx` rendering category pictograms (`🪙` pension, `✚` health, `🌾` food, `🔥` energy, `🏠` housing).
  - Implemented `components/results/SchemeCard.tsx` (Devanagari typography, 24px rounded card, 2px border, detail link, and individual read-aloud button).
  - Implemented `app/results/page.tsx` with max 3 cards displayed by default, "और योजनाएँ" toggle for remaining matches, sequential read-aloud with Stop button, refresh redirect to `/` when session is empty, and permanent department disclaimer.
  - All 41 tests passed; production build succeeded.
- **Assumed:**
  - Refreshing on `/results` without in-memory state redirects to `/` per README Section 12.
- **To Check:**
  - Verify that sequential read-aloud correctly announces top 3 schemes and can be interrupted anytime with the Stop button.

---

## Step 9: Scheme Detail Screen & Documents Checklist
- **Status:** COMPLETED
- **What was done:**
  - Implemented `components/results/DocumentChecklist.tsx`: tickable document list (pure local component state), where-to-get guidance, and individual / batch TTS read-aloud buttons.
  - Implemented `components/results/CenterCard.tsx`: displays CSC / Block Office information, district, and distinct badge for `(नमूना)` sample centers.
  - Implemented `app/scheme/[id]/page.tsx`: dynamic route displaying scheme category icon, benefit overview, full document checklist, nearby service centers (filtered by profile district), and direct official portal link with `rel="noopener noreferrer"`.
  - All 41 tests passed; production build succeeded.
- **Assumed:**
  - Center list defaults to Gaya or all centers when user district is not specified.
- **To Check:**
  - Verify that checkboxes toggle smoothly and do not reload or clear prematurely during the session.

---

## Step 10: Polish, Visual Verification & Acceptance Test
- **Status:** COMPLETED
- **What was done:**
  - Verified accessibility requirements:
    - Visible 3px Neel focus rings (`outline: 3px solid #1B2A6B; outline-offset: 2px`).
    - Respects `prefers-reduced-motion` in CSS and animations.
    - Zero horizontal overflow at 360px mobile viewport (constrained to max 480px centered column).
    - Status badges combine colors, icons, and text (Tulsi `✓ पात्र`, Kesar `? पुष्टि करें`).
    - Minimum 56px touch target height across all buttons and interactive elements.
  - Production server walkthrough using Chrome DevTools MCP at 360px width:
    1. **Home Screen (`/`)**: Loaded Baloo 2 + Noto Sans Devanagari fonts, 160px MicButton, LanguagePicker, DemoButton, and design token test card.
    2. **Listen Screen (`/listen?demo=1`)**: Triggered Savitri's demo sentence. With real Gemini API key unconfigured, automatically fell back to Guided Mode, presented follow-up question ("क्या आपके पास BPL / गरीबी रेखा का कार्ड है?"), and pre-filled transcript box.
    3. **Results Screen (`/results`)**: Evaluated demo profile; ranked top 3 matches (`widow_pension`, `pmjay`, `nfsa_ration`), with sequential read-aloud option and "और योजनाएँ" toggle.
    4. **Scheme Detail (`/scheme/widow_pension`)**: Rendered benefit summary, 5-item interactive document checklist with where-to-get guidance, sample Gaya service centers tagged `(नमूना)`, and official portal apply link (`https://nsap.nic.in`).
  - All 41 Vitest tests passing. Production build succeeding.

---

## Run and Test Instructions

### 1. Prerequisites
- Node.js (v18+ or v20+)
- npm

### 2. How to Run Locally
```bash
# Install dependencies (already completed)
npm install

# Start development server
npm run dev
# App will run at http://localhost:3000

# Or build and run production server
npm run build
npm run start
```

### 3. How to Run Unit Tests
```bash
npm test
# Runs Vitest covering 41 unit & integration tests across i18n, seed data, pure rules engine, API routes, understand handler, and conversation reducer.
```

### 4. Setting up GEMINI_API_KEY for Live Speech Understanding
Create or edit `.env.local` in the project root:
```env
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```
*(Note: Never commit `.env.local` to git. It is protected by `.gitignore`.)*

### 5. Testing `/api/understand` with curl
Once `.env.local` is configured with your real Gemini API key and `npm run dev` is running:
```bash
curl -X POST http://localhost:3000/api/understand \
  -H "Content-Type: application/json" \
  -d '{
    "language": "hi",
    "transcript": "Mera pati nahi rahe, do bachche hain, zameen nahi hai. Meri umar 58 saal hai."
  }'
```
Or run the provided test script:
```bash
npx tsx scripts/try-understand.ts
```

---

## Assumptions Made
1. **Fallback Guided Mode**: If `GEMINI_API_KEY` is missing or invalid, `/api/understand` returns HTTP 502 `LLM_FAILED`, and the frontend seamlessly switches to Guided Mode asking up to 4 core questions (`age`, `marital_status`, `income_category`, `has_land`).
2. **State Specificity**: If a scheme defines `state` (e.g. `Bihar`) and the user's profile specifies a different state, the scheme is marked `not_eligible`. If the user's profile state is null, it is marked `maybe` with `"state"` in `missing`.
3. **Draft Scheme Values**: Kept `"verified": false` on all 6 seed schemes in `data/schemes.json` per README instructions, avoiding any invented rupee amounts or arbitrary thresholds.
4. **Sample Centers**: All 11 center addresses in `data/centers.json` are marked as sample placeholders (`"(नमूना)"`, `"पता जोड़ना बाकी है"`).

---

## Out of Scope / Unfinished (Section 11)
Per project spec section 11, the following are intentionally omitted from this vertical slice prototype:
- User login / authentication accounts.
- Live Google Maps / geolocation routing.
- Database persistence (PostgreSQL / Supabase) — session state lives in React memory only.
- Application tracking / backend submission to government APIs.
- Payment gateway integrations.
- WhatsApp sharing / messaging integration.

---
