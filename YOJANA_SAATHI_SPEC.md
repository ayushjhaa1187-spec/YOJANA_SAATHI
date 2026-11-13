# YOJANA_SAATHI

# Yojana Saathi: Project Spec (source of truth for the agent)

A voice-first assistant that helps low-literacy Indian citizens find government schemes they qualify for.
Theme: Civic services. Hackathon: Scaler x Wispr Flow, "Build for Bharat".

**Anchor user:** Savitri Devi, 58, widow near Gaya, Bihar. Cannot read forms. Speaks Hindi/Magahi.
**Demo sentence:** "Mera pati nahi rahe, do bachche hain, zameen nahi hai. Meri umar 58 saal hai."

## 0. Golden rules
1. **The LLM only understands speech. A deterministic rules engine decides eligibility.** Never let the LLM decide eligibility.
2. Prototype first: one vertical slice, no login, no maps, no microservices.
3. Voice is the main interface, but every voice step must have a text/button fallback so the demo never dies.
4. Never store audio, Aadhaar, phone number or exact address.
5. Every result screen shows: "Final eligibility is decided by the department."
6. Mobile-first, big buttons, large Hindi-friendly fonts (Noto Sans Devanagari).

## 1. Tech stack
| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Data | Static JSON files in `/data` (no database for the prototype; Supabase is optional later) |
| Voice input | A large always-visible **textarea** (Wispr Flow dictates into any text field) + a mic button using the browser Web Speech API (`hi-IN`) |
| Voice output | Browser `speechSynthesis` (`hi-IN`) |
| LLM | Provider-agnostic wrapper in `lib/llm.ts`. Default: Gemini API. Selected by `LLM_PROVIDER` env var. Must return JSON only |
| Hosting | Vercel |
| Tests | Vitest (rules engine only) |

## 2. Folder structure
```
/app
  page.tsx                 # Home (language + start)
  listen/page.tsx          # Voice/conversation screen
  results/page.tsx         # Matched schemes
  scheme/[id]/page.tsx     # Scheme detail + documents + centers
  api/understand/route.ts
  api/match/route.ts
  api/schemes/[id]/documents/route.ts
  api/centers/route.ts
/components                # see section 7
/lib
  llm.ts                   # provider wrapper
  rules.ts                 # pure rules engine
  prompts.ts               # system prompt for extraction
  types.ts
/data
  schemes.json  documents.json  centers.json
/tests
  rules.test.ts
.env.example
```

## 3. Data model (TypeScript types in `lib/types.ts`)
```ts
type Profile = {
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

type Condition = { field: keyof Profile; op: "==" | ">=" | "<=" | "in"; value: any };
type Scheme = {
  id: string; name_en: string; name_hi: string; category: string;
  benefit_text_en: string; benefit_text_hi: string;
  apply_url: string; state: string | null;   // null = national
  conditions: Condition[]; document_ids: string[];
  benefit_rank: number;                      // for sorting
};
type Document = { id: string; name_en: string; name_hi: string; where_to_get_hi: string };
type Center = { id: string; name: string; type: "CSC" | "Block Office"; district: string; address: string };
type Match = { schemeId: string; status: "eligible" | "maybe" | "not_eligible"; reason_hi: string; missing: (keyof Profile)[] };
```
Relationships: Scheme many-to-many Document (via `document_ids`); Center filtered by district.
Session state lives in React state only (nothing persisted).

## 4. Seed data (6 schemes). THE THRESHOLDS BELOW MUST BE VERIFIED
Verify every age limit, amount and state variant on myscheme.gov.in or the official portal before the demo. Mark unverified fields `"verified": false`.

| id | Scheme | Conditions (draft) |
|---|---|---|
| `widow_pension` | Indira Gandhi National Widow Pension (NSAP) | marital_status == widowed; age >= 40; income_category in [BPL, low] |
| `old_age_pension` | Indira Gandhi National Old Age Pension (NSAP) | age >= 60; income_category in [BPL, low] |
| `pmjay` | Ayushman Bharat PM-JAY | income_category in [BPL, low] (note: also check the 70+ senior citizen provision) |
| `nfsa_ration` | Ration card (NFSA priority household) | income_category in [BPL, low] |
| `ujjwala` | PM Ujjwala Yojana (LPG) | gender == female; age >= 18; income_category in [BPL, low] |
| `pmay_g` | PM Awas Yojana Gramin | has_pucca_house == false; income_category in [BPL, low] |

Also add a Bihar state pension variant if verified. Documents to seed: Aadhaar, bank passbook, husband's death certificate, income certificate, BPL/ration card, passport photo, age proof, residence certificate, land/house proof. Seed ~5 centers for Gaya, Patna, Varanasi, Lucknow (placeholder addresses are fine for demo, label them "sample").

## 5. Rules engine (`lib/rules.ts`), pure function
```ts
evaluate(profile: Profile, scheme: Scheme): Match
```
- For each condition: if profile field is null, add field to `missing`. Else compare.
- Any condition fails -> `not_eligible`.
- All pass and none missing -> `eligible`.
- None failed but some missing -> `maybe`.
- `reason_hi`: a short Hindi sentence generated from the passed conditions (template strings, not LLM).
- `matchAll(profile, schemes)` returns matches sorted: eligible first, then maybe, by `benefit_rank`. `not_eligible` are omitted.
- `nextQuestionField(matches)`: the field that appears in `missing` for the most `maybe` matches.
- Cap: max 3 follow-up questions per session, max 3 results on the main screen (show "more" link for the rest).
- After 3 follow-ups with fields still missing: show `maybe` matches labelled "needs confirmation".

