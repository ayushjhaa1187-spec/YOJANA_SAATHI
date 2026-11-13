import { describe, it, expect } from "vitest";
import { POST as matchHandler } from "../app/api/match/route";
import { GET as documentsHandler } from "../app/api/schemes/[id]/documents/route";
import { GET as centersHandler } from "../app/api/centers/route";

describe("API Routes (Step 4)", () => {
  describe("POST /api/match", () => {
    it("returns 200 and matches for a valid profile", async () => {
      const request = new Request("http://localhost/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: {
            age: 58,
            marital_status: "widowed",
            income_category: "BPL",
            gender: "female",
          },
        }),
      });

      const response = await matchHandler(request);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.matches).toBeDefined();
      expect(Array.isArray(data.matches)).toBe(true);

      const widowMatch = data.matches.find(
        (m: any) => m.schemeId === "widow_pension"
      );
      expect(widowMatch).toBeDefined();
      expect(widowMatch.status).toBe("eligible");
      expect(widowMatch.name_hi).toBeDefined();
      expect(widowMatch.benefit_text_en).toBeDefined();
    });

    it("returns 400 INVALID_INPUT for malformed body", async () => {
      const request = new Request("http://localhost/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid json string",
      });

      const response = await matchHandler(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe("INVALID_INPUT");
    });

    it("returns 400 INVALID_INPUT for invalid profile field values", async () => {
      const request = new Request("http://localhost/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: {
            age: "not-a-number", // invalid type
          },
        }),
      });

      const response = await matchHandler(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe("INVALID_INPUT");
    });
  });

  describe("GET /api/schemes/[id]/documents", () => {
    it("returns 200 and documents for an existing scheme", async () => {
      const request = new Request(
        "http://localhost/api/schemes/widow_pension/documents"
      );
      const response = await documentsHandler(request, {
        params: { id: "widow_pension" },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.scheme).toBeDefined();
      expect(data.scheme.id).toBe("widow_pension");
      expect(data.documents.length).toBe(5);
    });

    it("returns 404 NOT_FOUND for an unknown scheme id", async () => {
      const request = new Request(
        "http://localhost/api/schemes/unknown_xyz/documents"
      );
      const response = await documentsHandler(request, {
        params: { id: "unknown_xyz" },
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error.code).toBe("NOT_FOUND");
    });
  });

  describe("GET /api/centers", () => {
    it("returns only Gaya centers when district=Gaya", async () => {
      const request = new Request("http://localhost/api/centers?district=Gaya");
      const response = await centersHandler(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.centers.length).toBe(5);
      for (const center of data.centers) {
        expect(center.district).toBe("Gaya");
      }
    });

    it("returns all centers when district is omitted or unknown", async () => {
      const requestAll = new Request("http://localhost/api/centers");
      const resAll = await centersHandler(requestAll);
      expect(resAll.status).toBe(200);
      const dataAll = await resAll.json();

      const requestUnknown = new Request(
        "http://localhost/api/centers?district=NonExistentDistrict"
      );
      const resUnknown = await centersHandler(requestUnknown);
      expect(resUnknown.status).toBe(200);
      const dataUnknown = await resUnknown.json();

      expect(dataUnknown.centers.length).toBe(dataAll.centers.length);
      expect(dataAll.centers.length).toBe(11);
    });
  });
});
