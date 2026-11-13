# Yojana Saathi: Architecture and System Design

Scope: how the system is structured, why, and how it can grow. For build steps, code and UI details see `README.md`. Numbers marked **target** are goals to aim for, not measurements.

---

## 1. Purpose and context

**Problem:** millions of eligible Indians never receive government benefits because discovering schemes needs literacy, English-heavy portals and long forms.

**Solution:** a voice-first assistant. The user describes their situation by speaking; the system works out which schemes they likely qualify for, which documents to carry and where to go.

**Primary user:** low-literacy, rural, on a basic Android phone, in a noisy environment, speaking Hindi or a dialect.
**Secondary users (later):** ASHA workers and CSC operators who help many households.

### System context
```
        ┌──────────────┐   speech / text    ┌──────────────────┐
        │ Citizen      │ ─────────────────► │                  │
        │ (Savitri)    │ ◄───────────────── │  Yojana Saathi   │
        └──────────────┘  spoken + written  │  (web app + API) │
                                            └───┬──────────┬───┘
                           profile extraction   │          │  static reference data
                                                ▼          ▼
                                       ┌──────────────┐  ┌────────────────────────┐
                                       │ LLM API      │  │ Scheme / document /    │
                                       │ (Gemini)     │  │ center data (JSON)     │
                                       └──────────────┘  └────────────────────────┘
        Browser services used on the device: Web Speech API (listen), speechSynthesis (speak)
        Wispr Flow: system-level dictation into the app's text box
```

---

## 2. Requirements

### 2.1 Functional
| ID | Requirement |
|---|---|
| F1 | Accept a spoken or typed description of the user's situation in Hindi, Hinglish or English |
| F2 | Extract structured facts (age, marital status, income category, land, etc.) |
| F3 | Ask up to 3 follow-up questions for missing facts |
| F4 | Decide eligibility using explicit rules |
| F5 | Show up to 3 best-matching schemes with a plain-language reason |
| F6 | Read questions and results aloud |
| F7 | Show a document checklist and the nearest service center for a scheme |
| F8 | Work with a text/button fallback when voice fails |

### 2.2 Non-functional
| Area | Requirement |
|---|---|
| Accuracy | Eligibility is deterministic and repeatable; same profile always gives the same result |
| Latency (target) | Voice-to-next-question under about 4 seconds on a typical 4G connection (one LLM call per turn) |
| Privacy | No audio, Aadhaar, phone number or exact address stored; profile lives in memory only |
| Accessibility | Usable without reading; large touch targets; contrast 4.5:1 or better |
| Resilience | Every voice step has a fallback; LLM failure degrades to guided questions |
| Simplicity | One repo, one deployment, no infrastructure to operate (prototype) |
| Honesty | Results always labelled as indicative; the department decides |

### 2.3 Out of scope (prototype)
Login, persistent accounts, maps, application tracking or submission, WhatsApp sharing, payments, IVR/toll-free line, real-time scheme data sync.

---

## 3. Key design decisions

| # | Decision | Why | Trade-off |
|---|---|---|---|
| D1 | **LLM extracts, rules engine decides** | Eligibility errors can cost people real benefits. Code is testable and explainable; an LLM may be confidently wrong | New schemes need rule entries, not just a prompt change |
| D2 | **Serverless monolith (Next.js on Vercel)** | Fastest to build and deploy; one codebase for UI and API | Less control over scaling and long-running work |
| D3 | **Static JSON instead of a database** | Six schemes and a few centers; zero setup; data is versioned in git | No admin UI, no live updates, redeploy to change data |
| D4 | **Stateless server, state in the browser** | Nothing sensitive stored server-side; simple privacy story | Refresh loses the session; no cross-device continuity |
| D5 | **Browser speech APIs for voice** | Free, no extra service, low latency | Web Speech works mainly in Chrome-based browsers; TTS needs an installed Hindi voice |
| D6 | **Text box always present** | Wispr Flow dictates into any text field; also the fallback when mic fails | Slightly more UI on screen |
| D7 | **Static question bank** | Predictable, translatable, no LLM drift in questions | Less conversational feel |
| D8 | **Rules as data (JSON conditions)** | Non-developers can review and verify them; easy to add schemes | Limited expressiveness (no nested OR logic yet) |
| D9 | **Provider-agnostic LLM wrapper** | Swap Gemini for another provider without touching routes | One more small abstraction |
| D10 | **Max 3 follow-ups** | Keeps sessions short for tired, low-patience users | Some results stay "needs confirmation" |

---

## 4. High-level architecture

