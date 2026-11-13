# Yojana Saathi (योजना साथी) — 90-Second Live Demonstration Script

## Overview
- **Product**: Yojana Saathi — Voice-first government scheme discovery assistant for low-literacy Indian citizens.
- **Anchor Persona**: Savitri Devi, 58, widow living near Gaya, Bihar; landless, two dependent children.
- **Target Experience**: Zero typing required, one big mic button, spoken conversation with quick chip fallbacks, deterministic eligibility matching, and a tangible document checklist with nearby Common Service Centers (CSCs).

---

## 1. Pre-Demo Checklist (Do 15 mins prior)

- [ ] **Device & Browser**: Android phone (preferred) or laptop running Google Chrome.
- [ ] **Display Settings**: Set device brightness to 80%+, auto-rotate off, zoom at 100%.
- [ ] **Speech Synthesis (TTS) Check**:
  - Android: *Settings → System → Accessibility / Text-to-Speech output* → Verify Google TTS engine has the **Hindi (India)** voice data installed.
  - Test audio volume: Set speaker volume to 80–90%.
- [ ] **Microphone Permission**: Open `http://localhost:3000` (or production URL), tap the mic icon once, and grant `"Allow microphone"` so no browser pop-up interrupts the live demo.
- [ ] **Network & Airplane Mode Readiness**:
  - Test live Wi-Fi / hotspot connectivity.
  - Verify that flipping Airplane mode immediately triggers the non-intrusive `OfflineBanner` without crashing or clearing state.
- [ ] **Fallback Contingency**:
  - If mic fails in a noisy conference room: Use the 1-tap **"नमूना सुनिए" (Listen to Sample)** button or Wispr Flow / keyboard into the pre-focused textarea.
  - If Gemini API quota or network fails: Guided Mode automatically engages with zero configuration.

---

## 2. The 90-Second Demonstration Script

### **[00:00 – 00:15] Hook & Persona Context**
- **Presenter Spoken Action**:
  > *"Meet Savitri Devi, 58 years old, a widow near Gaya, Bihar. She cannot read fine print or fill out complex government portals. She just wants to know: 'What help can I get?'"*
- **On Screen**:
  - Show the **Home Screen (`/`)** on a mobile viewport (360px).
  - Point out the clean UI: Baloo 2 + Noto Sans Devanagari typography, the high-contrast Haldi/Neel color scheme, and the bilingual toggle (`हि | EN`).
- **Interaction**:
  - Tap the big 160px Haldi **Mic Button** (or tap **"नमूना सुनिए"** for sample demo mode).

---

### **[00:15 – 00:35] Voice Input & Spoken Utterance**
- **Presenter Spoken Line** (speak clearly into the microphone in natural Hindi):
  > **"मेरा पति नहीं रहे, दो बच्चे हैं, ज़मीन नहीं है। मेरी उम्र 58 साल है।"**  
  > *(Romanized / Hinglish: "Mera pati nahi rahe, do bachche hain, zameen nahi hai. Meri umar 58 saal hai.")*
- **On Screen**:
  - Mic pulses with Haldi ripple during speech.
  - Speech text streams into the editable `<textarea>` box in real time.
  - Tap **"भेजें" (Send)** or let the 2-second silence detector finalize the utterance.
- **Behind the Scenes**:
  - Privacy guard: Audio is NEVER stored or transmitted.
  - Zero PII (no Aadhaar, phone numbers, or names) collected.
  - LLM extracts structured facts: `{ age: 58, marital_status: "widowed", gender: "female", has_land: false, dependents: 2 }`.

---

### **[00:35 – 00:50] The Follow-up Question & 1-Tap Quick Chip**
- **System Action**:
  - The deterministic rules engine (`lib/rules.ts`) evaluates schemes.
  - It detects that `income_category` is missing to confirm full eligibility for pensions and ration cards.
  - Assistant automatically reads aloud:
    > **"क्या आपके पास BPL / गरीबी रेखा का कार्ड है?"**
- **Presenter Spoken Action**:
  > *"Notice how the assistant asked only ONE targeted follow-up question. Savitri doesn't have to speak again—she can tap a 56px quick chip."*
