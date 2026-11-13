# Yojana Saathi: Frontend Plan

Companion to `YOJANA_SAATHI_SPEC.md`. If the two disagree, the spec wins on data and APIs; this file wins on UI.

## 1. Who the UI is for
Savitri Devi, 58, low literacy, cheap Android phone, shared or borrowed, noisy surroundings, speaks Hindi/Magahi. She may never have used an app with menus.

**The design job:** she should be able to finish the whole flow by looking at one big button and listening. Reading is optional, never required.

## 2. Design principles
1. **One screen, one job, one big action.** Never two competing buttons of equal weight.
2. **Listen first, read second.** Every question and result is spoken aloud automatically (with a replay button) and also written in large Hindi text.
3. **Icons plus words, never words alone.** Each scheme has a simple pictogram (pension = coin, health = cross, ration = grain, LPG = flame, housing = house).
4. **No dead ends.** Every error shows what happened and one thing to tap.
5. **The memorable element is the mic.** Everything else stays quiet and flat so the mic is unmistakable.

## 3. Design tokens

### Colour
| Name | Hex | Role |
|---|---|---|
| Neel (indigo ink) | `#1B2A6B` | Text, headers |
| Haldi (turmeric) | `#F5B700` | Mic button, primary action |
| Dhuli (pale wash) | `#F1F4FA` | Page background |
| Tulsi (green) | `#1E7B4F` | "Eligible" |
| Kesar (amber-orange) | `#C2600A` | "Needs confirmation" |
| Mirchi (red) | `#C6372B` | Errors only |
| White | `#FFFFFF` | Cards |

Text on Haldi uses Neel (never white). Status is never colour-only: each badge also has an icon and a word.

### Type
- **Headings, buttons, questions:** Baloo 2 (supports Devanagari), weights 600/700.
- **Body:** Noto Sans Devanagari, weight 400/500.
- Scale (mobile): question 28px, heading 24px, body 18px, small 16px (nothing smaller). Line-height 1.5 for Devanagari. Line length under 60 characters.
- Load via `next/font/google` with `subsets: ['devanagari','latin']`.

### Shape and spacing
- Radius: 24px for big cards, 999px for the mic and chips, 12px for inputs. Not one radius everywhere.
- Touch targets: minimum 56px high. Mic button 160px diameter.
- Spacing scale: 4, 8, 16, 24, 40.
- Shadows: only on the mic button. Cards use a 2px Neel-tinted border instead.

### Motion
- The mic has a slow ripple only while listening (this is the one orchestrated motion).
- Screen changes: simple fade, 150ms.
- Respect `prefers-reduced-motion`: replace the ripple with a solid ring and a "Listening" label.

Tailwind config: put tokens in `tailwind.config.ts` under `theme.extend.colors` and `fontFamily`.

## 4. Screens and wireframes
Four screens: **Home, Listen, Results, Scheme detail.** Mobile-first at 360px wide, centred column max 480px on desktop.

### 4.1 Home (`/`)
```
┌──────────────────────────┐
│ Yojana Saathi        [हि|EN]│
│                          │
│  आपके लिए कौन सी         │
│  सरकारी योजना है?        │
│  बोलकर पता कीजिए।        │
│                          │
│        ( ◉ MIC )         │  ← tap = go to Listen and start
│       बोलने के लिए दबाएँ   │
│                          │
│  [ नमूना सुनिए ]  (demo)  │
└──────────────────────────┘
```
- Language picker top right (Hindi default).
- Tapping the mic navigates to Listen with `autostart=1`.
- Demo button runs Savitri's sample sentence.

