import { describe, it, expect } from "vitest";
import { t } from "../lib/i18n";

describe("i18n library", () => {
  it("translates app title in Hindi and English", () => {
    expect(t("app_title", "hi")).toBe("योजना साथी");
    expect(t("app_title", "en")).toBe("Yojana Saathi");
  });

  it("translates home headline", () => {
    expect(t("home_headline", "hi")).toBe("आपके लिए कौन सी सरकारी योजना है?");
    expect(t("home_headline", "en")).toBe("Which government schemes are you eligible for?");
  });

  it("handles string parameter interpolation", () => {
    const text = t("step_indicator", "hi", { current: 1, total: 3 });
    expect(text).toBe("कदम 1 / 3");
  });
});
