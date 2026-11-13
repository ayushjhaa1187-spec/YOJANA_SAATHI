"use client";

import React from "react";

interface SchemeIconProps {
  category?: string;
  className?: string;
}

export function SchemeIcon({ category, className = "text-3xl" }: SchemeIconProps) {
  switch (category?.toLowerCase()) {
    case "pension":
      return (
        <span className={className} role="img" aria-label="पेंशन (Pension)">
          🪙
        </span>
      );
    case "health":
      return (
        <span className={className} role="img" aria-label="स्वास्थ्य (Health)">
          ✚
        </span>
      );
    case "food":
      return (
        <span className={className} role="img" aria-label="खाद्य (Food)">
          🌾
        </span>
      );
    case "energy":
      return (
        <span className={className} role="img" aria-label="ऊर्जा (Energy)">
          🔥
        </span>
      );
    case "housing":
      return (
        <span className={className} role="img" aria-label="आवास (Housing)">
          🏠
        </span>
      );
    default:
      return (
        <span className={className} role="img" aria-label="योजना (Scheme)">
          📜
        </span>
      );
  }
}