### 4.2 Listen (`/listen`)
```
┌──────────────────────────┐
│ ←                  [🔊]  │
│  ┌────────────────────┐  │
│  │ आपकी उम्र कितनी है?  │  │ ← QuestionCard (spoken aloud)
│  └────────────────────┘  │
│   [ 40 से कम ][ 40-59 ]   │ ← quick-answer chips (when field has few options)
│   [ 60 से ज़्यादा ]         │
│                          │
│        ( ◉ MIC )         │  ← pulses while listening
│  ┌────────────────────┐  │
│  │ आपने कहा: ...        │  │ ← TranscriptBox (editable, Wispr Flow target)
│  └────────────────────┘  │
│  [ भेजें ]                │
└──────────────────────────┘
```
- First visit shows an opening prompt: "अपनी हालत बताइए। जैसे: मैं विधवा हूँ, मेरी उम्र 58 साल है।"
- Transcript is editable. Pressing Send calls `/api/understand`.
- After a response: if follow-ups are needed, speak the next question; otherwise route to Results.
- Show `StepDots` (max 3 follow-ups) so the user sees progress without reading.

### 4.3 Results (`/results`)
```
┌──────────────────────────┐
│ ←  आप इनके लिए पात्र हैं    │
│ ┌──────────────────────┐ │
│ │ 🪙 विधवा पेंशन   ✔ पात्र │ │
│ │ आप 40+ की विधवा हैं     │ │
│ │ [ आगे देखें ]  [🔊]     │ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │ ✚ आयुष्मान भारत ✔ पात्र │ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │ 🌾 राशन कार्ड  ? पुष्टि करें│ │
│ └──────────────────────┘ │
│ [ और योजनाएँ ]  [ फिर से बोलें ]│
│ अंतिम फ़ैसला विभाग करेगा।   │
└──────────────────────────┘
```
- Max 3 cards, then a "more" link.
- Results are read aloud one after another automatically; a Stop button is always visible.
- Disclaimer is always visible at the bottom.

### 4.4 Scheme detail (`/scheme/[id]`)
```
┌──────────────────────────┐
│ ←  विधवा पेंशन             │
│  फ़ायदा: हर महीने पेंशन      │
│  ── ये कागज़ ले जाइए ──      │
│  ☐ आधार कार्ड        [🔊]  │
│  ☐ बैंक पासबुक             │
│  ☐ पति का मृत्यु प्रमाणपत्र   │
│  ☐ आय प्रमाणपत्र            │
│  ── यहाँ जाइए ──            │
│  CSC सेंटर, गया (नमूना)      │
│  [ लिंक खोलें ]  [ सुनाइए 🔊 ] │
└──────────────────────────┘
```
- Documents are tickable (local state only) and each says where to get it.
- "सुनाइए" reads the whole checklist aloud.

## 5. Component tree
```
app/layout.tsx            fonts, <ConversationProvider>, <OfflineBanner/>
components/
  layout/    Header, LanguagePicker, BackButton, StepDots
  voice/     MicButton, TranscriptBox, SpeakButton, ListeningIndicator
  convo/     QuestionCard, QuickChips, RetryPrompt
  results/   SchemeCard, EligibilityBadge, SchemeIcon, DocumentChecklist, CenterCard, Disclaimer
  feedback/  ErrorBanner, OfflineBanner, Loader
  demo/      DemoButton
hooks/
  useSpeechRecognition.ts   Web Speech API wrapper (hi-IN / en-IN)
  useSpeak.ts               speechSynthesis wrapper with queue + cancel
  useOnline.ts              navigator.onLine listener
lib/
  api.ts                    typed fetch wrappers with timeout + one retry
  i18n.ts                   hi/en string table
  questions.ts              static question bank (field -> hi/en text + chip options)
```

### Key component contracts
```ts
<MicButton status="idle|listening|processing|error" onStart={} onStop={} />
<TranscriptBox value onChange onSubmit disabled />        // plain <textarea>, so Wispr Flow can dictate into it
<QuestionCard text_hi text_en autoSpeak />
<QuickChips options={[{label_hi,label_en,value}]} onPick={} />
<SchemeCard match onOpen onSpeak />
<EligibilityBadge status="eligible|maybe" />              // icon + word + colour
<DocumentChecklist documents onSpeakAll />
<SpeakButton text lang />
```

## 6. State management
No library. One `ConversationProvider` using `useReducer`, shared across screens.

