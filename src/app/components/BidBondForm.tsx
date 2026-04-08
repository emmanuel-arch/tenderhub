import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import { ArrowLeft, ArrowRight, Check, Upload, FileText, Building2, DollarSign } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { CompanyInfoStep } from './bidbond/CompanyInfoStep';
import { FinancialDetailsStep } from './bidbond/FinancialDetailsStep';
import { DocumentUploadStep, type DocumentFiles } from './bidbond/DocumentUploadStep';
import { ReviewStep } from './bidbond/ReviewStep';
import { tendersApi, applicationsApi, documentsApi, BankDto } from '../services/api';
import { Tender } from '../data/mockData';
import { toast } from 'sonner';
import { Toaster } from './ui/sonner';
import { extractBackendErrors, type BackendErrors } from '../utils/formErrors';

const STEPS = [
  { number: 1, title: 'Company Information', icon: Building2 },
  { number: 2, title: 'Financial Details',   icon: DollarSign },
  { number: 3, title: 'Document Upload',     icon: Upload },
  { number: 4, title: 'Review & Submit',     icon: FileText },
];

const INITIAL_FORM = {
  companyName: '', registrationNumber: '', contactPerson: '',
  email: '', phone: '', address: '',
  annualRevenue: '', netWorth: '', bankAccount: '',
};

