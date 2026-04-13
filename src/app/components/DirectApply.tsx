import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { CompanyInfoStep } from './bidbond/CompanyInfoStep';
import { FinancialDetailsStep } from './bidbond/FinancialDetailsStep';
import { DocumentUploadStep, type DocumentFiles } from './bidbond/DocumentUploadStep';
import { banksApi, tendersApi, applicationsApi, documentsApi, type BankDto } from '../services/api';
import { toast } from 'sonner';
import { Toaster } from './ui/sonner';
import { extractBackendErrors, type BackendErrors } from '../utils/formErrors';
import { Shield, DollarSign, AlertCircle } from 'lucide-react';
import { STEPS, type TenderInfo } from './direct-apply/steps';
import { StepIndicator } from './direct-apply/StepIndicator';
import { TenderDetailsStep } from './direct-apply/TenderDetailsStep';
import { BankSelectStep } from './direct-apply/BankSelectStep';
import { DirectReviewStep } from './direct-apply/DirectReviewStep';

const INITIAL_TENDER: TenderInfo = {
  title: '', tenderNumber: '', procuringEntity: '',
  deadline: '', bidBondAmount: '', category: 'Government',
};

const INITIAL_FORM = {
  companyName: '', registrationNumber: '', kraPin: '', contactPerson: '',
  email: '', phone: '', address: '',
  annualRevenue: '', netWorth: '',
};

const INITIAL_FILES: DocumentFiles = {
  taxCertificate: null, registrationCertificate: null,
  financialStatements: null, additionalDocuments: null,
};

