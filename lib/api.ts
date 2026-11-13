import { Profile, Match, Document, Center } from "./types";

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

async function fetchWithRetry<T>(
  url: string,
  options: RequestInit,
  retries = 1,
  timeoutMs = 10000
): Promise<ApiResult<T>> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timer);

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        return {
          ok: false,
          error: {
            code: json?.error?.code || `HTTP_${response.status}`,
            message: json?.error?.message || response.statusText || "Request failed",
          },
        };
      }

      return { ok: true, data: json as T };
    } catch (err: any) {
      clearTimeout(timer);
      const isLastAttempt = attempt === retries;
      if (isLastAttempt) {
        const isTimeout = err?.name === "AbortError";
        return {
          ok: false,
          error: {
            code: isTimeout ? "TIMEOUT" : "NETWORK_ERROR",
            message: isTimeout
              ? "Request timed out after 10 seconds"
              : err?.message || "Network request failed",
          },
        };
      }
    }
  }

  return {
    ok: false,
    error: { code: "UNKNOWN_ERROR", message: "Unexpected failure in request" },
  };
}

export const api = {
  understand: async (params: {
    transcript: string;
    currentProfile?: Partial<Profile>;
    language?: "hi" | "en";
  }) => {
    return fetchWithRetry<{
      profile: Profile;
      missingFields: (keyof Profile)[];
      nextQuestion: { field: keyof Profile; text: string; text_hi: string; text_en: string; options?: any[] } | null;
    }>("/api/understand", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
  },

  match: async (params: { profile: Partial<Profile> }) => {
    return fetchWithRetry<{ matches: Match[] }>("/api/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
  },

  getSchemeDocuments: async (id: string) => {
    return fetchWithRetry<{
      scheme: { id: string; name_hi: string; name_en: string; apply_url: string };
      documents: Document[];
    }>(`/api/schemes/${encodeURIComponent(id)}/documents`, {
      method: "GET",
    });
  },

  getCenters: async (district?: string) => {
    const query = district ? `?district=${encodeURIComponent(district)}` : "";
    return fetchWithRetry<{ centers: Center[] }>(`/api/centers${query}`, {
      method: "GET",
    });
  },
};
