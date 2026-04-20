/**
 * Bond-amount classification.
 *
 * Tenders carry their bond amount as either a number on
 * ScrapedTenders.BidBondAmount or a free-text string on
 * TenderDocumentDetails.BidBondAmount (e.g. "Kshs. 500,000",
 * "1,200,000", "USD 5,000"). We parse both into numeric KES
 * and bucket them for the categorisation page.
 */

export type BondBucketSlug =
  | "small"
  | "midmarket"
  | "growth"
  | "enterprise"
  | "major"
  | "mega"
  | "unspecified";

export interface BondBucket {
  slug: BondBucketSlug;
  label: string;
  short: string;
  /** Inclusive lower bound in KES. */
  min: number;
  /** Exclusive upper bound in KES (Infinity for the top bucket). */
  max: number;
  description: string;
  /** Tailwind glass classes for the bucket card. */
  glassClass: string;
  accentTextClass: string;
}

export const BOND_BUCKETS: BondBucket[] = [
  {
    slug: "small",
    label: "Micro / SME",
    short: "< Ksh 100K",
    min: 0,
    max: 100_000,
    description:
      "Low-stakes tenders ideal for first-time bidders and SMEs.",
    glassClass:
      "bg-emerald-50/70 dark:bg-emerald-500/10 ring-1 ring-emerald-200/60 dark:ring-emerald-400/20",
    accentTextClass: "text-emerald-700 dark:text-emerald-300",
  },
  {
    slug: "midmarket",
    label: "Mid-market",
    short: "Ksh 100K – 500K",
    min: 100_000,
    max: 500_000,
    description:
      "Mid-sized tenders typically issued by counties and parastatals.",
    glassClass:
      "bg-blue-50/70 dark:bg-blue-500/10 ring-1 ring-blue-200/60 dark:ring-blue-400/20",
    accentTextClass: "text-blue-700 dark:text-blue-300",
  },
  {
    slug: "growth",
    label: "Growth",
    short: "Ksh 500K – 2M",
    min: 500_000,
    max: 2_000_000,
    description: "Established contractors with proven delivery capacity.",
    glassClass:
      "bg-violet-50/70 dark:bg-violet-500/10 ring-1 ring-violet-200/60 dark:ring-violet-400/20",
    accentTextClass: "text-violet-700 dark:text-violet-300",
  },
  {
    slug: "enterprise",
    label: "Enterprise",
    short: "Ksh 2M – 10M",
    min: 2_000_000,
    max: 10_000_000,
    description:
      "Large procurement projects from ministries and infrastructure agencies.",
    glassClass:
      "bg-amber-50/70 dark:bg-amber-500/10 ring-1 ring-amber-200/60 dark:ring-amber-400/20",
    accentTextClass: "text-amber-700 dark:text-amber-300",
  },
  {
    slug: "major",
    label: "Major Project",
    short: "Ksh 10M – 50M",
    min: 10_000_000,
    max: 50_000_000,
    description:
      "Major capital works — typically open to consortiums and joint ventures.",
    glassClass:
      "bg-rose-50/70 dark:bg-rose-500/10 ring-1 ring-rose-200/60 dark:ring-rose-400/20",
    accentTextClass: "text-rose-700 dark:text-rose-300",
  },
  {
    slug: "mega",
    label: "Mega Project",
    short: "Ksh 50M+",
    min: 50_000_000,
    max: Number.POSITIVE_INFINITY,
    description:
      "Flagship national infrastructure and PPP-class procurement.",
    glassClass:
      "bg-fuchsia-50/70 dark:bg-fuchsia-500/10 ring-1 ring-fuchsia-200/60 dark:ring-fuchsia-400/20",
    accentTextClass: "text-fuchsia-700 dark:text-fuchsia-300",
  },
  {
    slug: "unspecified",
    label: "Unspecified",
    short: "Bond TBC",
    min: 0,
    max: 0,
    description:
      "Bond amount not yet extracted from the tender document.",
    glassClass:
      "bg-slate-100/70 dark:bg-slate-700/20 ring-1 ring-slate-200/60 dark:ring-slate-500/20",
    accentTextClass: "text-slate-600 dark:text-slate-300",
  },
];

const BUCKET_BY_SLUG = new Map(BOND_BUCKETS.map((b) => [b.slug, b]));

export function getBondBucket(slug: string): BondBucket | null {
  return BUCKET_BY_SLUG.get(slug as BondBucketSlug) ?? null;
}

/**
 * Parse a bond-amount string (with currency / commas / words like "Kenya
 * Shillings") into KES. Returns 0 when nothing parseable was found.
 */
export function parseBondAmount(input: string | null | undefined): number {
  if (!input) return 0;
  const cleaned = String(input)
    .replace(/[,_]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const usd = /usd|\$|us\s*\$/i.test(cleaned);
  const eur = /eur|€/i.test(cleaned);

  // Find the largest number with optional decimal in the string.
  const matches = cleaned.match(/(?:\d+(?:\.\d+)?)/g);
  if (!matches) return 0;
  let amt = matches.reduce((max, m) => Math.max(max, Number(m)), 0);
  if (!isFinite(amt) || amt <= 0) return 0;

  // Multiplier suffixes (rare in tender data but handle them):
  // "5 million" / "5M" / "5 Mn"
  if (/(\d+(?:\.\d+)?)\s*(?:m|million|mn)\b/i.test(cleaned)) amt *= 1_000_000;
  else if (/(\d+(?:\.\d+)?)\s*(?:b|billion|bn)\b/i.test(cleaned))
    amt *= 1_000_000_000;
  else if (/(\d+(?:\.\d+)?)\s*(?:k|thousand)\b/i.test(cleaned))
    amt *= 1_000;

  if (usd) amt *= 130; // approx FX conversion
  else if (eur) amt *= 145;

  return Math.round(amt);
}

export function bucketFor(amount: number | null | undefined): BondBucketSlug {
  if (!amount || amount <= 0) return "unspecified";
  for (const b of BOND_BUCKETS) {
    if (b.slug === "unspecified") continue;
    if (amount >= b.min && amount < b.max) return b.slug;
  }
  return "unspecified";
}
