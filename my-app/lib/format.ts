export function formatKES(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount) || amount === 0) return "—";
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return "—";
  return new Intl.NumberFormat("en-KE").format(amount);
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function daysUntil(value: string | Date | null | undefined): number | null {
  if (!value) return null;
  const d = typeof value === "string" ? new Date(value) : value;
  if (isNaN(d.getTime())) return null;
  const diff = d.getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function deadlineLabel(value: string | Date | null | undefined): string {
  const days = daysUntil(value);
  if (days == null) return "Open";
  if (days < 0) return `Closed ${Math.abs(days)}d ago`;
  if (days === 0) return "Closes today";
  if (days === 1) return "Closes tomorrow";
  return `${days} days left`;
}

export function nullSafe<T>(value: T | null | undefined, fallback: string = "—"): T | string {
  if (value === null || value === undefined || value === "") return fallback;
  return value;
}

export function truncate(text: string | null | undefined, max: number = 180): string {
  if (!text) return "";
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "…";
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}