**Unit tests (Vitest), required:**
1. widowed, 58, BPL -> `widow_pension` eligible
2. widowed, 35, BPL -> `widow_pension` not_eligible
3. widowed, age null -> `widow_pension` maybe, missing ["age"]
4. age 65, BPL -> `old_age_pension` eligible
5. nextQuestionField picks the most common missing field

## 6. API contracts
All errors: `{ "error": { "code": "INVALID_INPUT" | "LLM_FAILED" | "NOT_FOUND", "message": "..." } }` with proper HTTP status.

**POST /api/understand**
```json
// req
{ "language": "hi", "transcript": "mera pati nahi rahe, do bachche hain", "currentProfile": { "age": null } }
// res
{ "profile": { "marital_status": "widowed", "dependents": 2, "has_land": false, "age": null },
  "missingFields": ["age", "income_category"],
  "nextQuestion": { "field": "age", "text_hi": "Aapki umar kitni hai?" } }
```
- LLM prompt (`lib/prompts.ts`): extract ONLY facts the user stated, merge with `currentProfile`, never guess, return JSON matching `Profile`. Understand Hindi, Hinglish, Bhojpuri/Magahi words ("rahe" = past tense of "be", "pati nahi rahe" = husband has passed away).
- Validate the output with zod. On invalid JSON: retry once, then return `LLM_FAILED` (frontend switches to guided question-by-question mode).
- `nextQuestion` comes from a **static question bank** in code (one Hindi question per field), not from the LLM.

**POST /api/match**: `{ "profile": Profile }` -> `{ "matches": [{ schemeId, name_hi, name_en, status, benefit_text_hi, reason_hi }] }`

**GET /api/schemes/:id/documents** -> `{ "documents": [{ name_hi, name_en, where_to_get_hi }] }`

**GET /api/centers?district=Gaya** -> `{ "centers": Center[] }` (fall back to all centers if the district is unknown)

## 7. UI
Screens: **Home -> Listen -> Results -> Scheme Detail.**

Components: `Header`, `LanguagePicker` (Hindi / English), `MicButton` (very large, pulsing while listening), `TranscriptBox` (editable textarea, also the Wispr Flow target), `QuestionCard` (speaks the question aloud and shows quick-answer buttons where possible, e.g. age chips), `SchemeCard`, `EligibilityBadge` (green eligible / amber needs confirmation), `DocumentChecklist` (tick boxes, read-aloud button), `CenterCard`, `ErrorBanner`, `OfflineBanner`, `Loader`, `DemoButton` ("Play Savitri's sample", feeds the demo sentence in).

State: React `useState`/`useReducer` in a `ConversationProvider` context. Shape:
```
conversation = { language, transcript[], profile, followUpCount, status }
results = { matches[], selectedSchemeId }
```
No Redux.

Flow: speech/text -> `/api/understand` -> merge profile -> `/api/match` -> if any `maybe` with missing fields and followUpCount < 3, speak next question and loop; else go to Results.

## 8. Edge cases (all must be handled)
| Situation | Behaviour |
|---|---|
| Mic permission denied | Large prompt to allow mic + text box fallback |
| Web Speech unsupported (non-Chrome) | Hide mic, show text box with note "Use Wispr Flow or type" |
| Silence / unclear audio | "Main sun nahi paya, phir se boliye" + retry button |
| Transcript has no useful info | Ask first question directly (age) |
| Contradictory info | Ask one clarifying question before matching |
| LLM invalid JSON | Retry once, then guided question-by-question mode |
| Network drops | Keep state locally, show OfflineBanner, auto-retry |
| No scheme matches | Say so honestly + point to nearest CSC |
| Back / wrong tap | Back returns to results, profile never lost |
| Unsupported language | Fall back to Hindi with a message |

## 9. Environment
`.env.example`:
```
LLM_PROVIDER=gemini
GEMINI_API_KEY=
# optional
ANTHROPIC_API_KEY=
```
Never commit `.env.local`.

## 10. Build order (vertical slice first)
1. Scaffold Next.js + Tailwind + Vitest, push to GitHub, deploy hello-world to Vercel.
2. Seed JSON data + types.
3. Rules engine + the 5 unit tests passing.
4. `/api/match` working with a hardcoded profile.
5. `/api/understand` with hardcoded transcript, then real LLM call.
6. Listen screen: textarea + MicButton + DemoButton -> profile -> follow-up loop.
7. Results screen with `speechSynthesis` read-aloud.
8. Scheme detail: document checklist + centers.
9. Edge-case states, polish, demo script.

**Vertical slice acceptance test:** click DemoButton -> app extracts widow/58/no land -> asks one follow-up about income -> shows 3 matched schemes read aloud in Hindi -> tapping `widow_pension` shows the document checklist.

## 11. Out of scope for now
Login, maps, application tracking, Bhojpuri/Maithili UI, database, WhatsApp share, payments.
