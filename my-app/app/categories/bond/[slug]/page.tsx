import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Banknote } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TenderCard } from "@/components/tender-card";
import { BOND_BUCKETS, BondBucketSlug, getBondBucket } from "@/lib/bond-buckets";
import { getBondBucketTenders } from "@/lib/tenders";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export async function generateStaticParams() {
  return BOND_BUCKETS.map((b) => ({ slug: b.slug }));
}

export default async function BondBucketDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!getBondBucket(slug)) notFound();
  const { bucket, tenders, total } = await getBondBucketTenders(
    slug as BondBucketSlug,
    36,
  );

  return (
    <div className="min-h-screen bg-white dark:bg-background">
      <SiteHeader />

      <section
        className={`relative overflow-hidden border-b border-slate-200 dark:border-white/10 ${bucket.glassClass} backdrop-blur-md`}
      >
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
          <Link
            href="/categories/bond"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> All bond sizes
          </Link>
          <div
            className={`mt-5 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest dark:bg-white/10 ${bucket.accentTextClass}`}
          >
            <Banknote className="h-3 w-3" />
            {bucket.short}
          </div>
          <h1 className="mt-3 font-display text-4xl text-slate-900 dark:text-slate-50 sm:text-5xl">
            {bucket.label}
          </h1>
          <p className="mt-2 max-w-2xl text-base text-slate-700 dark:text-slate-300">
            {bucket.description} {total.toLocaleString()} live tenders match
            this size band.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {tenders.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-400">
            No live tenders match this bond size right now.
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
