/**
 * Notion-integration: FGCNORD Admin Docs-databasen fungerer som CMS for de
 * offentlige guides på /docs. Kun guides med Status = "Published" i Notion
 * bliver vist på sitet — drafts forbliver interne.
 *
 * Kræver env-secret NOTION_TOKEN (integration token fra notion.so/my-integrations;
 * integrationen skal have adgang til siden hvor docs-databasen ligger).
 * Valgfri env-var NOTION_DOCS_DB_ID springer auto-opslaget af databasen over.
 */

import { ResponseError, type Env } from "./api";

const NOTION_API = "https://api.notion.com/v1";
// Fastlåst version: giver det klassiske databases-API (undgår data-sources-split)
const NOTION_VERSION = "2022-06-28";
const DOCS_DB_TITLE = "FGCNORD Admin Docs";
const CACHE_CONTROL = "public, max-age=300";

export { CACHE_CONTROL as DOCS_CACHE_CONTROL };

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

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function requireNotion(env: Env): string {
  if (!env.NOTION_TOKEN) {
    throw new ResponseError("Docs-integrationen er ikke sat op endnu.", 503);
  }
  return env.NOTION_TOKEN;
}

async function notionRequest<T>(
  env: Env,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = requireNotion(env);
  const res = await fetch(`${NOTION_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  if (!res.ok) {
    console.error("Notion API fejl:", res.status, await res.text());
    throw new ResponseError("Kunne ikke hente guides lige nu.", 502);
  }
  return (await res.json()) as T;
}

interface NotionSearchResult {
  results: {
    id: string;
    object: string;
    title?: { plain_text: string }[];
  }[];
}

let cachedDbId: string | null = null;

/** Find docs-databasens id — env-var først, ellers auto-opslag på titlen. */
async function getDocsDatabaseId(env: Env): Promise<string> {
  if (env.NOTION_DOCS_DB_ID) return env.NOTION_DOCS_DB_ID;
  if (cachedDbId) return cachedDbId;
  const data = await notionRequest<NotionSearchResult>(env, "/search", {
    method: "POST",
    body: JSON.stringify({
      filter: { property: "object", value: "database" },
      page_size: 25,
    }),
  });
  const db = data.results.find(
    (r) =>
      r.object === "database" &&
      (r.title ?? []).map((t) => t.plain_text).join("") === DOCS_DB_TITLE,
  );
  if (!db) {
    throw new ResponseError("Docs-databasen blev ikke fundet i Notion.", 404);
  }
  cachedDbId = db.id;
  return db.id;
}

interface NotionPage {
  id: string;
  last_edited_time: string;
  properties: {
    Name?: { title: { plain_text: string }[] };
    Category?: { select: { name: string } | null };
    Games?: { multi_select: { name: string }[] };
  };
}

interface NotionQueryResult {
  results: NotionPage[];
  has_more: boolean;
  next_cursor: string | null;
}

function pageToSummary(page: NotionPage): DocSummary {
  const title = (page.properties.Name?.title ?? [])
    .map((t) => t.plain_text)
    .join("");
  return {
    slug: slugify(title),
    title,
    category: page.properties.Category?.select?.name ?? "General",
    games: (page.properties.Games?.multi_select ?? []).map((g) => g.name),
    lastEdited: page.last_edited_time,
  };
}

/** Alle guides med Status = Published, alfabetisk. */
export async function listPublishedGuides(env: Env): Promise<DocSummary[]> {
  const dbId = await getDocsDatabaseId(env);
  const pages: NotionPage[] = [];
  let cursor: string | undefined;
  do {
    const data: NotionQueryResult = await notionRequest<NotionQueryResult>(
      env,
      `/databases/${dbId}/query`,
      {
        method: "POST",
        body: JSON.stringify({
          filter: { property: "Status", select: { equals: "Published" } },
          sorts: [{ property: "Name", direction: "ascending" }],
          page_size: 100,
          ...(cursor ? { start_cursor: cursor } : {}),
        }),
      },
    );
    pages.push(...data.results);
    cursor = data.has_more ? (data.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return pages.map(pageToSummary).filter((g) => g.slug);
}

interface NotionBlock {
  type: string;
  [key: string]: unknown;
}

interface NotionChildrenResult {
  results: NotionBlock[];
  has_more: boolean;
  next_cursor: string | null;
}

const BLOCK_TYPE_MAP: Record<string, DocBlock["type"]> = {
  heading_1: "h1",
  heading_2: "h2",
  heading_3: "h3",
  paragraph: "p",
  bulleted_list_item: "li-bullet",
  numbered_list_item: "li-number",
  callout: "callout",
  divider: "divider",
};

interface RichTextItem {
  plain_text: string;
  annotations?: { bold?: boolean };
}

function blockToDocBlock(block: NotionBlock): DocBlock | null {
  const type = BLOCK_TYPE_MAP[block.type];
  if (!type) return null;
  if (type === "divider") return { type };
  const payload = block[block.type] as { rich_text?: RichTextItem[] } | undefined;
  const segments: DocSegment[] = (payload?.rich_text ?? []).map((r) => ({
    text: r.plain_text,
    ...(r.annotations?.bold ? { bold: true } : {}),
  }));
  return { type, segments };
}

/** Én udgivet guide inkl. indhold. Null hvis slug ikke findes. */
export async function getPublishedGuide(
  env: Env,
  slug: string,
): Promise<DocGuide | null> {
  const guides = await listPublishedGuides(env);
  const summary = guides.find((g) => g.slug === slug);
  if (!summary) return null;

  // Vi skal bruge side-id'et — hent listen igen med sider (billig nok til vores skala)
  const dbId = await getDocsDatabaseId(env);
  const data = await notionRequest<NotionQueryResult>(
    env,
    `/databases/${dbId}/query`,
    {
      method: "POST",
      body: JSON.stringify({
        filter: { property: "Status", select: { equals: "Published" } },
        page_size: 100,
      }),
    },
  );
  const page = data.results.find((p) => pageToSummary(p).slug === slug);
  if (!page) return null;

  const blocks: DocBlock[] = [];
  let cursor: string | undefined;
  do {
    const children: NotionChildrenResult =
      await notionRequest<NotionChildrenResult>(
        env,
        `/blocks/${page.id}/children?page_size=100${cursor ? `&start_cursor=${cursor}` : ""}`,
      );
    for (const child of children.results) {
      const docBlock = blockToDocBlock(child);
      if (docBlock) blocks.push(docBlock);
    }
    cursor = children.has_more ? (children.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return { ...summary, blocks };
}
