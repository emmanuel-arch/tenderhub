"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Lock,
  Mail,
  Shield,
  TrendingUp,
  User,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950" />
      }
    >
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Email and password are required");
      return;
    }
    if (mode === "register" && !name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));
    if (mode === "register") register(name, email);
    else login(email);
    toast.success(`Welcome ${mode === "register" ? "to TenderHub" : "back"}!`);
    const next = params.get("next") ?? "/dashboard";
    router.push(next);
  };

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-slate-950">
      {/* Background video */}
      <video
        className="absolute inset-0 -z-10 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/hero/login-poster.jpg"
      >
        <source src="/hero/login-bg.mp4" type="video/mp4" />
        <source src="/hero/login-bg.webm" type="video/webm" />
      </video>
      {/* Grey gradient scrim */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-slate-950/85 via-slate-900/65 to-black/90" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.18),transparent_60%)]" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl lg:grid-cols-2">
        <div className="hidden flex-col justify-between p-12 text-white lg:flex">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/brand/birgenai-logo.png"
              alt="BirgenAI"
              width={160}
              height={44}
              className="h-10 w-auto brightness-110"
              priority
            />
          </Link>

          <div className="space-y-8">
            <h1 className="font-display text-4xl leading-tight">
              Welcome to Kenya&apos;s
              <br />
              <span className="bg-gradient-to-r from-emerald-300 to-emerald-500 bg-clip-text text-transparent">
                tender command center
              </span>
            </h1>
            <p className="max-w-md text-base text-white/80">
              Discover opportunities, prepare bid bonds, and track every
              application in one professional workspace.
            </p>

            <div className="space-y-3">
              <Bullet
                icon={Building2}
                title="1,700+ live tenders"
                sub="Pulled directly from public procurement portals"
              />
              <Bullet
                icon={Shield}
                title="10 partner providers"
                sub="Banks, MFIs and insurers ready to issue your bond"
              />
              <Bullet
                icon={TrendingUp}
                title="Application analytics"
                sub="Track status, timelines, and outcomes"
              />
            </div>
          </div>

          <div className="text-xs text-white/60">
            © {new Date().getFullYear()} BirgenAI · TenderHub Kenya
          </div>
        </div>

        <div className="flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md">
            <div className="lg:hidden mb-8 text-center">
              <Link href="/" className="inline-flex items-center gap-3">
                <Image
                  src="/brand/birgenai-logo.png"
                  alt="BirgenAI"
                  width={160}
                  height={44}
                  className="h-10 w-auto brightness-110"
                />
              </Link>
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/15 bg-slate-900/60 shadow-2xl shadow-black/40 backdrop-blur-2xl ring-1 ring-white/5">
              <div className="grid grid-cols-2 border-b border-white/10">
                <button
                  className={`py-4 text-sm font-medium transition-colors ${
                    mode === "signin"
                      ? "bg-white/[0.06] text-white"
                      : "text-white/60 hover:text-white"
                  }`}
                  onClick={() => setMode("signin")}
                >
                  Sign In
                </button>
                <button
                  className={`py-4 text-sm font-medium transition-colors ${
                    mode === "register"
                      ? "bg-white/[0.06] text-white"
                      : "text-white/60 hover:text-white"
                  }`}
                  onClick={() => setMode("register")}
                >
                  Create Account
                </button>
              </div>

              <form onSubmit={submit} className="space-y-4 p-6 sm:p-8 text-white">
                <div>
                  <h2 className="font-display text-2xl">
                    {mode === "signin" ? "Welcome back" : "Get started"}
                  </h2>
                  <p className="mt-1 text-sm text-white/70">
                    {mode === "signin"
                      ? "Sign in to access your dashboard and applications."
                      : "Create your TenderHub account in seconds."}
                  </p>
                </div>

                {mode === "register" && (
                  <Field label="Full Name" icon={User}>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Wanjiru"
                      className="border-white/15 bg-white/5 text-white placeholder:text-white/40"
                    />
                  </Field>
                )}

                <Field label="Email Address" icon={Mail}>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.co.ke"
                    autoComplete="email"
                    className="border-white/15 bg-white/5 text-white placeholder:text-white/40"
                  />
                </Field>

                <Field label="Password" icon={Lock}>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete={
                      mode === "register" ? "new-password" : "current-password"
                    }
                    className="border-white/15 bg-white/5 text-white placeholder:text-white/40"
                  />
                </Field>

                <Button
                  type="submit"
                  className="w-full bg-emerald-500 text-slate-950 shadow-[0_8px_30px_-8px_rgba(16,185,129,0.6)] hover:bg-emerald-400"
                  disabled={submitting}
                >
                  {submitting ? (
                    "Just a moment…"
                  ) : (
                    <>
                      {mode === "signin" ? "Sign In" : "Create Account"}
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </>
                  )}
                </Button>

                <p className="text-center text-xs text-white/60">
                  By continuing, you agree to our Terms of Service and Privacy
                  Policy.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: typeof Mail;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
        <Icon className="mr-1 inline h-3 w-3 text-slate-400 dark:text-slate-500" />
        {label}
      </Label>
      {children}
    </div>
  );
}

function Bullet({
  icon: Icon,
  title,
  sub,
}: {
  icon: typeof CheckCircle2;
  title: string;
  sub: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white/70 p-4 backdrop-blur dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</div>
        <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{sub}</div>
      </div>
    </div>
  );
}
