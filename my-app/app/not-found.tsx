import Link from "next/link";
import { ArrowLeft, FileSearch } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-background">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4">
        <div className="text-center">
          <FileSearch className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
          <h1 className="mt-6 font-display text-7xl text-slate-900 dark:text-slate-50">404</h1>
          <p className="mt-4 max-w-md text-slate-600 dark:text-slate-400">
            The page you&apos;re looking for doesn&apos;t exist — but there are
            still hundreds of active tenders waiting.
          </p>
          <div className="mt-8 flex justify-center gap-2">
            <Link href="/">
              <Button variant="outline" className="gap-2 dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-900/70">
                <ArrowLeft className="h-4 w-4" /> Go Home
              </Button>
            </Link>
            <Link href="/tenders">
              <Button className="bg-slate-900 hover:bg-slate-800 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400">
                Browse Tenders
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
