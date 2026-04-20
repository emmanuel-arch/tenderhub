import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Briefcase,
  Building2,
  CheckCircle2,
  FileText,
  GraduationCap,
  Package,
  Search,
  Shield,
  Sparkles,
  TrendingUp,
  Wrench,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CategoryGlow } from "@/components/category-glow";
import { TenderCard } from "@/components/tender-card";
import {
  getFeaturedTenders,
  getPlatformOverview,
} from "@/lib/tenders";
import { formatNumber } from "@/lib/format";

export const revalidate = 300;

export default async function HomePage() {
  const [overview, featured] = await Promise.all([
    getPlatformOverview().catch(() => null),
    getFeaturedTenders(6).catch(() => []),
  ]);

  const stats = {
    active: overview?.totalActive ?? 0,
    government: overview?.governmentCount ?? 0,
    private: overview?.privateCount ?? 0,
    bonds: overview?.bondRequiredCount ?? 0,
    entities: overview?.uniqueEntities ?? 0,
    total: overview?.totalEverScraped ?? 0,
  };

  return (
    <div className="min-h-screen bg-white dark:bg-background">
      <SiteHeader />

      <section className="relative isolate overflow-hidden">
        {/* Background video */}
        <video
          className="absolute inset-0 -z-20 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/hero/login-poster.jpg"
        >
          <source src="/hero/login-bg.mp4" type="video/mp4" />
          <source src="/hero/login-bg.webm" type="video/webm" />
        </video>
        {/* Light-mode scrim: warm grey, keeps the page airy */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-white/92 via-white/85 to-white dark:hidden" />
        {/* Dark-mode scrim: deep + subtle emerald glow */}
        <div className="pointer-events-none absolute inset-0 -z-10 hidden bg-gradient-to-br from-slate-950/85 via-slate-900/70 to-slate-950/95 dark:block" />
        <div className="pointer-events-none absolute inset-0 -z-10 hidden bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.18),transparent_60%)] dark:block" />

        <div className="absolute inset-0 -z-10 bg-grid opacity-30 dark:opacity-20" />
        <div className="absolute top-32 -left-32 -z-10 h-96 w-96 rounded-full bg-emerald-100/40 blur-3xl dark:bg-emerald-500/10 dark:animate-aurora" />
        <div className="absolute -top-20 right-0 -z-10 h-96 w-96 rounded-full bg-blue-100/40 blur-3xl dark:bg-blue-500/10 dark:animate-aurora" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200 dark:shadow-[0_0_30px_-8px_rgba(16,185,129,0.55)]">
                <TrendingUp className="h-3 w-3" />
                {formatNumber(stats.active)}+ Active Tenders Available
              </div>
              <h1 className="mt-6 font-display text-4xl leading-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-slate-50">
                Kenya&apos;s Leading Tender
                <br />
                <span className="bg-gradient-to-r from-emerald-700 to-emerald-500 bg-clip-text text-transparent dark:from-emerald-300 dark:to-emerald-500">
                  Aggregation Platform
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
                Access comprehensive tender opportunities from government
                ministries, county governments, and private sector
                organizations. All in one centralized platform.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/tenders">
                  <Button
                    size="lg"
                    className="gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400 dark:shadow-[0_8px_30px_-8px_rgba(16,185,129,0.6)]"
                  >
                    Explore Tenders
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/apply">
                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-2 border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-50 dark:border-emerald-400/40 dark:bg-white/5 dark:text-emerald-200 dark:hover:bg-emerald-500/10"
                  >
                    <Shield className="h-4 w-4" />
                    Apply for Bid Bond
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="ghost" className="dark:text-slate-200 dark:hover:bg-white/5">
                    Get Started
                  </Button>
                </Link>
              </div>

              <div className="mt-12 grid grid-cols-3 gap-6 border-t border-slate-200 pt-8 dark:border-white/10">
                <Stat
                  big={`${formatNumber(stats.active)}+`}
                  label="Active Tenders"
                />
                <Stat big="4" label="Categories" />
                <Stat big="24/7" label="Access" />
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 dark:border-white/10 dark:bg-slate-900/40 dark:shadow-[0_20px_60px_-20px_rgba(16,185,129,0.25)] dark:backdrop-blur-md">
                <div className="space-y-3">
                  <FeatureRow
                    icon={Building2}
                    title="Government Opportunities"
                    sub="From all ministries & counties"
                    accent="blue"
                  />
                  <FeatureRow
                    icon={Search}
                    title="Smart Filtering"
                    sub="Find relevant tenders fast"
                    accent="emerald"
                  />
                  <FeatureRow
                    icon={Shield}
                    title="Bid Bond Management"
                    sub="Integrated with local banks"
                    accent="emerald"
                  />
                </div>
                <div className="absolute -right-4 top-1/2 -translate-y-1/2">
                  <div className="rounded-full bg-slate-900 p-2 shadow-lg dark:bg-emerald-500 dark:shadow-emerald-500/40">
                    <Sparkles className="h-4 w-4 text-white dark:text-slate-950" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative bg-slate-50/60 py-20 dark:bg-slate-950/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="font-display text-3xl text-slate-900 sm:text-4xl dark:text-slate-50">
              Everything You Need to Win Tenders
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400">
              Comprehensive tools and features designed for Kenyan businesses
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={Search}
              title="Smart Search"
              body="Filter by category, entity, deadline, and bid bond requirements."
            />
            <FeatureCard
              icon={Bell}
              title="Real-time Updates"
              body="New tenders pulled directly from procurement portals every few hours."
            />
            <FeatureCard
              icon={Shield}
              title="Bank-Backed Bid Bonds"
              body="Apply through 6+ banks, MFIs and insurers in a single guided flow."
            />
            <FeatureCard
              icon={BarChart3}
              title="Application Dashboard"
              body="Track every application, document, and approval in one place."
            />
          </div>
        </div>
      </section>

      <section className="relative bg-white py-20 dark:bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl text-slate-900 sm:text-4xl dark:text-slate-50">
                Browse by Category
              </h2>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                {formatNumber(stats.total)} tenders organized across procurement
                types
              </p>
            </div>
            <Link
              href="/tenders"
              className="text-sm font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200"
            >
              View all →
            </Link>
          </div>

          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <CategoryTile
              href="/tenders?subCategory=Goods"
              icon={Package}
              label="Goods"
              count={overview?.bySub.Goods ?? 0}
              variant="goods"
              description="Office supplies, equipment, vehicles, ICT hardware"
            />
            <CategoryTile
              href="/tenders?subCategory=Works"
              icon={Wrench}
              label="Works"
              count={overview?.bySub.Works ?? 0}
              variant="works"
              description="Construction, civil engineering, infrastructure"
            />
            <CategoryTile
              href="/tenders?subCategory=Services"
              icon={Briefcase}
              label="Services"
              count={overview?.bySub.Services ?? 0}
              variant="services"
              description="Maintenance, security, cleaning, logistics"
            />
            <CategoryTile
              href="/tenders?subCategory=Consultancy"
              icon={GraduationCap}
              label="Consultancy"
              count={overview?.bySub.Consultancy ?? 0}
              variant="consultancy"
              description="Advisory, research, design, audit, training"
            />
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="relative bg-slate-50/40 py-20 dark:bg-slate-950/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200">
                  <Sparkles className="h-3 w-3" />
                  Featured this week
                </div>
                <h2 className="mt-3 font-display text-3xl text-slate-900 sm:text-4xl dark:text-slate-50">
                  High-Quality Active Tenders
                </h2>
                <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-400">
                  Hand-picked by completeness — these tenders have full
                  documentation, parsed bid-bond requirements, and confirmed
                  deadlines.
                </p>
              </div>
              <Link
                href="/tenders?onlyComplete=1"
                className="text-sm font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200"
              >
                See all complete →
              </Link>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featured.map((t) => (
                <TenderCard key={t.id} tender={t} variant="feature" />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="relative overflow-hidden bg-slate-900 py-24 dark:bg-slate-950 dark:border-y dark:border-white/5">
        <div className="absolute inset-0 bg-grid-dark opacity-40" />
        <div className="absolute -bottom-20 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-500/20 blur-3xl dark:bg-emerald-500/30" />
        <div className="absolute top-0 left-1/4 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl hidden dark:block" />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <CategoryGlow
            icon={CheckCircle2}
            label=""
            variant="government"
            size="md"
          />
          <h2 className="mt-6 font-display text-3xl text-white sm:text-5xl">
            Ready to Win Your Next Tender?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
            Join hundreds of Kenyan businesses streamlining their bid-bond
            applications and tender discovery.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link href="/tenders">
              <Button
                size="lg"
                className="gap-2 bg-emerald-500 text-white hover:bg-emerald-600"
              >
                Browse Active Tenders
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/apply">
              <Button
                size="lg"
                variant="outline"
                className="gap-2 border-white/30 bg-white/10 text-white backdrop-blur hover:bg-white/20"
              >
                <Zap className="h-4 w-4" />
                Apply for Bid Bond
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function Stat({ big, label }: { big: string; label: string }) {
  return (
    <div>
      <div className="font-display text-2xl text-slate-900 sm:text-3xl dark:text-slate-50">
        {big}
      </div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </div>
    </div>
  );
}

function FeatureRow({
  icon: Icon,
  title,
  sub,
  accent,
}: {
  icon: typeof FileText;
  title: string;
  sub: string;
  accent: "blue" | "emerald";
}) {
  const colors =
    accent === "emerald"
      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
      : "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300";
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/40 p-4 dark:border-white/5 dark:bg-white/[0.02]">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{sub}</div>
        </div>
      </div>
      <CheckCircle2 className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof FileText;
  title: string;
  body: string;
}) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-900/5 dark:border-white/5 dark:bg-slate-900/40 dark:hover:border-emerald-400/30 dark:hover:bg-slate-900/70 dark:hover:shadow-emerald-500/10">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white transition-transform group-hover:scale-110 dark:bg-emerald-500 dark:text-slate-950 dark:shadow-[0_0_25px_-5px_rgba(16,185,129,0.5)]">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-5 font-display text-base text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{body}</p>
    </div>
  );
}

function CategoryTile({
  href,
  icon,
  label,
  count,
  variant,
  description,
}: {
  href: string;
  icon: typeof Package;
  label: string;
  count: number;
  variant: "goods" | "works" | "services" | "consultancy";
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col items-center rounded-3xl border border-slate-200 bg-white p-8 text-center transition-all hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-900/5 dark:border-white/5 dark:bg-slate-900/40 dark:hover:border-emerald-400/30 dark:hover:bg-slate-900/70 dark:hover:shadow-emerald-500/10"
    >
      <CategoryGlow icon={icon} label={label} variant={variant} size="md" />
      <div className="mt-6 font-display text-3xl text-slate-900 dark:text-slate-50">
        {formatNumber(count)}
      </div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Tenders
      </div>
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{description}</p>
    </Link>
  );
}
