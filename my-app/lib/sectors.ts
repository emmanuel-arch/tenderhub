/**
 * Sector classification for tenders.
 *
 * Based on analytics of 1,741 live tenders we cluster procurement
 * by 16 sectors using keyword matching against the title + description.
 * Each sector has a brand colour, glass palette (used for cards in
 * dark/light mode) and an image slug — the user supplies the matching
 * JPG at /public/sectors/{slug}.jpg.
 */
import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  Building2,
  Cpu,
  Droplet,
  GraduationCap,
  HardHat,
  Hospital,
  Landmark,
  Leaf,
  Package,
  Pencil,
  Shield,
  Shirt,
  Truck,
  UtensilsCrossed,
  Wrench,
  Zap,
} from "lucide-react";

export type SectorSlug =
  | "construction"
  | "roads"
  | "ict"
  | "medical"
  | "energy"
  | "water"
  | "education"
  | "transport"
  | "agriculture"
  | "security"
  | "uniforms"
  | "stationery"
  | "food"
  | "consultancy"
  | "supply"
  | "insurance"
  | "general";

export interface Sector {
  slug: SectorSlug;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  /** Brand accent colour (used for glow + buttons). */
  accent: string;
  /** Tailwind classes for a translucent glass surface in light + dark. */
  glassClass: string;
  /** Tailwind text colour for the accent label/badge. */
  accentTextClass: string;
  /** Tailwind ring/border colour for the accent. */
  accentBorderClass: string;
  /**
   * Keywords used for classification. Matched against
   * lower-cased title + first ~600 chars of description.
   */
  keywords: string[];
}