```ts
type State = {
  language: "hi" | "en";
  transcripts: string[];
  profile: Profile;               // from spec section 3
  nextQuestion: { field: string; text_hi: string } | null;
  followUpCount: number;          // max 3
  matches: Match[];
  selectedSchemeId: string | null;
  status: "idle" | "listening" | "thinking" | "asking" | "done" | "error";
  error: { code: string; message_hi: string } | null;
};
type Action =
  | { type: "SET_LANGUAGE"; language }
  | { type: "ADD_TRANSCRIPT"; text }
  | { type: "PROFILE_UPDATED"; profile; nextQuestion }
  | { type: "MATCHES_READY"; matches }
  | { type: "SELECT_SCHEME"; id }
  | { type: "ERROR"; error }
  | { type: "RESET" };
```
- Persist nothing except `language` (localStorage). The profile stays in memory so refreshing clears personal data.
- Local-only state: document tick boxes, mic permission status.
- Data flow: `MicButton`/`TranscriptBox` -> `ADD_TRANSCRIPT` -> `api.understand` -> `PROFILE_UPDATED` -> `api.match` -> `MATCHES_READY` -> route to Results (or ask the next question).

## 7. Voice behaviour rules
- **Input:** if `SpeechRecognition` is unsupported or permission is denied, hide the mic and show only the textarea with the note "Wispr Flow या कीबोर्ड से बोलकर लिखें".
- **Stop on silence:** auto-stop after ~2 seconds of silence; show the transcript for confirmation instead of sending instantly.
- **Output:** a single `useSpeak` queue. Starting a new utterance cancels the previous one. Navigating away cancels speech.
- **Autoplay:** mobile browsers block speech until a user tap. The first mic tap on Home counts as that gesture, so later speech works.
- **Fallback voice:** if no `hi-IN` voice is installed, show the text only plus a small note.

## 8. Error and empty states (UI copy, Hindi first)
| Case | Message | Action |
|---|---|---|
| Mic denied | "माइक की अनुमति चाहिए।" | [अनुमति दें] + text box |
| No speech heard | "आवाज़ सुनाई नहीं दी। फिर से बोलिए।" | [फिर से बोलें] |
| Network down | "इंटरनेट नहीं है। जुड़ते ही फिर कोशिश होगी।" | auto-retry |
| Server/LLM failed | "समझ नहीं पाए। एक-एक सवाल पूछते हैं।" | switch to guided questions |
| No schemes | "अभी कोई योजना नहीं मिली। CSC सेंटर पर पूछिए।" | [नज़दीकी सेंटर] |
| Unsupported browser | "Chrome में खोलिए।" | text box still works |

Errors never apologise and never show codes to the user; codes go to `console.error`.

## 9. Accessibility and quality floor
- Visible focus ring (3px Neel) on every interactive element.
- All icons have `aria-label`; badges read as "पात्र" / "पुष्टि करें".
- Contrast: all text at least 4.5:1 (Neel on Dhuli and on Haldi pass).
- `prefers-reduced-motion` respected.
- Test at 360px, 412px and desktop; no horizontal scroll.
- Lighthouse mobile run before the demo (target: accessibility 90+).

## 10. Frontend build order
1. Tailwind tokens, fonts, `Header`, `LanguagePicker`, `i18n.ts`. Check Hindi renders correctly.
2. `ConversationProvider` + reducer + `lib/api.ts` with mocked responses.
3. Home screen + `MicButton` (all four states, with static mock behaviour).
4. `useSpeechRecognition` + `TranscriptBox` + Listen screen using mocked `/understand`.
5. `useSpeak` + `QuestionCard` + `QuickChips` + follow-up loop.
6. Results screen: `SchemeCard`, `EligibilityBadge`, `SchemeIcon`, read-aloud queue.
7. Scheme detail: `DocumentChecklist`, `CenterCard`.
8. Swap mocks for real APIs.
9. Error, offline and unsupported states, then reduced motion, focus and Lighthouse pass.
10. `DemoButton` and a final run of the demo script on a real phone.

**Frontend acceptance test:** on a 360px Android Chrome window, tapping the demo button leads to one spoken follow-up question, then three result cards read aloud in Hindi, then a tickable document checklist, with no horizontal scroll and no console errors.

## 11. Out of scope
Dark mode, animations beyond the mic, onboarding tutorial, PWA install, multi-language UI beyond Hindi and English.
