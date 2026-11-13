export const EXTRACTION_SYSTEM_PROMPT = `You extract facts from a user's spoken sentence (Hindi, Hinglish, or dialects such as Bhojpuri/Magahi).
Return ONLY a JSON object with these keys (use null if not stated):
age (number), gender ("female"|"male"|"other"), marital_status ("widowed"|"married"|"single"),
has_land (boolean), income_category ("BPL"|"low"|"other"), state (string), district (string), dependents (number),
has_ration_card (boolean), has_pucca_house (boolean).
Rules:
- Only record facts the user actually stated. Never guess or infer eligibility.
- You are given the current profile; keep its non-null values unless the user clearly corrects them.
- "pati nahi rahe", "pati guzar gaye", "vidhwa" mean marital_status = "widowed" and gender = "female".
- "zameen nahi hai" means has_land = false.
- Do not include any text outside the JSON.`;
