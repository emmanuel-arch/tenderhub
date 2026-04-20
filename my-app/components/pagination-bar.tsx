"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  page: number;
  totalPages: number;
}

export function PaginationBar({ page, totalPages }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  if (totalPages <= 1) return null;

  const go = (p: number) => {
    const next = new URLSearchParams(params.toString());
    if (p === 1) next.delete("page");
    else next.set("page", String(p));
    router.push(`/tenders?${next.toString()}`);
  };

  const window = 2;
  const pages: (number | "…")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= page - window && i <= page + window)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }

  return (
    <nav className="mt-10 flex items-center justify-center gap-1">
      <button
        onClick={() => go(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:border-slate-300 disabled:opacity-40 dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-300 dark:hover:border-emerald-400/30"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Prev
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e-${i}`} className="px-2 text-slate-400 text-xs dark:text-slate-500">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => go(p)}
            className={`h-9 min-w-9 rounded-lg px-3 text-xs font-medium transition-colors ${
              p === page
                ? "bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950"
                : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-300 dark:hover:border-emerald-400/30"
            }`}
          >
            {p}
          </button>
        ),
      )}
      <button
        onClick={() => go(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:border-slate-300 disabled:opacity-40 dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-300 dark:hover:border-emerald-400/30"
      >
        Next
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </nav>
  );
}
