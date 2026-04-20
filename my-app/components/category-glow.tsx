import { LucideIcon } from "lucide-react";

type GlowVariant =
  | "government"
  | "private"
  | "goods"
  | "works"
  | "services"
  | "consultancy"
  | "default";

interface CategoryGlowProps {
  icon: LucideIcon;
  label: string;
  variant?: GlowVariant;
  size?: "sm" | "md" | "lg" | "xl";
  pulse?: boolean;
}

const sizes = {
  sm: { box: "h-20 w-20", icon: "h-8 w-8" },
  md: { box: "h-32 w-32", icon: "h-14 w-14" },
  lg: { box: "h-48 w-48", icon: "h-20 w-20" },
  xl: { box: "h-80 w-80", icon: "h-36 w-36" },
};

const labelColor: Record<GlowVariant, string> = {
  government: "text-emerald-700 dark:text-emerald-300",
  private: "text-blue-700 dark:text-blue-300",
  goods: "text-amber-700 dark:text-amber-300",
  works: "text-emerald-700 dark:text-emerald-300",
  services: "text-blue-700 dark:text-blue-300",
  consultancy: "text-violet-700 dark:text-violet-300",
  default: "text-slate-700 dark:text-slate-300",
};

const ringColor: Record<GlowVariant, string> = {
  government: "from-emerald-100 to-white dark:from-emerald-500/20 dark:to-slate-900/0",
  private: "from-blue-100 to-white dark:from-blue-500/20 dark:to-slate-900/0",
  goods: "from-amber-100 to-white dark:from-amber-500/20 dark:to-slate-900/0",
  works: "from-emerald-100 to-white dark:from-emerald-500/20 dark:to-slate-900/0",
  services: "from-blue-100 to-white dark:from-blue-500/20 dark:to-slate-900/0",
  consultancy: "from-violet-100 to-white dark:from-violet-500/20 dark:to-slate-900/0",
  default: "from-slate-100 to-white dark:from-slate-700/30 dark:to-slate-900/0",
};

export function CategoryGlow({
  icon: Icon,
  label,
  variant = "default",
  size = "lg",
  pulse = true,
}: CategoryGlowProps) {
  const s = sizes[size];
  return (
    <div
      className={`relative flex flex-col items-center justify-center ${
        pulse ? "animate-pulse-scale" : ""
      }`}
    >
      <div
        className={`relative flex ${s.box} items-center justify-center rounded-full bg-gradient-to-b ${ringColor[variant]} glow glow-${variant}`}
      >
        <div className="absolute inset-2 rounded-full bg-white/80 backdrop-blur-sm dark:bg-slate-900/70 dark:ring-1 dark:ring-white/5" />
        <Icon className={`relative ${s.icon} ${labelColor[variant]}`} strokeWidth={1.5} />
      </div>
      {label && (
        <div
          className={`mt-4 font-display text-xs uppercase tracking-[0.25em] ${labelColor[variant]}`}
        >
          {label}
        </div>
      )}
    </div>
  );
}
