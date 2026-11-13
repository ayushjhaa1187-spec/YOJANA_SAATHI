# Yojana Saathi (योजना साथी) — Autonomous Progress & Verification Log

## Executive Summary & Final Verification (Phase F Complete)

- **Project Status**: PRODUCTION-READY VERTICAL SLICE COMPLETED
- **Autonomous Phases Completed**:
  - **Phase 0**: Pre-run integrity check & environment audit.
  - **Phase A**: Backend robustness (in-memory rate limiting, 1000-char transcript cap, privacy audit, 12s LLM timeout).
  - **Phase B**: Extraction quality harness & test fixtures (26 realistic transcripts in Hindi, Bhojpuri, Magahi; command-line eval runner).
  - **Phase C**: Frontend quality, accessibility & voice robustness (`aria-live="polite"`, 360px/412px/1024px responsive design, heading hierarchy, sub-16px text removal, `hasHindiVoice` device notice).
  - **Phase D**: Demo readiness (`DEMO_SCRIPT.md` 90-second script & contingency playbooks, Savitri Devi demo fallback path, standardized legal disclaimer).
  - **Phase E**: Documentation & packaging (`README.md` complete rewrite, `DATA_VERIFICATION.md` official checklist, `ACTIVITY2_PROMPT.md` < 500 words, 0 leaked credentials).
  - **Phase F**: Final end-to-end verification (56/56 passing Vitest tests, production Next.js build clean, 360px DevTools live walkthrough verified).

### Automated Test Suite Metrics
- **Test Files**: 9 passed (9/9)
- **Total Tests**: 56 passed (56/56)
- **Failures / Regressions**: 0
- **Test Execution Time**: ~2.7s
- **Suites**:
  1. `tests/rules.test.ts` (11 tests) — Pure deterministic rules engine & boundary conditions.
  2. `tests/routes.test.ts` (7 tests) — Next.js App Router API route handlers.
  3. `tests/understand.test.ts` (6 tests) — Speech understanding handler & Zod validation.
  4. `tests/conversation.test.ts` (8 tests) — Ephemeral in-memory state reducer actions.
  5. `tests/robustness.test.ts` (5 tests) — Rate limiting, transcript capping, timeout mapping, console privacy.
  6. `tests/i18n_screens.test.ts` (7 tests) — Screen localization and bilingual translation parity.
  7. `tests/eval.test.ts` (3 tests) — Extraction evaluation scoring harness.
  8. `tests/data.test.ts` (6 tests) — Seed JSON schema integrity & entity relationships.
  9. `tests/i18n.test.ts` (3 tests) — Translation string helper & parameter interpolation.

### Top 10 Manual Verification Checklist for Reviewers & Demonstrators
1. **Bilingual Toggle**: Tap `[हि | EN]` on Home; verify all headlines, mic button labels, and disclaimers toggle instantaneously.
2. **Accessible Mic Button**: Big 160px Haldi mic button has 4.5:1 contrast, 3px focus ring, pulses only during listening, and respects `prefers-reduced-motion`.
3. **Savitri Devi 1-Tap Demo**: Tap **"नमूना सुनिए" (Listen to Sample)** on Home; auto-populates Savitri's spoken sentence (`"Mera pati nahi rahe..."`) and seamlessly activates Guided Mode if API key is unconfigured.
4. **Targeted Follow-up Chips**: Guided Mode prompts only ONE question at a time using large 56px touch chips (`[हाँ, BPL कार्ड है]`); answers record in a single tap without requiring keyboard.
5. **Wispr Flow & Textarea Fallback**: The editable transcript `<textarea>` allows typing or dictation through Wispr Flow without clearing or premature sending.
6. **Strict Rules Engine Eligibility**: Top 3 ranked schemes (Widow Pension, PM-JAY, NFSA Ration Card) display Tulsi green `✓ पात्र` badges and pure Hindi deterministic reasons without LLM hallucination.
7. **Read-Aloud Speech Audio**: Tap **"सभी सुनाएँ" (Read All)** or individual **🔊 (सुनाइए)** buttons; verify speech synthesis speaks clearly in Hindi and cancels properly when interrupted or navigating.
8. **Document Checklist**: Open Widow Pension detail; check off documents with interactive checkboxes; note clear guidance on "कहाँ मिलेगा" for all 5 required papers.
9. **Physical Service Centers**: View nearby CSC Centers in Gaya tagged with sample notices `(नमूना)` and tap **"सरकारी पोर्टल खोलें ↗"** to verify the official NSAP portal link.
10. **Offline Resilience**: Disconnect Wi-Fi or toggle Airplane Mode; verify non-intrusive `OfflineBanner` drops down while React session state is completely preserved.

