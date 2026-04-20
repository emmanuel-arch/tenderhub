import { BankProvider } from "./types";

/**
 * Bank / MFI / Insurance providers used for bid-bond issuance.
 *
 * Image conventions (drop into /public/banks/):
 *   {id}-logo.png         — square logomark, transparent PNG (256×256)
 *   {id}-backdrop.jpg     — wide brand image (1600×900)
 *
 * Components fall back to logoText (e.g. "KCB") if the image is missing.
 *
 * Order matters: the bank-selection UI iterates this array in order.
 */
export const BANKS: BankProvider[] = [
  // ── Banks (KCB, Absa, NCBA, Co-op, Equity, StanChart) ──────────────────────
  {
    id: "kcb",
    name: "Kenya Commercial Bank",
    shortName: "KCB",
    logoText: "KCB",
    accent: "#0A6E3A",
    accentSecondary: "#10B981",
    logoSrc: "/banks/kcb-logo.png",
    backdropSrc: "/banks/kcb-backdrop.jpg",
    glassClass:
      "bg-emerald-50/70 dark:bg-emerald-500/10 ring-1 ring-emerald-200/70 dark:ring-emerald-400/25",
    institutionType: "Bank",
    processingTime: "24 hours",
    feesLabel: "1.5% of bond amount",
    feesPercent: 1.5,
    digitalOption: true,
    rating: 4.8,
    description:
      "Largest bank in East Africa with full digital bid-bond issuance and same-day approval for vetted SMEs.",
  },
  {
    id: "absa",
    name: "Absa Bank Kenya",
    shortName: "Absa",
    logoText: "AB",
    accent: "#A6192E",
    accentSecondary: "#F43F5E",
    logoSrc: "/banks/absa-logo.png",
    backdropSrc: "/banks/absa-backdrop.jpg",
    glassClass:
      "bg-rose-50/70 dark:bg-rose-500/10 ring-1 ring-rose-200/70 dark:ring-rose-400/25",
    institutionType: "Bank",
    processingTime: "48 hours",
    feesLabel: "1.7% of bond amount",
    feesPercent: 1.7,
    digitalOption: true,
    rating: 4.5,
    description:
      "Wide branch network and corporate banking expertise. Good for repeat bidders.",
  },
  {
    id: "ncba",
    name: "NCBA Bank Kenya",
    shortName: "NCBA",
    logoText: "NC",
    // NCBA brown
    accent: "#5B3A1B",
    accentSecondary: "#A0703A",
    logoSrc: "/banks/ncba-logo.png",
    backdropSrc: "/banks/ncba-backdrop.jpg",
    glassClass:
      "bg-amber-900/[0.08] dark:bg-amber-900/15 ring-1 ring-amber-800/30 dark:ring-amber-600/30",
    institutionType: "Bank",
    processingTime: "24 hours",
    feesLabel: "1.6% of bond amount",
    feesPercent: 1.6,
    digitalOption: true,
    rating: 4.6,
    description:
      "Fast turnaround through Loop digital platform; competitive on infrastructure tenders.",
  },
  {
    id: "coop",
    name: "Co-operative Bank",
    shortName: "Co-op",
    logoText: "CO",
    accent: "#006B3F",
    accentSecondary: "#34D399",
    logoSrc: "/banks/coop-logo.png",
    backdropSrc: "/banks/coop-backdrop.jpg",
    glassClass:
      "bg-green-50/70 dark:bg-green-500/10 ring-1 ring-green-200/70 dark:ring-green-400/25",
    institutionType: "Bank",
    processingTime: "24-72 hours",
    feesLabel: "1.8% of bond amount",
    feesPercent: 1.8,
    digitalOption: true,
    rating: 4.5,
    description:
      "Strong relationships with government parastatals and SACCOs. Reliable for county tenders.",
  },
  {
    id: "equity",
    name: "Equity Bank Kenya",
    shortName: "Equity",
    logoText: "EQ",
    accent: "#B61F25",
    accentSecondary: "#EF4444",
    logoSrc: "/banks/equity-logo.png",
    backdropSrc: "/banks/equity-backdrop.jpg",
    glassClass:
      "bg-red-50/70 dark:bg-red-500/10 ring-1 ring-red-200/70 dark:ring-red-400/25",
    institutionType: "Bank",
    processingTime: "12-48 hours",
    feesLabel: "1.2% of bond amount",
    feesPercent: 1.2,
    digitalOption: true,
    rating: 4.7,
    description:
      "Aggressive SME pricing and a fully digital application portal. Strong fit for new bidders.",
  },
  {
    id: "stanchart",
    name: "Standard Chartered Kenya",
    shortName: "StanChart",
    logoText: "SC",
    accent: "#0473EA",
    accentSecondary: "#38BDF8",
    logoSrc: "/banks/stanchart-logo.png",
    backdropSrc: "/banks/stanchart-backdrop.jpg",
    glassClass:
      "bg-sky-50/70 dark:bg-sky-500/10 ring-1 ring-sky-200/70 dark:ring-sky-400/25",
    institutionType: "Bank",
    processingTime: "48-72 hours",
    feesLabel: "2.0% of bond amount",
    feesPercent: 2.0,
    digitalOption: false,
    rating: 4.6,
    description:
      "Best for high-value international tenders and consortia with cross-border guarantees.",
  },

  // ── Microfinance (Micromart, Faulu, KWFT) ──────────────────────────────────
  {
    id: "micromart",
    name: "Micromart Africa Ltd",
    shortName: "Micromart",
    logoText: "MM",
    // Brown logo → use a soft warm-stone/whitish glass for legibility
    accent: "#8B5A2B",
    accentSecondary: "#C99A5C",
    logoSrc: "/banks/micromart-logo.png",
    backdropSrc: "/banks/micromart-backdrop.jpg",
    glassClass:
      "bg-stone-50/85 dark:bg-stone-100/[0.08] ring-1 ring-stone-200/80 dark:ring-stone-300/15",
    institutionType: "Microfinance",
    processingTime: "24 hours",
    feesLabel: "1.9% of bond amount",
    feesPercent: 1.9,
    digitalOption: true,
    rating: 4.4,
    description:
      "Pan-African microfinance lender with rapid digital onboarding and flexible terms for SMEs.",
  },
  {
    id: "faulu",
    name: "Faulu Microfinance Bank",
    shortName: "Faulu",
    logoText: "FA",
    accent: "#F08C00",
    accentSecondary: "#FBBF24",
    logoSrc: "/banks/faulu-logo.png",
    backdropSrc: "/banks/faulu-backdrop.jpg",
    glassClass:
      "bg-amber-50/70 dark:bg-amber-500/10 ring-1 ring-amber-200/70 dark:ring-amber-400/25",
    institutionType: "Microfinance",
    processingTime: "24-48 hours",
    feesLabel: "2.2% of bond amount",
    feesPercent: 2.2,
    digitalOption: true,
    rating: 4.3,
    description:
      "MFI with flexible collateral terms. Best for first-time bidders and small-value tenders.",
  },
  {
    id: "kwft",
    name: "Kenya Women Microfinance Bank",
    shortName: "KWFT",
    logoText: "KW",
    // Brown logo → use soft whitish glass for contrast
    accent: "#7C2D12",
    accentSecondary: "#C2854B",
    logoSrc: "/banks/kwft-logo.png",
    backdropSrc: "/banks/kwft-backdrop.jpg",
    glassClass:
      "bg-stone-50/85 dark:bg-stone-100/[0.08] ring-1 ring-stone-200/80 dark:ring-stone-300/15",
    institutionType: "Microfinance",
    processingTime: "48-72 hours",
    feesLabel: "2.0% of bond amount",
    feesPercent: 2.0,
    digitalOption: false,
    rating: 4.2,
    description:
      "Focused on women-led enterprises with concessional bid-bond rates and advisory.",
  },

  // ── Insurance ──────────────────────────────────────────────────────────────
  {
    id: "jubilee",
    name: "Jubilee Insurance",
    shortName: "Jubilee",
    logoText: "JU",
    // Jubilee uses Absa-style red palette per request
    accent: "#A6192E",
    accentSecondary: "#F43F5E",
    logoSrc: "/banks/jubilee-logo.png",
    backdropSrc: "/banks/jubilee-backdrop.jpg",
    glassClass:
      "bg-rose-50/70 dark:bg-rose-500/10 ring-1 ring-rose-200/70 dark:ring-rose-400/25",
    institutionType: "Insurance",
    processingTime: "24-48 hours",
    feesLabel: "0.8% premium",
    feesPercent: 0.8,
    digitalOption: true,
    rating: 4.7,
    description:
      "Insurance bid-bond alternative — lower premium, no cash collateral required.",
  },
  {
    id: "cic",
    name: "CIC Insurance Group",
    shortName: "CIC",
    logoText: "CI",
    accent: "#E2231A",
    accentSecondary: "#F87171",
    logoSrc: "/banks/cic-logo.png",
    backdropSrc: "/banks/cic-backdrop.jpg",
    glassClass:
      "bg-red-50/70 dark:bg-red-500/10 ring-1 ring-red-200/70 dark:ring-red-400/25",
    institutionType: "Insurance",
    processingTime: "24 hours",
    feesLabel: "0.9% premium",
    feesPercent: 0.9,
    digitalOption: true,
    rating: 4.5,
    description:
      "Strong in cooperative-sector tenders and county government work.",
  },
];

export function getBank(id: string): BankProvider | null {
  return BANKS.find((b) => b.id === id) ?? null;
}
