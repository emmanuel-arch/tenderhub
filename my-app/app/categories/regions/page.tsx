import Link from "next/link";
import { ArrowLeft, ArrowRight, Map as MapIcon } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BackdropImage } from "@/components/backdrop-image";
import {
  countiesInRegion,
  regionImagePath,
  REGIONS,
  RegionSlug,
} from "@/lib/counties";
import { getLensAggregations } from "@/lib/tenders";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export default async function RegionsIndexPage() {
  const agg = await getLensAggregations();
  const regionCounts = new Map(agg.byRegion.map((r) => [r.slug, r.count]));

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
          Tenders by region
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
          Explore opportunities in your region — Kenya's 47 counties grouped
          into 8 regional clusters.
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {REGIONS.map((r) => (
            <Link
              key={r.slug}
              href={`/categories/regions/${r.slug}`}
              className="group relative isolate flex h-56 flex-col justify-end overflow-hidden rounded-3xl p-6 ring-1 ring-slate-200/70 transition-all hover:-translate-y-1 hover:shadow-xl dark:ring-white/10"
            >
              <div className="pointer-events-none absolute inset-0 -z-10">
                <BackdropImage
                  src={regionImagePath(r.slug as RegionSlug)}
                  overlayClass="bg-gradient-to-t from-slate-950/85 via-slate-900/55 to-slate-900/15"
                  tint="#10B981"
                />
              </div>
              <div className="relative flex items-center gap-2 text-white">
                <MapIcon className="h-4 w-4 text-emerald-300" />
                <span className="text-[11px] font-semibold uppercase tracking-widest">
                  {countiesInRegion(r.slug).length} counties
                </span>
              </div>
              <h3 className="relative mt-2 font-display text-xl text-white">
                {r.label}
              </h3>
              <p className="relative mt-1 line-clamp-2 text-xs text-white/75">
                {r.tagline}
              </p>
              <div className="relative mt-3 inline-flex items-center gap-1 text-sm font-semibold text-emerald-200">
                {(regionCounts.get(r.slug) ?? 0).toLocaleString()} live tenders
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
