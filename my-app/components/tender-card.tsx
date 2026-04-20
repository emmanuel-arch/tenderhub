import Link from "next/link";
import {
  Building2,
  Calendar,
  FileCheck,
  Hash,
  Shield,
  Sparkles,
  Package,
  Wrench,
  Briefcase,
  GraduationCap,
  Folder,
} from "lucide-react";
import { Tender, TenderSubCategory } from "@/lib/types";
import { deadlineLabel, formatKES, nullSafe, truncate } from "@/lib/format";
import { CategoryGlow } from "./category-glow";

const subIcons: Record<TenderSubCategory, typeof Package> = {
  Goods: Package,
  Works: Wrench,
  Services: Briefcase,
  Consultancy: GraduationCap,
  Other: Folder,
};

const glowVariant = (sub: TenderSubCategory) =>
  ({
    Goods: "goods" as const,
    Works: "works" as const,
    Services: "services" as const,
    Consultancy: "consultancy" as const,
    Other: "default" as const,
  })[sub];

const subBadgeBg: Record<TenderSubCategory, string> = {
  Goods: "bg-amber-50 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200",
  Works: "bg-emerald-50 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200",
  Services: "bg-blue-50 text-blue-800 dark:bg-blue-400/15 dark:text-blue-200",
  Consultancy: "bg-violet-50 text-violet-800 dark:bg-violet-400/15 dark:text-violet-200",
  Other: "bg-slate-50 text-slate-700 dark:bg-slate-700/40 dark:text-slate-200",
};

const subRingBg: Record<TenderSubCategory, string> = {
  Goods: "from-amber-50 to-amber-100/40 dark:from-amber-500/15 dark:to-slate-900/0",
  Works: "from-emerald-50 to-emerald-100/40 dark:from-emerald-500/15 dark:to-slate-900/0",
  Services: "from-blue-50 to-blue-100/40 dark:from-blue-500/15 dark:to-slate-900/0",
  Consultancy: "from-violet-50 to-violet-100/40 dark:from-violet-500/15 dark:to-slate-900/0",
  Other: "from-slate-50 to-slate-100/40 dark:from-slate-700/40 dark:to-slate-900/0",
};

const subIconColor: Record<TenderSubCategory, string> = {
  Goods: "text-amber-700 dark:text-amber-300",
  Works: "text-emerald-700 dark:text-emerald-300",
  Services: "text-blue-700 dark:text-blue-300",
  Consultancy: "text-violet-700 dark:text-violet-300",
  Other: "text-slate-700 dark:text-slate-300",
};

interface Props {
  tender: Tender;
  variant?: "row" | "card" | "feature";
}

export function TenderCard({ tender, variant = "card" }: Props) {
  if (variant === "feature") {
    return <FeatureTenderCard tender={tender} />;
  }
  if (variant === "row") {
    return <RowTenderCard tender={tender} />;
  }
  return <DefaultTenderCard tender={tender} />;
}

