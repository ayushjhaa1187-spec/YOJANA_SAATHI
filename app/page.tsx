"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { MicButton } from "@/components/voice/MicButton";
import { DemoButton } from "@/components/demo/DemoButton";
import { t } from "@/lib/i18n";
import { Language } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();
  const [lang, setLang] = React.useState<Language>("hi");
  const [demoLoading, setDemoLoading] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem("yojana_saathi_lang") as Language;
      if (savedLang === "hi" || savedLang === "en") {
        setLang(savedLang);
      }
    }
  }, []);

  const handleStartSpeaking = () => {
    router.push("/listen?autostart=1");
  };

  const handlePlayDemo = () => {
    setDemoLoading(true);
    router.push("/listen?demo=1");
  };

  return (
    <div className="flex flex-col min-h-screen bg-dhuli text-neel">
      <Header language={lang} onLanguageChange={setLang} />

      <main className="flex-1 flex flex-col justify-between items-center px-4 py-8 max-w-[480px] mx-auto w-full">
        {/* Headlines */}
        <div className="flex flex-col items-center text-center space-y-3 mt-4">
          <h1 className="font-heading font-bold text-question text-neel leading-tight max-w-[340px]">
            {t("home_headline", lang)}
          </h1>
          <p className="font-body text-body text-neel/85 font-medium max-w-[300px]">
            {t("home_subheadline", lang)}
          </p>
        </div>

        {/* Center: Big 160px Mic Button */}
        <div className="my-10 flex flex-col items-center">
          <MicButton
            status="idle"
            language={lang}
            onClick={handleStartSpeaking}
          />
        </div>

        {/* Actions: Demo Button */}
        <div className="w-full flex flex-col items-center gap-4">
          <DemoButton
            language={lang}
            loading={demoLoading}
            onClick={handlePlayDemo}
          />

          {/* Design token verification card */}
          <div className="w-full bg-white rounded-card border-2 border-neel/15 p-4 shadow-sm text-left">
            <h2 className="font-heading font-bold text-body text-neel mb-2">
              डिजाइन टोकन एवं हिंदी रेंडरिंग प्रमाण (Step 1 Verification):
            </h2>
            <p className="font-body text-small text-neel/80 mb-3">
              नमूना वाक्य: &ldquo;मेरा पति नहीं रहे, दो बच्चे हैं, ज़मीन नहीं है। मेरी उम्र 58 साल है।&rdquo;
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full bg-tulsi text-white text-small font-bold flex items-center gap-1">
                <span>✓</span>
                <span>{t("status_eligible", lang)} (Tulsi)</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-kesar text-white text-small font-bold flex items-center gap-1">
                <span>?</span>
                <span>{t("status_maybe", lang)} (Kesar)</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-haldi text-neel text-small font-bold flex items-center gap-1">
                <span>★</span>
                <span>Haldi / Neel</span>
              </span>
            </div>
          </div>
        </div>

        {/* Mandatory Disclaimer */}
        <footer className="mt-8 mb-2 text-center w-full">
          <p className="text-small text-neel/70 font-body">
            {t("disclaimer", lang)}
          </p>
        </footer>
      </main>
    </div>
  );
}
