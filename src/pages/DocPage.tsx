import { Fragment, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Lightbulb } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { getDoc, type DocBlock, type DocGuide, type DocSegment } from "@/lib/docsApi";

function Segments({ segments }: { segments?: DocSegment[] }) {
  return (
    <>
      {(segments ?? []).map((seg, i) =>
        seg.bold ? (
          <strong key={i}>{seg.text}</strong>
        ) : (
          <Fragment key={i}>{seg.text}</Fragment>
        ),
      )}
    </>
  );
}

/** Gruppér på hinanden følgende listepunkter til én <ul>/<ol>. */
function groupBlocks(blocks: DocBlock[]): DocBlock[][] {
  const groups: DocBlock[][] = [];
  for (const block of blocks) {
    const prev = groups[groups.length - 1];
    const isList = block.type === "li-bullet" || block.type === "li-number";
    if (isList && prev && prev[0].type === block.type) {
      prev.push(block);
    } else {
      groups.push([block]);
    }
  }
  return groups;
}

function BlockGroup({ group }: { group: DocBlock[] }) {
  const first = group[0];
  switch (first.type) {
    case "h1":
      return null; // titlen står allerede i PageHeader
    case "h2":
      return (
        <h2 className="mt-10 font-heading text-2xl font-bold text-ink">
          <Segments segments={first.segments} />
        </h2>
      );
    case "h3":
      return (
        <h3 className="mt-8 font-heading text-xl font-bold text-ink">
          <Segments segments={first.segments} />
        </h3>
      );
    case "li-bullet":
      return (
        <ul className="mt-4 list-disc space-y-1.5 pl-6 text-ink/85">
          {group.map((item, i) => (
            <li key={i}>
              <Segments segments={item.segments} />
            </li>
          ))}
        </ul>
      );
    case "li-number":
      return (
        <ol className="mt-4 list-decimal space-y-1.5 pl-6 text-ink/85">
          {group.map((item, i) => (
            <li key={i}>
              <Segments segments={item.segments} />
            </li>
          ))}
        </ol>
      );
    case "callout":
      return (
        <div className="mt-6 flex items-start gap-3 rounded-xl border-2 border-brick bg-brick/10 p-4">
          <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-brick" aria-hidden="true" />
          <p className="text-[15px] text-ink/85">
            <Segments segments={first.segments} />
          </p>
        </div>
      );
    case "divider":
      return <hr className="my-10 border-t-2 border-ink/10" />;
    default:
      return (
        <p className="mt-4 leading-relaxed text-ink/85">
          <Segments segments={first.segments} />
        </p>
      );
  }
}

/** /docs/:slug — én udgivet guide. */
export function DocPage() {
  const { slug } = useParams<{ slug: string }>();
  const [guide, setGuide] = useState<DocGuide | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    getDoc(slug)
      .then((data) => setGuide(data.guide))
      .catch((err: Error) => setError(err.message));
  }, [slug]);

  return (
    <>
      <PageHeader
        eyebrow={guide?.category ?? "Guide"}
        title={guide?.title ?? "Henter guide…"}
        description={
          guide
            ? `Opdateret ${new Date(guide.lastEdited).toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" })}`
            : undefined
        }
      >
        <Link
          to="/docs"
          className="inline-flex items-center gap-2 font-heading text-sm font-bold uppercase tracking-wide text-brick hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Alle guides
        </Link>
      </PageHeader>
      <section className="section-padding bg-cream">
        <div className="container-site px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            {error && (
              <div className="rounded-xl border-2 border-ink bg-cream-dim p-6 text-center text-ink/70 shadow-poster">
                <p className="font-heading font-bold">Guiden kunne ikke hentes</p>
                <p className="mt-1 text-sm">{error}</p>
              </div>
            )}
            {!error && guide === null && (
              <p className="text-center text-ink/60">Henter…</p>
            )}
            {guide &&
              groupBlocks(guide.blocks).map((group, i) => (
                <BlockGroup key={i} group={group} />
              ))}
            {guide && (
              <p className="mt-12 flex items-center gap-1.5 border-t-2 border-ink/10 pt-6 text-xs text-ink/50">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                Denne guide vedligeholdes i FGC Nords Notion og opdateres her automatisk.
              </p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