```
┌──────────────────────────────────── CLIENT (mobile browser) ────────────────────────────────────┐
│                                                                                                  │
│  UI layer          Home ─► Listen ─► Results ─► Scheme detail                                    │
│  State layer       ConversationProvider (useReducer, in memory)                                  │
│  Voice layer       useSpeechRecognition (listen)   useSpeak (speak)   TranscriptBox (Wispr Flow) │
│  Network layer     lib/api.ts  (typed fetch, 10s timeout, 1 retry, Result<T> return type)        │
│                                                                                                  │
└───────────────────────────────────────────────┬──────────────────────────────────────────────────┘
                                                │ HTTPS / JSON
┌───────────────────────────────────────────────▼──────────────────────────────────────────────────┐
│                              SERVER (Next.js API routes, serverless)                              │
│                                                                                                  │
│  Route layer       /api/understand   /api/match   /api/schemes/:id/documents   /api/centers      │
│  Validation        zod schemas on every request and on LLM output                                │
│  Domain layer      rules.ts (evaluate, matchAll, nextQuestionField)   questions.ts   prompts.ts  │
│  Integration       llm.ts  ──► Gemini API                                                        │
│  Data access       data.ts ──► /data/schemes.json, documents.json, centers.json                  │
│                                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Layer responsibilities
| Layer | Owns | Must not |
|---|---|---|
| UI components | Rendering, user input, accessibility | Call the LLM, evaluate rules |
| State (reducer) | Session profile, status, results | Talk to the network directly |
| API client | HTTP, timeouts, retries, error shaping | Contain business logic |
| Route handlers | Validation, orchestration, status codes | Hold eligibility logic inline |
| Domain (`rules.ts`) | Eligibility decisions | Import from the UI, the network or the LLM |
| LLM wrapper | Provider calls, JSON parsing | Decide anything; it only returns raw extraction |
| Data access | Loading and typing static data | Mutate data |

The domain layer has **no dependencies** on frameworks. That makes it the most testable part and the one to protect.

---

## 5. Component design

### 5.1 Conversation engine (client-side orchestration)
A small controller in the Listen screen drives the loop:

```
input (voice or text)
   → understand()        server: LLM extraction + merge + match + next question
   → update profile
   → decide:  more questions needed AND followUpCount < 3 ? ask : show results
```

States: `idle → listening → thinking → asking → done`, plus `error`. Any state can move to `error`; `error` always offers a retry or the text fallback.

### 5.2 Understanding service (`/api/understand`)
```
request ─► zod validate ─► LLM extractJson ─► zod validate ─► merge into profile
                              │ invalid                          │
                              └─► retry once ─► LLM_FAILED       ▼
                                                    matchAll + nextQuestionField ─► response
```
- **Merge rule:** new non-null values overwrite old ones; null never erases known data.
- **Determinism:** `temperature: 0`, JSON response mode, schema validation.
- The LLM is given the current profile so a short answer like "58" lands on the right field.

### 5.3 Rules engine (`lib/rules.ts`)
Pure functions over `(Profile, Scheme[])`.
- Each scheme is a list of conditions; each condition returns `pass`, `fail` or `missing`.
- Result: any fail → `not_eligible`; no fail but a missing → `maybe`; all pass → `eligible`.
- Ranking: eligible before maybe, then by `benefit_rank`.
- Next question: the field missing in the most `maybe` matches (greedy; reduces uncertainty fastest).
- Reasons are built from Hindi templates per condition, never LLM text.

### 5.4 Voice subsystem
```
 INPUT                                              OUTPUT
 ┌────────────────────┐                             ┌─────────────────────┐
 │ Web Speech API     │──┐                          │ speechSynthesis     │
 │ (hi-IN, auto-stop) │  │      ┌──────────────┐    │ queue + cancel      │
 └────────────────────┘  ├────► │ TranscriptBox│    │ Hindi voice check   │
 ┌────────────────────┐  │      │ (editable)   │    │ text-only fallback  │
 │ Wispr Flow dictation│─┤      └──────┬───────┘    └─────────────────────┘
 └────────────────────┘  │             │ user confirms / sends
 ┌────────────────────┐  │             ▼
 │ Keyboard typing    │──┘        onSend(text)
 └────────────────────┘
