const API_BASE = "/api";

export interface DocSummary {
  slug: string;
  title: string;
  category: string;
  games: string[];
  lastEdited: string;
}

export interface DocSegment {
  text: string;
  bold?: boolean;
}

export interface DocBlock {
  type: "h1" | "h2" | "h3" | "p" | "li-bullet" | "li-number" | "callout" | "divider";
  segments?: DocSegment[];
}

export interface DocGuide extends DocSummary {
  blocks: DocBlock[];
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { credentials: "same-origin" });
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new Error(data.error || "Noget gik galt.");
  return data;
}

/** Liste over udgivne guides (kun Status = Published i Notion). */
export function getDocs(): Promise<{ docs: DocSummary[] }> {
  return fetchJson("/docs");
}

/** Én guide inkl. indhold. */
export function getDoc(slug: string): Promise<{ guide: DocGuide }> {
  return fetchJson(`/docs/${encodeURIComponent(slug)}`);
}
