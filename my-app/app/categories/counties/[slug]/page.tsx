import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BackdropImage } from "@/components/backdrop-image";
import { TenderCard } from "@/components/tender-card";
import { COUNTIES, countyImagePath, getCounty } from "@/lib/counties";
import { getCountyTenders } from "@/lib/tenders";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export async function generateStaticParams() {
  return COUNTIES.map((c) => ({ slug: c.slug }));
}

export default async function CountyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = getCounty(slug);
  if (!c) notFound();

  const { county, tenders, total } = await getCountyTenders(slug, 36);

  return (
    <div className="min-h-screen bg-white dark:bg-background">
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-slate-200 dark:border-white/10">
        <BackdropImage
          src={countyImagePath(county.slug)}
          tint="#10B981"
          overlayClass="bg-gradient-to-br from-slate-950/85 via-slate-900/65 to-slate-950/90"
          priority
        />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14 text-white">
          <Link
            href={`/categories/regions/${county.region}`}
            className="inline-flex items-center gap-1.5 text-sm text-white/85 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back to region
          </Link>
          <div className="mt-4 inline-flex items-center gap-1.5 text-emerald-300 text-[11px] font-semibold uppercase tracking-widest">
            <MapPin className="h-3 w-3" /> {county.region.replace("-", " ")}
          </div>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl">
            {county.name} County
          </h1>
          <p className="mt-2 max-w-2xl text-base text-white/85">
            {total.toLocaleString()} live tenders linked to {county.name}.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {tenders.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-400">
            No live tenders matched {county.name} County right now.
          </p>
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
