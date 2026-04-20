"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  DollarSign,
  FileText,
  Mail,
  MapPin,
  Phone,
  Shield,
  Upload,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "./auth-provider";
import { BankProvider, Tender } from "@/lib/types";
import { formatKES, nullSafe } from "@/lib/format";
import {
  newApplicationId,
  saveApplication,
} from "@/lib/applications-store";

interface Props {
  tender: Tender;
  bank: BankProvider;
  bondAmount: number;
}

const STEPS = [
  { id: 1, title: "Company", icon: Building2 },
  { id: 2, title: "Financial", icon: DollarSign },
  { id: 3, title: "Documents", icon: FileText },
  { id: 4, title: "Review", icon: CheckCircle2 },
];

interface FormData {
  companyName: string;
  registrationNumber: string;
  kraPin: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  annualRevenue: string;
  netWorth: string;
}

interface FilesState {
  taxCertificate: File | null;
  registrationCertificate: File | null;
  financialStatements: File | null;
  additional: File | null;
}

export function BidBondWizard({ tender, bank, bondAmount }: Props) {
  const router = useRouter();
  const { user, isAuthenticated, login } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormData>({
    companyName: "",
    registrationNumber: "",
    kraPin: "",
    contactPerson: user?.name ?? "",
    phone: "",
    email: user?.email ?? "",
    address: "",
    annualRevenue: "",
    netWorth: "",
  });
  const [files, setFiles] = useState<FilesState>({
    taxCertificate: null,
    registrationCertificate: null,
    financialStatements: null,
    additional: null,
  });

  const update = (k: keyof FormData, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const fee =
    bondAmount > 0 ? Math.round((bondAmount * bank.feesPercent) / 100) : 0;
  const total = bondAmount + fee;

  const validateStep = (n: number): string | null => {
    if (n === 1) {
      if (!form.companyName.trim()) return "Company name is required";
      if (!form.registrationNumber.trim())
        return "Registration number is required";
      if (!form.contactPerson.trim()) return "Contact person is required";
      if (!form.phone.trim()) return "Phone is required";
      if (!/^\S+@\S+\.\S+$/.test(form.email))
        return "Valid email is required";
      if (!form.address.trim()) return "Address is required";
    }
    if (n === 2) {
      if (!form.annualRevenue.trim())
        return "Annual revenue is required";
      if (!form.netWorth.trim()) return "Company net worth is required";
    }
    if (n === 3) {
      if (!files.taxCertificate)
        return "Tax compliance certificate is required";
      if (!files.registrationCertificate)
        return "Business registration certificate is required";
      if (!files.financialStatements)
        return "Audited financial statements are required";
    }
    return null;
  };

  const next = () => {
    const err = validateStep(step);
    if (err) {
      toast.error(err);
      return;
    }
    setStep((s) => Math.min(4, s + 1));
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      // simulated network delay
      await new Promise((r) => setTimeout(r, 1100));
      if (!isAuthenticated) {
        login(form.email, form.contactPerson);
      }
      const id = newApplicationId();
      saveApplication({
        id,
        tenderId: tender.id,
        tenderTitle: tender.title,
        tenderNumber: tender.tenderNumber,
        bankId: bank.id,
        bankName: bank.name,
        bondAmount,
        status: "submitted",
        companyName: form.companyName,
        registrationNumber: form.registrationNumber,
        kraPin: form.kraPin,
        contactPerson: form.contactPerson,
        phone: form.phone,
        email: form.email,
        address: form.address,
        annualRevenue: form.annualRevenue,
        netWorth: form.netWorth,
        documents: Object.entries(files)
          .filter(([, f]) => f)
          .map(([k, f]) => ({
            name: k,
            fileName: (f as File).name,
            sizeBytes: (f as File).size,
          })),
        submittedAt: new Date().toISOString(),
        statusHistory: [
          {
            status: "submitted",
            at: new Date().toISOString(),
            note: `Application sent to ${bank.name}`,
          },
        ],
      });
      toast.success("Application submitted successfully");
      router.push(`/dashboard?submitted=${id}`);
    } catch (e) {
      toast.error("Could not submit application");
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="lg:col-span-8">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
          <div className="border-b border-slate-100 bg-slate-50/40 p-6 sm:p-8 dark:border-white/5 dark:bg-slate-950/40">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
                  Bid Bond Application
                </div>
                <div className="mt-1 font-display text-xl text-slate-900 dark:text-slate-50">
                  Step {step} of 4 · {STEPS[step - 1].title}
                </div>
              </div>
              <div className="hidden sm:block">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl text-base font-display text-white shadow-md"
                  style={{ backgroundColor: bank.accent }}
                >
                  {bank.logoText}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              {STEPS.map((s, i) => {
                const isCompleted = step > s.id;
                const isActive = step === s.id;
                return (
                  <div
                    key={s.id}
                    className="flex flex-1 items-center last:flex-none"
                  >
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all ${
                          isCompleted
                            ? "border-emerald-500 bg-emerald-500 text-white dark:border-emerald-400 dark:bg-emerald-400 dark:text-slate-950"
                            : isActive
                              ? "border-slate-900 bg-slate-900 text-white ring-4 ring-slate-900/10 dark:border-emerald-400 dark:bg-emerald-500 dark:text-slate-950 dark:ring-emerald-400/20"
                              : "border-slate-200 bg-white text-slate-400 dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-500"
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <s.icon className="h-4 w-4" />
                        )}
                      </div>
                      <div
                        className={`text-[10px] font-medium uppercase tracking-wider ${
                          isActive
                            ? "text-slate-900 dark:text-emerald-300"
                            : isCompleted
                              ? "text-emerald-700 dark:text-emerald-400"
                              : "text-slate-400 dark:text-slate-500"
                        }`}
                      >
                        {s.title}
                      </div>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div
                        className={`mx-2 h-0.5 flex-1 rounded-full transition-colors ${
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
            {step === 1 && <CompanyStep form={form} update={update} />}
            {step === 2 && (
              <FinancialStep
                form={form}
                update={update}
                bondAmount={bondAmount}
                fee={fee}
                total={total}
                bank={bank}
              />
            )}
            {step === 3 && <DocumentsStep files={files} setFiles={setFiles} />}
            {step === 4 && (
              <ReviewStep
                form={form}
                files={files}
                bank={bank}
                tender={tender}
                bondAmount={bondAmount}
                fee={fee}
                total={total}
              />
            )}
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/40 p-4 sm:p-6 dark:border-white/5 dark:bg-slate-950/40">
            <Button
              variant="ghost"
              size="sm"
              disabled={step === 1 || submitting}
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              className="dark:text-slate-300 dark:hover:bg-white/5"
            >
              <ArrowLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            {step < 4 ? (
              <Button
                size="sm"
                className="bg-slate-900 hover:bg-slate-800 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400"
                onClick={next}
              >
                Continue <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400"
                disabled={submitting}
                onClick={submit}
              >
                {submitting ? (
                  "Submitting…"
                ) : (
                  <>
                    Submit Application <CheckCircle2 className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      <aside className="lg:col-span-4">
        <div className="sticky top-24 space-y-4">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
            <div
              className="px-5 py-4 text-white"
              style={{ backgroundColor: bank.accent }}
            >
              <div className="text-[10px] font-semibold uppercase tracking-widest text-white/80">
                Selected provider
              </div>
              <div className="mt-1 font-display text-lg">{bank.name}</div>
            </div>
            <div className="space-y-2 p-5 text-sm">
              <Row label="Tender" value={tender.title} />
              <Row label="Tender No." value={nullSafe(tender.tenderNumber, "—")} />
              <Row label="Entity" value={nullSafe(tender.procuringEntity, "—")} />
              <div className="my-3 h-px bg-slate-100 dark:bg-white/5" />
              <Row
                label="Bid Bond"
                value={bondAmount > 0 ? formatKES(bondAmount) : "—"}
              />
              <Row label="Processing fee" value={formatKES(fee)} />
              <div className="my-3 h-px bg-slate-100 dark:bg-white/5" />
              <Row
                label="Total payable"
                value={formatKES(total)}
                strong
              />
            </div>
          </div>

          <Link
            href={`/tenders/${tender.id}/banks${bondAmount ? `?bondAmount=${bondAmount}` : ""}`}
            className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-emerald-300"
          >
            <ArrowLeft className="h-3 w-3" />
            Change provider
          </Link>
        </div>
      </aside>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-xs">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span
        className={`text-right ${strong ? "font-display text-base text-slate-900 dark:text-emerald-300" : "font-medium text-slate-900 dark:text-slate-100"}`}
      >
        {value}
      </span>
    </div>
  );
}

function CompanyStep({
  form,
  update,
}: {
  form: FormData;
  update: (k: keyof FormData, v: string) => void;
}) {
  return (
    <div className="space-y-5">
      <SectionHeader
        icon={Building2}
        title="Company Information"
        sub="Tell us about the company applying for the bond."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company Name" required>
          <Input
            value={form.companyName}
            onChange={(e) => update("companyName", e.target.value)}
            placeholder="Acme Construction Ltd"
          />
        </Field>
        <Field label="Business Registration Number" required>
          <Input
            value={form.registrationNumber}
            onChange={(e) => update("registrationNumber", e.target.value)}
            placeholder="C.123456"
          />
        </Field>
        <Field label="KRA PIN">
          <Input
            value={form.kraPin}
            onChange={(e) => update("kraPin", e.target.value)}
            placeholder="P051234567X"
          />
        </Field>
        <Field label="Contact Person" required icon={User}>
          <Input
            value={form.contactPerson}
            onChange={(e) => update("contactPerson", e.target.value)}
            placeholder="Jane Wanjiru"
          />
        </Field>
        <Field label="Phone Number" required icon={Phone}>
          <Input
            type="tel"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="+254 700 000 000"
          />
        </Field>
        <Field label="Email" required icon={Mail}>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="finance@acme.co.ke"
          />
        </Field>
      </div>
      <Field label="Physical Address" required icon={MapPin}>
        <Textarea
          value={form.address}
          onChange={(e) => update("address", e.target.value)}
          rows={3}
          placeholder="ABC Place, 5th Floor, Waiyaki Way, Nairobi"
        />
      </Field>
    </div>
  );
}

function FinancialStep({
  form,
  update,
  bondAmount,
  fee,
  total,
  bank,
}: {
  form: FormData;
  update: (k: keyof FormData, v: string) => void;
  bondAmount: number;
  fee: number;
  total: number;
  bank: BankProvider;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        icon={DollarSign}
        title="Financial Details"
        sub="Bid bond providers require basic financial information for vetting."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Annual Revenue (KES)" required>
          <Input
            value={form.annualRevenue}
            onChange={(e) => update("annualRevenue", e.target.value)}
            placeholder="50,000,000"
          />
        </Field>
        <Field label="Company Net Worth (KES)" required>
          <Input
            value={form.netWorth}
            onChange={(e) => update("netWorth", e.target.value)}
            placeholder="20,000,000"
          />
        </Field>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Cost breakdown
        </div>
        <div className="mt-3 space-y-2 text-sm">
          <Row label="Bid bond amount" value={formatKES(bondAmount)} />
          <Row
            label={`Processing fee (${bank.feesPercent}%)`}
            value={formatKES(fee)}
          />
          <div className="my-2 h-px bg-slate-200 dark:bg-white/10" />
          <Row label="Total payable" value={formatKES(total)} strong />
        </div>
      </div>
    </div>
  );
}

function DocumentsStep({
  files,
  setFiles,
}: {
  files: FilesState;
  setFiles: (f: FilesState) => void;
}) {
  const update = (k: keyof FilesState, f: File | null) =>
    setFiles({ ...files, [k]: f });

  return (
    <div className="space-y-5">
      <SectionHeader
        icon={FileText}
        title="Required Documents"
        sub="Upload supporting documents (PDF or images, max 10MB each)."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <FileSlot
          label="Tax Compliance Certificate"
          required
          file={files.taxCertificate}
          onChange={(f) => update("taxCertificate", f)}
        />
        <FileSlot
          label="Business Registration Certificate"
          required
          file={files.registrationCertificate}
          onChange={(f) => update("registrationCertificate", f)}
        />
        <FileSlot
          label="Audited Financial Statements"
          required
          file={files.financialStatements}
          onChange={(f) => update("financialStatements", f)}
        />
        <FileSlot
          label="Additional Documents (optional)"
          file={files.additional}
          onChange={(f) => update("additional", f)}
        />
      </div>
    </div>
  );
}

function ReviewStep({
  form,
  files,
  bank,
  tender,
  bondAmount,
  fee,
  total,
}: {
  form: FormData;
  files: FilesState;
  bank: BankProvider;
  tender: Tender;
  bondAmount: number;
  fee: number;
  total: number;
}) {
  return (
    <div className="space-y-5">
      <SectionHeader
        icon={CheckCircle2}
        title="Review & Submit"
        sub="Confirm everything looks correct before submitting your application."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <ReviewCard title="Company">
          <KV k="Company name" v={form.companyName} />
          <KV k="Registration" v={form.registrationNumber} />
          <KV k="KRA PIN" v={form.kraPin} />
          <KV k="Contact" v={form.contactPerson} />
          <KV k="Phone" v={form.phone} />
          <KV k="Email" v={form.email} />
          <KV k="Address" v={form.address} />
        </ReviewCard>
        <ReviewCard title="Financials">
          <KV k="Annual revenue" v={`KES ${form.annualRevenue}`} />
          <KV k="Net worth" v={`KES ${form.netWorth}`} />
          <KV k="Bond amount" v={formatKES(bondAmount)} />
          <KV k="Fee" v={formatKES(fee)} />
          <KV k="Total payable" v={formatKES(total)} strong />
        </ReviewCard>
        <ReviewCard title="Tender">
          <KV k="Title" v={tender.title} />
          <KV k="Number" v={nullSafe(tender.tenderNumber, "—") as string} />
          <KV
            k="Entity"
            v={nullSafe(tender.procuringEntity, "—") as string}
          />
        </ReviewCard>
        <ReviewCard title="Provider">
          <KV k="Name" v={bank.name} />
          <KV k="Type" v={bank.institutionType} />
          <KV k="Processing time" v={bank.processingTime} />
          <KV k="Digital" v={bank.digitalOption ? "Yes" : "No"} />
        </ReviewCard>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-5 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Documents
        </div>
        <div className="mt-3 space-y-2">
          {Object.entries(files).map(([k, f]) =>
            f ? (
              <div
                key={k}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-white/10 dark:bg-slate-900/40"
              >
                <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-medium text-slate-900 dark:text-slate-100">{f.name}</span>
                <span className="ml-auto text-slate-500 dark:text-slate-400">
                  {(f.size / 1024).toFixed(0)} KB
                </span>
              </div>
            ) : null,
          )}
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200">
        <Shield className="mt-0.5 h-5 w-5 flex-shrink-0" />
        <p>
          By submitting this application, you authorize{" "}
          <strong>{bank.name}</strong> to process your bid bond request and
          contact you with status updates.
        </p>
      </div>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  sub,
}: {
  icon: typeof Building2;
  title: string;
  sub: string;
}) {
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

function Field({
  label,
  required,
  icon: Icon,
  children,
}: {
  label: string;
  required?: boolean;
  icon?: typeof Mail;
  children: React.ReactNode;
}) {
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

function FileSlot({
  label,
  required,
  file,
  onChange,
}: {
  label: string;
  required?: boolean;
  file: File | null;
  onChange: (f: File | null) => void;
}) {
  const inputId = `file-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div>
      <Label
        htmlFor={inputId}
        className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
      >
        {label}
        {required && <span className="ml-1 text-rose-500 dark:text-rose-400">*</span>}
      </Label>
      {file ? (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-400/30 dark:bg-emerald-500/10">
          <FileText className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-emerald-900 dark:text-emerald-100">
              {file.name}
            </div>
            <div className="text-xs text-emerald-700 dark:text-emerald-300/80">
              {(file.size / 1024).toFixed(0)} KB
            </div>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="rounded-lg p-1.5 text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-white px-4 py-6 text-xs text-slate-500 transition-colors hover:border-emerald-300 hover:bg-emerald-50/40 hover:text-emerald-700 dark:border-white/15 dark:bg-slate-900/40 dark:text-slate-400 dark:hover:border-emerald-400/40 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300"
        >
          <Upload className="h-4 w-4" />
          Click to upload
        </label>
      )}
      <input
        id={inputId}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}

function ReviewCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900/40">
      <div className="border-b border-slate-100 pb-2 text-xs font-semibold uppercase tracking-widest text-slate-500 dark:border-white/5 dark:text-slate-400">
        {title}
      </div>
      <dl className="mt-3 space-y-2 text-sm">{children}</dl>
    </div>
  );
}

function KV({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  const empty = !v || v.trim() === "" || v === "—";
  return (
    <div className="flex items-start justify-between gap-3 text-xs">
      <dt className="text-slate-500 dark:text-slate-400">{k}</dt>
      <dd
        className={`text-right ${strong ? "font-display text-sm text-slate-900 dark:text-emerald-300" : empty ? "italic text-slate-400 dark:text-slate-500" : "font-medium text-slate-900 dark:text-slate-100"}`}
      >
        {empty ? "—" : v}
      </dd>
    </div>
  );
}
