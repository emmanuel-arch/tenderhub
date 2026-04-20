import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  DollarSign,
  Landmark,
  Shield,
  Star,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BankCard } from "@/components/bank-card";
import { BackdropImage } from "@/components/backdrop-image";
import { getTenderById } from "@/lib/tenders";
import { BANKS } from "@/lib/banks";
import { formatKES, nullSafe } from "@/lib/format";
import { InstitutionType } from "@/lib/types";
import { classifyTender, getSector, sectorImagePath } from "@/lib/sectors";

export const dynamic = "force-dynamic";

export default async function BankSelectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const data = await getTenderById(id).catch(() => null);
  if (!data) notFound();
  const { tender, details } = data;

  const overrideBond = sp.bondAmount
    ? Number(Array.isArray(sp.bondAmount) ? sp.bondAmount[0] : sp.bondAmount)
    : 0;
  const parsedBond = details?.bidBondAmount
    ? parseFloat(details.bidBondAmount.replace(/[^0-9.]/g, ""))
    : 0;
  const bondAmount =
    overrideBond > 0
      ? overrideBond
      : tender.bidBondAmount > 0
        ? tender.bidBondAmount
        : !isNaN(parsedBond) && parsedBond > 0
          ? parsedBond
          : 0;

  const sector = getSector(
    classifyTender({
      title: tender.title,
      description: tender.description,
      procuringEntity: tender.procuringEntity,
    }),
  );

  const groups: { type: InstitutionType; icon: typeof Landmark; label: string }[] = [
    { type: "Bank", icon: Landmark, label: "Banks" },
    { type: "Microfinance", icon: Building2, label: "Microfinance Institutions" },
    { type: "Insurance", icon: Star, label: "Insurance Providers" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-background">
      <SiteHeader />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href={`/tenders/${tender.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-emerald-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tender Details
        </Link>

        {/* Hero with sector backdrop */}
        <div className="relative mt-6 overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10">
          <BackdropImage
            src={sectorImagePath(sector.slug)}
            tint={sector.accent}
            overlayClass="bg-gradient-to-br from-slate-950/80 via-slate-900/60 to-slate-950/85"
            priority
          />
          <div className="relative px-6 py-8 sm:px-10 sm:py-12 text-white">
            <div
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest backdrop-blur ring-1 ring-white/20"
              style={{ color: sector.accent }}
            >
              <sector.icon className="h-3 w-3" />
              {sector.shortLabel} · Step 1 of 2
            </div>
            <h1 className="mt-3 font-display text-2xl sm:text-3xl">
              Select a Provider for Your Bid Bond
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/80">
              Choose a bank, microfinance institution, or insurer to issue your
              bid bond. Each provider's tile is tinted with its own brand
              palette so you can spot familiar names instantly.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Pill icon={Shield} label="Tender" value={tender.title} />
              <Pill
                icon={Building2}
                label="Entity"
                value={nullSafe(tender.procuringEntity, "—")}
              />
              <Pill
                icon={DollarSign}
                label="Bond Amount"
                value={bondAmount > 0 ? formatKES(bondAmount) : "Custom"}
                accent
              />
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-12">
          {groups.map((g) => {
            const banks = BANKS.filter((b) => b.institutionType === g.type);
            if (banks.length === 0) return null;
            return (
              <section key={g.type}>
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm dark:bg-emerald-500 dark:text-slate-950">
                    <g.icon className="h-4 w-4" />
                  </div>
                  <h2 className="font-display text-lg text-slate-900 dark:text-slate-50">
                    {g.label}
                  </h2>
                  <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-slate-100 px-2 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200 dark:bg-white/5 dark:text-slate-200 dark:ring-white/10">
                    {banks.length}
                  </span>
                </div>
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {banks.map((b) => (
                    <BankCard
                      key={b.id}
                      bank={b}
                      hrefBase={`/tenders/${tender.id}/banks`}
                      bondAmount={bondAmount > 0 ? bondAmount : undefined}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}

function Pill({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Shield;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border p-3 backdrop-blur ${
        accent
          ? "border-emerald-300/60 bg-emerald-500/10 text-emerald-100"
          : "border-white/15 bg-white/10 text-white/95"
      }`}
    >
      <div
        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
          accent ? "bg-emerald-400 text-slate-950" : "bg-white/20 text-white"
        }`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-white/70">
          {label}
        </div>
        <div className="mt-0.5 line-clamp-2 text-sm font-semibold">
          {value}
        </div>
      </div>
    </div>
  );
}
