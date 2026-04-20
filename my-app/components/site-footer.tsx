import Link from "next/link";
import { FileText } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50/60 dark:border-white/10 dark:bg-slate-950/60">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950">
                <FileText className="h-4 w-4" />
              </div>
              <div className="font-display text-sm text-slate-900 dark:text-slate-50">
                TenderHub Kenya
              </div>
            </Link>
            <p className="mt-4 max-w-sm text-sm text-slate-600 dark:text-slate-400">
              Kenya&apos;s leading aggregation platform for government and
              private-sector tender opportunities.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Platform
            </h4>
            <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li><Link href="/tenders" className="hover:text-slate-900 dark:hover:text-emerald-300">All Tenders</Link></li>
              <li><Link href="/tenders?category=Government" className="hover:text-slate-900 dark:hover:text-emerald-300">Government</Link></li>
              <li><Link href="/tenders?category=Private" className="hover:text-slate-900 dark:hover:text-emerald-300">Private</Link></li>
              <li><Link href="/apply" className="hover:text-slate-900 dark:hover:text-emerald-300">Apply for Bid Bond</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Categories
            </h4>
            <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li><Link href="/tenders?subCategory=Goods" className="hover:text-slate-900 dark:hover:text-emerald-300">Goods</Link></li>
              <li><Link href="/tenders?subCategory=Works" className="hover:text-slate-900 dark:hover:text-emerald-300">Works</Link></li>
              <li><Link href="/tenders?subCategory=Services" className="hover:text-slate-900 dark:hover:text-emerald-300">Services</Link></li>
              <li><Link href="/tenders?subCategory=Consultancy" className="hover:text-slate-900 dark:hover:text-emerald-300">Consultancy</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Account
            </h4>
            <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li><Link href="/login" className="hover:text-slate-900 dark:hover:text-emerald-300">Sign In</Link></li>
              <li><Link href="/dashboard" className="hover:text-slate-900 dark:hover:text-emerald-300">My Dashboard</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-6 text-center text-xs text-slate-500 dark:border-white/10 dark:text-slate-500">
          © {new Date().getFullYear()} TenderHub Kenya · Tender data sourced
          from public procurement portals.
        </div>
      </div>
    </footer>
  );
}
