import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BidBondWizard } from "@/components/bid-bond-wizard";
import { getTenderById } from "@/lib/tenders";
import { getBank } from "@/lib/banks";

export const dynamic = "force-dynamic";

export default async function BidBondPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; bankId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id, bankId }, sp] = await Promise.all([params, searchParams]);
  const data = await getTenderById(id).catch(() => null);
  if (!data) notFound();
  const bank = getBank(bankId);
  if (!bank) notFound();

  const overrideBond = sp.bondAmount
    ? Number(Array.isArray(sp.bondAmount) ? sp.bondAmount[0] : sp.bondAmount)
    : 0;
  const parsed = data.details?.bidBondAmount
    ? parseFloat(data.details.bidBondAmount.replace(/[^0-9.]/g, ""))
    : 0;
  const bondAmount =
    overrideBond > 0
      ? overrideBond
      : data.tender.bidBondAmount > 0
        ? data.tender.bidBondAmount
        : !isNaN(parsed) && parsed > 0
          ? parsed
          : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-background">
      <SiteHeader />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href={`/tenders/${data.tender.id}/banks${bondAmount ? `?bondAmount=${bondAmount}` : ""}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-emerald-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Bank Selection
        </Link>

        <div className="mt-6">
          <BidBondWizard
            tender={data.tender}
            bank={bank}
            bondAmount={bondAmount}
          />
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
