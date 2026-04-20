"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

interface Props {
  className?: string;
}

export function ThemeToggle({ className = "" }: Props) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const current = (mounted ? (theme === "system" ? resolvedTheme : theme) : "dark") as
    | "dark"
    | "light";
  const isDark = current === "dark";

  function toggle() {
    setTheme(isDark ? "light" : "dark");
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={toggle}
      suppressHydrationWarning
      className={[
        "group relative inline-flex h-9 w-16 items-center rounded-full",
        "border transition-colors duration-300",
        "border-slate-300/70 bg-slate-100",
        "dark:border-white/10 dark:bg-slate-800/60 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      ].join(" ")}
    >
      {/* Knob */}
      <span
        className={[
          "absolute top-1 left-1 inline-flex h-7 w-7 items-center justify-center rounded-full",
          "bg-white text-amber-500 shadow-sm transition-all duration-300 ease-out",
          "dark:bg-slate-950 dark:text-emerald-300",
          "dark:shadow-[0_0_18px_-2px_rgba(16,185,129,0.55),inset_0_0_0_1px_rgba(255,255,255,0.05)]",
          isDark ? "translate-x-7" : "translate-x-0",
        ].join(" ")}
      >
        <Sun
          className={`absolute h-4 w-4 transition-all duration-300 ${
            isDark ? "scale-0 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"
          }`}
        />
        <Moon
          className={`absolute h-4 w-4 transition-all duration-300 ${
            isDark ? "scale-100 rotate-0 opacity-100" : "scale-0 -rotate-90 opacity-0"
          }`}
        />
      </span>

      {/* Track icons (decorative) */}
      <span className="pointer-events-none flex w-full items-center justify-between px-2 text-[10px]">
        <Sun
          className={`h-3 w-3 transition-opacity ${
            isDark ? "opacity-0" : "opacity-50 text-amber-500"
          }`}
        />
        <Moon
          className={`h-3 w-3 transition-opacity ${
            isDark ? "opacity-60 text-emerald-300" : "opacity-0"
          }`}
        />
      </span>
    </button>
  );
}
