"use client";

import React from "react";
import { Center, Language } from "@/lib/types";
import { t } from "@/lib/i18n";

interface CenterCardProps {
  center: Center;
  language?: Language;
}

export function CenterCard({ center, language = "hi" }: CenterCardProps) {
  const isSample = center.name.includes("(नमूना)");
  const cleanName = center.name.replace(/\(नमूना\)/g, "").trim();

  return (
    <div className="w-full bg-white rounded-card border-2 border-neel/15 p-4 my-2 shadow-sm flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-heading font-bold text-body text-neel">
              {cleanName}
            </h4>
            {isSample && (
              <span className="px-2 py-0.5 rounded-full bg-kesar/15 text-kesar text-xs font-bold font-body">
                {t("sample_tag", language)}
              </span>
            )}
          </div>
          <span className="text-small text-neel/70 font-body">
            {center.type === "CSC" ? "कॉमन सर्विस सेंटर (CSC)" : "प्रखंड कार्यालय (Block Office)"} • {center.district}
          </span>
        </div>

        <span className="text-2xl" role="img" aria-hidden="true">
          📍
        </span>
      </div>

      <div className="bg-dhuli/60 rounded-input p-2.5 border border-neel/10">
        <p className="text-small text-neel/80 font-body">
          <span className="font-bold">{language === "hi" ? "पता: " : "Address: "}</span>
          {center.address}
        </p>
      </div>
    </div>
  );
}
