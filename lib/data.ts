import schemesData from "@/data/schemes.json";
import documentsData from "@/data/documents.json";
import centersData from "@/data/centers.json";
import { Scheme, Document, Center } from "./types";

const schemes: Scheme[] = schemesData as Scheme[];
const documents: Document[] = documentsData as Document[];
const centers: Center[] = centersData as Center[];

export function getSchemes(): Scheme[] {
  return schemes;
}

export function getScheme(id: string): Scheme | undefined {
  return schemes.find((s) => s.id === id);
}

export function getDocument(id: string): Document | undefined {
  return documents.find((d) => d.id === id);
}

export function getDocumentsForScheme(id: string): Document[] {
  const scheme = getScheme(id);
  if (!scheme) return [];
  return scheme.document_ids
    .map((docId) => getDocument(docId))
    .filter((doc): doc is Document => doc !== undefined);
}

export function getCenters(district?: string | null): Center[] {
  if (!district || !district.trim()) {
    return centers;
  }
  const normalizedDistrict = district.trim().toLowerCase();
  const matched = centers.filter(
    (c) => c.district.toLowerCase() === normalizedDistrict
  );
  // Fall back to all centers if the district is unknown
  return matched.length > 0 ? matched : centers;
}
