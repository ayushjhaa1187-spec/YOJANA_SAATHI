"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { SchemeIcon } from "@/components/results/SchemeIcon";
import { DocumentChecklist } from "@/components/results/DocumentChecklist";
import { CenterCard } from "@/components/results/CenterCard";
import { OfflineBanner } from "@/components/feedback/OfflineBanner";
import { Loader } from "@/components/feedback/Loader";
import { useConversation } from "@/components/ConversationProvider";
import { api } from "@/lib/api";
import { t } from "@/lib/i18n";
import { Scheme, Document, Center } from "@/lib/types";

export default function SchemeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { state, dispatch } = useConversation();

  const schemeId = params?.id as string;

  const [scheme, setScheme] = useState<any>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!schemeId) return;
      setLoading(true);
      setError(null);

      // Fetch documents and scheme details
      const docRes = await api.getSchemeDocuments(schemeId);
      if (!isMounted) return;

      if (!docRes.ok) {
        setError(docRes.error.message || "Failed to load scheme details");
        setLoading(false);
        return;
      }

      setScheme(docRes.data.scheme);
      setDocuments(docRes.data.documents);

      // Fetch centers (filter by profile district if available)
      const centerRes = await api.getCenters(state.profile.district || undefined);
      if (!isMounted) return;

      if (centerRes.ok) {
        setCenters(centerRes.data.centers);
      }

      setLoading(false);
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [schemeId, state.profile.district]);

  const schemeName =
    state.language === "en" && scheme?.name_en
      ? scheme.name_en
      : scheme?.name_hi || schemeId;

  // Find benefit text from matches if available
  const matchedScheme = state.matches.find((m) => m.schemeId === schemeId);
  const benefitText =
    state.language === "en" && matchedScheme?.benefit_text_en
      ? matchedScheme.benefit_text_en
      : matchedScheme?.benefit_text_hi || scheme?.benefit_text_hi;

  return (
    <div className="flex flex-col min-h-screen bg-dhuli text-neel">
      <OfflineBanner language={state.language} />
      <Header
        language={state.language}
        onLanguageChange={(lang) => dispatch({ type: "SET_LANGUAGE", language: lang })}
        showBack
        backHref="/results"
      />

      <main className="flex-1 flex flex-col justify-between px-4 py-4 max-w-[480px] mx-auto w-full">
        <div>
          {loading ? (
            <Loader language={state.language} />
          ) : error ? (
            <div className="w-full bg-white rounded-card border-2 border-mirchi p-6 my-4 text-center">
              <p className="font-heading font-bold text-heading text-mirchi mb-2">
                {error}
              </p>
              <Link
                href="/results"
                className="inline-block mt-3 px-6 py-2 rounded-full bg-haldi text-neel font-heading font-bold text-body"
              >
                {t("back", state.language)}
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Scheme Header Card */}
              <div className="w-full bg-white rounded-card border-2 border-neel/20 p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-14 h-14 rounded-full bg-dhuli flex items-center justify-center shrink-0">
                    <SchemeIcon category={matchedScheme?.category || "pension"} className="text-4xl" />
                  </div>
                  <div>
                    <h1 className="font-heading font-bold text-question text-neel leading-tight">
                      {schemeName}
                    </h1>
                  </div>
                </div>

                {benefitText && (
                  <div className="bg-dhuli/60 rounded-input p-3 border border-neel/10">
                    <h2 className="font-heading font-bold text-body text-neel mb-1">
                      {t("scheme_benefit_heading", state.language)}:
                    </h2>
                    <p className="font-body text-body text-neel/90">
                      {benefitText}
                    </p>
                  </div>
                )}
              </div>

              {/* Document Checklist */}
              <DocumentChecklist
                documents={documents}
                language={state.language}
              />

              {/* Where to Go / Centers List */}
              <div className="w-full my-2">
                <h2 className="font-heading font-bold text-heading text-neel mb-2">
                  {t("centers_heading", state.language)}
                </h2>
                <div className="flex flex-col gap-2">
                  {centers.slice(0, 3).map((center) => (
                    <CenterCard
                      key={center.id}
                      center={center}
                      language={state.language}
                    />
                  ))}
                </div>
              </div>

              {/* Official Portal Apply Button */}
              {scheme?.apply_url && (
                <div className="my-4">
                  <a
                    href={scheme.apply_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full min-h-touch px-6 py-3 rounded-full bg-haldi text-neel font-heading font-bold text-body flex items-center justify-center gap-2 shadow-sm hover:bg-haldi/90 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neel text-center"
                  >
                    <span>{t("open_official_portal", state.language)}</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mandatory Department Disclaimer */}
        <footer className="mt-8 mb-2 text-center w-full">
          <p className="text-small text-neel/70 font-body">
            {t("disclaimer", state.language)}
          </p>
        </footer>
      </main>
    </div>
  );
}
