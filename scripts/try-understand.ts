/**
 * Script to test /api/understand with real GEMINI_API_KEY.
 * Usage:
 *   npx tsx scripts/try-understand.ts
 *
 * Make sure GEMINI_API_KEY is defined in .env.local or in your shell environment.
 */

async function main() {
  const endpoint = "http://localhost:3000/api/understand";
  const payload = {
    language: "hi",
    transcript: "मेरा पति नहीं रहे, दो बच्चे हैं, ज़मीन नहीं है। मेरी उम्र 58 साल है।",
    currentProfile: {
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
    },
  };

  console.log("Sending test request to:", endpoint);
  console.log("Payload:", JSON.stringify(payload, null, 2));

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const status = res.status;
    const body = await res.json();
    console.log(`\nResponse (HTTP ${status}):`);
    console.log(JSON.stringify(body, null, 2));
  } catch (err: any) {
    console.error("Failed to connect to dev server. Is `npm run dev` running?", err.message);
  }
}

main();
