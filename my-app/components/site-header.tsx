"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Search,
  Shield,
  User,
  UserPlus,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "./auth-provider";
import { initials } from "@/lib/format";
import { ThemeToggle } from "./theme-toggle";
import { REGIONS } from "@/lib/counties";
import { SECTORS } from "@/lib/sectors";

type MenuKey = "sectors" | "locations" | "user" | "search" | null;

const TOP_SECTORS = [
  "construction",
  "roads",
  "ict",
  "medical",
  "energy",
  "water",
  "education",
  "agriculture",
] as const;

export function SiteHeader() {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<MenuKey>(null);
  const [searchValue, setSearchValue] = useState("");
  const navRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!navRef.current) return;
      if (navRef.current.contains(e.target as Node)) return;
      setOpenMenu(null);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenMenu(null);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setOpenMenu(null);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (openMenu === "search") {
      requestAnimationFrame(() => searchInputRef.current?.focus());
    }
  }, [openMenu]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchValue.trim();
    setOpenMenu(null);
    setMobileOpen(false);
    router.push(q ? `/tenders?q=${encodeURIComponent(q)}` : "/tenders");
  }

  const browseActive = pathname === "/categories";
  const sectorsActive = pathname?.startsWith("/categories/sectors") ?? false;
  const locationsActive =
    (pathname?.startsWith("/categories/regions") ||
      pathname?.startsWith("/categories/counties")) ??
    false;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/85 backdrop-blur-md dark:border-white/10 dark:bg-slate-950/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center group shrink-0">
          <Image
            src="/brand/birgenai-logo.png"
            alt="BirgenAI"
            width={140}
            height={40}
            priority
            className="h-9 w-auto transition-transform group-hover:-translate-y-px dark:brightness-110"
          />
        </Link>

        {/* Primary nav */}
        <nav
          ref={navRef}
          className="hidden md:flex flex-1 items-center justify-center gap-1"
        >
          <NavLink href="/categories" active={browseActive}>
            Browse Tenders
          </NavLink>

          <NavMenuButton
            label="Sectors"
            active={sectorsActive}
            open={openMenu === "sectors"}
            onClick={() =>
              setOpenMenu((m) => (m === "sectors" ? null : "sectors"))
            }
          />

          <NavMenuButton
            label="Locations"
            active={locationsActive}
            open={openMenu === "locations"}
            onClick={() =>
              setOpenMenu((m) => (m === "locations" ? null : "locations"))
            }
          />

          {/* Sectors dropdown */}
          {openMenu === "sectors" && (
            <DropdownPanel>
              <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 sm:p-4">
                {TOP_SECTORS.map((slug) => {
                  const s = SECTORS.find((x) => x.slug === slug);
                  if (!s) return null;
                  return (
                    <Link
                      key={s.slug}
                      href={`/categories/sectors/${s.slug}`}
                      className="group flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-slate-100 dark:hover:bg-white/5"
                    >
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-white shadow"
                        style={{ backgroundColor: s.accent }}
                      >
                        <s.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {s.shortLabel}
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-2 dark:text-slate-400">
                          {s.description}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
              <div className="border-t border-slate-100 px-4 py-3 dark:border-white/5">
                <Link
                  href="/categories/sectors"
                  className="text-xs font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-300"
                >
                  See all 16 sectors →
                </Link>
              </div>
            </DropdownPanel>
          )}

          {/* Locations dropdown */}
          {openMenu === "locations" && (
            <DropdownPanel>
              <div className="grid grid-cols-2 gap-1.5 p-3 sm:grid-cols-3 sm:p-4">
                {REGIONS.filter((r) => r.slug !== "national").map((r) => (
                  <Link
                    key={r.slug}
                    href={`/categories/regions/${r.slug}`}
                    className="rounded-lg px-3 py-2 text-sm transition-colors hover:bg-slate-100 dark:hover:bg-white/5"
                  >
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {r.label}
                    </div>
                    <div className="text-[11px] text-slate-500 line-clamp-1 dark:text-slate-400">
                      {r.tagline}
                    </div>
                  </Link>
                ))}
              </div>
              <div className="border-t border-slate-100 px-4 py-3 dark:border-white/5">
                <Link
                  href="/categories/regions"
                  className="text-xs font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-300"
                >
                  Browse all 47 counties →
                </Link>
              </div>
            </DropdownPanel>
          )}
        </nav>

        {/* Right cluster: search · theme · user */}
        <div className="hidden md:flex items-center gap-1 shrink-0">
          <div className="relative">
            <button
              type="button"
              aria-label="Search tenders"
              onClick={() =>
                setOpenMenu((m) => (m === "search" ? null : "search"))
              }
              className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                openMenu === "search"
                  ? "bg-slate-100 text-slate-900 dark:bg-white/10 dark:text-emerald-300"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-emerald-300"
              }`}
            >
              <Search className="h-4 w-4" />
            </button>
            {openMenu === "search" && (
              <form
                onSubmit={submitSearch}
                className="absolute right-0 top-12 z-50 w-[22rem] overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-white/10 dark:bg-slate-950/95 dark:backdrop-blur-md"
              >
                <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 dark:bg-white/5">
                  <Search className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder="Search 1,700+ live tenders…"
                    className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                  <kbd className="hidden rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 sm:inline-block dark:bg-white/10 dark:text-slate-300">
                    ↵
                  </kbd>
                </div>
              </form>
            )}
          </div>

          <ThemeToggle />

          {/* User menu */}
          <div className="relative">
            <button
              type="button"
              aria-label="Account menu"
              onClick={() =>
                setOpenMenu((m) => (m === "user" ? null : "user"))
              }
              className={`flex h-9 items-center gap-2 rounded-full px-1.5 transition-colors ${
                openMenu === "user"
                  ? "bg-slate-100 dark:bg-white/10"
                  : "hover:bg-slate-100 dark:hover:bg-white/5"
              }`}
            >
              {isAuthenticated && user ? (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white dark:bg-emerald-500 dark:text-slate-950">
                  {initials(user.name)}
                </span>
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200">
                  <User className="h-4 w-4" />
                </span>
              )}
              <ChevronDown className="hidden h-3 w-3 text-slate-500 dark:text-slate-400 sm:block" />
            </button>

            {openMenu === "user" && (
              <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-950/95 dark:backdrop-blur-md">
                {isAuthenticated && user ? (
                  <>
                    <div className="border-b border-slate-100 px-4 py-3 dark:border-white/5">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {user.name}
                      </div>
                      <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {user.email}
                      </div>
                    </div>
                    <div className="p-1">
                      <MenuLink href="/dashboard" icon={LayoutDashboard}>
                        Dashboard
                      </MenuLink>
                      <MenuLink href="/apply" icon={Shield}>
                        Apply for Bid Bond
                      </MenuLink>
                    </div>
                    <div className="border-t border-slate-100 p-1 dark:border-white/5">
                      <button
                        onClick={() => {
                          logout();
                          setOpenMenu(null);
                          router.push("/");
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="border-b border-slate-100 px-4 py-3 dark:border-white/5">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Welcome to BirgenAI
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Sign in to save tenders and apply for bonds.
                      </div>
                    </div>
                    <div className="p-1">
                      <MenuLink href="/login" icon={LogIn}>
                        Sign in
                      </MenuLink>
                      <MenuLink href="/login?mode=register" icon={UserPlus}>
                        Create account
                      </MenuLink>
                      <MenuLink href="/apply" icon={Shield}>
                        Apply for Bid Bond
                      </MenuLink>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile cluster */}
        <div className="ml-auto flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button
            className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950/95 dark:backdrop-blur-md">
          <div className="space-y-1 px-4 py-3">
            <form
              onSubmit={submitSearch}
              className="mb-2 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 dark:bg-white/5"
            >
              <Search className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search tenders…"
                className="flex-1 bg-transparent text-sm focus:outline-none dark:text-slate-100"
              />
            </form>
            <MobileLink href="/categories" label="Browse Tenders" />
            <MobileLink href="/categories/sectors" label="Sectors" />
            <MobileLink href="/categories/regions" label="Locations" />
            <MobileLink href="/apply" label="Apply for Bid Bond" />
            {isAuthenticated ? (
              <>
                <MobileLink href="/dashboard" label="Dashboard" />
                <button
                  onClick={() => {
                    logout();
                    setMobileOpen(false);
                    router.push("/");
                  }}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <MobileLink href="/login" label="Sign in" />
                <MobileLink href="/login?mode=register" label="Create account" />
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`relative rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "text-slate-900 dark:text-emerald-300"
          : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-emerald-300"
      }`}
    >
      {children}
      {active && (
        <span className="absolute -bottom-0.5 left-3 right-3 h-0.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
      )}
    </Link>
  );
}

function NavMenuButton({
  label,
  active,
  open,
  onClick,
}: {
  label: string;
  active: boolean;
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      className={`relative inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        open || active
          ? "text-slate-900 dark:text-emerald-300"
          : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-emerald-300"
      }`}
    >
      {label}
      <ChevronDown
        className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
      />
      {active && (
        <span className="absolute -bottom-0.5 left-3 right-6 h-0.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
      )}
    </button>
  );
}

function DropdownPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute left-1/2 top-14 z-50 w-[640px] -translate-x-1/2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-950/95 dark:backdrop-blur-md">
      {children}
    </div>
  );
}

function MenuLink({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: typeof LogIn;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5"
    >
      <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
      {children}
    </Link>
  );
}

function MobileLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5"
    >
      {label}
    </Link>
  );
}
