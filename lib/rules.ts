import { Profile, Scheme, Condition, Match, MatchStatus } from "./types";

export const createEmptyProfile = (): Profile => ({
  age: null,
  gender: null,
  marital_status: null,
  has_land: null,
  income_category: null,
  state: null,
  district: null,
  dependents: null,
  has_ration_card: null,
  has_pucca_house: null,
});

type ConditionResult = "pass" | "fail" | "missing";

export function checkCondition(p: Profile, c: Condition): ConditionResult {
  const v = p[c.field];
  if (v === null || v === undefined) {
    return "missing";
  }

  switch (c.op) {
    case "==":
      return v === c.value ? "pass" : "fail";
    case ">=":
      return typeof v === "number" && v >= (c.value as number) ? "pass" : "fail";
    case "<=":
      return typeof v === "number" && v <= (c.value as number) ? "pass" : "fail";
    case "in":
      return Array.isArray(c.value) && c.value.includes(v as never) ? "pass" : "fail";
    default:
      return "fail";
  }
}

const missingFieldTemplates: Record<keyof Profile, string> = {
  age: "आपकी उम्र जाननी है",
  gender: "महिला या पुरुष की जानकारी चाहिए",
  marital_status: "वैवाहिक स्थिति जाननी है",
  has_land: "ज़मीन की जानकारी चाहिए",
  income_category: "आय या BPL कार्ड की जानकारी चाहिए",
  state: "राज्य की जानकारी चाहिए",
  district: "ज़िले की जानकारी चाहिए",
  dependents: "परिवार के सदस्यों की जानकारी चाहिए",
  has_ration_card: "राशन कार्ड की जानकारी चाहिए",
  has_pucca_house: "मकान की स्थिति जाननी है",
};

function conditionToPassedText(c: Condition): string {
  if (c.field === "marital_status" && c.op === "==" && c.value === "widowed") {
    return "आप विधवा हैं";
  }
  if (c.field === "age" && c.op === ">=") {
    return `आपकी उम्र ${c.value} से ज़्यादा है`;
  }
  if (c.field === "gender" && c.op === "==" && c.value === "female") {
    return "आप महिला हैं";
  }
  if (c.field === "income_category" && c.op === "in") {
    return "आपकी आय कम है";
  }
  if (c.field === "has_pucca_house" && c.op === "==" && c.value === false) {
    return "आपका घर पक्का नहीं है";
  }
  if (c.field === "has_land" && c.op === "==" && c.value === false) {
    return "आपके पास ज़मीन नहीं है";
  }
  if (c.field === "has_ration_card" && c.op === "==" && c.value === true) {
    return "आपके पास राशन कार्ड है";
  }
  return "शर्त पूरी है";
}

export function buildReasonHi(
  p: Profile,
  s: Scheme,
  status: MatchStatus,
  missingOverride?: (keyof Profile)[]
): string {
  if (status === "not_eligible") {
    return "आप इस योजना की सभी शर्तें पूरी नहीं करते हैं";
  }

  const passedParts: string[] = [];

  if (s.state && p.state && p.state.trim().toLowerCase() === s.state.trim().toLowerCase()) {
    passedParts.push(`आप ${s.state} के निवासी हैं`);
  }

  for (const c of s.conditions) {
    if (checkCondition(p, c) === "pass") {
      passedParts.push(conditionToPassedText(c));
    }
  }

  if (status === "eligible") {
    return passedParts.length > 0
      ? passedParts.join(", ")
      : "आप इस योजना के लिए पात्र हैं";
  }

  // status === "maybe"
  const missingFields = missingOverride ?? s.conditions
    .filter((c) => checkCondition(p, c) === "missing")
    .map((c) => c.field);

  const missingParts = Array.from(new Set(missingFields)).map(
    (field) => missingFieldTemplates[field] ?? `${String(field)} की जानकारी चाहिए`
  );

  if (passedParts.length > 0) {
    return `${passedParts.join(", ")} (पुष्टि के लिए: ${missingParts.join(", ")})`;
  } else {
    return `पुष्टि के लिए: ${missingParts.join(", ")}`;
  }
}

export function evaluate(p: Profile, s: Scheme): Match {
  const missing: (keyof Profile)[] = [];
  let failed = false;

  // State-specific schemes:
  // if scheme.state is set and profile.state is set and they differ -> not_eligible
  // if scheme.state is set and profile.state is null -> treat as a missing "state" field (maybe)
  if (s.state !== null && s.state !== undefined) {
    if (p.state !== null && p.state !== undefined) {
      if (p.state.trim().toLowerCase() !== s.state.trim().toLowerCase()) {
        failed = true;
      }
    } else {
      if (!missing.includes("state")) {
        missing.push("state");
      }
    }
  }

  for (const c of s.conditions) {
    const r = checkCondition(p, c);
    if (r === "fail") {
      failed = true;
    } else if (r === "missing") {
      if (!missing.includes(c.field)) {
        missing.push(c.field);
      }
    }
  }

  const status: MatchStatus = failed ? "not_eligible" : missing.length > 0 ? "maybe" : "eligible";

  return {
    schemeId: s.id,
    status,
    reason_hi: buildReasonHi(p, s, status, missing),
    missing,
    name_hi: s.name_hi,
    name_en: s.name_en,
    category: s.category,
    benefit_text_hi: s.benefit_text_hi,
    benefit_text_en: s.benefit_text_en,
  };
}

export function matchAll(p: Profile, schemes: Scheme[]): Match[] {
  const rank = (id: string) => schemes.find((s) => s.id === id)?.benefit_rank ?? 999;
  const statusOrder: Record<MatchStatus, number> = {
    eligible: 0,
    maybe: 1,
    not_eligible: 2,
  };

  return schemes
    .map((s) => evaluate(p, s))
    .filter((m) => m.status !== "not_eligible")
    .sort((a, b) => {
      const orderDiff = statusOrder[a.status] - statusOrder[b.status];
      if (orderDiff !== 0) return orderDiff;
      return rank(a.schemeId) - rank(b.schemeId);
    });
}

export function nextQuestionField(matches: Match[]): keyof Profile | null {
  const counts = new Map<keyof Profile, number>();
  matches
    .filter((m) => m.status === "maybe")
    .forEach((m) =>
      m.missing.forEach((f) => counts.set(f, (counts.get(f) ?? 0) + 1))
    );

  const entries = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  return entries[0]?.[0] ?? null;
}

export function mergeProfile(
  current: Profile,
  incoming: Partial<Profile>
): Profile {
  const result: Profile = { ...current };
  const keys = Object.keys(incoming) as (keyof Profile)[];
  for (const key of keys) {
    const val = incoming[key];
    if (val !== null && val !== undefined) {
      (result as any)[key] = val;
    }
  }
  return result;
}
