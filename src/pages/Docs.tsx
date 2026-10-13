import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { getDocs, type DocSummary } from "@/lib/docsApi";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("da-DK", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** /docs — udgivne guides fra Notion (kun Status = Published). */
export function Docs() {
  const [docs, setDocs] = useState<DocSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDocs()
      .then((data) => setDocs(data.docs))
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="Videnbank"
        title="Guides & docs"
        description="Opsætningsguides og playbook til events og streaming — skrevet i vores Notion, udgivet her automatisk."
      />
      <section className="section-padding bg-cream">
        <div className="container-site px-4 sm:px-6 lg:px-8">
          {error && (
            <div className="rounded-xl border-2 border-ink bg-cream-dim p-6 text-center text-ink/70 shadow-poster">
              <p className="font-heading font-bold">Guides er ikke tilgængelige lige nu</p>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          )}

          {!error && docs === null && (
            <p className="text-center text-ink/60">Henter guides…</p>
          )}

          {!error && docs !== null && docs.length === 0 && (
            <div className="rounded-xl border-2 border-ink bg-cream-dim p-6 text-center text-ink/70 shadow-poster">
              <BookOpen className="mx-auto mb-2 h-6 w-6 text-brick" aria-hidden="true" />
              <p>Der er ikke udgivet nogen guides endnu — vi arbejder på det.</p>
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(docs ?? []).map((doc) => (
              <Link
                key={doc.slug}
                to={`/docs/${doc.slug}`}
                className="group flex flex-col rounded-xl border-2 border-ink bg-white p-6 shadow-poster transition-transform duration-200 hover:-translate-y-1"
              >
                <span className="inline-block w-fit rounded-full bg-brick px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                  {doc.category}
                </span>
                <h2 className="mt-3 font-heading text-xl font-bold text-ink group-hover:text-brick">
                  {doc.title}
                </h2>
                {doc.games.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {doc.games.map((game) => (
                      <span
                        key={game}
                        className="rounded-full border border-ink/20 px-2 py-0.5 text-[11px] text-ink/60"
                      >
                        {game}
                      </span>
                    ))}
                  </div>
                )}
                <p className="mt-4 flex items-center gap-1.5 text-xs text-ink/50">
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                  Opdateret {formatDate(doc.lastEdited)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
