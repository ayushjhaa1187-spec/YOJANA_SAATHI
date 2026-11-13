# Yojana Saathi (योजना साथी)

> A voice-first assistant that tells people which government schemes they qualify for, what documents to carry, and where to go. Speak your situation in Hindi or Hinglish; get answers by voice.

**Hackathon:** Scaler x Wispr Flow, "Build for Bharat" · **Theme:** Civic services
**Anchor user:** Savitri Devi, 58, a widow near Gaya, Bihar. She cannot read forms but can talk.
**Demo sentence:** "Mera pati nahi rahe, do bachche hain, zameen nahi hai. Meri umar 58 saal hai."

This README is the single source of truth for humans and AI coding agents. Read it fully before writing code.

---

## Table of contents
1. [Golden rules](#1-golden-rules)
2. [System architecture](#2-system-architecture)
3. [Tech stack](#3-tech-stack)
4. [Project structure](#4-project-structure)
5. [Environment and setup](#5-environment-and-setup)
6. [Data and "database" logic](#6-data-and-database-logic)
7. [Backend logic](#7-backend-logic)
8. [API routes and contracts](#8-api-routes-and-contracts)
9. [Frontend logic](#9-frontend-logic)
10. [User workflow](#10-user-workflow)
11. [Business rules](#11-business-rules)
12. [Edge cases and error states](#12-edge-cases-and-error-states)
13. [Design system](#13-design-system)
14. [Testing](#14-testing)
15. [Build order (vertical slice first)](#15-build-order-vertical-slice-first)
16. [Deployment](#16-deployment)
17. [Demo script and fallbacks](#17-demo-script-and-fallbacks)
18. [Instructions for AI coding agents](#18-instructions-for-ai-coding-agents)
19. [Definition of done](#19-definition-of-done)

---

## 1. Golden rules
1. **The LLM only understands speech. A deterministic rules engine decides eligibility.** An LLM must never decide whether someone qualifies.
2. **Prototype scope:** one Next.js app, one vertical slice, no login, no maps, no microservices, no real database.
3. **Voice is primary, but every voice step has a text/button fallback** so the demo never dies.
4. **Privacy:** never store audio, Aadhaar, phone number or exact address. Profile data lives in memory only and is cleared on refresh.
5. **Honesty:** every result screen shows "Final eligibility is decided by the department." Never claim certainty.
6. **Scheme data is draft until verified.** Any threshold not checked on an official source carries `"verified": false`.
7. **Hindi is the default language.** All user-facing strings go through `lib/i18n.ts`.

---

## 2. System architecture

A serverless monolith: one repo, one deployment.

```
┌───────────────────────── Browser (mobile web) ─────────────────────────┐
│  Screens: Home → Listen → Results → Scheme detail                      │
│  Voice in : Wispr Flow dictation into <textarea>  +  Web Speech API    │
│  Voice out: speechSynthesis (hi-IN)                                    │
│  State    : React useReducer (in memory)                               │
└──────────────┬─────────────────────────────────────────────────────────┘
               │ fetch (JSON)
┌──────────────▼─────────────── Next.js API routes (Vercel) ─────────────┐
│ POST /api/understand ──► lib/llm.ts ──► Gemini API   (text → Profile)  │
│ POST /api/match      ──► lib/rules.ts (pure TypeScript, no LLM)        │
│ GET  /api/schemes/:id/documents ──► data/*.json                        │
│ GET  /api/centers    ──► data/centers.json                             │
└────────────────────────────────────────────────────────────────────────┘
```

**Data flow (one turn):**
`speech/text` → `POST /api/understand` (LLM extracts facts, merged into profile) → `POST /api/match` (rules engine) → if some matches are `maybe` and follow-ups < 3, ask the next question by voice and repeat → else show Results.

**Why this split:** the LLM handles messy Hindi/Hinglish; plain code handles the decision, so results are repeatable, testable and explainable.

---

## 3. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | UI and API in one codebase |
| Styling | Tailwind CSS | Tokens in `tailwind.config.ts` |
| Validation | zod | Validates LLM output and API inputs |
| Data | Static JSON in `/data` | No DB needed for 6 schemes; Supabase optional later |
| Voice in | `<textarea>` (Wispr Flow dictates into any text field) + Web Speech API (`hi-IN`) | Web Speech works in Chrome-based browsers only |
| Voice out | Browser `speechSynthesis` | Free; depends on the phone having a Hindi voice |
| LLM | Provider-agnostic wrapper, default Gemini API | Set via `LLM_PROVIDER`; must return JSON only |
| Tests | Vitest | Rules engine is the priority |
| Hosting | Vercel | Deploy on git push |

Check current pricing, rate limits and model names in each provider's docs before the demo.

---

## 4. Project structure

```
/app
  layout.tsx                 fonts, ConversationProvider, OfflineBanner
  page.tsx                   Home
  listen/page.tsx            Listen
  results/page.tsx           Results
  scheme/[id]/page.tsx       Scheme detail
  api/
    understand/route.ts
    match/route.ts
    schemes/[id]/documents/route.ts
    centers/route.ts
/components
  layout/    Header, LanguagePicker, BackButton, StepDots
  voice/     MicButton, TranscriptBox, SpeakButton, ListeningIndicator
  convo/     QuestionCard, QuickChips, RetryPrompt
  results/   SchemeCard, EligibilityBadge, SchemeIcon, DocumentChecklist, CenterCard, Disclaimer
  feedback/  ErrorBanner, OfflineBanner, Loader
  demo/      DemoButton
/hooks
  useSpeechRecognition.ts    useSpeak.ts    useOnline.ts
/lib
  types.ts   rules.ts   llm.ts   prompts.ts   questions.ts   i18n.ts   api.ts   data.ts
/data
  schemes.json   documents.json   centers.json
/tests
  rules.test.ts
.env.example
README.md
```

---

## 5. Environment and setup

```bash
npx create-next-app@latest yojana-saathi --typescript --tailwind --app
cd yojana-saathi
npm i zod
npm i -D vitest
```

`.env.example` (commit this; never commit `.env.local`):
```
LLM_PROVIDER=gemini
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash   # verify the current model name in Google's docs
```

`package.json` scripts: `"test": "vitest run"`.

Git: `main` branch + feature branches; link the repo to Vercel for automatic deploys; add the env vars in Vercel's dashboard.

---

## 6. Data and "database" logic

No database for the prototype. Data lives in typed JSON files loaded by `lib/data.ts`. Session state is in React memory only.

### 6.1 Core entities and relationships
- **Profile**: the facts about the user (from speech). One per session, in memory.
- **Scheme**: a government scheme with its eligibility conditions.
- **Condition**: one rule on one profile field (belongs to a Scheme).
- **Document**: a paper the user must carry. Scheme ↔ Document is many-to-many via `document_ids`.
- **Center**: a CSC or office, filtered by district.
- **Match**: the result of evaluating a Profile against a Scheme (computed, never stored).

### 6.2 Types (`lib/types.ts`)
```ts
export type Profile = {
  age: number | null;
  gender: "female" | "male" | "other" | null;
  marital_status: "widowed" | "married" | "single" | null;
  has_land: boolean | null;
  income_category: "BPL" | "low" | "other" | null;
  state: string | null;
  district: string | null;
  dependents: number | null;
  has_ration_card: boolean | null;
  has_pucca_house: boolean | null;
};

export type Condition = {
  field: keyof Profile;
  op: "==" | ">=" | "<=" | "in";
  value: string | number | boolean | string[];
};

export type Scheme = {
  id: string;
  name_en: string; name_hi: string;
  category: "pension" | "health" | "food" | "energy" | "housing";
  benefit_text_en: string; benefit_text_hi: string;
  apply_url: string;
  state: string | null;            // null = national
  conditions: Condition[];
  document_ids: string[];
  benefit_rank: number;            // lower = shown first
  verified: boolean;
};

export type Document = { id: string; name_en: string; name_hi: string; where_to_get_hi: string };
export type Center = { id: string; name: string; type: "CSC" | "Block Office"; district: string; address: string };

export type MatchStatus = "eligible" | "maybe" | "not_eligible";
export type Match = {
  schemeId: string;
  status: MatchStatus;
  reason_hi: string;
  missing: (keyof Profile)[];
};
```

### 6.3 Seed schemes (`data/schemes.json`): DRAFT, VERIFY EVERY VALUE
Check ages, income conditions, amounts and state variants on myscheme.gov.in or the official portals. Keep `verified: false` until you have.

| id | Scheme | Draft conditions |
|---|---|---|
| `widow_pension` | Indira Gandhi National Widow Pension (NSAP) | marital_status == widowed; age >= 40; income_category in [BPL, low] |
| `old_age_pension` | Indira Gandhi National Old Age Pension (NSAP) | age >= 60; income_category in [BPL, low] |
| `pmjay` | Ayushman Bharat PM-JAY | income_category in [BPL, low] (also check the 70+ senior provision) |
| `nfsa_ration` | Ration card (NFSA priority household) | income_category in [BPL, low] |
| `ujjwala` | PM Ujjwala Yojana (LPG) | gender == female; age >= 18; income_category in [BPL, low] |
| `pmay_g` | PM Awas Yojana Gramin | has_pucca_house == false; income_category in [BPL, low] |

Example entry:
```json
{
  "id": "widow_pension",
  "name_en": "Widow Pension (NSAP)",
  "name_hi": "विधवा पेंशन",
  "category": "pension",
  "benefit_text_en": "Monthly pension for eligible widows",
  "benefit_text_hi": "पात्र विधवाओं को हर महीने पेंशन",
  "apply_url": "https://nsap.nic.in",
  "state": null,
  "conditions": [
    { "field": "marital_status", "op": "==", "value": "widowed" },
    { "field": "age", "op": ">=", "value": 40 },
    { "field": "income_category", "op": "in", "value": ["BPL", "low"] }
  ],
  "document_ids": ["aadhaar", "bank_passbook", "death_certificate", "income_certificate", "photo"],
  "benefit_rank": 1,
  "verified": false
}
```

**Documents to seed:** `aadhaar`, `bank_passbook`, `death_certificate`, `income_certificate`, `bpl_card`, `photo`, `age_proof`, `residence_certificate`, `house_proof`. Each needs `name_hi`, `name_en`, `where_to_get_hi`.

**Centers to seed:** about 5 for Gaya plus 1-2 each for Patna, Varanasi, Lucknow. Use sample addresses and label them "(नमूना)" in the UI unless you have real ones.

### 6.4 Storage strategy
| What | Where | Lifetime |
|---|---|---|
| Schemes, documents, centers | `/data/*.json` (bundled) | Permanent |
| Profile, transcripts, matches | React state (memory) | Cleared on refresh |
| Language preference | `localStorage` | Persistent |
| Document tick boxes | Component state | Until the page changes |
| Audio | Never stored | Transcribed in the browser and discarded |

If you later move to Supabase: tables `schemes`, `rules`, `documents`, `scheme_documents`, `service_centers` map directly from the types above.

---

## 7. Backend logic

### 7.1 Rules engine (`lib/rules.ts`), pure and fully unit-tested
```ts
import { Profile, Scheme, Condition, Match } from "./types";

type Result = "pass" | "fail" | "missing";

function checkCondition(p: Profile, c: Condition): Result {
  const v = p[c.field];
  if (v === null || v === undefined) return "missing";
  switch (c.op) {
    case "==": return v === c.value ? "pass" : "fail";
    case ">=": return typeof v === "number" && v >= (c.value as number) ? "pass" : "fail";
    case "<=": return typeof v === "number" && v <= (c.value as number) ? "pass" : "fail";
    case "in": return (c.value as unknown[]).includes(v) ? "pass" : "fail";
  }
}

export function evaluate(p: Profile, s: Scheme): Match {
  const missing: (keyof Profile)[] = [];
  let failed = false;
  for (const c of s.conditions) {
    const r = checkCondition(p, c);
    if (r === "fail") failed = true;
    if (r === "missing") missing.push(c.field);
  }
  const status = failed ? "not_eligible" : missing.length ? "maybe" : "eligible";
  return { schemeId: s.id, status, reason_hi: buildReasonHi(p, s, status), missing };
}

export function matchAll(p: Profile, schemes: Scheme[]): Match[] {
  const rank = (id: string) => schemes.find(s => s.id === id)!.benefit_rank;
  const order = { eligible: 0, maybe: 1, not_eligible: 2 };
  return schemes
    .map(s => evaluate(p, s))
    .filter(m => m.status !== "not_eligible")
    .sort((a, b) => order[a.status] - order[b.status] || rank(a.schemeId) - rank(b.schemeId));
}

// Field that is missing in the most "maybe" matches → ask about it next.
export function nextQuestionField(matches: Match[]): keyof Profile | null {
  const counts = new Map<keyof Profile, number>();
  matches.filter(m => m.status === "maybe")
         .forEach(m => m.missing.forEach(f => counts.set(f, (counts.get(f) ?? 0) + 1)));
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}
```
`buildReasonHi` uses **template strings per condition**, not the LLM. Examples: `marital_status == widowed` → "आप विधवा हैं"; `age >= 40` → "आपकी उम्र 40 से ज़्यादा है"; `income_category in [BPL, low]` → "आपकी आय कम है".

### 7.2 LLM wrapper (`lib/llm.ts`)
```ts
export async function extractJson(system: string, user: string): Promise<unknown> {
  if (process.env.LLM_PROVIDER === "gemini") {
    const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY! },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: user }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0 },
        }),
      }
    );
    if (!res.ok) throw new Error(`LLM_HTTP_${res.status}`);
    const data = await res.json();
    return JSON.parse(data.candidates[0].content.parts[0].text);
  }
  throw new Error("UNSUPPORTED_PROVIDER");
}
```
Check the request format against Google's current docs; keep this function the only place that knows about the provider so it can be swapped.

### 7.3 Extraction prompt (`lib/prompts.ts`)
```
You extract facts from a user's spoken sentence (Hindi, Hinglish, or dialects such as Bhojpuri/Magahi).
Return ONLY a JSON object with these keys (use null if not stated):
age (number), gender ("female"|"male"|"other"), marital_status ("widowed"|"married"|"single"),
has_land (boolean), income_category ("BPL"|"low"|"other"), state, district, dependents (number),
has_ration_card (boolean), has_pucca_house (boolean).
Rules:
- Only record facts the user actually stated. Never guess or infer eligibility.
- You are given the current profile; keep its non-null values unless the user clearly corrects them.
- "pati nahi rahe", "pati guzar gaye", "vidhwa" mean marital_status = "widowed" and gender = "female".
- "zameen nahi hai" means has_land = false.
- Do not include any text outside the JSON.
```

### 7.4 `/api/understand` algorithm
1. Validate body with zod (`transcript` non-empty string, `language` in `hi|en`).
2. Call `extractJson(system, userMessage)` where `userMessage` contains the transcript and `currentProfile`.
3. Validate the result with a zod `ProfileSchema` (all fields nullable). Invalid → retry once → still invalid → respond `LLM_FAILED` (HTTP 502).
4. **Merge:** new non-null values overwrite old ones; nulls never erase known values.
5. Run `matchAll(profile, schemes)` and `nextQuestionField`.
6. If a field is needed, look up the question text in `lib/questions.ts` (a static bank). The LLM never writes the questions.
7. Return `{ profile, missingFields, nextQuestion }`.

### 7.5 Question bank (`lib/questions.ts`)
| field | text_hi | quick chips |
|---|---|---|
| `age` | आपकी उम्र कितनी है? | 18-39 · 40-59 · 60+ (maps to a representative age, or let the user speak the exact age) |
| `income_category` | क्या आपके पास BPL / गरीबी रेखा का कार्ड है? | हाँ → BPL · नहीं → other · पता नहीं → null |
| `marital_status` | आप विवाहित हैं, विधवा हैं, या अविवाहित? | विवाहित · विधवा · अविवाहित |
| `has_land` | क्या आपके पास ज़मीन है? | हाँ · नहीं |
| `has_pucca_house` | क्या आपका घर पक्का है? | हाँ · नहीं |
| `gender` | आप महिला हैं या पुरुष? | महिला · पुरुष |

Age chips are approximate: prefer asking the user to say their exact age, and use chips only as a fallback.

### 7.6 Error format (all routes)
```json
{ "error": { "code": "INVALID_INPUT", "message": "transcript is required" } }
```
Codes: `INVALID_INPUT` (400), `NOT_FOUND` (404), `LLM_FAILED` (502), `INTERNAL` (500). Log details server-side; never leak API keys or stack traces.

---

## 8. API routes and contracts

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/understand` | Transcript → updated profile + next question |
| POST | `/api/match` | Profile → ranked matches |
| GET | `/api/schemes/:id/documents` | Document checklist for a scheme |
| GET | `/api/centers?district=Gaya` | Nearby centers (falls back to all if the district is unknown) |

### POST /api/understand
```json
// Request
{ "language": "hi",
  "transcript": "mera pati nahi rahe, do bachche hain, zameen nahi hai",
  "currentProfile": { "age": null, "gender": null, "marital_status": null, "has_land": null,
                      "income_category": null, "state": null, "district": null,
                      "dependents": null, "has_ration_card": null, "has_pucca_house": null } }

// Response 200
{ "profile": { "marital_status": "widowed", "gender": "female", "dependents": 2, "has_land": false, "age": null },
  "missingFields": ["age", "income_category"],
  "nextQuestion": { "field": "age", "text_hi": "आपकी उम्र कितनी है?" } }
```
`nextQuestion` is `null` when nothing more is needed or when 3 follow-ups are used up (the frontend tracks `followUpCount`).

### POST /api/match
```json
// Request
{ "profile": { "age": 58, "marital_status": "widowed", "gender": "female", "income_category": "BPL" } }

// Response 200
{ "matches": [
  { "schemeId": "widow_pension", "name_hi": "विधवा पेंशन", "name_en": "Widow Pension (NSAP)",
    "category": "pension", "status": "eligible",
    "benefit_text_hi": "पात्र विधवाओं को हर महीने पेंशन",
    "reason_hi": "आप विधवा हैं, आपकी उम्र 40 से ज़्यादा है, आपकी आय कम है" } ] }
```

### GET /api/schemes/:id/documents
```json
{ "scheme": { "id": "widow_pension", "name_hi": "विधवा पेंशन", "apply_url": "https://nsap.nic.in" },
  "documents": [ { "id": "aadhaar", "name_hi": "आधार कार्ड", "name_en": "Aadhaar card",
                   "where_to_get_hi": "नज़दीकी आधार केंद्र" } ] }
```

### GET /api/centers?district=Gaya
```json
{ "centers": [ { "id": "csc_gaya_1", "name": "CSC गया (नमूना)", "type": "CSC",
                 "district": "Gaya", "address": "..." } ] }
```

### Frontend API client (`lib/api.ts`)
Typed wrappers with a 10-second timeout and one automatic retry on network failure. Always return `{ ok: true, data } | { ok: false, error }` so screens never need try/catch.

---

## 9. Frontend logic

### 9.1 Screens
| Route | Screen | Job |
|---|---|---|
| `/` | Home | Pick language, tap the big mic, or play the demo |
| `/listen` | Listen | Speak/type, answer follow-up questions |
| `/results` | Results | Up to 3 matched schemes, read aloud |
| `/scheme/[id]` | Scheme detail | Document checklist, centers, apply link |

### 9.2 Wireframes (mobile, 360px)
```
HOME                         LISTEN                       RESULTS                      DETAIL
┌─────────────────────┐      ┌─────────────────────┐      ┌─────────────────────┐      ┌─────────────────────┐
│ Yojana Saathi [हि|EN]│      │ ←                🔊 │      │ ← आप इनके पात्र हैं   │      │ ← विधवा पेंशन        │
│ आपके लिए कौन सी      │      │ ┌─────────────────┐ │      │ ┌─────────────────┐ │      │ फ़ायदा: हर महीने पेंशन │
│ योजना है?            │      │ │ आपकी उम्र कितनी  │ │      │ │🪙 विधवा पेंशन ✔ │ │      │ ── कागज़ ले जाइए ──   │
│      ( ◉ MIC )      │      │ │ है?             │ │      │ │ कारण... [आगे][🔊]│ │      │ ☐ आधार कार्ड   [🔊]  │
│ [ नमूना सुनिए ]       │      │ └─────────────────┘ │      │ └─────────────────┘ │      │ ☐ बैंक पासबुक        │
└─────────────────────┘      │ [40-59][60+]        │      │ │✚ आयुष्मान   ✔    │ │      │ ── यहाँ जाइए ──      │
                             │     ( ◉ MIC )       │      │ │🌾 राशन ? पुष्टि  │ │      │ CSC गया (नमूना)      │
                             │ [ आपने कहा: ...  ]   │      │ अंतिम फ़ैसला विभाग   │      │ [ लिंक खोलें ]        │
                             │ [ भेजें ]            │      └─────────────────────┘      └─────────────────────┘
                             └─────────────────────┘
```

### 9.3 State (`ConversationProvider`, `useReducer`, no library)
```ts
type State = {
  language: "hi" | "en";
  transcripts: string[];
  profile: Profile;
  nextQuestion: { field: keyof Profile; text_hi: string } | null;
  followUpCount: number;            // max 3
  matches: Match[];
  selectedSchemeId: string | null;
  status: "idle" | "listening" | "thinking" | "asking" | "done" | "error";
  error: { code: string; message_hi: string } | null;
};

type Action =
  | { type: "SET_LANGUAGE"; language: "hi" | "en" }
  | { type: "ADD_TRANSCRIPT"; text: string }
  | { type: "PROFILE_UPDATED"; profile: Profile; nextQuestion: State["nextQuestion"] }
  | { type: "MATCHES_READY"; matches: Match[] }
  | { type: "SELECT_SCHEME"; id: string }
  | { type: "ERROR"; error: State["error"] }
  | { type: "RESET" };
```
Persist only `language`. Everything else is in memory so refresh wipes personal data.

### 9.4 Conversation controller (core loop)
```
onSend(text):
  dispatch ADD_TRANSCRIPT
  r = await api.understand({ transcript: text, currentProfile, language })
  if (!r.ok) → if code == LLM_FAILED → switch to guided mode (ask fields in fixed order) else show ErrorBanner
  dispatch PROFILE_UPDATED
  m = await api.match({ profile: r.data.profile })
  dispatch MATCHES_READY
  if (r.data.nextQuestion && followUpCount < 3) → followUpCount++, speak question, wait for next input
  else → router.push("/results")
```
**Guided mode** (LLM fallback): ask `age`, `marital_status`, `income_category`, `has_land` in order using chips and typed numbers; no LLM call needed.

### 9.5 Hooks
| Hook | Behaviour |
|---|---|
| `useSpeechRecognition(lang)` | Wraps `webkitSpeechRecognition`. Returns `{ supported, listening, transcript, start, stop, error }`. `lang` = `hi-IN` or `en-IN`. Auto-stops after ~2s of silence. Does not auto-send: puts text in the textarea for confirmation. |
| `useSpeak()` | Wraps `speechSynthesis`. Queue of utterances, `speak(text, lang)`, `cancel()`. New utterance cancels the previous one; navigating away cancels speech. Reports whether a Hindi voice exists. |
| `useOnline()` | Tracks `navigator.onLine` with `online`/`offline` listeners. |

Mobile browsers block speech until a user gesture. The first mic tap on Home is that gesture.

### 9.6 Component contracts
```ts
<MicButton status="idle|listening|processing|error" onStart onStop />
<TranscriptBox value onChange onSubmit disabled />     // plain <textarea>: Wispr Flow dictates into it
<QuestionCard text_hi text_en autoSpeak />
<QuickChips options={[{ label_hi, label_en, value }]} onPick />
<SchemeCard match onOpen onSpeak />
<EligibilityBadge status="eligible|maybe" />           // icon + word + colour, never colour alone
<DocumentChecklist documents onSpeakAll />
<SpeakButton text lang />
<DemoButton />                                         // feeds the demo sentence into onSend
```

### 9.7 i18n
`lib/i18n.ts` exports `t(key, lang)` backed by a `{ key: { hi, en } }` table. No hard-coded user-facing strings in components. Hindi is written first; get a native speaker to review it.

---

## 10. User workflow

```
[Open app]
   ↓
[Pick language (Hindi default)]
   ↓
[Tap big mic and speak: "Mera pati nahi rahe, do bachche hain, zameen nahi hai"]
   ↓
[Speech → text in textarea]  (Wispr Flow / Web Speech API / typing)
   ↓
[POST /api/understand → profile]
   ↓
<Any "maybe" match with missing fields AND followUpCount < 3?>
   ├─ yes → [Speak ONE follow-up question] → [user answers] ─┐
   │                                                         │
   └─ no ──────────────────────────┐   ←─────────────────────┘
                                   ↓
          [Results: top 3 schemes shown and read aloud]
                                   ↓
          [Tap a scheme → documents checklist + center]
                                   ↓
                                [Done]
```

---

## 11. Business rules

- **Status:** all conditions pass and none missing → `eligible`. Any condition fails → `not_eligible`. None failed but a field is missing → `maybe`.
- **Ranking:** `eligible` first, then `maybe`; within a group, by `benefit_rank` ascending.
- **Display cap:** 3 results on the main screen; a "more" link shows the rest.
- **Follow-ups:** maximum 3 per session; ask first for the field missing in the most `maybe` matches.
- **After 3 follow-ups:** show remaining `maybe` matches labelled "needs confirmation" (पुष्टि करें).
- **Merge rule:** a new non-null value overwrites; null never erases known data.
- **Privacy:** no Aadhaar, phone number, exact address or audio is collected or stored.
- **Disclaimer:** shown on Results and Scheme detail.
- **State-specific schemes:** if `scheme.state` is set, include it only when `profile.state` matches or is unknown (then mark `maybe`).

---

## 12. Edge cases and error states

| Situation | Behaviour (UI copy in Hindi first) |
|---|---|
| Mic permission denied | "माइक की अनुमति चाहिए।" + [अनुमति दें] + text box |
| Web Speech unsupported | Hide mic, show text box: "Wispr Flow या कीबोर्ड से बोलकर लिखें" |
| Silence / nothing heard | "आवाज़ सुनाई नहीं दी। फिर से बोलिए।" + retry |
| Transcript has no useful facts | Ask the first question directly (age) |
| Contradictory info | Ask one clarifying question before matching |
| LLM returns invalid JSON | Retry once, then switch to guided mode |
| Network drops | OfflineBanner: "इंटरनेट नहीं है। जुड़ते ही फिर कोशिश होगी।" Keep state, auto-retry |
| No scheme matches | "अभी कोई योजना नहीं मिली। CSC सेंटर पर पूछिए।" + nearest center |
| Wrong tap / back | Back returns to the previous screen; the profile is never lost |
| Unsupported language | Fall back to Hindi with a notice |
| No Hindi TTS voice on the device | Show text only plus a small note |
| User refreshes on `/results` | Redirect to Home (profile is in memory only) |

Errors never apologise and never show raw codes to the user. Codes go to `console.error`.

---

## 13. Design system

Design goal: Savitri finishes the flow by looking at one big button and listening. Reading is optional.

**Principles:** one screen, one job, one big action · listen first, read second · icons plus words · no dead ends · the mic is the one memorable element; everything else stays quiet.

### Colour tokens
| Name | Hex | Role |
|---|---|---|
| Neel | `#1B2A6B` | Text, headers |
| Haldi | `#F5B700` | Mic and primary action (text on it is Neel) |
| Dhuli | `#F1F4FA` | Page background |
| Tulsi | `#1E7B4F` | Eligible |
| Kesar | `#C2600A` | Needs confirmation |
| Mirchi | `#C6372B` | Errors only |
| White | `#FFFFFF` | Cards |

### Type
- Headings, buttons, questions: **Baloo 2** (600/700).
- Body: **Noto Sans Devanagari** (400/500).
- Load via `next/font/google` with subsets `devanagari` and `latin`.
- Sizes (mobile): question 28px, heading 24px, body 18px, minimum 16px. Line-height 1.5. Lines under 60 characters.

### Shape, spacing, motion
- Radius: 24px for cards, 999px for the mic and chips, 12px for inputs.
- Touch targets at least 56px; the mic is 160px.
- Cards use a 2px Neel-tinted border; only the mic has a shadow.
- Motion: the mic ripples only while listening; screen changes use a 150ms fade. Respect `prefers-reduced-motion` (solid ring plus a "सुन रहे हैं" label).

### Accessibility
Visible 3px focus ring; `aria-label` on icons; contrast at least 4.5:1; status never by colour alone; works at 360px, 412px and desktop with no horizontal scroll.

---

## 14. Testing

**Required unit tests (`tests/rules.test.ts`):**
1. widowed, age 58, BPL → `widow_pension` is `eligible`
2. widowed, age 35, BPL → `widow_pension` is `not_eligible`
3. widowed, age null, BPL → `widow_pension` is `maybe`, missing `["age"]`
4. age 65, BPL → `old_age_pension` is `eligible`
5. `nextQuestionField` returns the field missing in the most `maybe` matches
6. `matchAll` sorts eligible before maybe

**Manual checks:** the vertical-slice test in section 19, on a real Android phone in Chrome; Lighthouse mobile accessibility 90 or higher; airplane-mode test for the offline banner.

---

## 15. Build order (vertical slice first)

| Step | Task | Done when |
|---|---|---|
| 1 | Scaffold, Tailwind tokens, fonts, deploy hello-world to Vercel | Live URL renders Hindi text correctly |
| 2 | `types.ts` + seed JSON | Data loads without type errors |
| 3 | `rules.ts` + the unit tests | `npm test` passes |
| 4 | `/api/match` with a hardcoded profile | curl returns widow pension as eligible |
| 5 | `lib/api.ts`, `ConversationProvider`, Home + `MicButton` (mocked) | Tapping the mic navigates to Listen |
| 6 | `/api/understand`: hardcoded transcript, then real LLM call | Demo sentence returns widowed/female/dependents 2/no land |
| 7 | Listen screen: `TranscriptBox`, `useSpeechRecognition`, `DemoButton`, follow-up loop | Demo button leads to a spoken follow-up question |
| 8 | Results screen + `useSpeak` read-aloud | 3 cards shown and spoken in Hindi |
| 9 | Scheme detail: `DocumentChecklist`, `CenterCard` | Checklist ticks work; centers show |
| 10 | Error, offline and unsupported states; guided mode; reduced motion; Lighthouse | Every row in section 12 is handled |
| 11 | Demo rehearsal on the real phone | Section 17 runs clean twice in a row |

Out of scope for now: login, maps, application tracking, WhatsApp share, payments, database, Bhojpuri/Maithili UI, dark mode, PWA install.

---

## 16. Deployment
1. Push to GitHub; import the repo in Vercel.
2. Add `LLM_PROVIDER`, `GEMINI_API_KEY`, `GEMINI_MODEL` in the Vercel environment settings.
3. Every push to `main` deploys automatically; open the preview URL on a phone.
4. API routes run as serverless functions. Keep each under a few seconds (one LLM call per turn) to stay inside free-tier timeouts.

---

## 17. Demo script and fallbacks

**Script (about 90 seconds):**
1. "Meet Savitri Devi, 58, a widow near Gaya. She can't read government forms, but she can talk."
2. Tap the mic and say: *"Mera pati nahi rahe, do bachche hain, zameen nahi hai. Meri umar 58 saal hai."*
3. The app asks one question about income; answer by voice or chip.
4. Three schemes appear and are read aloud. Open widow pension; show the document checklist and the nearest center.
5. Close: "If a person can speak, they can be served."

**Fallbacks:** the `DemoButton` feeds the sentence in if the mic fails; the textarea works with Wispr Flow or the keyboard; if the LLM or network fails, guided mode still reaches results; keep a screen recording as a last resort. Test on the exact phone and browser you will present with.

---

## 18. Instructions for AI coding agents

- Read this whole README first. If anything is unclear, ask before assuming.
- Start with a short plan and wait for approval. Then follow section 15 in order, one step at a time, running the app or tests after each step and showing what changed.
- **Never** let the LLM decide eligibility. **Never** invent scheme thresholds; use the draft values and keep `verified: false`.
- Every voice feature needs a text fallback. Every user-facing string goes through `lib/i18n.ts`.
- Use the exact design tokens in section 13; do not substitute generic palettes or fonts.
- Add no libraries beyond Next.js, React, Tailwind, zod and Vitest without asking.
- Keep API keys only in `.env.local`. Keep `.env.example` updated.
- Keep functions small and typed; no `any` except at the LLM boundary, where zod validates.
- When finished with a step, list what you assumed and anything left undone.

---

## 19. Definition of done

**Vertical-slice acceptance test:** on a 360px Android Chrome window, tapping the demo button extracts widowed/58/no land → asks one spoken follow-up about income → shows three matched schemes read aloud in Hindi → tapping widow pension shows the document checklist and a center. No horizontal scroll, no console errors, `npm test` green.

**Before submitting:**
- [ ] Scheme conditions verified on official sources, or clearly marked unverified
- [ ] Hindi copy reviewed by a native speaker
- [ ] Demo works on the real phone, with and without the mic
- [ ] No secrets committed
- [ ] README updated with the live URL