### How to Run Locally
```bash
# 1. Install dependencies
npm install

# 2. Configure environment (optional - guided mode works out of the box with zero keys)
cp .env.example .env.local
# Set GEMINI_API_KEY=your_key in .env.local if live Gemini API is desired

# 3. Start development server
npm run dev
# Open http://localhost:3000

# 4. Or build and start production server
npm run build
npm run start
```

### How to Deploy
1. Push repository to GitHub.
2. Import project into Vercel.
3. Configure `LLM_PROVIDER=gemini`, `GEMINI_API_KEY`, `GEMINI_MODEL=gemini-2.5-flash` in Vercel project environment variables.
4. Automatic deployment triggers on git push to `main`.

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

## Phase A: Backend Robustness
- **Status:** COMPLETED
- **What was done:**
  - Implemented `lib/rateLimit.ts`: in-memory per-IP rate limiter (default: 30 requests per 10-minute window for `/api/understand`), returning 429 `RATE_LIMITED` with `Retry-After` header. Configurable via constants.
  - Implemented request size constraints in `lib/understand.ts`: `transcript` strictly capped at 1000 characters (returns 400 `INVALID_INPUT` on exceed). Sanitizes `currentProfile` to strip any unknown/injected fields.
  - Privacy audit & cleanup: Replaced all raw error object logging with request ID and error codes only (`[req_id] ErrorCode: ...`). Zero user transcripts, profiles, or API keys are logged anywhere on the server.
  - Added 12-second timeout around LLM calls in `lib/llm.ts` via `LLMTimeoutError`, safely mapped to HTTP 502 `LLM_FAILED`.
  - Implemented 5 tests in `tests/robustness.test.ts` verifying rate limiting, transcript length validation, timeout mapping, console privacy (spying on `console.log` and `console.error`), and unknown profile property stripping.
  - All 46 tests passed; production build succeeded.
- **Assumed:**
  - In-memory rate limiting is ephemeral and resets on serverless cold starts; it serves as a baseline protection layer without requiring an external Redis store.
- **To Check:**
  - Test rapid repeated calls to `/api/understand` to confirm HTTP 429 `RATE_LIMITED` response after 30 hits.

---

## Phase B: Extraction Quality Harness & Fixtures
- **Status:** COMPLETED
- **What was done:**
  - Created `tests/fixtures/transcripts.json`: 26 comprehensive realistic spoken utterances in Hindi, Bhojpuri, Magahi, and English. Covers edge cases: Hindi word-numbers ("पचपन", "साठ"), self-corrections ("नहीं नहीं, 62 नहीं 60..."), dialects ("नाही बा", "पति ना रहथिन"), and conversational filler with zero profile fields.
  - Enhanced system prompt in `lib/prompts.ts`: added explicit instructions for Hindi word-numbers, self-corrections (always prioritizing the latest corrected value), and dialect forms without ever hallucinating or inferring eligibility.
  - Implemented `scripts/eval-extraction.ts`: command-line evaluation harness comparing LLM extraction against ground-truth profiles across field-level precision and recall. Gracefully skips without error if `GEMINI_API_KEY` is not present.
  - Implemented `tests/eval.test.ts`: 3 unit tests verifying evaluation logic, perfect scoring on matching fixtures, and accurate mismatch reporting.
  - Verified with `npm test` (49 tests passing) and `npm run build` (success).
- **Assumed:**
  - Evaluation harness runs in mock/unit test mode during CI/local test suite and only hits live Gemini API when explicitly invoked via `npx tsx scripts/eval-extraction.ts` with `GEMINI_API_KEY`.
- **To Check:**
  - Run `npx tsx scripts/eval-extraction.ts` with valid `GEMINI_API_KEY` to benchmark live extraction accuracy against the 26 fixtures.

---

## Phase C: Frontend Quality, Accessibility & Voice Robustness
- **Status:** COMPLETED
- **What was done:**
  - **Accessibility Audit & Fixes**:
    - Confirmed `aria-label` across all interactive buttons (MicButton, QuestionCard TTS, SchemeCard TTS, LanguagePicker, Header back link, SpeakAll).
    - Added `aria-live="polite"` dynamic live announcer regions in `app/listen/page.tsx` and `app/results/page.tsx` for spoken/processing status changes.
    - Verified strict heading hierarchy (`h1` -> `h2` -> `h3` / `h4`) across all 4 screens (`/`, `/listen`, `/results`, `/scheme/[id]`).
    - Standardized typography to ensure zero text below 16px (`text-small` is 16px, replaced `text-xs` badge in `CenterCard.tsx` with `text-small`).
    - Maintained 56px minimum touch target height (`min-h-touch`) across buttons and cards.
  - **Edge-Case Copy**:
    - Added missing edge-case keys in `lib/i18n.ts`: `no_hindi_tts_notice` and `unsupported_lang_notice` for both `hi` and `en`.
  - **Voice Robustness**:
    - Checked `hasHindiVoice` in `hooks/useSpeak.ts`; added device notice when device lacks local Hindi speech synthesis voice.
    - Kept transcript preserved in textarea if speech recognition disconnects or finishes.
  - **Automated Language-Switch Testing**:
    - Created `tests/i18n_screens.test.ts` (7 unit tests) verifying dynamic switching and dictionary parity between Hindi and English across all screens.
  - **DevTools Multi-Screen Walkthrough & Responsive Verification**:
    - Ran production server on port 3000 and used `chrome-devtools-mcp` to walk the 360px mobile viewport: Home -> Demo -> Listen (Guided questions) -> Results (Ranked schemes) -> Scheme detail (Checklist & CSCs).
    - Verified viewport layout across 360px, 412px, and 1024px: confirmed `hasHorizontalScroll: false` and strict max 480px centered column.
    - Terminated background production server following verification.
  - All 56 Vitest tests passing; Next.js production build succeeded.
