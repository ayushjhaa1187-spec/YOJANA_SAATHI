"use client";

import React, { useState } from "react";
import { Document, Language } from "@/lib/types";
import { t } from "@/lib/i18n";
import { useSpeak } from "@/hooks/useSpeak";

interface DocumentChecklistProps {
  documents: Document[];
  language?: Language;
}

export function DocumentChecklist({
  documents,
  language = "hi",
}: DocumentChecklistProps) {
  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>({});
  const { speak, cancel, speaking } = useSpeak();
  const [speakingDocId, setSpeakingDocId] = useState<string | null>(null);

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSpeakSingle = (doc: Document) => {
    if (speaking && speakingDocId === doc.id) {
      cancel();
      setSpeakingDocId(null);
    } else {
      setSpeakingDocId(doc.id);
      const docName = language === "en" ? doc.name_en : doc.name_hi;
      const speechText = `${docName}. ${t("where_to_get", language)}: ${doc.where_to_get_hi}`;
      speak(speechText, language);
    }
  };

  const handleSpeakAll = () => {
    if (speaking && speakingDocId === "all") {
      cancel();
      setSpeakingDocId(null);
    } else {
      setSpeakingDocId("all");
      const listText = documents
        .map((d, i) => {
          const docName = language === "en" ? d.name_en : d.name_hi;
          return `${i + 1}: ${docName}, ${d.where_to_get_hi}`;
        })
        .join(". ");

      speak(`${t("documents_heading", language)}. ${listText}`, language);
    }
  };

  if (!documents || documents.length === 0) return null;

  return (
    <div className="w-full flex flex-col gap-3 my-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-heading font-bold text-heading text-neel">
          {t("documents_heading", language)}
        </h2>

        <button
          type="button"
          onClick={handleSpeakAll}
          aria-label={
            speaking && speakingDocId === "all"
              ? t("stop_speaking", language)
              : t("listen_documents", language)
          }
          className={`min-h-touch px-4 py-2 rounded-full border-2 border-neel/20 font-heading font-bold text-small flex items-center gap-1.5 active:scale-95 transition-all ${
            speaking && speakingDocId === "all"
              ? "bg-haldi animate-pulse text-neel"
              : "bg-white text-neel hover:bg-dhuli"
          }`}
        >
          <span className="text-xl" role="img" aria-hidden="true">
            {speaking && speakingDocId === "all" ? "⏹️" : "🔊"}
          </span>
          <span>
            {speaking && speakingDocId === "all"
              ? t("stop_speaking", language)
              : t("read_aloud", language)}
          </span>
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {documents.map((doc) => {
          const isChecked = !!checkedIds[doc.id];
          const docName = language === "en" ? doc.name_en : doc.name_hi;

          return (
            <div
              key={doc.id}
              className={`w-full bg-white rounded-card border-2 p-4 flex items-center justify-between gap-3 transition-all ${
                isChecked
                  ? "border-tulsi/50 bg-tulsi/5"
                  : "border-neel/15 hover:border-neel/30"
              }`}
            >
              <label className="flex items-start gap-3 cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleCheck(doc.id)}
                  className="w-6 h-6 mt-1 rounded border-2 border-neel/30 text-tulsi focus:ring-neel cursor-pointer"
                />
                <div className="flex flex-col">
                  <span
                    className={`font-heading font-bold text-body text-neel leading-snug ${
                      isChecked ? "line-through text-neel/60" : ""
                    }`}
                  >
                    {docName}
                  </span>
                  <span className="font-body text-small text-neel/75 mt-0.5">
                    <span className="font-semibold">
                      {t("where_to_get", language)}:
                    </span>{" "}
                    {doc.where_to_get_hi}
                  </span>
                </div>
              </label>

              <button
                type="button"
                onClick={() => handleSpeakSingle(doc)}
                aria-label={`${docName} ${t("read_aloud", language)}`}
                className={`min-h-touch min-w-[56px] rounded-full border-2 border-neel/20 flex items-center justify-center text-neel transition-all active:scale-95 ${
                  speaking && speakingDocId === doc.id
                    ? "bg-haldi animate-pulse"
                    : "bg-dhuli hover:bg-white"
                }`}
              >
                <span className="text-xl" role="img" aria-hidden="true">
                  {speaking && speakingDocId === doc.id ? "⏹️" : "🔊"}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
