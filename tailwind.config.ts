import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        neel: "#1B2A6B",
        haldi: "#F5B700",
        dhuli: "#F1F4FA",
        tulsi: "#1E7B4F",
        kesar: "#C2600A",
        mirchi: "#C6372B",
        white: "#FFFFFF",
      },
      fontFamily: {
        heading: ["var(--font-baloo-2)", "sans-serif"],
        body: ["var(--font-noto-sans-devanagari)", "sans-serif"],
      },
      fontSize: {
        small: ["16px", { lineHeight: "1.5" }],
        body: ["18px", { lineHeight: "1.5" }],
        heading: ["24px", { lineHeight: "1.4" }],
        question: ["28px", { lineHeight: "1.3" }],
      },
      borderRadius: {
        card: "24px",
        chip: "999px",
        input: "12px",
      },
      minHeight: {
        touch: "56px",
      },
      minWidth: {
        touch: "56px",
      },
      width: {
        mic: "160px",
      },
      height: {
        mic: "160px",
      },
      boxShadow: {
        mic: "0 10px 25px -5px rgba(245, 183, 0, 0.4), 0 8px 10px -6px rgba(245, 183, 0, 0.3)",
        "mic-active": "0 0 0 16px rgba(245, 183, 0, 0.25), 0 10px 25px -5px rgba(245, 183, 0, 0.5)",
      },
      spacing: {
        1: "4px",
        2: "8px",
        4: "16px",
        6: "24px",
        10: "40px",
      },
    },
  },
  plugins: [],
};

export default config;