- **Assumed:**
  - When speech recognition or TTS voice is unavailable (e.g. headless browser or unsupported device), the interface displays a clear visual fallback notice while remaining fully functional via typed input and quick chips.
- **To Check:**
  - Check screen reader accessibility announcement of dynamic question transitions using VoiceOver or NVDA.

---

## Phase D: Demo Readiness, Demo Script & Legal Disclaimers
- **Status:** COMPLETED
- **What was done:**
  - Implemented Savitri Devi demo mode path in `app/listen/page.tsx` (`SAVITRI_DEMO_TEXT = "Mera pati nahi rahe, do bachche hain, zameen nahi hai. Meri umar 58 saal hai."`).
  - Added robust fallback: if LLM fails or API key is unconfigured, automatically initializes profile with `{ age: 58, gender: "female", marital_status: "widowed", has_land: false, dependents: 2, income_category: null }` and immediately surfaces the BPL question ("क्या आपके पास BPL / गरीबी रेखा का कार्ड है?") via quick chips.
  - Authored `DEMO_SCRIPT.md`: comprehensive 90-second timeline with exact spoken lines in natural Hindi, step-by-step click actions, pre-demo hardware checklist (audio volume, TTS voice pack, permissions, airplane mode), and 4 contingency failure playbooks (mic noise, LLM 502, Wi-Fi drop, missing Hindi voice).
  - Standardized legal disclaimer across all screen footers in `lib/i18n.ts`: explicit notice that results are indicative, data is sample, and the final decision rests solely with the government department.
  - All 56 Vitest tests passing; Next.js production build succeeded.
- **Assumed:**
  - Live demo presenters will follow the 90-second timeline in `DEMO_SCRIPT.md` with either natural microphone speech or the 1-tap "नमूना सुनिए" button as backup.
- **To Check:**
  - Rehearse the 90-second demo using `DEMO_SCRIPT.md` on a mobile device.

---

## Phase E: Documentation, Packaging & Data Verification Checklist
- **Status:** COMPLETED
- **What was done:**
  - **Updated `README.md`**:
    - Reflected exact, complete project directory tree including all newly created modules (`lib/rateLimit.ts`, `lib/understand.ts`, `tests/fixtures/transcripts.json`, `scripts/eval-extraction.ts`, etc.).
    - Documented system architecture, environment variables, secret hygiene, and step-by-step local run and test guides.
    - Added Section 20 "Known Limitations & Security Architecture" outlining draft scheme conditions, sample CSC directories, in-memory rate limiting, and zero-PII data retention.
  - **Credential & Secret Protection**:
    - Checked `.gitignore` to ensure `.env*.local` and `.env` are strictly excluded from git.
    - Scanned entire repository and commit history (`git grep -i "AIza"` and `git log -S "AIza"`); confirmed 0 leaked keys or credentials.
  - **Authored `DATA_VERIFICATION.md`**:
    - Created formal verification tracking matrix covering all 6 seed schemes, 9 documents, and 11 sample service centers.
    - Linked direct government portals (`nsap.nic.in`, `pmjay.gov.in`, `myscheme.gov.in`, `pmayg.nic.in`) and established procedure for promoting draft values to verified status.
  - **Authored `ACTIVITY2_PROMPT.md`**:
    - Created concise, self-contained re-creation prompt (< 500 words, exactly 385 words) specifying the Savitri Devi anchor persona, voice-first mobile-first experience, pure deterministic rules engine vs. LLM extraction split, design tokens, and zero-secrets architecture.
  - All 56 Vitest tests passing; Next.js production build succeeded.
- **Assumed:**
  - Field workers and civic volunteers will consult `DATA_VERIFICATION.md` before adapting scheme thresholds for regional state variations.
- **To Check:**
  - Confirm that `ACTIVITY2_PROMPT.md` is self-contained and functions as a standalone prompt for AI code generators.

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