export function DirectApply() {
  const navigate = useNavigate();

  const [step, setStep]               = useState(1);
  const [tenderInfo, setTenderInfo]   = useState<TenderInfo>(INITIAL_TENDER);
  const [tenderErrors, setTenderErrors] = useState<Record<string, string> | null>(null);
  const [banks, setBanks]             = useState<BankDto[]>([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [banksError, setBanksError]   = useState<string | null>(null);
  const [selectedBank, setSelectedBank] = useState<BankDto | null>(null);
  const [formData, setFormData]       = useState(INITIAL_FORM);
  const [files, setFiles]             = useState<DocumentFiles>(INITIAL_FILES);
  const [errors, setErrors]           = useState<BackendErrors>(null);
  const [validating, setValidating]   = useState(false);
  const [submitting, setSubmitting]   = useState(false);

  const loadBanks = () => {
    setBanksLoading(true);
    setBanksError(null);
    banksApi.list()
      .then(all => setBanks(all.filter(b => b.isActive)))
      .catch(err => setBanksError(err.message ?? 'Failed to load providers.'))
      .finally(() => setBanksLoading(false));
  };

  useEffect(() => { loadBanks(); }, []);

  const handleTenderChange = (field: keyof TenderInfo, value: string) =>
    setTenderInfo(prev => ({ ...prev, [field]: value }));

  const handleFormChange = (field: string, value: string) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const handleFileChange = (field: keyof DocumentFiles, file: File) =>
    setFiles(prev => ({ ...prev, [field]: file }));

  const validateTender = (): boolean => {
    const errs: Record<string, string> = {};
    if (!tenderInfo.title.trim()) errs.title = 'Tender title is required.';
    if (!tenderInfo.bidBondAmount || parseFloat(tenderInfo.bidBondAmount) <= 0)
      errs.bidBondAmount = 'Enter a valid bid bond amount.';
    setTenderErrors(Object.keys(errs).length ? errs : null);
    return Object.keys(errs).length === 0;
  };

  const tryParseProcessingFee = (): number => {
    if (!selectedBank) return 0;
    const amount = parseFloat(tenderInfo.bidBondAmount) || 0;
    const parts = selectedBank.fees.split('+').map(p => p.trim());
    let base = 0, pct = 0;
    for (const part of parts) {
      const num = parseFloat(part.replace(/[^0-9.]/g, ''));
      if (part.includes('%')) pct = num; else base = num;
    }
    return base + (amount * pct) / 100;
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!validateTender()) return;
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!selectedBank) { toast.error('Please select a provider.'); return; }
      setStep(3);
      return;
    }
    if (step >= 5) { setStep(s => s + 1); return; }

    setValidating(true);
    setErrors(null);
    try {
      const payload = step === 3
        ? { companyName: formData.companyName, businessRegistrationNumber: formData.registrationNumber, contactPerson: formData.contactPerson, phoneNumber: formData.phone, contactEmail: formData.email, physicalAddress: formData.address }
        : { annualRevenue: formData.annualRevenue ? parseFloat(formData.annualRevenue) : null, companyNetWorth: formData.netWorth ? parseFloat(formData.netWorth) : null };
      await applicationsApi.validateStep(step === 3 ? 1 : 2, payload);
      setStep(s => s + 1);
    } catch (err: unknown) {
      const backendErrors = extractBackendErrors(err);
      if (backendErrors) setErrors(backendErrors);
      else toast.error('Validation failed', { description: (err as any)?.message });
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setErrors(null);
    try {
      const tenderNumber = tenderInfo.tenderNumber.trim() || `DIRECT-${Date.now()}`;
      const existing = await tendersApi.list({ externalId: `direct-${tenderNumber}` });
      let backendTenderId: string;
      if (existing.data.length > 0) {
        backendTenderId = existing.data[0].id;
      } else {
        const created = await tendersApi.create({
          externalId: `direct-${tenderNumber}`,
          title: tenderInfo.title,
          tenderNumber,
          procuringEntity: tenderInfo.procuringEntity || '',
          deadline: tenderInfo.deadline
            ? new Date(tenderInfo.deadline).toISOString()
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          industry: tenderInfo.category,
          bidBondRequired: true,
          bidBondAmount: parseFloat(tenderInfo.bidBondAmount) || 0,
          category: tenderInfo.category,
          subCategory: 'Goods',
          summary: '', description: '', documentUrl: '', requiredDocuments: [],
        });
        backendTenderId = created.id;
      }

      const application = await applicationsApi.create({
        tenderId: backendTenderId,
        bankId: selectedBank!.id,
        companyName: formData.companyName,
        businessRegistrationNumber: formData.registrationNumber,
        contactPerson: formData.contactPerson,
        phoneNumber: formData.phone,
        contactEmail: formData.email,
        physicalAddress: formData.address,
        annualRevenue: formData.annualRevenue ? parseFloat(formData.annualRevenue) : undefined,
        companyNetWorth: formData.netWorth ? parseFloat(formData.netWorth) : undefined,
        kraPin: formData.kraPin || undefined,
      });

      const docUploads: { name: string; file: File }[] = [
        { name: 'Tax Compliance Certificate',        file: files.taxCertificate! },
        { name: 'Business Registration Certificate', file: files.registrationCertificate! },
        { name: 'Audited Financial Statements',      file: files.financialStatements! },
      ];
      if (files.additionalDocuments)
        docUploads.push({ name: 'Additional Documents', file: files.additionalDocuments });

      for (const doc of docUploads)
        await documentsApi.upload(application.id, doc.file, doc.name);

      toast.success('Application submitted successfully!');
      navigate('/dashboard', { state: { applicationSubmitted: true } });
    } catch (err: unknown) {
      const backendErrors = extractBackendErrors(err);
      if (backendErrors) {
        setErrors(backendErrors);
        const s3 = ['CompanyName','BusinessRegistrationNumber','ContactPerson','PhoneNumber','ContactEmail','PhysicalAddress'];
        const s4 = ['AnnualRevenue','CompanyNetWorth'];
        if (s3.some(f => backendErrors[f])) setStep(3);
        else if (s4.some(f => backendErrors[f])) setStep(4);
        toast.error('Please fix the errors highlighted on the form.');
      } else {
        toast.error('Submission failed', { description: (err as any)?.message });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const bondAmount = parseFloat(tenderInfo.bidBondAmount) || 0;
  const isLastStep = step === STEPS.length;
  const stepMeta = STEPS[step - 1];
  const StepIcon = stepMeta.icon;

  // Step 2 (bank selection) renders full-width outside the card to avoid nesting
  const isBankStep = step === 2;

  const renderStepContent = () => {
    switch (step) {
      case 1: return <TenderDetailsStep info={tenderInfo} onChange={handleTenderChange} errors={tenderErrors} />;
      case 2: return <BankSelectStep banks={banks} selectedId={selectedBank?.id ?? null} onSelect={setSelectedBank} loading={banksLoading} />;
      case 3: return <CompanyInfoStep formData={formData} onChange={handleFormChange} errors={errors} />;
      case 4: return <FinancialDetailsStep annualRevenue={formData.annualRevenue} netWorth={formData.netWorth} bankName={selectedBank?.name ?? ''} bondAmount={bondAmount} processingFee={tryParseProcessingFee()} onChange={handleFormChange} errors={errors} />;
      case 5: return <DocumentUploadStep files={files} onFileChange={handleFileChange} errors={errors} />;
      case 6: return <DirectReviewStep tenderInfo={tenderInfo} bank={selectedBank!} formData={formData} files={files} />;
      default: return null;
    }
  };

  const navButtons = (
    <div className="flex justify-between mt-8 pt-6 border-t">
      <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 1 || submitting} className="gap-2">
        <ArrowLeft className="w-4 h-4" />Previous
      </Button>
      {isLastStep ? (
        <Button onClick={handleSubmit} disabled={submitting} className="gap-2 bg-blue-900 hover:bg-blue-800">
          {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting…</> : <><Check className="w-4 h-4" />Submit Application</>}
        </Button>
      ) : (
        <Button onClick={handleNext} disabled={validating} className="gap-2 bg-blue-900 hover:bg-blue-800">
          {validating ? <><Loader2 className="w-4 h-4 animate-spin" />Validating…</> : <>Next<ArrowRight className="w-4 h-4" /></>}
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Toaster />

      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="w-4 h-4" />Back
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-slate-900">Apply for Bid Bond</h1>
            <Badge variant="outline" className="text-sm font-medium bg-blue-50 text-blue-900 border-blue-200">
              Step {step} of {STEPS.length}
            </Badge>
          </div>
          <p className="text-sm text-slate-500">No tender listing required — enter your tender details and apply directly.</p>
          <StepIndicator currentStep={step} />
        </div>

        {/* Bank step: full-width, no outer card wrapper */}
        {isBankStep ? (
          <div>
            {banksError && (
              <Card className="mb-6 border-red-200 bg-red-50">
                <CardContent className="py-8 text-center">
                  <AlertCircle className="w-10 h-10 mx-auto text-red-500 mb-3" />
                  <p className="text-red-800 font-medium mb-4">{banksError}</p>
                  <Button variant="outline" onClick={loadBanks}>Try Again</Button>
                </CardContent>
              </Card>
            )}
            {/* Tender summary — mirrors BankSelection layout */}
            <Card className="mb-8 shadow-md border-0 overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg">Select a Provider for Your Bid Bond</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                      <Shield className="w-5 h-5 text-blue-900" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 uppercase tracking-wide">Tender</div>
                      <div className="font-medium text-sm line-clamp-2">{tenderInfo.title}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                      <Shield className="w-5 h-5 text-blue-900" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 uppercase tracking-wide">Procuring Entity</div>
                      <div className="font-medium text-sm">{tenderInfo.procuringEntity || '—'}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                      <DollarSign className="w-5 h-5 text-green-700" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 uppercase tracking-wide">Bond Amount Required</div>
                      <div className="text-xl font-bold text-slate-900">
                        {bondAmount > 0 ? `KES ${bondAmount.toLocaleString()}` : '—'}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            {renderStepContent()}
            {navButtons}
          </div>
        ) : (
          <Card className="shadow-md border-0 overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <StepIcon className="w-5 h-5 text-blue-900" />{stepMeta.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderStepContent()}
              {navButtons}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
