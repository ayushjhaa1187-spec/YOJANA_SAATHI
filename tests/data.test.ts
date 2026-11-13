import { describe, it, expect } from "vitest";
import {
  getSchemes,
  getScheme,
  getDocumentsForScheme,
  getCenters,
  getDocument,
} from "../lib/data";
import documentsData from "../data/documents.json";
import { Profile } from "../lib/types";

describe("Data Integrity & Loaders (data.ts)", () => {
  const schemes = getSchemes();
  const validOps = ["==", ">=", "<=", "in"];
  const validProfileKeys: (keyof Profile)[] = [
    "age",
    "gender",
    "marital_status",
    "has_land",
    "income_category",
    "state",
    "district",
    "dependents",
    "has_ration_card",
    "has_pucca_house",
  ];

  it("all scheme ids are unique", () => {
    const ids = schemes.map((s) => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("every document_id used by a scheme exists in documents.json", () => {
    const existingDocIds = new Set(documentsData.map((d) => d.id));
    for (const scheme of schemes) {
      for (const docId of scheme.document_ids) {
        expect(
          existingDocIds.has(docId),
          `Scheme ${scheme.id} references missing document: ${docId}`
        ).toBe(true);
      }
    }
  });

  it("every condition.field is a valid key of Profile and op is one of ==, >=, <=, in", () => {
    for (const scheme of schemes) {
      for (const cond of scheme.conditions) {
        expect(
          validProfileKeys.includes(cond.field),
          `Scheme ${scheme.id} has invalid condition field: ${String(cond.field)}`
        ).toBe(true);
        expect(
          validOps.includes(cond.op),
          `Scheme ${scheme.id} has invalid operator: ${cond.op}`
        ).toBe(true);
      }
    }
  });

  it("every scheme has verified === false", () => {
    for (const scheme of schemes) {
      expect(scheme.verified).toBe(false);
    }
  });

  it('getCenters("Gaya") returns only Gaya centers; getCenters("Unknown") returns all', () => {
    const gayaCenters = getCenters("Gaya");
    expect(gayaCenters.length).toBe(5);
    for (const center of gayaCenters) {
      expect(center.district).toBe("Gaya");
      expect(center.name.endsWith("(नमूना)")).toBe(true);
      expect(center.address).toBe("पता जोड़ना बाकी है");
    }

    const allCenters = getCenters();
    const unknownCenters = getCenters("UnknownDistrictXYZ");
    expect(unknownCenters.length).toBe(allCenters.length);
  });

  it('getDocumentsForScheme("widow_pension") returns 5 documents', () => {
    const docs = getDocumentsForScheme("widow_pension");
    expect(docs.length).toBe(5);
    const docIds = docs.map((d) => d.id);
    expect(docIds).toEqual([
      "aadhaar",
      "bank_passbook",
      "death_certificate",
      "income_certificate",
      "photo",
    ]);
  });
});