const INITIAL_FILES: DocumentFiles = {
  taxCertificate: null,
  registrationCertificate: null,
  financialStatements: null,
  additionalDocuments: null,
};

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="mt-6">
      <div className="flex items-center">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isActive    = currentStep === step.number;
          const isCompleted = currentStep > step.number;
          return (
            <div key={step.number} className="flex items-center flex-1 last:flex-none">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                isActive    ? 'bg-blue-900 text-white ring-4 ring-blue-100 shadow-md' :
                isCompleted ? 'bg-green-500 text-white' :
                              'bg-slate-100 text-slate-400'
              }`}>
                {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 mx-1 transition-colors duration-300 ${
                  isCompleted ? 'bg-green-500' : 'bg-slate-200'
                }`} />
              )}
            </div>
          );
        })}
      </div>
      <div className="flex mt-2">
        {STEPS.map((step) => {
          const isActive    = currentStep === step.number;
          const isCompleted = currentStep > step.number;
          return (
            <div key={step.number} className="flex-1 text-center">
              <span className={`text-xs font-medium ${
                isActive ? 'text-blue-900' : isCompleted ? 'text-green-600' : 'text-slate-400'
              }`}>{step.title}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function BidBondForm() {
  const { id, bankId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const state = (location.state as any) ?? {};
  const tender: Tender | null = state.tender ?? null;
  const bank: BankDto | null  = state.bank   ?? null;

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData]       = useState(INITIAL_FORM);
  const [files, setFiles]             = useState<DocumentFiles>(INITIAL_FILES);
  const [submitting, setSubmitting]   = useState(false);
  const [errors, setErrors]           = useState<BackendErrors>(null);

  if (!tender || !bank) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="max-w-md shadow-lg border-0">
          <CardHeader><CardTitle>Invalid Request</CardTitle></CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">Tender or bank information is missing. Please start from the bank selection page.</p>
            <Button onClick={() => navigate(id ? `/tender/${id}/banks` : '/')}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [validating, setValidating] = useState(false);

  const handleChange     = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value }));
  const handleFileChange = (field: keyof DocumentFiles, file: File) => setFiles(prev => ({ ...prev, [field]: file }));

  const handleNext = async () => {
    // Steps 3 & 4 have no backend validation — advance directly
    if (currentStep >= 3) { setCurrentStep(s => s + 1); return; }

    setValidating(true);
    setErrors(null);
    try {
      const payload = currentStep === 1
        ? { companyName: formData.companyName, businessRegistrationNumber: formData.registrationNumber, contactPerson: formData.contactPerson, phoneNumber: formData.phone, contactEmail: formData.email, physicalAddress: formData.address }
        : { annualRevenue: formData.annualRevenue ? parseFloat(formData.annualRevenue) : null, companyNetWorth: formData.netWorth ? parseFloat(formData.netWorth) : null };

      await applicationsApi.validateStep(currentStep as 1 | 2, payload);
      // Backend returned 200 — step is valid
      setCurrentStep(s => s + 1);
    } catch (err: unknown) {
      const backendErrors = extractBackendErrors(err);
      if (backendErrors) setErrors(backendErrors);
      else toast.error('Validation failed', { description: (err as any)?.message });
    } finally {
      setValidating(false);
    }
  };

  const tryParseAmount = (fees: string): number => {
    const parts = fees.split('+').map(p => p.trim());
    let base = 0, pct = 0;
    for (const part of parts) {
      const num = parseFloat(part.replace(/[^0-9.]/g, ''));
      if (part.includes('%')) pct = num; else base = num;
    }
    return base + (tender.bidBondAmount * pct) / 100;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setErrors(null);
    try {
      // Find or create tender in backend
      const tenderList = await tendersApi.list({ externalId: tender.id });
      let backendTenderId: string;
      if (tenderList.data.length > 0) {
        backendTenderId = tenderList.data[0].id;
      } else {
        const created = await tendersApi.create({
          externalId: tender.id,
          title: tender.title,
          tenderNumber: tender.tenderNumber || tender.id,
          procuringEntity: tender.procuringEntity || '',
          deadline: new Date(tender.deadline).toISOString(),
          industry: tender.industry || '',
          bidBondRequired: tender.bidBondRequired,
          bidBondAmount: tender.bidBondAmount,
          category: tender.category === 'government' ? 'Government' : 'Private',
          subCategory: tender.subCategory ?? 'Goods',
          summary: tender.summary || '',
          description: tender.description || '',
          documentUrl: tender.documentUrl ?? '',
          requiredDocuments: tender.requiredDocuments ?? [],
        });
        backendTenderId = created.id;
      }

      // POST application — backend validates and returns errors if invalid
      const application = await applicationsApi.create({
        tenderId: backendTenderId,
        bankId: bankId!,
        companyName: formData.companyName,
        businessRegistrationNumber: formData.registrationNumber,
        contactPerson: formData.contactPerson,
        phoneNumber: formData.phone,
        contactEmail: formData.email,
        physicalAddress: formData.address,
        annualRevenue: formData.annualRevenue ? parseFloat(formData.annualRevenue) : undefined,
        companyNetWorth: formData.netWorth ? parseFloat(formData.netWorth) : undefined,
        bankAccountNumber: formData.bankAccount || undefined,
      });

      // Upload documents
      const docUploads: { name: string; file: File }[] = [
        { name: 'Tax Compliance Certificate',         file: files.taxCertificate! },
        { name: 'Business Registration Certificate',  file: files.registrationCertificate! },
        { name: 'Audited Financial Statements',       file: files.financialStatements! },
      ];
      if (files.additionalDocuments)
        docUploads.push({ name: 'Additional Documents', file: files.additionalDocuments });

      for (const doc of docUploads)
        await documentsApi.upload(application.id, doc.file, doc.name);

      // Success
      toast.success('Application submitted successfully!');
      navigate('/dashboard', { state: { applicationSubmitted: true } });

    } catch (err: unknown) {
      const backendErrors = extractBackendErrors(err);
      if (backendErrors) {
        // Backend returned field-level validation errors — show them inline
        setErrors(backendErrors);
        // Jump to first step that has errors
        const step1 = ['CompanyName','BusinessRegistrationNumber','ContactPerson','PhoneNumber','ContactEmail','PhysicalAddress'];
        const step2 = ['AnnualRevenue','CompanyNetWorth','BankAccountNumber'];
        if (step1.some(f => backendErrors[f])) setCurrentStep(1);
        else if (step2.some(f => backendErrors[f])) setCurrentStep(2);
        toast.error('Please fix the errors highlighted on the form.');
      } else {
        toast.error('Submission failed', { description: (err as any)?.message });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <CompanyInfoStep formData={formData} onChange={handleChange} errors={errors} />;
      case 2: return (
        <FinancialDetailsStep
          annualRevenue={formData.annualRevenue}
          netWorth={formData.netWorth}
          bankAccount={formData.bankAccount}
          bankName={bank.name}
          bondAmount={tender.bidBondAmount}
          processingFee={tryParseAmount(bank.fees)}
          onChange={handleChange}
          errors={errors}
        />
      );
      case 3: return <DocumentUploadStep files={files} onFileChange={handleFileChange} errors={errors} />;
      case 4: return (
        <ReviewStep
          formData={formData}
          tenderTitle={tender.title}
          bankName={bank.name}
          bondAmount={tender.bidBondAmount}
          processingFee={tryParseAmount(bank.fees)}
          processingTime={bank.processingTime}
          files={files}
        />
      );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Toaster />

      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button variant="ghost" onClick={() => navigate(`/tender/${id}/banks`, { state: { tender } })} className="gap-2 hover:bg-slate-100">
            <ArrowLeft className="w-4 h-4" />
            Back to Provider Selection
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-slate-900">Bid Bond Application</h1>
            <Badge variant="outline" className="text-sm font-medium bg-blue-50 text-blue-900 border-blue-200">
              Step {currentStep} of {STEPS.length}
            </Badge>
          </div>
          <StepIndicator currentStep={currentStep} />
        </div>

        <Card className="shadow-md border-0 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-900 to-indigo-600" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {(() => { const Icon = STEPS[currentStep - 1].icon; return <Icon className="w-5 h-5 text-blue-900" />; })()}
              {STEPS[currentStep - 1].title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderStep()}

            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(s => s - 1)}
                disabled={currentStep === 1 || submitting}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </Button>
              {currentStep < STEPS.length ? (
                <Button
                  onClick={handleNext}
                  disabled={submitting || validating}
                  className="gap-2 bg-blue-900 hover:bg-blue-800"
                >
                  {validating ? 'Checking...' : 'Next'}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="gap-2 bg-green-600 hover:bg-green-700 shadow-md"
                >
                  <Check className="w-4 h-4" />
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
