import { Profile, QuestionItem } from "./types";

export const QUESTION_BANK: Partial<Record<keyof Profile, QuestionItem>> = {
  age: {
    field: "age",
    text_hi: "आपकी उम्र कितनी है?",
    text_en: "What is your age?",
    options: [
      { label_hi: "40 से कम", label_en: "Under 40", value: 35 },
      { label_hi: "40 से 59", label_en: "40 to 59", value: 50 },
      { label_hi: "60 या ज़्यादा", label_en: "60 or older", value: 65 },
    ],
  },
  income_category: {
    field: "income_category",
    text_hi: "क्या आपके पास BPL / गरीबी रेखा का कार्ड है?",
    text_en: "Does your family have a BPL card or low income?",
    options: [
      { label_hi: "हाँ, BPL कार्ड है", label_en: "Yes, BPL Card", value: "BPL" },
      { label_hi: "नहीं / सामान्य आय", label_en: "No / Normal Income", value: "other" },
      { label_hi: "कम आय है", label_en: "Low Income", value: "low" },
    ],
  },
  marital_status: {
    field: "marital_status",
    text_hi: "आप विवाहित हैं, विधवा हैं, या अविवाहित?",
    text_en: "What is your marital status?",
    options: [
      { label_hi: "विधवा", label_en: "Widowed", value: "widowed" },
      { label_hi: "विवाहित", label_en: "Married", value: "married" },
      { label_hi: "अविवाहित", label_en: "Unmarried", value: "single" },
    ],
  },
  has_land: {
    field: "has_land",
    text_hi: "क्या आपके पास खेती की ज़मीन है?",
    text_en: "Do you own agricultural land?",
    options: [
      { label_hi: "नहीं, ज़मीन नहीं है", label_en: "No land", value: false },
      { label_hi: "हाँ, ज़मीन है", label_en: "Own land", value: true },
    ],
  },
  has_pucca_house: {
    field: "has_pucca_house",
    text_hi: "क्या आपका घर पक्का है?",
    text_en: "Do you own a pucca house?",
    options: [
      { label_hi: "नहीं, कच्चा मकान है", label_en: "Kutcha house / None", value: false },
      { label_hi: "हाँ, पक्का मकान है", label_en: "Pucca house", value: true },
    ],
  },
  gender: {
    field: "gender",
    text_hi: "आप महिला हैं या पुरुष?",
    text_en: "Are you female or male?",
    options: [
      { label_hi: "महिला", label_en: "Female", value: "female" },
      { label_hi: "पुरुष", label_en: "Male", value: "male" },
    ],
  },
  state: {
    field: "state",
    text_hi: "आप किस राज्य में रहते हैं?",
    text_en: "Which state do you live in?",
    options: [
      { label_hi: "बिहार", label_en: "Bihar", value: "Bihar" },
      { label_hi: "उत्तर प्रदेश", label_en: "Uttar Pradesh", value: "Uttar Pradesh" },
    ],
  },
  district: {
    field: "district",
    text_hi: "आपका ज़िला कौन सा है?",
    text_en: "Which district do you reside in?",
  },
  has_ration_card: {
    field: "has_ration_card",
    text_hi: "क्या आपके पास राशन कार्ड है?",
    text_en: "Do you have a ration card?",
    options: [
      { label_hi: "हाँ", label_en: "Yes", value: true },
      { label_hi: "नहीं", label_en: "No", value: false },
    ],
  },
};

export function getQuestionForField(
  field: keyof Profile,
  language: "hi" | "en" = "hi"
): { field: keyof Profile; text: string; text_hi: string; text_en: string; options?: any[] } | null {
  const item = QUESTION_BANK[field];
  if (!item) return null;
  return {
    field,
    text: language === "en" ? item.text_en : item.text_hi,
    text_hi: item.text_hi,
    text_en: item.text_en,
    options: item.options,
  };
}
