import Link from "next/link";
import { ArrowLeft, FileSearch } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getLensAggregations } from "@/lib/tenders";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export default async function MethodsPage() {
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
          Tenders by procurement method
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
          Open Tender, Request for Quotation, Framework Agreement, Direct
          Procurement and other Public Procurement Act methods.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {agg.byMethod.map((m) => (
            <Link
              key={m.slug}
              href={`/tenders?search=${encodeURIComponent(m.slug)}`}
              className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md dark:border-white/10 dark:bg-slate-900/50 dark:hover:border-emerald-400/30"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  <FileSearch className="h-4 w-4" />
                </div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {m.slug}
                </div>
              </div>
              <div className="font-display text-base text-slate-900 dark:text-emerald-300">
                {m.count.toLocaleString()}
              </div>
            </Link>
          ))}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