```
Design point: all three input methods converge on one editable text box, so downstream code has exactly one input path.

### 5.4.1 Why the user confirms before sending
Speech recognition on dialects and noisy audio makes mistakes. Showing the text lets the user (or a helper) correct it cheaply, instead of getting a wrong answer.

### 5.5 Data store
Typed JSON loaded at build/runtime by `lib/data.ts`. Schemes carry `verified: boolean` so unverified rules can be flagged in the UI during development.

---

## 6. Sequence: the main flow

```
User        UI/Listen          API client       /api/understand        Gemini        /api/match
 │ speaks      │                    │                  │                  │              │
 ├────────────►│ text in box        │                  │                  │              │
 │ confirms    │                    │                  │                  │              │
 ├────────────►│ onSend(text)       │                  │                  │              │
 │             ├───────────────────►│ POST             │                  │              │
 │             │                    ├─────────────────►│ build prompt     │              │
 │             │                    │                  ├─────────────────►│ extract JSON │
 │             │                    │                  │◄─────────────────┤              │
 │             │                    │                  │ validate + merge │              │
 │             │                    │                  │ matchAll, next Q │              │
 │             │◄───────────────────┤◄─────────────────┤ profile + nextQ  │              │
 │◄────────────┤ speak next question│                  │                  │              │
 │ answers     │  ... loop (max 3) ...                                                    │
 │             ├───────────────────►│ POST /api/match ───────────────────────────────────►│
 │             │◄───────────────────┤◄──────────────────────────────── matches ───────────┤
 │◄────────────┤ Results screen + read aloud                                              │
```
Note: `/api/understand` already runs `matchAll` internally to choose the next question; the client calls `/api/match` for the final ranked list with display fields. If you want fewer round trips, return `matches` from `/api/understand` too (a safe optimisation; keep `/api/match` for direct use and tests).

---

## 7. Data architecture

### 7.1 Entities
```
Profile (in memory)          Scheme ────────< Condition
   │ evaluated against          │ many-to-many
   ▼                            ▼
 Match (computed)            Document          Center (filtered by district)
```
### 7.2 Where data lives
| Data | Store | Mutability | Sensitivity |
|---|---|---|---|
| Schemes, conditions, documents | JSON in repo | Changed by redeploy | Public |
| Centers | JSON in repo | Changed by redeploy | Public |
| Profile, transcripts | Browser memory | Per session | Personal; never persisted |
| Language choice | `localStorage` | User-set | Non-sensitive |
| Audio | Not stored | n/a | Sensitive; discarded |

### 7.3 Privacy note
The transcript and profile **are sent to the LLM provider** for extraction. That is personal information, so before any real-world use you need: a privacy notice, consent, a check of the provider's data-retention terms, and a decision on whether to strip names and places before sending. For the hackathon demo, use sample data only.

---

## 8. API design principles

- JSON over HTTPS, one responsibility per route.
- Inputs validated with zod; unknown fields rejected or ignored.
- Uniform error shape `{ error: { code, message } }` with correct HTTP status (400, 404, 502, 500).
- No sessions or cookies; the client sends the current profile each time (stateless).
- Idempotent: the same request returns the same result (LLM at temperature 0 is near-deterministic, rules are fully deterministic).
- Full request/response examples live in `README.md` section 8.

---

## 9. Failure modes and degradation

| Failure | Detection | Degradation |
|---|---|---|
| Mic unavailable or denied | Permission error / unsupported API | Text box only (Wispr Flow or keyboard) |
| Speech misheard | User sees the transcript | Edit before sending |
| LLM timeout or HTTP error | Non-2xx or timeout | One retry, then guided mode |
| LLM returns bad JSON | zod validation fails | Retry once, then guided mode |
| LLM extracts a wrong fact | Not detectable automatically | User sees facts echoed in results reasons; can speak again to correct |
| Network lost | `navigator.onLine`, fetch failure | Offline banner, keep state, auto-retry |
| No Hindi TTS voice | Voice list check | Show text only |
| Rules data wrong | Review and tests | Mark `verified:false`; disclaimer on screen |
| Vercel cold start | Slow first request | Show loader; pre-warm before the demo |

**Guided mode:** a no-LLM path that asks fixed questions (age, marital status, income category, land) using chips and typed numbers, then runs the same rules engine. It guarantees the app still works if the AI part does not.

---

## 10. Security and privacy

| Concern | Control |
|---|---|
| API key exposure | Key only in server env vars; LLM is called from API routes, never from the browser |
| Abuse of the LLM endpoint | Add basic per-IP rate limiting before any public launch (the prototype has none) |
| Prompt injection via transcript | The LLM only returns a schema-validated JSON profile; output cannot trigger actions, and eligibility ignores free text |
| Data minimisation | No Aadhaar, phone, address or audio collected; fields are coarse categories |
| Logging | Do not log transcripts or profiles in production |
| Transport | HTTPS via Vercel |
| Dependencies | Minimal set (Next.js, React, Tailwind, zod, Vitest) |
| Misleading output | Disclaimer on every result; `maybe` clearly labelled |

---

## 11. Performance and cost

- **One LLM call per user turn**, short prompt, JSON-only output. Typical session is 2-4 calls.
- Rules engine and data lookups run in memory in under a millisecond; they are not a bottleneck.
- Static assets and JSON are served from the CDN.
- **Target:** first meaningful result within about 4 seconds of the user finishing speaking on 4G.
- **Cost:** driven by the LLM only. Check the provider's current pricing and free-tier limits, and estimate cost per session before any public launch. The prototype should fit a free tier for a demo.

---

## 12. Observability (minimum viable)
- `console.error` with error codes on the server (no transcripts).
- Vercel's built-in function logs for failures and latency.
- Later: anonymous counters for sessions started, sessions reaching results, LLM failures, guided-mode rate and follow-up count. These show whether voice is actually working for people.

---

## 13. Testing strategy

| Level | What | Tool |
|---|---|---|
| Unit | Rules engine (all status paths, ranking, next-question) | Vitest |
| Unit | Merge logic, zod schemas | Vitest |
| Contract | `/api/match` with fixed profiles | curl or Vitest + fetch |
| Manual E2E | Demo path on a real Android phone in Chrome | Checklist in `README.md` |
| Fallback | Mic denied, offline, LLM key removed | Manual |
| Accessibility | Lighthouse mobile, keyboard focus, 360px width | Lighthouse |

The LLM step is tested with a small table of sample sentences (Hindi, Hinglish, dialect) and expected fields. Keep it as a regression list and rerun when the prompt or model changes.

---

## 14. Deployment architecture

```
 Developer ──git push──► GitHub ──webhook──► Vercel build ──► Preview URL (per branch)
                                                  │
                                                  └──► Production URL (main)
 Env vars (Vercel dashboard): LLM_PROVIDER, GEMINI_API_KEY, GEMINI_MODEL
