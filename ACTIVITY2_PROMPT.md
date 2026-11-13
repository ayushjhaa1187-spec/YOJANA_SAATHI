# Activity 2 Re-creation Prompt: Yojana Saathi

Copy and paste the self-contained prompt below into any AI app builder or coding agent to recreate Yojana Saathi from scratch:

```markdown
Build "Yojana Saathi" (योजना साथी), a production-grade, voice-first Next.js (App Router) + TypeScript single-page app helping low-literacy Indian citizens discover government schemes.

ANCHOR PERSONA:
Savitri Devi (58, widow near Gaya, Bihar, landless, 2 children). She cannot read fine print or navigate portals. She speaks naturally: "Mera pati nahi rahe, do bachche hain, zameen nahi hai. Meri umar 58 saal hai."

CORE ARCHITECTURAL RULE (THE SPLIT):
- The LLM (Gemini 2.5 Flash via @google/genai, temp 0) ONLY extracts structured demographic facts from speech into a strict JSON profile (age, gender, marital_status, income_category, has_land, has_pucca_house, dependents, district, state).
- Eligibility is decided ONLY by a deterministic pure TypeScript rules engine (`lib/rules.ts`). The LLM NEVER decides eligibility or invents benefit amounts.

4 SCREENS (Mobile-first 360px viewport, max 480px centered column):
1. Home (`/`): Bilingual toggle (`हि | EN`, Hindi default), 160px Haldi mic button, headline, and "नमूना सुनिए" (Demo button).
2. Listen (`/listen`): Web Speech API listener with auto-stop on 2s silence; pre-fills editable textarea fallback (Wispr Flow compatible). Asks max 3 targeted follow-ups with 56px touch quick chips. If LLM fails, falls back to deterministic Guided Mode with zero crashes.
3. Results (`/results`): Top 3 ranked schemes (eligible first, then needs confirmation). Shows Tulsi green `✓ पात्र` and Kesar amber `? पुष्टि करें` badges, deterministic Hindi explanation ("आप विधवा हैं, आपकी उम्र 40 से ज़्यादा है..."), and sequential TTS read-aloud.
4. Scheme Detail (`/scheme/:id`): Benefit overview, interactive 5-document checklist with "Where to get" guidance, nearby CSC centers marked sample `(नमूना)`, and official portal apply link.

DESIGN TOKENS & ACCESSIBILITY:
- Colors: Neel `#1B2A6B` (text/headings), Haldi `#F5B700` (mic/buttons), Dhuli `#F1F4FA` (background), Tulsi `#1E7B4F` (eligible), Kesar `#C2600A` (confirmation), Mirchi `#C6372B` (errors).
- Typography: Next/font Google loading Baloo 2 (headings) + Noto Sans Devanagari (body). No text below 16px.
- Minimum 56px touch targets. 3px Neel focus rings. Supports `prefers-reduced-motion`.

DATA & PRIVACY:
- 6 seed schemes in `data/schemes.json` (`widow_pension`, `old_age_pension`, `pmjay`, `nfsa_ration`, `ujjwala`, `pmay_g`), 9 documents in `data/documents.json`, 11 sample centers in `data/centers.json`. All schemes kept `verified: false`.
- Zero audio or PII (no Aadhaar, phone numbers, or exact addresses) stored or logged. Ephemeral in-memory React session state (cleared on refresh).
- Complete i18n string table in `lib/i18n.ts` (zero hardcoded UI text). Offline banner on connection drops.
- Clean Next.js monolith with Vitest test coverage and zero leaked credentials.
```
