import fs from "fs";
import path from "path";
import { LLMExtractor, extractJson } from "../lib/llm";
import { EXTRACTION_SYSTEM_PROMPT } from "../lib/prompts";
import { Profile } from "../lib/types";

export interface FixtureItem {
  id: string;
  case_type: string;
  language: string;
  transcript: string;
  expected: Partial<Profile>;
}

export interface EvalResult {
  fixtureId: string;
  caseType: string;
  passed: boolean;
  fieldResults: Record<string, { expected: any; actual: any; match: boolean }>;
}

export interface SummaryReport {
  totalFixtures: number;
  passedFixtures: number;
  overallAccuracyPct: number;
  fieldAccuracy: Record<string, { totalExpected: number; matches: number; accuracyPct: number }>;
  results: EvalResult[];
}

export async function runEvaluationHarness(
  extractor: LLMExtractor,
  fixtures: FixtureItem[]
): Promise<SummaryReport> {
  const results: EvalResult[] = [];
  const fieldStats: Record<string, { totalExpected: number; matches: number }> = {};

  for (const fixture of fixtures) {
    const userMessage = JSON.stringify({
      transcript: fixture.transcript,
      currentProfile: {},
    });

    let rawExtracted: any = {};
    try {
      rawExtracted = await extractor(EXTRACTION_SYSTEM_PROMPT, userMessage);
    } catch (err: any) {
      rawExtracted = {};
    }

    const fieldResults: Record<string, { expected: any; actual: any; match: boolean }> = {};
    let fixturePassed = true;

    for (const [key, expectedVal] of Object.entries(fixture.expected)) {
      if (!fieldStats[key]) {
        fieldStats[key] = { totalExpected: 0, matches: 0 };
      }
      fieldStats[key].totalExpected += 1;

      const actualVal = rawExtracted?.[key] ?? null;
      const match =
        expectedVal === null
          ? actualVal === null || actualVal === undefined
          : actualVal === expectedVal;

      fieldResults[key] = { expected: expectedVal, actual: actualVal, match };

      if (match) {
        fieldStats[key].matches += 1;
      } else {
        fixturePassed = false;
      }
    }

    results.push({
      fixtureId: fixture.id,
      caseType: fixture.case_type,
      passed: fixturePassed,
      fieldResults,
    });
  }

  const passedCount = results.filter((r) => r.passed).length;
  const overallAccuracyPct = fixtures.length > 0 ? (passedCount / fixtures.length) * 100 : 0;

  const fieldAccuracy: Record<string, { totalExpected: number; matches: number; accuracyPct: number }> = {};
  for (const [field, stat] of Object.entries(fieldStats)) {
    fieldAccuracy[field] = {
      totalExpected: stat.totalExpected,
      matches: stat.matches,
      accuracyPct: stat.totalExpected > 0 ? (stat.matches / stat.totalExpected) * 100 : 0,
    };
  }

  return {
    totalFixtures: fixtures.length,
    passedFixtures: passedCount,
    overallAccuracyPct: Math.round(overallAccuracyPct * 10) / 10,
    fieldAccuracy,
    results,
  };
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    console.error(
      "❌ GEMINI_API_KEY is missing in environment. Please set GEMINI_API_KEY in .env.local to run evaluation."
    );
    process.exit(1);
  }

  const fixturesPath = path.resolve(__dirname, "../tests/fixtures/transcripts.json");
  if (!fs.existsSync(fixturesPath)) {
    console.error("❌ Fixtures file not found at:", fixturesPath);
    process.exit(1);
  }

  const fixtures: FixtureItem[] = JSON.parse(fs.readFileSync(fixturesPath, "utf-8"));
  console.log(`\n🔍 Evaluating ${fixtures.length} extraction fixtures against Gemini API...\n`);

  const report = await runEvaluationHarness(extractJson, fixtures);

  console.log("┌──────┬──────────────────────┬─────────┐");
  console.log("│ ID   │ Case Type            │ Status  │");
  console.log("├──────┼──────────────────────┼─────────┤");
  for (const r of report.results) {
    const status = r.passed ? "✅ PASS" : "❌ FAIL";
    console.log(
      `│ ${r.fixtureId.padEnd(4)} │ ${r.caseType.padEnd(20)} │ ${status.padEnd(7)} │`
    );
  }
  console.log("└──────┴──────────────────────┴─────────┘");

  console.log("\n📊 Per-Field Accuracy:");
  console.table(report.fieldAccuracy);

  console.log(
    `\n🎯 Overall Accuracy: ${report.passedFixtures}/${report.totalFixtures} (${report.overallAccuracyPct}%)\n`
  );
}

if (require.main === module) {
  main().catch((err) => {
    console.error("Evaluation script encountered an error:", err.message);
    process.exit(1);
  });
}
