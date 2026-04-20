import Link from "next/link";
import { ArrowLeft, Shield, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { DirectApplyClient } from "@/components/direct-apply-client";
import { BANKS } from "@/lib/banks";

export const dynamic = "force-static";

export default function ApplyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-background">
      <SiteHeader />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/tenders"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-emerald-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tenders
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-4">
            <div className="rounded-3xl border border-emerald-200 bg-gradient-to-b from-emerald-50 to-white p-6 dark:border-emerald-400/30 dark:from-emerald-500/10 dark:to-slate-900/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950 dark:shadow-[0_0_25px_-5px_rgba(16,185,129,0.6)]">
                <Shield className="h-5 w-5" />
              </div>
              <h2 className="mt-4 font-display text-lg text-slate-900 dark:text-slate-50">
                Direct Bid Bond Application
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Already have a tender that isn&apos;t in our listings? Skip the
                discovery and apply for a bid bond directly. We&apos;ll connect
                you with one of our partner banks, MFIs, or insurers.
              </p>
              <ul className="mt-5 space-y-3 text-sm text-slate-700 dark:text-slate-300">
                {[
                  "Enter your tender details",
                  "Select a provider",
                  "Provide company & financial info",
                  "Upload supporting documents",
                  "Submit & track status",
                ].map((step, i) => (
                  <li key={step} className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white dark:bg-emerald-500 dark:text-slate-950">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-slate-900/50">
              <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Why apply through TenderHub?
              </div>
              <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <li className="flex gap-2">
                  <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500 dark:text-amber-300" />
                  10 partner providers compared in one place
                </li>
                <li className="flex gap-2">
                  <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500 dark:text-amber-300" />
                  Single profile reused across applications
                </li>
                <li className="flex gap-2">
                  <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500 dark:text-amber-300" />
                  Status tracking from your dashboard
                </li>
              </ul>
            </div>
          </div>

          <div className="lg:col-span-8">
            <DirectApplyClient banks={BANKS} />
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
