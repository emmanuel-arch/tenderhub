import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BackdropImage } from "@/components/backdrop-image";
import { TenderCard } from "@/components/tender-card";
import { SECTORS, SectorSlug, sectorImagePath } from "@/lib/sectors";
import { getSectorTenders } from "@/lib/tenders";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export async function generateStaticParams() {
  return SECTORS.filter((s) => s.slug !== "general").map((s) => ({
    slug: s.slug,
  }));
}

export default async function SectorDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!SECTORS.some((s) => s.slug === slug)) notFound();

  const { sector, tenders, total } = await getSectorTenders(
    slug as SectorSlug,
    36,
  );

  return (
    <div className="min-h-screen bg-white dark:bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 dark:border-white/10">
        <BackdropImage
          src={sectorImagePath(sector.slug)}
          tint={sector.accent}
          overlayClass="bg-gradient-to-br from-slate-950/85 via-slate-900/65 to-slate-950/90"
          priority
        />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16 text-white">
          <Link
            href="/categories/sectors"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white/85 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> All sectors
          </Link>
          <div
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest backdrop-blur ring-1 ring-white/20"
            style={{ color: sector.accent }}
          >
            <sector.icon className="h-3 w-3" />
            {sector.shortLabel}
          </div>
          <h1 className="mt-3 max-w-3xl font-display text-4xl leading-tight sm:text-5xl">
            {sector.label}
          </h1>
          <p className="mt-3 max-w-2xl text-base text-white/85">
            {sector.description} {total.toLocaleString()} live tenders matched
            this cluster.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {tenders.length === 0 ? (
          <div className="flex flex-col items-center rounded-3xl border border-dashed border-slate-300 p-12 text-center dark:border-white/10">
            <ExternalLink className="h-8 w-8 text-slate-400 dark:text-slate-500" />
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              No live tenders in this sector right now. Check back soon.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {tenders.map((t) => (
              <TenderCard key={t.id} tender={t} />
            ))}
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
