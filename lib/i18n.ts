import { Language } from "./types";

export const translations = {
  hi: {
    // Header & Common
    app_title: "योजना साथी",
    app_subtitle: "सरकारी योजना सहायता",
    back: "पीछे जाएँ",
    offline_notice: "इंटरनेट नहीं है। जुड़ते ही फिर कोशिश होगी।",
    disclaimer: "अंतिम फ़ैसला संबंधित सरकारी विभाग ही करेगा।",
    retry: "फिर से कोशिश करें",

    // Home
    home_headline: "आपके लिए कौन सी सरकारी योजना है?",
    home_subheadline: "बोलकर पता कीजिए।",
    mic_tap_to_speak: "बोलने के लिए दबाएँ",
    mic_listening: "सुन रहे हैं...",
    mic_processing: "जाँच रहे हैं...",
    mic_error: "माइक में समस्या है",
    demo_button: "नमूना सुनिए",
    demo_loading: "नमूना चल रहा है...",
    or_type: "या लिखकर बताइए",

    // Listen
    listen_title: "अपनी बात बताइए",
    listen_initial_prompt: "अपनी हालत बताइए। जैसे: मैं विधवा हूँ, मेरी उम्र 58 साल है।",
    transcript_label: "आपने कहा:",
    transcript_placeholder: "यहाँ बोलकर या लिखकर अपनी जानकारी दें (जैसे: उम्र, परिवार, ज़मीन)...",
    transcript_send: "भेजें",
    transcript_empty_warning: "कृपया कुछ बोलें या लिखें",
    stop_listening: "रोकें",
    start_listening: "बोलना शुरू करें",
    listening_active: "आवाज़ सुनी जा रही है...",
    step_indicator: "कदम {current} / {total}",

    // Results
    results_title: "आप इनके लिए पात्र हैं",
    results_subtitle: "आपकी दी गई जानकारी के आधार पर योजनाएँ",
    status_eligible: "पात्र",
    status_maybe: "पुष्टि करें",
    status_not_eligible: "अपात्र",
    view_details: "आगे देखें",
    speak_all: "सभी सुनाएँ",
    stop_speaking: "रोकें",
    read_aloud: "सुनाइए",
    more_schemes: "और योजनाएँ",
    speak_again: "फिर से बोलें",
    no_schemes_found: "अभी कोई योजना नहीं मिली। CSC सेंटर पर पूछिए।",
    nearest_center: "नज़दीकी सेंटर",

    // Scheme Detail
    scheme_benefit_heading: "फ़ायदा",
    documents_heading: "ये कागज़ ले जाइए",
    centers_heading: "यहाँ जाइए",
    where_to_get: "कहाँ मिलेगा",
    open_official_portal: "सरकारी पोर्टल खोलें",
    listen_documents: "कागज़ों की सूची सुनें",
    document_checked: "तैयार है",
    sample_tag: "नमूना",

    // Error & Fallbacks (from Section 8)
    error_mic_denied: "माइक की अनुमति चाहिए।",
    action_allow_mic: "अनुमति दें",
    error_no_speech: "आवाज़ सुनाई नहीं दी। फिर से बोलिए।",
    action_speak_again: "फिर से बोलें",
    error_network: "इंटरनेट नहीं है। जुड़ते ही फिर कोशिश होगी।",
    error_llm_failed: "समझ नहीं पाए। एक-एक सवाल पूछते हैं।",
    error_no_schemes: "अभी कोई योजना नहीं मिली। CSC सेंटर पर पूछिए।",
    error_unsupported_browser: "Chrome में खोलिए।",
    wispr_fallback_note: "Wispr Flow या कीबोर्ड से बोलकर लिखें",
    no_hindi_tts_notice: "आपके डिवाइस में हिंदी आवाज़ नहीं है। नीचे लिखा पढ़ें।",
    unsupported_lang_notice: "केवल हिंदी और अंग्रेज़ी उपलब्ध हैं।",

    // Question bank
    q_age: "आपकी उम्र कितनी है?",
    q_marital_status: "क्या आप विधवा हैं या शादीशुदा?",
    q_income_category: "क्या आपका परिवार बीपीएल (BPL) या कम आय वर्ग में है?",
    q_has_land: "क्या आपके पास खेती की ज़मीन है?",
    q_has_pucca_house: "क्या आपके पास पक्का मकान है?",
    q_gender: "महिला हैं या पुरुष?",

    // Quick chips
    chip_age_under_40: "40 से कम",
    chip_age_40_59: "40 से 59",
    chip_age_60_plus: "60 या ज़्यादा",
    chip_widowed: "विधवा",
    chip_married: "विवाहित",
    chip_single: "अविवाहित",
    chip_bpl: "हाँ, BPL / कम आय",
    chip_not_bpl: "नहीं, सामान्य आय",
    chip_no_land: "ज़मीन नहीं है",
    chip_has_land: "ज़मीन है",
    chip_no_pucca: "कच्चा मकान / नहीं है",
    chip_has_pucca: "पक्का मकान है",
    chip_female: "महिला",
    chip_male: "पुरुष",
  },
  en: {
    // Header & Common
    app_title: "Yojana Saathi",
    app_subtitle: "Government Scheme Assistant",
    back: "Go Back",
    offline_notice: "No internet connection. Will retry automatically.",
    disclaimer: "Final eligibility is decided by the government department.",
    retry: "Try Again",

    // Home
    home_headline: "Which government schemes are you eligible for?",
    home_subheadline: "Find out just by speaking.",
    mic_tap_to_speak: "Tap to Speak",
    mic_listening: "Listening...",
    mic_processing: "Checking...",
    mic_error: "Microphone error",
    demo_button: "Listen to Sample",
    demo_loading: "Running sample...",
    or_type: "Or type below",

    // Listen
    listen_title: "Tell Us About Yourself",
    listen_initial_prompt: "Tell us your situation. Example: I am a widow, 58 years old, and have no land.",
    transcript_label: "You said:",
    transcript_placeholder: "Speak or type details here (e.g. age, family, land)...",
    transcript_send: "Send",
    transcript_empty_warning: "Please speak or enter text",
    stop_listening: "Stop",
    start_listening: "Start Speaking",
    listening_active: "Listening to your voice...",
    step_indicator: "Step {current} of {total}",

    // Results
    results_title: "You Qualify For These",
    results_subtitle: "Schemes based on your information",
    status_eligible: "Eligible",
    status_maybe: "Needs Confirmation",
    status_not_eligible: "Not Eligible",
    view_details: "View Details",
    speak_all: "Read All",
    stop_speaking: "Stop",
    read_aloud: "Read Aloud",
    more_schemes: "More Schemes",
    speak_again: "Speak Again",
    no_schemes_found: "No schemes found. Please check at your nearest CSC centre.",
    nearest_center: "Nearest CSC Center",

    // Scheme Detail
    scheme_benefit_heading: "Benefit",
    documents_heading: "Required Documents",
    centers_heading: "Where to Apply",
    where_to_get: "Where to get",
    open_official_portal: "Open Official Portal",
    listen_documents: "Listen to Document Checklist",
    document_checked: "Ready",
    sample_tag: "Sample",

    // Error & Fallbacks
    error_mic_denied: "Microphone permission required.",
    action_allow_mic: "Allow Mic",
    error_no_speech: "Could not hear audio. Please speak again.",
    action_speak_again: "Speak Again",
    error_network: "No internet. Retrying once reconnected.",
    error_llm_failed: "Could not understand. Asking one question at a time.",
    error_no_schemes: "No matching schemes found. Inquire at your nearest CSC center.",
    error_unsupported_browser: "Please open in Google Chrome.",
    wispr_fallback_note: "Dictate with Wispr Flow or type using keyboard",
    no_hindi_tts_notice: "Hindi voice is not available on this device. Please read the text below.",
    unsupported_lang_notice: "Only Hindi and English are supported.",

    // Question bank
    q_age: "What is your age?",
    q_marital_status: "What is your marital status?",
    q_income_category: "Does your family have a BPL card or low income?",
    q_has_land: "Do you own agricultural land?",
    q_has_pucca_house: "Do you own a pucca house?",
    q_gender: "Are you female or male?",

    // Quick chips
    chip_age_under_40: "Under 40",
    chip_age_40_59: "40 to 59",
    chip_age_60_plus: "60 or older",
    chip_widowed: "Widowed",
    chip_married: "Married",
    chip_single: "Unmarried",
    chip_bpl: "Yes, BPL / Low Income",
    chip_not_bpl: "No, Regular Income",
    chip_no_land: "No land",
    chip_has_land: "Own land",
    chip_no_pucca: "Kutcha house / None",
    chip_has_pucca: "Pucca house",
    chip_female: "Female",
    chip_male: "Male",
  },
} as const;

export type TranslationKey = keyof typeof translations.hi;

export function t(key: TranslationKey, lang: Language = "hi", params?: Record<string, string | number>): string {
  const dictionary = translations[lang] || translations.hi;
  let text = dictionary[key] || translations.hi[key] || key;
  if (params) {
    Object.entries(params).forEach(([paramKey, paramVal]) => {
      text = text.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(paramVal)) as any;
    });
  }
  return text;
}