export const SECTORS: Sector[] = [
  {
    slug: "construction",
    label: "Construction & Civil Works",
    shortLabel: "Construction",
    description:
      "Building works, civil engineering, refurbishment and rehabilitation tenders.",
    icon: HardHat,
    accent: "#F59E0B",
    glassClass:
      "bg-amber-50/70 dark:bg-amber-500/10 backdrop-blur-md ring-1 ring-amber-200/60 dark:ring-amber-400/20",
    accentTextClass: "text-amber-700 dark:text-amber-300",
    accentBorderClass: "border-amber-300/60 dark:border-amber-400/30",
    keywords: [
      "construction",
      "civil works",
      "rehabilitation",
      "refurbishment",
      "renovation",
      "building",
      "structural",
      "masonry",
    ],
  },
  {
    slug: "roads",
    label: "Roads, Bridges & Drainage",
    shortLabel: "Roads",
    description:
      "Highway, road, drainage and bridge construction and maintenance.",
    icon: Truck,
    accent: "#64748B",
    glassClass:
      "bg-slate-100/70 dark:bg-slate-700/20 backdrop-blur-md ring-1 ring-slate-200/60 dark:ring-slate-500/20",
    accentTextClass: "text-slate-700 dark:text-slate-200",
    accentBorderClass: "border-slate-300/60 dark:border-slate-500/30",
    keywords: [
      "road",
      "highway",
      "drainage",
      "bridge",
      "pavement",
      "tarmac",
      "footbridge",
      "culvert",
    ],
  },
  {
    slug: "ict",
    label: "ICT & Digital",
    shortLabel: "ICT",
    description:
      "Software, hardware, licenses, cybersecurity and digital transformation.",
    icon: Cpu,
    accent: "#3B82F6",
    glassClass:
      "bg-blue-50/70 dark:bg-blue-500/10 backdrop-blur-md ring-1 ring-blue-200/60 dark:ring-blue-400/20",
    accentTextClass: "text-blue-700 dark:text-blue-300",
    accentBorderClass: "border-blue-300/60 dark:border-blue-400/30",
    keywords: [
      "ict",
      "software",
      "computer",
      "laptop",
      "system",
      "license",
      "digital",
      "cyber",
      "network",
      "server",
      "cloud",
      "wifi",
      "fiber",
    ],
  },
  {
    slug: "medical",
    label: "Health & Medical",
    shortLabel: "Medical",
    description:
      "Hospitals, drugs, lab equipment, PPE and medical services tenders.",
    icon: Hospital,
    accent: "#EF4444",
    glassClass:
      "bg-rose-50/70 dark:bg-rose-500/10 backdrop-blur-md ring-1 ring-rose-200/60 dark:ring-rose-400/20",
    accentTextClass: "text-rose-700 dark:text-rose-300",
    accentBorderClass: "border-rose-300/60 dark:border-rose-400/30",
    keywords: [
      "medical",
      "hospital",
      "drugs",
      "pharmaceutical",
      "lab",
      "ppe",
      "surgical",
      "health",
      "clinic",
      "vaccine",
      "diagnostic",
    ],
  },
  {
    slug: "energy",
    label: "Energy & Power",
    shortLabel: "Energy",
    description:
      "Power generation, transmission, solar, transformers and electrical works.",
    icon: Zap,
    accent: "#EAB308",
    glassClass:
      "bg-yellow-50/70 dark:bg-yellow-500/10 backdrop-blur-md ring-1 ring-yellow-200/60 dark:ring-yellow-400/20",
    accentTextClass: "text-yellow-700 dark:text-yellow-300",
    accentBorderClass: "border-yellow-300/60 dark:border-yellow-400/30",
    keywords: [
      "solar",
      "energy",
      "power",
      "electric",
      "transformer",
      "generator",
      "kengen",
      "wind",
      "geothermal",
    ],
  },
  {
    slug: "water",
    label: "Water & Sanitation",
    shortLabel: "Water",
    description:
      "Boreholes, water supply, sanitation, sewerage and irrigation tenders.",
    icon: Droplet,
    accent: "#06B6D4",
    glassClass:
      "bg-cyan-50/70 dark:bg-cyan-500/10 backdrop-blur-md ring-1 ring-cyan-200/60 dark:ring-cyan-400/20",
    accentTextClass: "text-cyan-700 dark:text-cyan-300",
    accentBorderClass: "border-cyan-300/60 dark:border-cyan-400/30",
    keywords: [
      "water",
      "borehole",
      "sanitation",
      "sewer",
      "irrigation",
      "wastewater",
      "drilling",
      "pipeline",
    ],
  },
  {
    slug: "education",
    label: "Education & Training",
    shortLabel: "Education",
    description:
      "Schools, universities, TVETs, training and educational equipment.",
    icon: GraduationCap,
    accent: "#8B5CF6",
    glassClass:
      "bg-violet-50/70 dark:bg-violet-500/10 backdrop-blur-md ring-1 ring-violet-200/60 dark:ring-violet-400/20",
    accentTextClass: "text-violet-700 dark:text-violet-300",
    accentBorderClass: "border-violet-300/60 dark:border-violet-400/30",
    keywords: [
      "school",
      "education",
      "training",
      "university",
      "college",
      "tvet",
      "polytechnic",
      "scholarship",
      "curriculum",
    ],
  },
  {
    slug: "transport",
    label: "Transport & Fleet",
    shortLabel: "Transport",
    description:
      "Vehicles, buses, trucks, motorbikes, fleet management and logistics.",
    icon: Truck,
    accent: "#0EA5E9",
    glassClass:
      "bg-sky-50/70 dark:bg-sky-500/10 backdrop-blur-md ring-1 ring-sky-200/60 dark:ring-sky-400/20",
    accentTextClass: "text-sky-700 dark:text-sky-300",
    accentBorderClass: "border-sky-300/60 dark:border-sky-400/30",
    keywords: [
      "vehicle",
      "motor",
      "bus",
      "truck",
      "fleet",
      "logistics",
      "lorry",
      "motorbike",
      "ambulance",
    ],
  },
  {
    slug: "agriculture",
    label: "Agriculture & Livestock",
    shortLabel: "Agriculture",
    description:
      "Agriculture, agribusiness, fertilizer, seed, livestock and irrigation.",
    icon: Leaf,
    accent: "#22C55E",
    glassClass:
      "bg-green-50/70 dark:bg-green-500/10 backdrop-blur-md ring-1 ring-green-200/60 dark:ring-green-400/20",
    accentTextClass: "text-green-700 dark:text-green-300",
    accentBorderClass: "border-green-300/60 dark:border-green-400/30",
    keywords: [
      "agric",
      "farm",
      "fertilizer",
      "seed",
      "livestock",
      "dairy",
      "tea",
      "coffee",
      "horticulture",
      "agribusiness",
    ],
  },
  {
    slug: "security",
    label: "Security & Safety",
    shortLabel: "Security",
    description:
      "Security services, fire-fighting, CCTV, surveillance and safety equipment.",
    icon: Shield,
    accent: "#DC2626",
    glassClass:
      "bg-red-50/70 dark:bg-red-500/10 backdrop-blur-md ring-1 ring-red-200/60 dark:ring-red-400/20",
    accentTextClass: "text-red-700 dark:text-red-300",
    accentBorderClass: "border-red-300/60 dark:border-red-400/30",
    keywords: [
      "security",
      "firefight",
      "fire-fight",
      "alarm",
      "cctv",
      "surveillance",
      "guard",
      "watchman",
      "safety",
    ],
  },
  {
    slug: "uniforms",
    label: "Uniforms & Apparel",
    shortLabel: "Uniforms",
    description: "Uniforms, garments, boots and protective clothing.",
    icon: Shirt,
    accent: "#A855F7",
    glassClass:
      "bg-purple-50/70 dark:bg-purple-500/10 backdrop-blur-md ring-1 ring-purple-200/60 dark:ring-purple-400/20",
    accentTextClass: "text-purple-700 dark:text-purple-300",
    accentBorderClass: "border-purple-300/60 dark:border-purple-400/30",
    keywords: [
      "uniform",
      "clothing",
      "garment",
      "boots",
      "apparel",
      "regalia",
    ],
  },
  {
    slug: "stationery",
    label: "Stationery & Printing",
    shortLabel: "Stationery",
    description:
      "Stationery, branded items, office supplies, printing and binding.",
    icon: Pencil,
    accent: "#7C3AED",
    glassClass:
      "bg-indigo-50/70 dark:bg-indigo-500/10 backdrop-blur-md ring-1 ring-indigo-200/60 dark:ring-indigo-400/20",
    accentTextClass: "text-indigo-700 dark:text-indigo-300",
    accentBorderClass: "border-indigo-300/60 dark:border-indigo-400/30",
    keywords: [
      "stationery",
      "printing",
      "branded",
      "office supplies",
      "toner",
      "cartridge",
    ],
  },
  {
    slug: "food",
    label: "Food, Catering & Rations",
    shortLabel: "Food",
    description: "Food, rations, catering services and groceries.",
    icon: UtensilsCrossed,
    accent: "#F97316",
    glassClass:
      "bg-orange-50/70 dark:bg-orange-500/10 backdrop-blur-md ring-1 ring-orange-200/60 dark:ring-orange-400/20",
    accentTextClass: "text-orange-700 dark:text-orange-300",
    accentBorderClass: "border-orange-300/60 dark:border-orange-400/30",
    keywords: [
      "food",
      "ration",
      "catering",
      "groceries",
      "produce",
      "meal",
      "diet",
    ],
  },
  {
    slug: "consultancy",
    label: "Consultancy & Advisory",
    shortLabel: "Consultancy",
    description: "Advisory, research, study and consultancy services.",
    icon: Briefcase,
    accent: "#0F766E",
    glassClass:
      "bg-teal-50/70 dark:bg-teal-500/10 backdrop-blur-md ring-1 ring-teal-200/60 dark:ring-teal-400/20",
    accentTextClass: "text-teal-700 dark:text-teal-300",
    accentBorderClass: "border-teal-300/60 dark:border-teal-400/30",
    keywords: [
      "consultancy",
      "consultant",
      "advisory",
      "study",
      "research",
      "feasibility",
    ],
  },
  {
    slug: "supply",
    label: "Supply & Delivery",
    shortLabel: "Supply",
    description:
      "General supply and delivery — broad procurement of goods and services.",
    icon: Package,
    accent: "#10B981",
    glassClass:
      "bg-emerald-50/70 dark:bg-emerald-500/10 backdrop-blur-md ring-1 ring-emerald-200/60 dark:ring-emerald-400/20",
    accentTextClass: "text-emerald-700 dark:text-emerald-300",
    accentBorderClass: "border-emerald-300/60 dark:border-emerald-400/30",
    keywords: ["supply", "delivery", "procurement of"],
  },
  {
    slug: "insurance",
    label: "Insurance & Indemnity",
    shortLabel: "Insurance",
    description: "Insurance, indemnity and risk-management services.",
    icon: Landmark,
    accent: "#1D4ED8",
    glassClass:
      "bg-blue-50/70 dark:bg-blue-500/10 backdrop-blur-md ring-1 ring-blue-200/60 dark:ring-blue-400/20",
    accentTextClass: "text-blue-700 dark:text-blue-300",
    accentBorderClass: "border-blue-300/60 dark:border-blue-400/30",
    keywords: ["insurance", "indemnity", "underwriting"],
  },
  {
    slug: "general",
    label: "General Procurement",
    shortLabel: "General",
    description: "Tenders that don't fit a specific sector cluster.",
    icon: Wrench,
    accent: "#0EA5E9",
    glassClass:
      "bg-slate-50/70 dark:bg-slate-700/15 backdrop-blur-md ring-1 ring-slate-200/60 dark:ring-slate-500/20",
    accentTextClass: "text-slate-700 dark:text-slate-200",
    accentBorderClass: "border-slate-300/60 dark:border-slate-500/30",
    keywords: [],
  },
];

