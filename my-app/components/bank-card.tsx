import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Landmark,
  Star,
  Zap,
} from "lucide-react";
import { BankProvider } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "./brand-logo";
import { BackdropImage } from "./backdrop-image";

const typeIcon = {
  Bank: Landmark,
  Microfinance: Building2,
  Insurance: Star,
} as const;

const typeStyle = {
  Bank: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  Microfinance:
    "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  Insurance:
    "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
} as const;

export function BankCard({
  bank,
  hrefBase,
  bondAmount,
}: {
  bank: BankProvider;
  hrefBase: string;
  bondAmount?: number;
}) {
  const TypeIcon = typeIcon[bank.institutionType];
  const href = `${hrefBase}/${bank.id}${
    bondAmount ? `?bondAmount=${bondAmount}` : ""
  }`;

  const fee =
    bondAmount && bondAmount > 0
      ? Math.round((bondAmount * bank.feesPercent) / 100)
      : null;

  return (
    <Link
      href={href}
      className={`group relative isolate flex h-[28rem] flex-col overflow-hidden rounded-3xl border border-slate-200 transition-all duration-500 hover:-translate-y-1 hover:border-transparent hover:shadow-2xl hover:shadow-black/15 dark:border-white/10 dark:hover:shadow-black/40 ${bank.glassClass} backdrop-blur-md`}
    >
      {/* Backdrop image: dim by default, vivid on hover */}
      <div className="pointer-events-none absolute inset-0 -z-10 transition-opacity duration-500 opacity-[0.18] group-hover:opacity-100 dark:opacity-[0.22]">
        <BackdropImage
          src={bank.backdropSrc}
          overlayClass="bg-gradient-to-br from-white/40 via-white/30 to-white/55 transition-opacity duration-500 group-hover:opacity-0 dark:from-slate-950/55 dark:via-slate-950/40 dark:to-slate-950/70"
          tint={bank.accent}
        />
      </div>

      {/* Hover scrim — adds a brand-tinted dark veil so foreground text stays legible on the photo */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `linear-gradient(180deg, ${bank.accent}00 0%, ${bank.accent}55 55%, ${bank.accent}E0 100%)`,
        }}
      />

      {/* Brand accent bar — stays during hover for continuity */}
      <div
        className="h-1.5 w-full"
        style={{
          background: `linear-gradient(90deg, ${bank.accent}, ${bank.accentSecondary})`,
        }}
      />

      {/* DEFAULT FACE — visible at rest, fades + lifts on hover */}
      <div className="relative flex flex-1 flex-col p-6 transition-all duration-500 group-hover:-translate-y-3 group-hover:opacity-0">
        <div className="flex items-start gap-4">
          <BrandLogo
            src={bank.logoSrc}
            fallbackText={bank.logoText}
            accent={bank.accent}
            sizeClass="h-14 w-14"
            alt={`${bank.name} logo`}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${typeStyle[bank.institutionType]}`}
              >
                <TypeIcon className="h-2.5 w-2.5" />
                {bank.institutionType}
              </span>
              {bank.digitalOption && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  <Zap className="h-2.5 w-2.5" />
                  Digital
                </span>
              )}
            </div>
            <h3 className="mt-1.5 font-display text-base text-slate-900 dark:text-slate-50">
              {bank.name}
            </h3>
            <div className="mt-1 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-300">
              <Star className="h-3 w-3 fill-current" />
              <span className="font-semibold">{bank.rating.toFixed(1)}</span>
              <span className="text-slate-400 dark:text-slate-500">·</span>
              <span className="text-slate-600 dark:text-slate-300">
                {bank.shortName}
              </span>
            </div>
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-slate-700 line-clamp-3 dark:text-slate-300">
          {bank.description}
        </p>

        <div className="mt-auto pt-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/70 p-3 ring-1 ring-slate-200/60 dark:bg-white/5 dark:ring-white/5">
              <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <Clock className="h-3 w-3" />
                Processing
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {bank.processingTime}
              </div>
            </div>
            <div className="rounded-xl bg-white/70 p-3 ring-1 ring-slate-200/60 dark:bg-white/5 dark:ring-white/5">
              <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <CheckCircle2 className="h-3 w-3" />
                Fees
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {bank.feesLabel}
              </div>
            </div>
          </div>
          <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Hover to preview
            <ArrowRight className="h-3 w-3" />
          </div>
        </div>
      </div>

      {/* HOVER FACE — slides up over the vivid image, glassmorphic */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-4 p-6 opacity-0 transition-all duration-500 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
        <div className="rounded-2xl border border-white/25 bg-white/15 p-4 backdrop-blur-xl shadow-2xl ring-1 ring-white/10">
          {/* Tiny badge with shortname so users still recognise the brand */}
          <div className="flex items-center justify-between text-white">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest">
              <TypeIcon className="h-2.5 w-2.5" />
              {bank.shortName}
            </span>
            <span className="inline-flex items-center gap-1 text-xs">
              <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
              {bank.rating.toFixed(1)}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-white">
            <div className="rounded-xl bg-white/10 p-2.5 backdrop-blur">
              <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-white/80">
                <Clock className="h-3 w-3" /> Processing
              </div>
              <div className="mt-0.5 text-sm font-semibold">
                {bank.processingTime}
              </div>
            </div>
            <div className="rounded-xl bg-white/10 p-2.5 backdrop-blur">
              <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-white/80">
                <CheckCircle2 className="h-3 w-3" /> Fees
              </div>
              <div className="mt-0.5 text-sm font-semibold">
                {bank.feesLabel}
              </div>
            </div>
          </div>

          {fee != null && (
            <div className="mt-3 flex items-center justify-between rounded-xl bg-black/35 px-3 py-2 text-white backdrop-blur">
              <span className="text-[11px] uppercase tracking-widest text-white/80">
                Estimated fee
              </span>
              <span className="font-display text-sm">
                KES {fee.toLocaleString()}
              </span>
            </div>
          )}

          <Button
            className="mt-4 w-full bg-white font-semibold text-slate-900 shadow-lg hover:bg-white/95"
            style={{ color: bank.accent }}
          >
            Select {bank.shortName}
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </Link>
  );
}