function StatusPill({ tender }: { tender: Tender }) {
  const days = tender.deadline
    ? Math.ceil((new Date(tender.deadline).getTime() - Date.now()) / 86400000)
    : null;
  let cls = "bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-300";
  if (days != null) {
    if (days < 0)
      cls = "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300";
    else if (days <= 3)
      cls = "bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200";
    else if (days <= 7)
      cls = "bg-yellow-50 text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-200";
    else cls = "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200";
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${cls}`}
    >
      <Calendar className="h-3 w-3" />
      {deadlineLabel(tender.deadline)}
    </span>
  );
}

function DefaultTenderCard({ tender }: { tender: Tender }) {
  const Icon = subIcons[tender.subCategory];
  return (
    <Link
      href={`/tenders/${tender.id}`}
      className="group relative block overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-900/5 dark:border-white/5 dark:bg-slate-900/40 dark:hover:border-emerald-400/30 dark:hover:bg-slate-900/70 dark:hover:shadow-emerald-500/5"
    >
      <div className="flex items-start gap-4">
        <div
          className={`relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl glow glow-${glowVariant(
            tender.subCategory,
          )} bg-gradient-to-b ${subRingBg[tender.subCategory]}`}
        >
          <Icon className={`h-5 w-5 ${subIconColor[tender.subCategory]}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-700 dark:bg-white/5 dark:text-slate-300">
              {tender.category}
            </span>
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                subBadgeBg[tender.subCategory]
              }`}
            >
              {tender.subCategory}
            </span>
            {tender.bidBondRequired && (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200">
                <Shield className="h-2.5 w-2.5" />
                Bid Bond
              </span>
            )}
            {tender.hasDocumentDetails && (
              <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-800 dark:bg-blue-500/15 dark:text-blue-200">
                <FileCheck className="h-2.5 w-2.5" />
                Parsed
              </span>
            )}
          </div>
          <h3 className="line-clamp-2 font-display text-base text-slate-900 group-hover:text-emerald-700 dark:text-slate-100 dark:group-hover:text-emerald-300">
            {tender.title}
          </h3>
          <div className="mt-2 grid grid-cols-1 gap-1.5 text-xs text-slate-600 sm:grid-cols-2 dark:text-slate-400">
            <div className="flex items-start gap-1.5">
              <Building2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-slate-400 dark:text-slate-500" />
              <span className="line-clamp-1">
                {nullSafe(tender.procuringEntity, "Entity not specified")}
              </span>
            </div>
            {tender.tenderNumber && (
              <div className="flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5 flex-shrink-0 text-slate-400 dark:text-slate-500" />
                <span className="line-clamp-1 font-mono">
                  {tender.tenderNumber}
                </span>
              </div>
            )}
          </div>
          {tender.summary && (
            <p className="mt-3 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
              {truncate(tender.summary, 200)}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-white/5">
        <StatusPill tender={tender} />
        {tender.bidBondAmount > 0 && (
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Bid Bond:</span>
            <span className="font-semibold text-slate-900 dark:text-emerald-300">
              {formatKES(tender.bidBondAmount)}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

function RowTenderCard({ tender }: { tender: Tender }) {
  const Icon = subIcons[tender.subCategory];
  return (
    <Link
      href={`/tenders/${tender.id}`}
      className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-slate-300 hover:bg-slate-50/40 dark:border-white/5 dark:bg-slate-900/40 dark:hover:border-emerald-400/30 dark:hover:bg-slate-900/70"
    >
      <div
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg glow glow-${glowVariant(
          tender.subCategory,
        )}`}
      >
        <Icon className={`h-5 w-5 ${subIconColor[tender.subCategory]}`} />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-1 font-medium text-slate-900 group-hover:text-emerald-700 dark:text-slate-100 dark:group-hover:text-emerald-300">
          {tender.title}
        </h3>
        <div className="mt-0.5 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
          {nullSafe(tender.procuringEntity, "—")}
          {tender.tenderNumber ? ` · ${tender.tenderNumber}` : ""}
        </div>
      </div>
      <StatusPill tender={tender} />
    </Link>
  );
}

function FeatureTenderCard({ tender }: { tender: Tender }) {
  const Icon = subIcons[tender.subCategory];
  return (
    <Link
      href={`/tenders/${tender.id}`}
      className="group relative block overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/50 p-6 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-900/10 dark:border-white/5 dark:from-slate-900/60 dark:to-slate-950/60 dark:hover:border-emerald-400/30 dark:hover:shadow-emerald-500/10"
    >
      <div className="absolute -top-12 -right-12 opacity-50 transition-opacity group-hover:opacity-80 dark:opacity-70 dark:group-hover:opacity-100">
        <CategoryGlow
          icon={Icon}
          label=""
          variant={glowVariant(tender.subCategory)}
          size="md"
          pulse={false}
        />
      </div>
      <div className="relative">
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200">
            <Sparkles className="h-2.5 w-2.5" />
            Featured
          </span>
          <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white dark:bg-white/10 dark:text-slate-100">
            {tender.subCategory}
          </span>
        </div>
        <h3 className="line-clamp-2 max-w-[80%] font-display text-lg text-slate-900 group-hover:text-emerald-700 dark:text-slate-100 dark:group-hover:text-emerald-300">
          {tender.title}
        </h3>
        <div className="mt-3 line-clamp-1 text-sm text-slate-600 dark:text-slate-400">
          {nullSafe(tender.procuringEntity, "Entity not specified")}
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-white/5">
          <StatusPill tender={tender} />
          {tender.bidBondAmount > 0 && (
            <span className="font-display text-sm text-slate-900 dark:text-emerald-300">
              {formatKES(tender.bidBondAmount)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