- **Interaction**:
  - Tap the large chip: **`[हाँ, BPL कार्ड है]`** (or speak: *"हाँ, BPL कार्ड है"*).

---

### **[00:50 – 01:15] Ranked Results & Sequential Audio Announcement**
- **On Screen**:
  - Results Screen (`/results`) loads with top 3 ranked schemes:
    1. **विधवा पेंशन (NSAP Widow Pension)** — Badge: `✓ पात्र` (Tulsi green + checkmark)
       - Pure Hindi deterministic reason: *"आप विधवा हैं, आपकी उम्र 40 से ज़्यादा है, आपकी आय कम है"*
    2. **आयुष्मान भारत (PM-JAY)** — Badge: `✓ पात्र`
       - Reason: *"आपकी आय कम है"*
    3. **राशन कार्ड (NFSA)** — Badge: `✓ पात्र`
       - Reason: *"आपकी आय कम है"*
- **Interaction**:
  - Tap **"सभी सुनाएँ" (Read All)** or individual **🔊 (सुनाइए)** button.
  - Presenter highlights: *"Notice: The LLM did NOT decide her eligibility. That was computed 100% deterministically by pure rules code. No hallucinations, no false promises."*

---

### **[01:15 – 01:30] Actionable Next Steps & Document Checklist**
- **Interaction**:
  - Tap **"आगे देखें →"** on **विधवा पेंशन (NSAP)**.
- **On Screen (`/scheme/widow_pension`)**:
  - Benefit summary clearly stated.
  - **Checklist of 5 essential documents** with clear guidance on where to get each:
    - `[ ] आधार कार्ड` — *कहाँ मिलेगा: नज़दीकी आधार केंद्र या CSC*
    - `[ ] बैंक पासबुक` — *कहाँ मिलेगा: अपनी बैंक शाखा से*
    - `[ ] पति का मृत्यु प्रमाणपत्र` — *कहाँ मिलेगा: ग्राम पंचायत या नगर निकाय कार्यालय*
    - `[ ] आय प्रमाणपत्र` — *कहाँ मिलेगा: प्रखंड/अंचल कार्यालय या CSC*
    - `[ ] पासपोर्ट साइज़ फोटो` — *कहाँ मिलेगा: नज़दीकी फोटो की दुकान*
  - Interactive checkboxes toggle off documents Savitri already has at home.
  - Physical service center addresses: Local Gaya CSC Centers tagged with sample indicator `(नमूना)`.
  - Direct link: **"सरकारी पोर्टल खोलें ↗"** (`https://nsap.nic.in`).
  - Clear footer disclaimer: *"यह सांकेतिक जानकारी और नमूना डेटा है। अंतिम फ़ैसला संबंधित सरकारी विभाग ही करेगा।"*
- **Presenter Closing Line**:
  > *"In 90 seconds, a landless widow discovered 3 life-changing government programs, knows exactly what papers to gather, and where to walk. That is Yojana Saathi."*

---

## 3. Live Failure Modes & Backup Playbooks

| Potential Issue | What Happens on Screen | Demonstrator Action |
|---|---|---|
| **Audience Noise / Mic Error** | Chrome fails speech recognition or denies permission. | Textbox remains visible with fallback note: *"Wispr Flow या कीबोर्ड से बोलकर लिखें"*. Tap **"नमूना सुनिए"** or click into textarea and paste Savitri's text. |
| **No Gemini API Key / LLM 502** | `/api/understand` fails or is unconfigured. | App instantly engages **Guided Mode** with zero crashes. It asks age, widowhood, and BPL status via quick chips. Eligibility is calculated purely client-side! |
| **Venue Wi-Fi Drops** | Network disconnects mid-flow. | Yellow `OfflineBanner` drops down: *"इंटरनेट नहीं है। जुड़ते ही फिर कोशिश होगी।"* State remains in React memory. Reconnect Wi-Fi to auto-resume. |
| **No Hindi Voice on Browser** | Device lacks local Hindi TTS engine. | Visual badge displays: *"ℹ️ आपके डिवाइस में हिंदी आवाज़ नहीं है। नीचे लिखा पढ़ें।"* Reading mode continues without audio failure. |
