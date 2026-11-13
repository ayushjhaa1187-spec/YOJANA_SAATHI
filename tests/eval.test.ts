import { describe, it, expect } from "vitest";
import { runEvaluationHarness, FixtureItem } from "../scripts/eval-extraction";
import fixturesData from "./fixtures/transcripts.json";

describe("Phase B: Extraction Quality Harness", () => {
  const fixtures: FixtureItem[] = fixturesData as FixtureItem[];

  it("contains at least 25 test fixtures covering all required categories", () => {
    expect(fixtures.length).toBeGreaterThanOrEqual(25);

    const caseTypes = new Set(fixtures.map((f) => f.case_type));
    expect(caseTypes.has("widow")).toBe(true);
    expect(caseTypes.has("old_age")).toBe(true);
    expect(caseTypes.has("no_info")).toBe(true);
    expect(caseTypes.has("hindi_words_number")).toBe(true);
    expect(caseTypes.has("correction")).toBe(true);
    expect(caseTypes.has("dialect")).toBe(true);
  });

  it("scores 100% accuracy when fake extractor matches expected values", async () => {
    // Fake extractor that returns expected values for each fixture
    const perfectExtractor = async (_system: string, user: string) => {
      const parsedUser = JSON.parse(user);
      const matchFixture = fixtures.find((f) => f.transcript === parsedUser.transcript);
      return matchFixture ? matchFixture.expected : {};
    };

    const report = await runEvaluationHarness(perfectExtractor, fixtures);
    expect(report.totalFixtures).toBe(fixtures.length);
    expect(report.passedFixtures).toBe(fixtures.length);
    expect(report.overallAccuracyPct).toBe(100);

    for (const [, stats] of Object.entries(report.fieldAccuracy)) {
      expect(stats.accuracyPct).toBe(100);
    }
  });

  it("correctly identifies field mismatches and updates scoring metrics", async () => {
    // Extractor that introduces a deliberate failure on age
    const faultyExtractor = async (_system: string, user: string) => {
      const parsedUser = JSON.parse(user);
      const matchFixture = fixtures.find((f) => f.transcript === parsedUser.transcript);
      const output = matchFixture ? { ...matchFixture.expected } : {};
      if (output.age !== undefined && output.age !== null) {
        // Deliberate age corruption
        output.age = (output.age as number) + 10;
      }
      return output;
    };

    const sampleFixtures = fixtures.slice(0, 5); // Take 5 fixtures
    const report = await runEvaluationHarness(faultyExtractor, sampleFixtures);

    expect(report.totalFixtures).toBe(5);
    // Fixtures with age should have failed
    const fixturesWithAge = sampleFixtures.filter((f) => f.expected.age !== undefined && f.expected.age !== null);
    if (fixturesWithAge.length > 0) {
      expect(report.passedFixtures).toBeLessThan(report.totalFixtures);
      expect(report.fieldAccuracy.age.accuracyPct).toBe(0);
    }
  });
});
