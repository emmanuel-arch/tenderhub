import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BackdropImage } from "@/components/backdrop-image";
import { SECTORS, sectorImagePath } from "@/lib/sectors";
import { getLensAggregations } from "@/lib/tenders";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export default async function SectorsIndexPage() {
  const agg = await getLensAggregations();
  const counts = new Map(agg.bySector.map((s) => [s.slug, s.count]));

  return (
    <div className="min-h-screen bg-white dark:bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href="/categories"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-emerald-300"
        >
          <ArrowLeft className="h-4 w-4" /> Back to all categories
        </Link>
        <h1 className="mt-4 font-display text-3xl text-slate-900 dark:text-slate-50">
          All sectors
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
          16 sector clusters spanning {agg.totalActive.toLocaleString()} live
          tenders.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {SECTORS.filter((s) => s.slug !== "general").map((s) => {
            const n = counts.get(s.slug) ?? 0;
            return (
              <Link
                key={s.slug}
                href={`/categories/sectors/${s.slug}`}
                className={`group relative isolate flex h-48 flex-col justify-end overflow-hidden rounded-3xl p-5 ring-1 transition-all hover:-translate-y-1 hover:shadow-xl ${s.glassClass}`}
              >
                <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.40] dark:opacity-[0.50]">
                  <BackdropImage
                    src={sectorImagePath(s.slug)}
                    tint={s.accent}
                    overlayClass="bg-gradient-to-t from-white/85 via-white/50 to-white/0 dark:from-slate-950/85 dark:via-slate-950/55 dark:to-slate-950/10"
                  />
                </div>
                <div
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-lg"
                  style={{ backgroundColor: s.accent }}
                >
                  <s.icon className="h-4 w-4" />
                </div>
                <div className="mt-3">
                  <div
                    className={`text-[10px] font-bold uppercase tracking-widest ${s.accentTextClass}`}
                  >
                    {n.toLocaleString()} live tenders
                  </div>
                  <div className="mt-0.5 font-display text-base text-slate-900 dark:text-slate-50">
                    {s.label}
                  </div>
                  <div className="mt-1 text-xs text-slate-600 line-clamp-2 dark:text-slate-300">
                    {s.description}
                  </div>
                </div>
                <div className={`mt-3 inline-flex items-center gap-1 text-xs font-semibold ${s.accentTextClass}`}>
                  Open
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
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
