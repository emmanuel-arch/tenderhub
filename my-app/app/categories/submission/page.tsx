import Link from "next/link";
import { ArrowLeft, Inbox } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getLensAggregations } from "@/lib/tenders";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export default async function SubmissionPage() {
  const agg = await getLensAggregations();

  return (
    <div className="min-h-screen bg-white dark:bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href="/categories"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-emerald-300"
        >
          <ArrowLeft className="h-4 w-4" /> Back to all categories
        </Link>
        <h1 className="mt-4 font-display text-3xl text-slate-900 dark:text-slate-50">
          Submission format
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
          Whether you'll need to print and drop a sealed bid, or upload it
          electronically through an e-procurement portal.
        </p>

        <div className="mt-8 space-y-3">
          {agg.bySubmissionMethod.map((s) => (
            <div
              key={s.slug}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900/50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  <Inbox className="h-4 w-4" />
                </div>
                <div className="font-display text-base text-slate-900 dark:text-slate-50">
                  {s.slug}
                </div>
              </div>
              <div className="font-display text-lg text-slate-900 dark:text-emerald-300">
                {s.count.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
