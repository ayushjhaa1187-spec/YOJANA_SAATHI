import { z } from "zod";

export const ProfileSchema = z.object({
  age: z.number().nullable(),
  gender: z.enum(["female", "male", "other"]).nullable(),
  marital_status: z.enum(["widowed", "married", "single"]).nullable(),
  has_land: z.boolean().nullable(),
  income_category: z.enum(["BPL", "low", "other"]).nullable(),
  state: z.string().nullable(),
  district: z.string().nullable(),
  dependents: z.number().nullable(),
  has_ration_card: z.boolean().nullable(),
  has_pucca_house: z.boolean().nullable(),
});

export type Profile = z.infer<typeof ProfileSchema>;

export type Condition = {
  field: keyof Profile;
  op: "==" | ">=" | "<=" | "in";
  value: string | number | boolean | string[];
};

export type Scheme = {
  id: string;
  name_en: string;
  name_hi: string;
  category: "pension" | "health" | "food" | "energy" | "housing";
  benefit_text_en: string;
  benefit_text_hi: string;
  apply_url: string;
  state: string | null; // null = national
  conditions: Condition[];
  document_ids: string[];
  benefit_rank: number; // lower = shown first
  verified: boolean;
};

export type Document = {
  id: string;
  name_en: string;
  name_hi: string;
  where_to_get_hi: string;
};

export type Center = {
  id: string;
  name: string;
  type: "CSC" | "Block Office";
  district: string;
  address: string;
};

export type MatchStatus = "eligible" | "maybe" | "not_eligible";

export type Match = {
  schemeId: string;
  status: MatchStatus;
  reason_hi: string;
  missing: (keyof Profile)[];
  name_hi?: string;
  name_en?: string;
  category?: string;
  benefit_text_hi?: string;
};

export type Language = "hi" | "en";

export type QuestionOption = {
  label_hi: string;
  label_en: string;
  value: any;
};

export type QuestionItem = {
  field: keyof Profile;
  text_hi: string;
  text_en: string;
  options?: QuestionOption[];
};
