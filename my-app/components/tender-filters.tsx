"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const SUB_CATEGORIES = ["All", "Goods", "Works", "Services", "Consultancy", "Other"] as const;
const CATEGORIES = ["All", "Government", "Private"] as const;

interface Props {
  total: number;
}

export function TenderFilters({ total }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const currentSearch = params.get("search") ?? "";
  const currentCategory = params.get("category") ?? "All";
  const currentSub = params.get("subCategory") ?? "All";
  const onlyComplete = params.get("onlyComplete") === "1";
  const requireBidBond = params.get("requireBidBond") === "1";

  const [searchInput, setSearchInput] = useState(currentSearch);

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "" || v === "All") next.delete(k);
      else next.set(k, v);
    }
    next.delete("page");
    startTransition(() => {
      router.push(`/tenders?${next.toString()}`);
    });
  };

  return (
    <div className="space-y-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          update({ search: searchInput });
        }}
        className="relative"
      >
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search tenders by title, entity, number, or keyword…"
          className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-32 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/20"
        />
        <Button
          type="submit"
          size="sm"
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400"
          disabled={pending}
        >
          {pending ? "Searching…" : "Search"}
        </Button>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Type
        </span>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => update({ category: c })}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              currentCategory === c
                ? "bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950"
                : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-300 dark:hover:border-emerald-400/30 dark:hover:text-emerald-300"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Category
        </span>
        {SUB_CATEGORIES.map((sc) => (
          <button
            key={sc}
            onClick={() => update({ subCategory: sc })}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              currentSub === sc
                ? "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950"
                : "border border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:text-emerald-700 dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-300 dark:hover:border-emerald-400/30 dark:hover:text-emerald-300"
            }`}
          >
            {sc}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 dark:border-white/10 dark:bg-slate-900/40">
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={onlyComplete}
              onChange={(e) =>
                update({ onlyComplete: e.target.checked ? "1" : null })
              }
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-white/20 dark:bg-slate-900"
            />
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Only complete tenders (parsed + active deadline)
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={requireBidBond}
              onChange={(e) =>
                update({ requireBidBond: e.target.checked ? "1" : null })
              }
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-white/20 dark:bg-slate-900"
            />
            Bid bond required only
          </label>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            <strong className="text-slate-900 dark:text-slate-100">{total.toLocaleString()}</strong>{" "}
            results
          </span>
          {(currentSearch ||
            currentCategory !== "All" ||
            currentSub !== "All" ||
            onlyComplete ||
            requireBidBond) && (
            <button
              onClick={() => {
                setSearchInput("");
                startTransition(() => router.push("/tenders"));
              }}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:border-slate-300 dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-300 dark:hover:border-emerald-400/30"
            >
              <X className="h-3 w-3" />
              Clear all
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