```
- API routes become serverless functions; the UI is static plus server-rendered where needed.
- Keep each function to one LLM call to stay inside execution limits (check the plan's current limits).
- Rollback: redeploy a previous commit from the Vercel dashboard.

---

## 15. Scaling path (after the hackathon)

| Stage | Change | Trigger |
|---|---|---|
| 1. Data | Move schemes, rules, documents, centers to Postgres (Supabase); add an admin page for updating rules | More than about 20 schemes or frequent updates |
| 2. Rules | Richer rule language (AND/OR groups, state variants, benefit amounts); source and last-verified date per rule | Rule complexity grows |
| 3. Coverage | State-wise scheme packs (Bihar, UP, Maharashtra first); more dialects | Real users from more regions |
| 4. Channels | Toll-free number with IVR for basic phones (telephony provider + speech-to-text); WhatsApp voice notes | Users without smartphones |
| 5. Integration | Hand-off or deep links into UMANG, state portals and CSC workflows; application status | Government or partner access |
| 6. Operators | Multi-household mode for ASHA workers and CSC operators, with consent | Pilot with field workers |
| 7. Platform | Separate the conversation service and rules service behind APIs; caching; rate limiting; monitoring | Sustained traffic |
| 8. Safety | Consent flows, data-retention policy, audit trail of rule versions used per answer | Handling real personal data |

Integration with government platforms depends on access and partnerships outside this project; treat it as a roadmap item, not a promise.

---

## 16. Risks and open questions

| Risk | Impact | Mitigation |
|---|---|---|
| Wrong scheme thresholds | Misleads users | Verify against official sources; show `verified` status; disclaimer |
| Dialect recognition quality | Misheard input | Editable transcript, text fallback, test with real speakers |
| Hindi TTS missing on cheap phones | No spoken output | Text always shown; test on target devices |
| LLM privacy | Personal data leaves the device | Minimise data, notice and consent before real use |
| Wispr Flow availability on the user's device | Dictation path unavailable | Web Speech and typing remain |
| Over-trust in results | People skip official checks | Clear "department decides" messaging |

**Open questions for the team:** Which states will the demo cover? Which 6 schemes are verified? Which phone and browser will be used on stage? Is a Wispr Flow developer integration available, or is it dictation-only?

---

## 17. Glossary
- **CSC:** Common Service Centre, a village-level government service point.
- **BPL:** Below Poverty Line.
- **NSAP:** National Social Assistance Programme (pensions).
- **PM-JAY:** Ayushman Bharat health insurance scheme.
- **NFSA:** National Food Security Act (ration cards).
- **TTS:** text-to-speech. **STT:** speech-to-text.
- **Profile:** the structured facts about a user. **Match:** a scheme evaluated against a profile.