const SECTOR_BY_SLUG = new Map(SECTORS.map((s) => [s.slug, s]));

export function getSector(slug: string | null | undefined): Sector {
  if (!slug) return SECTOR_BY_SLUG.get("general")!;
  return SECTOR_BY_SLUG.get(slug as SectorSlug) ?? SECTOR_BY_SLUG.get("general")!;
}

/** Classify a tender into the best-matching sector. */
export function classifyTender(input: {
  title?: string | null;
  description?: string | null;
  procuringEntity?: string | null;
}): SectorSlug {
  const text = (
    (input.title ?? "") +
    " " +
    (input.description ?? "").slice(0, 600) +
    " " +
    (input.procuringEntity ?? "")
  ).toLowerCase();

  // Order matters: more specific buckets win over generic supply.
  const order: SectorSlug[] = [
    "medical",
    "ict",
    "energy",
    "water",
    "roads",
    "construction",
    "education",
    "agriculture",
    "transport",
    "security",
    "uniforms",
    "stationery",
    "food",
    "consultancy",
    "insurance",
    "supply",
    "general",
  ];
  for (const slug of order) {
    const s = SECTOR_BY_SLUG.get(slug);
    if (!s) continue;
    if (s.keywords.length === 0) continue;
    if (s.keywords.some((kw) => text.includes(kw))) return slug;
  }
  return "general";
}

/** Path to the background image for a sector hero strip. */
export function sectorImagePath(slug: SectorSlug): string {
  return `/sectors/${slug}.jpg`;
}
