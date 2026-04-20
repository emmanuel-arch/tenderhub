import Link from "next/link";
import { ArrowLeft, Database } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getLensAggregations } from "@/lib/tenders";

export const dynamic = "force-dynamic";
export const revalidate = 300;

const SOURCE_LABELS: Record<string, { label: string; description: string }> = {
  EGP: {
    label: "Electronic Government Procurement",
    description: "egpkenya.go.ke — flagship national e-procurement system.",
  },
  "tenders.go.ke": {
    label: "tenders.go.ke",
    description:
      "Public procurement portal aggregating county and ministry tenders.",
  },
  kengen: {
    label: "KenGen",
    description: "Kenya Electricity Generating Company tender portal.",
  },
  AFA: {
    label: "Agriculture & Food Authority",
    description: "AFA agricultural sector tenders.",
  },
  KRA: {
    label: "Kenya Revenue Authority",
    description: "Kenya Revenue Authority procurement.",
  },
  redcross: {
    label: "Kenya Red Cross",
    description: "NGO tenders from the Kenya Red Cross Society.",
  },
};

export default async function SourcesPage() {
  const agg = await getLensAggregations();

  return (
    <div className="min-h-screen bg-white dark:bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href="/categories"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-emerald-300"
        >
          <ArrowLeft className="h-4 w-4" /> Back to all categories
        </Link>
        <h1 className="mt-4 font-display text-3xl text-slate-900 dark:text-slate-50">
          Source portals
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
          Where each tender originated. Tenders are scraped continuously from
          these public portals.
        </p>

        <div className="mt-8 space-y-3">
          {agg.bySource.map((s) => {
            const meta = SOURCE_LABELS[s.slug] ?? {
              label: s.slug,
              description: "",
            };
            return (
              <Link
                key={s.slug}
                href={`/tenders?search=${encodeURIComponent(s.slug)}`}
                className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md dark:border-white/10 dark:bg-slate-900/50 dark:hover:border-emerald-400/30"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                    <Database className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-display text-lg text-slate-900 dark:text-slate-50">
                      {meta.label}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {meta.description}
                    </div>
                  </div>
                </div>
                <div className="font-display text-xl text-slate-900 dark:text-emerald-300">
                  {s.count.toLocaleString()}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
