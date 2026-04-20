import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, FileX2, Loader2, Shield } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TenderFilters } from "@/components/tender-filters";
import { TenderCard } from "@/components/tender-card";
import { PaginationBar } from "@/components/pagination-bar";
import { listTenders } from "@/lib/tenders";
import {
  TenderCategory,
  TenderListFilters,
  TenderSubCategory,
} from "@/lib/types";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const dynamic = "force-dynamic";

function parseParams(
  raw: Record<string, string | string[] | undefined>,
): TenderListFilters {
  const get = (k: string) => {
    const v = raw[k];
    return Array.isArray(v) ? v[0] : v;
  };
  return {
    page: Number(get("page") ?? "1") || 1,
    pageSize: Number(get("pageSize") ?? "20") || 20,
    category: (get("category") as TenderCategory | "All") ?? "All",
    subCategory: (get("subCategory") as TenderSubCategory | "All") ?? "All",
    search: get("search") ?? "",
    onlyComplete: get("onlyComplete") === "1",
    requireBidBond: get("requireBidBond") === "1",
  };
}

export default async function TendersPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const filters = parseParams(raw);

  return (
    <div className="min-h-screen bg-white dark:bg-background">
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white dark:border-white/10 dark:from-slate-950 dark:to-background">
        <div className="absolute inset-0 hidden dark:block dark-noise" />
        <div className="absolute -top-32 right-1/4 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl hidden dark:block" />
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
                Tender Directory
              </div>
              <h1 className="mt-2 font-display text-3xl text-slate-900 sm:text-4xl dark:text-slate-50">
                Browse Active Tenders
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
                Tenders ranked by data completeness — the richest, most
                actionable opportunities surface first. Use filters to narrow
                by procurement type, category, or bid-bond requirements.
              </p>
            </div>
            <Link
              href="/apply"
              className="group inline-flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 transition-all hover:bg-emerald-100 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200 dark:hover:bg-emerald-500/20"
            >
              <Shield className="h-5 w-5" />
              <div>
                <div className="font-semibold">
                  Can&apos;t find your tender?
                </div>
                <div className="text-xs text-emerald-800/80 dark:text-emerald-300/80">
                  Apply for a Bid Bond directly →
                </div>
              </div>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="h-40" />}>
          <TenderListBody filters={filters} />
        </Suspense>
      </section>

      <SiteFooter />
    </div>
  );
}

async function TenderListBody({ filters }: { filters: TenderListFilters }) {
  let result;
  let error: string | null = null;
  try {
    result = await listTenders(filters);
  } catch (err) {
    error = err instanceof Error ? err.message : "Unknown error";
  }

  if (error || !result) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
        <div className="font-semibold">Couldn&apos;t load tenders</div>
        <div className="mt-1 text-sm opacity-80">{error}</div>
      </div>
    );
  }

  return (
    <div>
      <TenderFilters total={result.total} />

      {result.data.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {result.data.map((t) => (
              <TenderCard key={t.id} tender={t} />
            ))}
          </div>
          <Suspense
            fallback={
              <div className="mt-8 flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            }
          >
            <PaginationBar page={result.page} totalPages={result.totalPages} />
          </Suspense>
          <div className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
            Showing page {result.page} of {result.totalPages.toLocaleString()} ·{" "}
            {result.total.toLocaleString()} tenders total
          </div>
        </>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-12 flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50/40 p-16 text-center dark:border-white/10 dark:bg-slate-900/30">
      <FileX2 className="h-10 w-10 text-slate-300 dark:text-slate-600" />
      <h3 className="mt-4 font-display text-lg text-slate-900 dark:text-slate-100">
        No tenders match your filters
      </h3>
      <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        Try clearing some filters or broadening your search to see more
        opportunities.
      </p>
      <Link
        href="/tenders"
        className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400"
      >
        Reset filters
      </Link>
    </div>
  );
}
