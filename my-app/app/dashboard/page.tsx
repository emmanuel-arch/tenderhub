"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Hash,
  Loader2,
  Shield,
  XCircle,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { ApplicationRecord } from "@/lib/types";
import { loadApplications } from "@/lib/applications-store";
import { formatDateTime, formatKES, initials, nullSafe } from "@/lib/format";
import { toast } from "sonner";

const TABS = [
  { id: "all", label: "All" },
  { id: "submitted", label: "Submitted" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
] as const;

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400 dark:text-emerald-400" />
        </div>
      }
    >
      <DashboardPageInner />
    </Suspense>
  );
}

function DashboardPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, isAuthenticated, loading } = useAuth();
  const [apps, setApps] = useState<ApplicationRecord[] | null>(null);
  const [tab, setTab] = useState<typeof TABS[number]["id"]>("all");

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace("/login?next=/dashboard");
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    setApps(loadApplications());
  }, []);

  useEffect(() => {
    const submittedId = params.get("submitted");
    if (submittedId && apps) {
      toast.success("Application submitted — we&apos;ll keep you updated.");
    }
  }, [params, apps]);

  const filtered = useMemo(() => {
    if (!apps) return [];
    if (tab === "all") return apps;
    return apps.filter((a) => a.status === tab);
  }, [apps, tab]);

  const counts = useMemo(() => {
    const c = { all: 0, submitted: 0, approved: 0, rejected: 0, "under-review": 0 };
    for (const a of apps ?? []) {
      c.all++;
      c[a.status]++;
    }
    return c;
  }, [apps]);

  if (loading || !user || apps === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400 dark:text-emerald-400" />
      </div>
    );
  }

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

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-base font-display text-white dark:bg-emerald-500 dark:text-slate-950 dark:shadow-[0_0_30px_-5px_rgba(16,185,129,0.5)]">
              {initials(user.name)}
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
                Dashboard
              </div>
              <h1 className="font-display text-2xl text-slate-900 sm:text-3xl dark:text-slate-50">
                Hi {user.name.split(" ")[0]} 👋
              </h1>
              <div className="text-sm text-slate-500 dark:text-slate-400">{user.email}</div>
            </div>
          </div>
          <Link href="/apply">
            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400 dark:shadow-[0_8px_30px_-8px_rgba(16,185,129,0.6)]">
              <Shield className="h-4 w-4" />
              New Bid Bond Application
            </Button>
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={FileText}
            label="Total Applications"
            value={counts.all}
            tone="slate"
          />
          <StatCard
            icon={Clock}
            label="In Review"
            value={counts.submitted + counts["under-review"]}
            tone="amber"
          />
          <StatCard
            icon={CheckCircle2}
            label="Approved"
            value={counts.approved}
            tone="emerald"
          />
          <StatCard
            icon={XCircle}
            label="Rejected"
            value={counts.rejected}
            tone="rose"
          />
        </div>

        <div className="mt-10">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-white/10">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative -mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                  tab === t.id
                    ? "border-emerald-600 text-slate-900 dark:border-emerald-400 dark:text-slate-50"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                {t.label}
                <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 dark:bg-white/10 dark:text-slate-300">
                  {counts[t.id as keyof typeof counts] ?? 0}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-3">
            {filtered.length === 0 ? (
              <EmptyState />
            ) : (
              filtered.map((a) => <ApplicationRow key={a.id} app={a} />)
            )}
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof FileText;
  label: string;
  value: number;
  tone: "slate" | "emerald" | "amber" | "rose";
}) {
  const tones = {
    slate: "bg-slate-50 text-slate-700 ring-slate-200 dark:bg-white/5 dark:text-slate-200 dark:ring-white/10",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/20",
    amber: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/20",
    rose: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-400/20",
  } as const;
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900/50">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${tones[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </div>
      </div>
      <div className="mt-3 font-display text-3xl text-slate-900 dark:text-slate-50">{value}</div>
    </div>
  );
}

function ApplicationRow({ app }: { app: ApplicationRecord }) {
  const statusStyle = {
    submitted: "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-400/30",
    "under-review": "bg-blue-50 text-blue-800 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-200 dark:ring-blue-400/30",
    approved: "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-400/30",
    rejected: "bg-rose-50 text-rose-800 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-200 dark:ring-rose-400/30",
  } as const;
  const statusIcon = {
    submitted: Clock,
    "under-review": AlertCircle,
    approved: CheckCircle2,
    rejected: XCircle,
  } as const;
  const SI = statusIcon[app.status];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900/50">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ring-1 ${statusStyle[app.status]}`}
            >
              <SI className="h-3 w-3" />
              {app.status.replace("-", " ")}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Submitted {formatDateTime(app.submittedAt)}
            </span>
          </div>
          <h3 className="mt-2 line-clamp-2 font-display text-base text-slate-900 dark:text-slate-50">
            {app.tenderTitle}
          </h3>
          <div className="mt-2 grid grid-cols-1 gap-1.5 text-xs text-slate-600 sm:grid-cols-3 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
              {nullSafe(app.tenderNumber, "—")}
            </div>
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
              {app.bankName}
            </div>
            <div className="flex items-center gap-1.5 font-medium text-slate-900 dark:text-emerald-300">
              <Calendar className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
              {formatKES(app.bondAmount)}
            </div>
          </div>
        </div>
        <Link
          href={`/tenders/${app.tenderId}`}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:border-slate-300 dark:border-white/10 dark:bg-slate-900/50 dark:text-slate-200 dark:hover:border-emerald-400/30 dark:hover:text-emerald-300"
        >
          View tender
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50/40 p-16 text-center dark:border-white/10 dark:bg-slate-900/30">
      <FileText className="h-10 w-10 text-slate-300 dark:text-slate-600" />
      <h3 className="mt-4 font-display text-lg text-slate-900 dark:text-slate-50">
        No applications yet
      </h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        Browse active tenders and apply for a bid bond — your applications
        will show up here.
      </p>
      <div className="mt-4 flex gap-2">
        <Link href="/tenders">
          <Button size="sm" className="bg-slate-900 hover:bg-slate-800 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400">
            Browse Tenders
          </Button>
        </Link>
        <Link href="/apply">
          <Button size="sm" variant="outline" className="dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-900/70">
            Direct Apply
          </Button>
        </Link>
      </div>
    </div>
  );
}
