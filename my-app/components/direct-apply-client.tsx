"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  DollarSign,
  FileText,
  Hash,
  Landmark,
  Shield,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "./auth-provider";
import { BankCard } from "./bank-card";
import { BankProvider, Tender } from "@/lib/types";
import {
  newApplicationId,
  saveApplication,
} from "@/lib/applications-store";
import { formatKES } from "@/lib/format";

interface Props {
  banks: BankProvider[];
}

const STEPS = [
  { id: 1, title: "Tender", icon: FileText },
  { id: 2, title: "Provider", icon: Landmark },
  { id: 3, title: "Company", icon: Building2 },
  { id: 4, title: "Documents", icon: FileText },
  { id: 5, title: "Review", icon: CheckCircle2 },
];

export function DirectApplyClient({ banks }: Props) {
  const router = useRouter();
  const { user, isAuthenticated, login } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [tenderTitle, setTenderTitle] = useState("");
  const [tenderNumber, setTenderNumber] = useState("");
  const [procuringEntity, setProcuringEntity] = useState("");
  const [bondAmountStr, setBondAmountStr] = useState("");
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");
  const bondAmount = Number(bondAmountStr.replace(/[^0-9.]/g, "")) || 0;

  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const bank = banks.find((b) => b.id === selectedBankId) ?? null;
  const fee = bank && bondAmount > 0 ? Math.round((bondAmount * bank.feesPercent) / 100) : 0;

  const [companyName, setCompanyName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [kraPin, setKraPin] = useState("");
  const [contactPerson, setContactPerson] = useState(user?.name ?? "");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [address, setAddress] = useState("");
  const [annualRevenue, setAnnualRevenue] = useState("");
  const [netWorth, setNetWorth] = useState("");

  const [files, setFiles] = useState<{ tax: File | null; reg: File | null; fin: File | null }>({
    tax: null,
    reg: null,
    fin: null,
  });

  const validate = (n: number): string | null => {
    if (n === 1) {
      if (!tenderTitle.trim()) return "Tender title is required";
      if (!procuringEntity.trim()) return "Procuring entity is required";
      if (bondAmount <= 0) return "Enter a valid bond amount";
    }
    if (n === 2 && !selectedBankId) return "Select a provider";
    if (n === 3) {
      if (!companyName.trim()) return "Company name is required";
      if (!registrationNumber.trim()) return "Registration number is required";
      if (!contactPerson.trim()) return "Contact person is required";
      if (!phone.trim()) return "Phone is required";
      if (!/^\S+@\S+\.\S+$/.test(email)) return "Valid email is required";
      if (!address.trim()) return "Address is required";
      if (!annualRevenue.trim()) return "Annual revenue is required";
      if (!netWorth.trim()) return "Net worth is required";
    }
    if (n === 4) {
      if (!files.tax) return "Tax certificate is required";
      if (!files.reg) return "Registration certificate is required";
      if (!files.fin) return "Financial statements are required";
    }
    return null;
  };

  const next = () => {
    const err = validate(step);
    if (err) return toast.error(err);
    setStep((s) => Math.min(5, s + 1));
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 1100));
      if (!isAuthenticated) login(email, contactPerson);
      const id = newApplicationId();
      const tenderPseudoId = `direct-${Date.now()}`;
      saveApplication({
        id,
        tenderId: tenderPseudoId,
        tenderTitle,
        tenderNumber: tenderNumber || null,
        bankId: bank!.id,
        bankName: bank!.name,
        bondAmount,
        status: "submitted",
        companyName,
        registrationNumber,
        kraPin,
        contactPerson,
        phone,
        email,
        address,
        annualRevenue,
        netWorth,
        documents: [
          files.tax && {
            name: "tax",
            fileName: files.tax.name,
            sizeBytes: files.tax.size,
          },
          files.reg && {
            name: "reg",
            fileName: files.reg.name,
            sizeBytes: files.reg.size,
          },
          files.fin && {
            name: "fin",
            fileName: files.fin.name,
            sizeBytes: files.fin.size,
          },
        ].filter(Boolean) as { name: string; fileName: string; sizeBytes: number }[],
        submittedAt: new Date().toISOString(),
        statusHistory: [
          {
            status: "submitted",
            at: new Date().toISOString(),
            note: `Direct application sent to ${bank!.name}`,
          },
        ],
      });
      toast.success("Application submitted!");
      router.push(`/dashboard?submitted=${id}`);
    } catch {
      toast.error("Could not submit");
      setSubmitting(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
      <div className="border-b border-slate-100 bg-slate-50/40 p-6 dark:border-white/5 dark:bg-slate-950/40">
        <div className="text-xs font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
          Direct Bid Bond Application
        </div>
        <div className="mt-1 font-display text-xl text-slate-900 dark:text-slate-50">
          Step {step} of 5 · {STEPS[step - 1].title}
        </div>
        <div className="mt-5 flex items-center justify-between">
          {STEPS.map((s, i) => {
            const completed = step > s.id;
            const active = step === s.id;
            return (
              <div key={s.id} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                      completed
                        ? "border-emerald-500 bg-emerald-500 text-white dark:border-emerald-400 dark:bg-emerald-400 dark:text-slate-950"
                        : active
                          ? "border-slate-900 bg-slate-900 text-white dark:border-emerald-400 dark:bg-emerald-500 dark:text-slate-950 dark:ring-4 dark:ring-emerald-400/20"
                          : "border-slate-200 bg-white text-slate-400 dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-500"
                    }`}
                  >
                    {completed ? <Check className="h-3.5 w-3.5" /> : <s.icon className="h-3.5 w-3.5" />}
                  </div>
                  <div className="text-[10px] font-medium text-slate-600 dark:text-slate-400">
                    {s.title}
                  </div>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`mx-2 h-0.5 flex-1 rounded-full ${
                      step > s.id ? "bg-emerald-500 dark:bg-emerald-400" : "bg-slate-200 dark:bg-white/10"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-6 sm:p-8">
        {step === 1 && (
          <div className="space-y-4">
            <SectionHeader icon={FileText} title="Tender Details" sub="Tell us about the tender you're bidding on." />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tender Title" required>
                <Input value={tenderTitle} onChange={(e) => setTenderTitle(e.target.value)} placeholder="Construction of new office building" />
              </Field>
              <Field label="Tender Number" icon={Hash}>
                <Input value={tenderNumber} onChange={(e) => setTenderNumber(e.target.value)} placeholder="MOH/T/001/2026" />
              </Field>
              <Field label="Procuring Entity" required icon={Building2}>
                <Input value={procuringEntity} onChange={(e) => setProcuringEntity(e.target.value)} placeholder="Ministry of Health" />
              </Field>
              <Field label="Submission Deadline" icon={Calendar}>
                <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </Field>
              <Field label="Bid Bond Amount (KES)" required icon={DollarSign}>
                <Input value={bondAmountStr} onChange={(e) => setBondAmountStr(e.target.value)} placeholder="500,000" />
              </Field>
            </div>
            <Field label="Brief Description (optional)">
              <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description of the scope of work…" />
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <SectionHeader icon={Landmark} title="Select Provider" sub="Compare and pick the best fit for your bond." />
            {selectedBankId && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                Selected: <strong>{bank?.name}</strong> · Estimated fee: <strong>{formatKES(fee)}</strong>
              </div>
            )}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-2">
              {banks.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedBankId(b.id)}
                  className={`text-left transition-all ${
                    selectedBankId === b.id ? "ring-2 ring-emerald-500 ring-offset-2 rounded-3xl dark:ring-emerald-400 dark:ring-offset-background" : ""
                  }`}
                >
                  <div className="pointer-events-none">
                    <BankCard bank={b} hrefBase="#" bondAmount={bondAmount} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <SectionHeader icon={Building2} title="Company Information" sub="Used by the provider for vetting." />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Company Name" required><Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} /></Field>
              <Field label="Registration Number" required><Input value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} /></Field>
              <Field label="KRA PIN"><Input value={kraPin} onChange={(e) => setKraPin(e.target.value)} /></Field>
              <Field label="Contact Person" required><Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} /></Field>
              <Field label="Phone" required><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
              <Field label="Email" required><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
            </div>
            <Field label="Address" required><Textarea rows={3} value={address} onChange={(e) => setAddress(e.target.value)} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Annual Revenue (KES)" required><Input value={annualRevenue} onChange={(e) => setAnnualRevenue(e.target.value)} /></Field>
              <Field label="Net Worth (KES)" required><Input value={netWorth} onChange={(e) => setNetWorth(e.target.value)} /></Field>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <SectionHeader icon={FileText} title="Documents" sub="Upload supporting documents." />
            <div className="grid gap-4 sm:grid-cols-2">
              <FileSlot label="Tax Compliance Certificate" required file={files.tax} onChange={(f) => setFiles({ ...files, tax: f })} />
              <FileSlot label="Business Registration" required file={files.reg} onChange={(f) => setFiles({ ...files, reg: f })} />
              <FileSlot label="Audited Financials" required file={files.fin} onChange={(f) => setFiles({ ...files, fin: f })} />
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-5">
            <SectionHeader icon={CheckCircle2} title="Review & Submit" sub="Confirm your application." />
            <div className="grid gap-4 sm:grid-cols-2">
              <ReviewCard title="Tender">
                <KV k="Title" v={tenderTitle} />
                <KV k="Number" v={tenderNumber || "—"} />
                <KV k="Entity" v={procuringEntity} />
                <KV k="Bond" v={formatKES(bondAmount)} />
              </ReviewCard>
              <ReviewCard title="Provider">
                <KV k="Name" v={bank?.name ?? "—"} />
                <KV k="Type" v={bank?.institutionType ?? "—"} />
                <KV k="Fee" v={formatKES(fee)} strong />
              </ReviewCard>
              <ReviewCard title="Company">
                <KV k="Name" v={companyName} />
                <KV k="Reg No." v={registrationNumber} />
                <KV k="Contact" v={contactPerson} />
                <KV k="Phone" v={phone} />
                <KV k="Email" v={email} />
              </ReviewCard>
              <ReviewCard title="Documents">
                {Object.entries(files)
                  .filter(([, f]) => f)
                  .map(([k, f]) => (
                    <KV key={k} k={k} v={(f as File).name} />
                  ))}
              </ReviewCard>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200">
              <Shield className="mt-0.5 h-5 w-5 flex-shrink-0" />
              By submitting, you authorize <strong>{bank?.name}</strong> to process your bid bond request.
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/40 p-4 sm:p-6 dark:border-white/5 dark:bg-slate-950/40">
        <Button variant="ghost" size="sm" disabled={step === 1 || submitting} onClick={() => setStep((s) => Math.max(1, s - 1))} className="dark:text-slate-300 dark:hover:bg-white/5">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        {step < 5 ? (
          <Button size="sm" className="bg-slate-900 hover:bg-slate-800 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400" onClick={next}>
            Continue <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400" disabled={submitting} onClick={submit}>
            {submitting ? "Submitting…" : (<>Submit Application <CheckCircle2 className="ml-1 h-4 w-4" /></>)}
          </Button>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, sub }: { icon: typeof FileText; title: string; sub: string }) {
  return (
    <div className="flex items-start gap-3 border-b border-slate-100 pb-4 dark:border-white/5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 dark:shadow-[0_0_25px_-5px_rgba(16,185,129,0.6)]">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <h3 className="font-display text-lg text-slate-900 dark:text-slate-50">{title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">{sub}</p>
      </div>
    </div>
  );
}

function Field({ label, required, icon: Icon, children }: { label: string; required?: boolean; icon?: typeof FileText; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
        {Icon && <Icon className="mr-1 inline h-3 w-3 text-slate-400 dark:text-slate-500" />}
        {label}
        {required && <span className="ml-1 text-rose-500 dark:text-rose-400">*</span>}
      </Label>
      {children}
    </div>
  );
}

function FileSlot({ label, required, file, onChange }: { label: string; required?: boolean; file: File | null; onChange: (f: File | null) => void }) {
  const id = `f-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div>
      <Label htmlFor={id} className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
        {label}
        {required && <span className="ml-1 text-rose-500 dark:text-rose-400">*</span>}
      </Label>
      {file ? (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-400/30 dark:bg-emerald-500/10">
          <FileText className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
          <div className="min-w-0 flex-1 truncate text-sm font-medium text-emerald-900 dark:text-emerald-100">{file.name}</div>
          <button onClick={() => onChange(null)} type="button" className="text-emerald-700 hover:underline text-xs dark:text-emerald-300">Remove</button>
        </div>
      ) : (
        <label htmlFor={id} className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-white px-4 py-6 text-xs text-slate-500 hover:border-emerald-300 hover:bg-emerald-50/40 hover:text-emerald-700 dark:border-white/15 dark:bg-slate-900/40 dark:text-slate-400 dark:hover:border-emerald-400/40 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300">
          <FileText className="h-4 w-4" /> Click to upload
        </label>
      )}
      <input id={id} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
    </div>
  );
}

function ReviewCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900/40">
      <div className="border-b border-slate-100 pb-2 text-xs font-semibold uppercase tracking-widest text-slate-500 dark:border-white/5 dark:text-slate-400">{title}</div>
      <dl className="mt-3 space-y-2 text-sm">{children}</dl>
    </div>
  );
}

function KV({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  const empty = !v || v === "—";
  return (
    <div className="flex items-start justify-between gap-3 text-xs">
      <dt className="text-slate-500 dark:text-slate-400">{k}</dt>
      <dd className={`text-right ${strong ? "font-display text-sm text-slate-900 dark:text-emerald-300" : empty ? "italic text-slate-400 dark:text-slate-500" : "font-medium text-slate-900 dark:text-slate-100"}`}>{empty ? "—" : v}</dd>
    </div>
  );
}
