import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  Building2,
  Compass,
  Database,
  FileSearch,
  Inbox,
  Map as MapIcon,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BackdropImage } from "@/components/backdrop-image";
import { getLensAggregations } from "@/lib/tenders";
import { SECTORS, sectorImagePath, getSector } from "@/lib/sectors";
import {
  REGIONS,
  countiesInRegion,
  regionImagePath,
} from "@/lib/counties";
import { BOND_BUCKETS, getBondBucket } from "@/lib/bond-buckets";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export default async function CategoriesPage() {
  const agg = await getLensAggregations();

  const bondCounts = new Map(agg.byBondBucket.map((b) => [b.slug, b.count]));
  const sectorCounts = new Map(agg.bySector.map((s) => [s.slug, s.count]));
  const regionCounts = new Map(agg.byRegion.map((r) => [r.slug, r.count]));

  return (
    <div className="min-h-screen bg-white dark:bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 dark:border-white/10">
        <BackdropImage
          src="/hero/categories-hero.jpg"
          tint="#10B981"
          overlayClass="bg-gradient-to-br from-slate-950/85 via-slate-900/65 to-slate-950/90"
          priority
        />
        <div className="relative mx-auto max-w-7xl px-4 py-16 text-white sm:px-6 lg:px-8 lg:py-20">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest backdrop-blur ring-1 ring-white/20">
            <Compass className="h-3 w-3" /> Explore
          </div>
          <h1 className="mt-4 max-w-3xl font-display text-4xl leading-tight sm:text-5xl">
            {agg.totalActive.toLocaleString()} live tenders, sliced six
            different ways.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-white/85">
            Drill into Kenyan public procurement by sector, county, bond size,
            procurement method, source portal, or submission format. Each
            cluster is rendered with imagery and a brand palette so you can
            scan opportunities at a glance.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-16 px-4 py-12 sm:px-6 lg:px-8">
        {/* Sectors */}
        <Lens
          eyebrow="By sector"
          title="What's being procured"
          description="16 sector clusters derived from titles and descriptions across all sources."
          ctaLabel="See all sectors"
          ctaHref="/categories/sectors"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {SECTORS.filter((s) => s.slug !== "general")
              .sort(
                (a, b) =>
                  (sectorCounts.get(b.slug) ?? 0) - (sectorCounts.get(a.slug) ?? 0),
              )
              .slice(0, 8)
              .map((s) => (
                <SectorTile
                  key={s.slug}
                  slug={s.slug}
                  count={sectorCounts.get(s.slug) ?? 0}
                />
              ))}
          </div>
        </Lens>

        {/* Counties / Regions */}
        <Lens
          eyebrow="By location"
          title="Counties & regions"
          description="Tenders grouped by Kenya's 47 counties, organised into eight regional clusters."
          ctaLabel="Browse all counties"
          ctaHref="/categories/regions"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {REGIONS.filter((r) => r.slug !== "national")
              .sort(
                (a, b) =>
                  (regionCounts.get(b.slug) ?? 0) - (regionCounts.get(a.slug) ?? 0),
              )
              .map((r) => (
                <RegionTile
                  key={r.slug}
                  slug={r.slug}
                  label={r.label}
                  tagline={r.tagline}
                  count={regionCounts.get(r.slug) ?? 0}
                  countyCount={countiesInRegion(r.slug).length}
                />
              ))}
          </div>
        </Lens>

        {/* Bond size */}
        <Lens
          eyebrow="By bid-bond size"
          title="Match opportunities to your balance sheet"
          description="Every tender bucketed from micro-SME to mega-project so you can filter by what your company can credibly pursue."
          ctaLabel="Open bond explorer"
          ctaHref="/categories/bond"
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {BOND_BUCKETS.filter((b) => b.slug !== "unspecified").map((b) => (
              <BondTile
                key={b.slug}
                slug={b.slug}
                count={bondCounts.get(b.slug) ?? 0}
              />
            ))}
            <BondTile
              key="unspecified"
              slug="unspecified"
              count={bondCounts.get("unspecified") ?? 0}
            />
          </div>
        </Lens>

        {/* Procurement method + source + format */}
        <div className="grid gap-6 lg:grid-cols-3">
          <SimpleLens
            icon={FileSearch}
            title="Procurement method"
            description="Open Tender, RFQ, Framework, EOI and more."
            href="/categories/methods"
            items={agg.byMethod.slice(0, 6)}
          />
          <SimpleLens
            icon={Database}
            title="Source portals"
            description="EGP, tenders.go.ke, KenGen, AFA, KRA, Red Cross."
            href="/categories/sources"
            items={agg.bySource}
          />
          <SimpleLens
            icon={Inbox}
            title="Submission format"
            description="Drop-box, electronic upload, or hybrid."
            href="/categories/submission"
            items={agg.bySubmissionMethod}
          />
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}

function Lens({
  eyebrow,
  title,
  description,
  ctaHref,
  ctaLabel,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  ctaHref: string;
  ctaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
            {eyebrow}
          </div>
          <h2 className="mt-1 font-display text-2xl text-slate-900 dark:text-slate-50 sm:text-3xl">
            {title}
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            {description}
          </p>
        </div>
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200"
        >
          {ctaLabel}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function SectorTile({ slug, count }: { slug: string; count: number }) {
  const s = getSector(slug);
  return (
    <Link
      href={`/categories/sectors/${s.slug}`}
      className={`group relative isolate flex h-44 flex-col justify-end overflow-hidden rounded-3xl p-5 ring-1 transition-all hover:-translate-y-1 hover:shadow-xl ${s.glassClass}`}
    >
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.40] dark:opacity-[0.45]">
        <BackdropImage
          src={sectorImagePath(s.slug)}
          tint={s.accent}
          overlayClass="bg-gradient-to-t from-white/85 via-white/40 to-white/0 dark:from-slate-950/85 dark:via-slate-950/55 dark:to-slate-950/10"
        />
      </div>
      <div
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-lg"
        style={{ backgroundColor: s.accent }}
      >
        <s.icon className="h-4 w-4" />
      </div>
      <div className="mt-3">
        <div className={`text-[10px] font-bold uppercase tracking-widest ${s.accentTextClass}`}>
          {count.toLocaleString()} live
        </div>
        <div className="mt-0.5 font-display text-base text-slate-900 dark:text-slate-50">
          {s.label}
        </div>
      </div>
    </Link>
  );
}

function RegionTile({
  slug,
  label,
  tagline,
  count,
  countyCount,
}: {
  slug: string;
  label: string;
  tagline: string;
  count: number;
  countyCount: number;
}) {
  return (
    <Link
      href={`/categories/regions/${slug}`}
      className="group relative isolate flex h-48 flex-col justify-end overflow-hidden rounded-3xl p-5 ring-1 ring-slate-200/70 transition-all hover:-translate-y-1 hover:shadow-xl dark:ring-white/10"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <BackdropImage
          src={regionImagePath(slug as never)}
          overlayClass="bg-gradient-to-t from-slate-950/85 via-slate-900/55 to-slate-900/15"
          tint="#10B981"
        />
      </div>
      <div className="relative flex items-center gap-2 text-white">
        <MapIcon className="h-4 w-4 text-emerald-300" />
        <span className="text-[11px] font-semibold uppercase tracking-widest">
          {countyCount} counties
        </span>
      </div>
      <h3 className="relative mt-2 font-display text-xl text-white">{label}</h3>
      <p className="relative mt-1 line-clamp-2 text-xs text-white/75">
        {tagline}
      </p>
      <div className="relative mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-200">
        {count.toLocaleString()} live tenders
        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

function BondTile({ slug, count }: { slug: string; count: number }) {
  const b = getBondBucket(slug);
  if (!b) return null;
  return (
    <Link
      href={`/categories/bond/${b.slug}`}
      className={`group relative flex flex-col gap-2 rounded-3xl p-5 backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-xl ${b.glassClass}`}
    >
      <div
        className={`inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 dark:bg-white/10 ${b.accentTextClass}`}
      >
        <Banknote className="h-4 w-4" />
      </div>
      <div>
        <div
          className={`text-[10px] font-bold uppercase tracking-widest ${b.accentTextClass}`}
        >
          {b.short}
        </div>
        <div className="mt-1 font-display text-base text-slate-900 dark:text-slate-50">
          {b.label}
        </div>
        <div className="mt-1 text-xs text-slate-600 line-clamp-2 dark:text-slate-400">
          {b.description}
        </div>
      </div>
      <div
        className={`mt-2 text-sm font-semibold ${b.accentTextClass}`}
      >
        {count.toLocaleString()} tenders
      </div>
    </Link>
  );
}

function SimpleLens({
  icon: Icon,
  title,
  description,
  href,
  items,
}: {
  icon: typeof Building2;
  title: string;
  description: string;
  href: string;
  items: { slug: string; count: number }[];
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-3xl border border-slate-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg dark:border-white/10 dark:bg-slate-900/50 dark:hover:border-emerald-400/30"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h3 className="font-display text-lg text-slate-900 dark:text-slate-50">
            {title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>
      </div>
      <div className="mt-5 space-y-1.5">
        {items.slice(0, 6).map((it) => (
          <div
            key={it.slug}
            className="flex items-center justify-between rounded-lg px-3 py-1.5 text-xs hover:bg-slate-50 dark:hover:bg-white/5"
          >
            <span className="truncate text-slate-700 dark:text-slate-300">
              {it.slug}
            </span>
            <span className="font-display text-slate-900 dark:text-slate-100">
              {it.count.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
        Open lens
        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
