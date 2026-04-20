"use client";

import { ApplicationRecord } from "./types";

const KEY = "tenderhub.applications";

export function loadApplications(): ApplicationRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ApplicationRecord[];
  } catch {
    return [];
  }
}

export function saveApplication(app: ApplicationRecord) {
  const all = loadApplications();
  const idx = all.findIndex((a) => a.id === app.id);
  if (idx >= 0) all[idx] = app;
  else all.unshift(app);
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function getApplication(id: string): ApplicationRecord | null {
  return loadApplications().find((a) => a.id === id) ?? null;
}

export function deleteApplication(id: string) {
  const all = loadApplications().filter((a) => a.id !== id);
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function newApplicationId(): string {
  return `app-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
