import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, MapPin } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BackdropImage } from "@/components/backdrop-image";
import {
  countiesInRegion,
  countyImagePath,
  regionImagePath,
  REGIONS,
  RegionSlug,
} from "@/lib/counties";
import { getLensAggregations } from "@/lib/tenders";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export async function generateStaticParams() {
  return REGIONS.map((r) => ({ slug: r.slug }));
}

export default async function RegionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const region = REGIONS.find((r) => r.slug === slug);
  if (!region) notFound();

  const counties = countiesInRegion(slug as RegionSlug);
  const agg = await getLensAggregations();
  const countyCounts = new Map(agg.byCounty.map((c) => [c.slug, c.count]));
  const total = agg.byRegion.find((r) => r.slug === slug)?.count ?? 0;

  return (
    <div className="min-h-screen bg-white dark:bg-background">
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-slate-200 dark:border-white/10">
        <BackdropImage
          src={regionImagePath(slug as RegionSlug)}
          overlayClass="bg-gradient-to-br from-slate-950/85 via-slate-900/65 to-slate-950/90"
          tint="#10B981"
          priority
        />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16 text-white">
          <Link
            href="/categories/regions"
            className="inline-flex items-center gap-1.5 text-sm text-white/85 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> All regions
          </Link>
          <h1 className="mt-5 font-display text-4xl sm:text-5xl">{region.label}</h1>
          <p className="mt-2 max-w-2xl text-base text-white/85">
            {region.tagline}. {total.toLocaleString()} live tenders across{" "}
            {counties.length} counties.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {counties.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-400">
            National-level tenders aren't filtered by county. Use the main
            tender browser to view them.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {counties.map((c) => {
              const n = countyCounts.get(c.slug) ?? 0;
              return (
                <Link
                  key={c.slug}
                  href={`/categories/counties/${c.slug}`}
                  className="group relative isolate flex h-44 flex-col justify-end overflow-hidden rounded-2xl ring-1 ring-slate-200/70 p-4 transition-all hover:-translate-y-1 hover:shadow-xl dark:ring-white/10"
                >
                  <div className="pointer-events-none absolute inset-0 -z-10">
                    <BackdropImage
                      src={countyImagePath(c.slug)}
                      overlayClass="bg-gradient-to-t from-slate-950/85 via-slate-900/55 to-slate-900/15"
                      tint="#10B981"
                    />
                  </div>
                  <div className="relative flex items-center gap-1.5 text-emerald-200 text-[11px] font-semibold uppercase tracking-widest">
                    <MapPin className="h-3 w-3" />
                    {n.toLocaleString()} live
                  </div>
                  <h3 className="relative mt-2 font-display text-lg text-white">
                    {c.name}
                  </h3>
                  <div className="relative mt-1 inline-flex items-center gap-1 text-xs font-semibold text-white/85">
                    Open
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
