import Link from "next/link";
import { ArrowLeft, ArrowRight, Banknote } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BOND_BUCKETS } from "@/lib/bond-buckets";
import { getLensAggregations } from "@/lib/tenders";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export default async function BondIndexPage() {
  const agg = await getLensAggregations();
  const counts = new Map(agg.byBondBucket.map((b) => [b.slug, b.count]));

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
          Tenders by bid-bond size
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
          Filter procurement opportunities by the size of the bid bond — from
          micro-SME jobs through to mega flagship projects.
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {BOND_BUCKETS.map((b) => (
            <Link
              key={b.slug}
              href={`/categories/bond/${b.slug}`}
              className={`group flex flex-col gap-3 rounded-3xl p-6 backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-xl ${b.glassClass}`}
            >
              <div
                className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 dark:bg-white/10 ${b.accentTextClass}`}
              >
                <Banknote className="h-4 w-4" />
              </div>
              <div>
                <div
                  className={`text-[10px] font-bold uppercase tracking-widest ${b.accentTextClass}`}
                >
                  {b.short}
                </div>
                <h3 className="mt-1 font-display text-lg text-slate-900 dark:text-slate-50">
                  {b.label}
                </h3>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  {b.description}
                </p>
              </div>
              <div className={`mt-1 flex items-center gap-1 text-sm font-semibold ${b.accentTextClass}`}>
                {(counts.get(b.slug) ?? 0).toLocaleString()} tenders
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
