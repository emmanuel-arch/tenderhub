import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
  FileSearch,
  FileText,
  GraduationCap,
  Hash,
  Info,
  Landmark,
  MapPin,
  Package,
  Shield,
  Sparkles,
  Wrench,
  Users,
  Video,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CategoryGlow } from "@/components/category-glow";
import { Button } from "@/components/ui/button";
import { getTenderById } from "@/lib/tenders";
import {
  daysUntil,
  deadlineLabel,
  formatDate,
  formatKES,
  nullSafe,
} from "@/lib/format";
import { TenderSubCategory } from "@/lib/types";

const subIcons = {
  Goods: Package,
  Works: Wrench,
  Services: Briefcase,
  Consultancy: GraduationCap,
  Other: FileText,
} as const;

const glowVariant = (sub: TenderSubCategory) =>
  ({
    Goods: "goods" as const,
    Works: "works" as const,
    Services: "services" as const,
    Consultancy: "consultancy" as const,
    Other: "default" as const,
  })[sub];

export const dynamic = "force-dynamic";

export default async function TenderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getTenderById(id).catch(() => null);
  if (!data) notFound();

  const { tender, details } = data;
  const Icon = subIcons[tender.subCategory];
  const days = daysUntil(tender.deadline);
  const isExpired = days != null && days < 0;

  // Bond amount for bid-bond CTA — prefer parsed details over scraped column
  const parsedBondAmount = details?.bidBondAmount
    ? parseFloat(details.bidBondAmount.replace(/[^0-9.]/g, ""))
    : 0;
  const bondAmount =
    tender.bidBondAmount > 0
      ? tender.bidBondAmount
      : !isNaN(parsedBondAmount) && parsedBondAmount > 0
        ? parsedBondAmount
        : 0;

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
          <div className="space-y-6 lg:col-span-8">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-white/10 dark:bg-slate-900/50 dark:backdrop-blur-md dark:shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white dark:bg-white/10 dark:text-slate-100">
                  {tender.category}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                    {
                      Goods: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200",
                      Works: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200",
                      Services: "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-200",
                      Consultancy: "bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-200",
                      Other: "bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-200",
                    }[tender.subCategory]
                  }`}
                >
                  {tender.subCategory}
                </span>
                {tender.bidBondRequired && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200">
                    <Shield className="h-2.5 w-2.5" />
                    Bid Bond Required
                  </span>
                )}
                {tender.procurementMethod && (
                  <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-700 dark:bg-white/5 dark:text-slate-300">
                    {tender.procurementMethod}
                  </span>
                )}
                {tender.hasDocumentDetails && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-blue-800 dark:bg-blue-500/15 dark:text-blue-200">
                    <Sparkles className="h-2.5 w-2.5" />
                    Document parsed
                  </span>
                )}
              </div>

              <h1 className="mt-4 font-display text-2xl leading-tight text-slate-900 sm:text-3xl dark:text-slate-50">
                {tender.title}
              </h1>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <InfoBlock
                  icon={Hash}
                  label="Tender Number"
                  value={tender.tenderNumber}
                />
                <InfoBlock
                  icon={Calendar}
                  label="Submission Deadline"
                  value={
                    tender.deadline ? (
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {formatDate(tender.deadline)}
                        </div>
                        <div
                          className={`text-xs ${
                            isExpired
                              ? "text-rose-700 dark:text-rose-300"
                              : days != null && days <= 7
                                ? "text-amber-700 dark:text-amber-300"
                                : "text-emerald-700 dark:text-emerald-300"
                          }`}
                        >
                          {deadlineLabel(tender.deadline)}
                        </div>
                      </div>
                    ) : null
                  }
                />
                <InfoBlock
                  icon={Building2}
                  label="Procuring Entity"
                  value={tender.procuringEntity}
                />
                <InfoBlock
                  icon={DollarSign}
                  label="Bid Bond Amount"
                  value={
                    bondAmount > 0
                      ? formatKES(bondAmount)
                      : details?.bidBondAmount ?? null
                  }
                />
              </div>
            </div>

            {details && (
              <Section
                title="Tender Requirements"
                icon={FileSearch}
                hint="Auto-extracted from the official tender document"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <InfoBlock
                    icon={Calendar}
                    label="Submission Deadline"
                    value={details.submissionDeadline}
                  />
                  <InfoBlock
                    icon={Shield}
                    label="Bid Bond Form"
                    value={details.bidBondForm}
                  />
                  <InfoBlock
                    icon={Clock}
                    label="Bid Bond Validity"
                    value={details.bidBondValidity}
                  />
                  <InfoBlock
                    icon={Clock}
                    label="Bid Validity Period"
                    value={details.bidValidityPeriod}
                  />
                  <InfoBlock
                    icon={MapPin}
                    label="Submission Method"
                    value={details.submissionMethod}
                  />
                  <InfoBlock
                    icon={FileText}
                    label="Number of Bid Copies"
                    value={details.numberOfBidCopies}
                  />
                  <InfoBlock
                    icon={Calendar}
                    label="Pre-Bid Meeting"
                    value={details.preBidMeetingDate}
                  />
                  <InfoBlock
                    icon={Video}
                    label="Pre-Bid Link"
                    value={
                      details.preBidMeetingLink ? (
                        <a
                          href={details.preBidMeetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-300"
                        >
                          Join meeting →
                        </a>
                      ) : null
                    }
                  />
                  <InfoBlock
                    icon={AlertCircle}
                    label="Clarification Deadline"
                    value={details.clarificationDeadline}
                  />
                  <InfoBlock
                    icon={MapPin}
                    label="Mandatory Site Visit"
                    value={details.mandatorySiteVisit ? "Yes" : "No"}
                  />
                </div>
              </Section>
            )}

            {details &&
              (details.minAnnualTurnover ||
                details.minLiquidAssets ||
                details.minSingleContractValue ||
                details.minCombinedContractValue ||
                details.cashFlowRequirement ||
                details.auditedFinancialsYears ||
                details.financialQualificationsRaw) && (
                <Section
                  title="Financial Qualifications"
                  icon={Landmark}
                  hint="Minimum financial criteria bidders must meet"
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <InfoBlock
                      icon={DollarSign}
                      label="Min Annual Turnover"
                      value={details.minAnnualTurnover}
                    />
                    <InfoBlock
                      icon={DollarSign}
                      label="Min Liquid Assets"
                      value={details.minLiquidAssets}
                    />
                    <InfoBlock
                      icon={DollarSign}
                      label="Min Single Contract Value"
                      value={details.minSingleContractValue}
                    />
                    <InfoBlock
                      icon={DollarSign}
                      label="Min Combined Contract Value"
                      value={details.minCombinedContractValue}
                    />
                    <InfoBlock
                      icon={DollarSign}
                      label="Cash Flow Requirement"
                      value={details.cashFlowRequirement}
                    />
                    <InfoBlock
                      icon={Calendar}
                      label="Audited Financials"
                      value={details.auditedFinancialsYears}
                    />
                  </div>
                  {details.financialQualificationsRaw && (
                    <details className="mt-4 rounded-xl bg-slate-50 p-4 dark:bg-white/5">
                      <summary className="cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                        View raw qualification text
                      </summary>
                      <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                        {details.financialQualificationsRaw}
                      </pre>
                    </details>
                  )}
                </Section>
              )}

            {(tender.summary || tender.description) && (
              <Section title="About This Tender" icon={Info}>
                {tender.summary && (
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {tender.summary}
                  </p>
                )}
                {tender.description &&
                  tender.description !== tender.summary && (
                    <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      {tender.description}
                    </p>
                  )}
              </Section>
            )}

            {(details?.keyRequirementsRaw || details?.keyPersonnel || details?.keyEquipment) && (
              <Section title="Key Requirements" icon={Users}>
                {details.keyRequirementsRaw && (
                  <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-700 dark:bg-white/5 dark:text-slate-300">
                    {details.keyRequirementsRaw}
                  </pre>
                )}
                {details.keyPersonnel && (
                  <details className="mt-3 rounded-xl bg-slate-50 p-4 dark:bg-white/5">
                    <summary className="cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                      Key Personnel
                    </summary>
                    <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap text-xs text-slate-600 dark:text-slate-400">
                      {details.keyPersonnel}
                    </pre>
                  </details>
                )}
                {details.keyEquipment && (
                  <details className="mt-3 rounded-xl bg-slate-50 p-4 dark:bg-white/5">
                    <summary className="cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                      Key Equipment
                    </summary>
                    <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap text-xs text-slate-600 dark:text-slate-400">
                      {details.keyEquipment}
                    </pre>
                  </details>
                )}
              </Section>
            )}
          </div>

          <aside className="space-y-6 lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-b from-emerald-600 to-emerald-700 text-white shadow-xl shadow-emerald-900/20 dark:border-emerald-400/40 dark:from-emerald-500 dark:to-emerald-700 dark:shadow-emerald-500/30">
                <div className="px-6 pb-2 pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-widest text-emerald-100/90">
                        Bid Bond
                      </div>
                      <div className="mt-1 font-display text-3xl">
                        {bondAmount > 0
                          ? formatKES(bondAmount)
                          : "Custom amount"}
                      </div>
                    </div>
                    <Shield className="h-8 w-8 text-emerald-100/80" />
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-emerald-50/90">
                    {bondAmount > 0
                      ? "Secure your bid with a bond from one of our partner banks, MFIs, or insurers."
                      : "This tender doesn't list a fixed bond amount — you'll specify yours in the next step."}
                  </p>
                </div>
                <div className="bg-emerald-800/30 px-6 py-4 backdrop-blur dark:bg-slate-950/40">
                  <Link
                    href={`/tenders/${tender.id}/banks${
                      bondAmount > 0 ? `?bondAmount=${bondAmount}` : ""
                    }`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-emerald-800 transition-all hover:bg-emerald-50 dark:bg-slate-950 dark:text-emerald-300 dark:hover:bg-slate-900"
                  >
                    Apply for Bid Bond
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-slate-900/50">
                <CategoryGlow
                  icon={Icon}
                  label={tender.subCategory}
                  variant={glowVariant(tender.subCategory)}
                  size="md"
                />
                <div className="mt-4 grid grid-cols-2 gap-3 text-center text-xs">
                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                    <div className="font-display text-base text-slate-900 dark:text-slate-100">
                      {tender.hasDocumentDetails ? "Yes" : "No"}
                    </div>
                    <div className="mt-0.5 text-slate-500 dark:text-slate-400">Doc Parsed</div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                    <div className="font-display text-base text-slate-900 dark:text-slate-100">
                      {nullSafe(tender.source, "—")}
                    </div>
                    <div className="mt-0.5 text-slate-500 dark:text-slate-400">Source</div>
                  </div>
                </div>
              </div>

              {(tender.documentUrl || tender.tenderNoticeUrl) && (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-slate-900/50">
                  <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Documents
                  </div>
                  <div className="mt-3 space-y-2">
                    {tender.documentUrl && (
                      <a
                        href={tender.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:border-emerald-400/30 dark:hover:bg-emerald-500/10"
                      >
                        <span className="inline-flex items-center gap-2">
                          <FileText className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
                          Tender document
                        </span>
                        <Download className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                      </a>
                    )}
                    {tender.tenderNoticeUrl && (
                      <a
                        href={tender.tenderNoticeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:border-emerald-400/30 dark:hover:bg-emerald-500/10"
                      >
                        <span className="inline-flex items-center gap-2">
                          <Info className="h-4 w-4 text-blue-700 dark:text-blue-300" />
                          Original notice
                        </span>
                        <ArrowRight className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-slate-900/50">
                <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Required documents (typical)
                </div>
                <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  {[
                    "KRA Tax Compliance Certificate",
                    "Business Registration Certificate",
                    "Audited Financial Statements (3 yrs)",
                    "Company Profile",
                    "CR12 / Directors' Particulars",
                  ].map((d) => (
                    <li key={d} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  hint,
  children,
}: {
  title: string;
  icon: typeof FileText;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-white/10 dark:bg-slate-900/50">
      <div className="flex items-start gap-3 border-b border-slate-100 pb-4 dark:border-white/5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h2 className="font-display text-lg text-slate-900 dark:text-slate-50">{title}</h2>
          {hint && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
        </div>
      </div>
      <div className="pt-5">{children}</div>
    </section>
  );
}

function InfoBlock({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileText;
  label: string;
  value: React.ReactNode;
}) {
  const isEmpty =
    value === null || value === undefined || value === "" || value === "—";
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4 dark:border-white/5 dark:bg-white/[0.03]">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div
        className={`mt-1.5 text-sm ${isEmpty ? "italic text-slate-400 dark:text-slate-500" : "text-slate-900 dark:text-slate-100"}`}
      >
        {isEmpty ? "Not specified" : value}
      </div>
    </div>
  );
}
