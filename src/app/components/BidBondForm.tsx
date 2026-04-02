import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import { ArrowLeft, ArrowRight, Check, Upload, FileText, Building2, DollarSign } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { CompanyInfoStep } from './bidbond/CompanyInfoStep';
import { FinancialDetailsStep } from './bidbond/FinancialDetailsStep';
import { DocumentUploadStep, type DocumentFiles } from './bidbond/DocumentUploadStep';
import { ReviewStep } from './bidbond/ReviewStep';
import { tendersApi, applicationsApi, documentsApi, BankDto } from '../services/api';
import { Tender } from '../data/mockData';
import { toast } from 'sonner';
import { Toaster } from './ui/sonner';

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
    <div className="grid grid-cols-4 gap-2 mt-6">
      {STEPS.map((step, idx) => {
        const Icon = step.icon;
        const isActive    = currentStep === step.number;
        const isCompleted = currentStep > step.number;
        return (
          <div key={step.number} className="flex flex-col items-center">
            <div className="flex items-center w-full">
              {idx > 0 && (
                <div className={`h-0.5 flex-1 ${
                  isCompleted || isActive ? 'bg-blue-500' : 'bg-slate-200'
                }`} />
              )}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                isActive    ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200 ring-4 ring-blue-100' :
                isCompleted ? 'bg-green-500 text-white shadow-md' :
                              'bg-slate-100 text-slate-400'
              }`}>
                {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 ${
                  isCompleted ? 'bg-green-500' : 'bg-slate-200'
                }`} />
              )}
            </div>
            <div className={`text-xs font-medium mt-2 ${
              isActive ? 'text-blue-700' : isCompleted ? 'text-green-600' : 'text-slate-400'
            }`}>{step.title}</div>
          </div>
        );
      })}
    </div>
  );
}

export function BidBondForm() {
  const { id, bankId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const state = (location.state as any) ?? {};
  const tender: Tender | null = state.tender ?? null;
  const bank: BankDto | null = state.bank ?? null;

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [files, setFiles] = useState<DocumentFiles>(INITIAL_FILES);
  const [submitting, setSubmitting] = useState(false);

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

  const handleChange = (field: string, value: string) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const handleFileChange = (field: keyof DocumentFiles, file: File) =>
    setFiles(prev => ({ ...prev, [field]: file }));

  const tryParseAmount = (fees: string): number => {
    const parts = fees.split('+').map(p => p.trim());
    let base = 0;
    let pct = 0;
    for (const part of parts) {
      const num = parseFloat(part.replace(/[^0-9.]/g, ''));
      if (part.includes('%')) pct = num;
      else base = num;
    }
    return base + (tender.bidBondAmount * pct) / 100;
  };

  const handleSubmit = async () => {
    if (!formData.companyName || !formData.registrationNumber || !formData.contactPerson || !formData.email || !formData.phone || !formData.address) {
      toast.error('Missing required fields', { description: 'Please fill in all company information fields.' });
      setCurrentStep(1);
      return;
    }

    if (!files.taxCertificate || !files.registrationCertificate || !files.financialStatements) {
      toast.error('Missing documents', { description: 'Please upload all required documents.' });
      setCurrentStep(3);
      return;
    }

    setSubmitting(true);
    try {
      // Find or create the tender in our backend by external ID
      const tenderList = await tendersApi.list({ externalId: tender.id });
      let backendTenderId: string;

      if (tenderList.data.length > 0) {
        backendTenderId = tenderList.data[0].id;
      } else {
        // Create the tender in our backend from the external data
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

      // Create the application
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
        { name: 'Tax Compliance Certificate', file: files.taxCertificate },
        { name: 'Business Registration Certificate', file: files.registrationCertificate },
        { name: 'Audited Financial Statements', file: files.financialStatements },
      ];
      if (files.additionalDocuments) {
        docUploads.push({ name: 'Additional Documents', file: files.additionalDocuments });
      }

      for (const doc of docUploads) {
        await documentsApi.upload(application.id, doc.file, doc.name);
      }

      toast.success('Application submitted!');
      navigate('/dashboard', { state: { applicationSubmitted: true } });
    } catch (err: any) {
      toast.error('Submission failed', { description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <CompanyInfoStep formData={formData} onChange={handleChange} />;
      case 2: return (
        <FinancialDetailsStep
          annualRevenue={formData.annualRevenue}
          netWorth={formData.netWorth}
          bankAccount={formData.bankAccount}
          bankName={bank.name}
          bondAmount={tender.bidBondAmount}
          processingFee={tryParseAmount(bank.fees)}
          onChange={handleChange}
        />
      );
      case 3: return <DocumentUploadStep files={files} onFileChange={handleFileChange} />;
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
            Back to Bank Selection
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-slate-900">Bid Bond Application</h1>
            <Badge variant="outline" className="text-sm font-medium bg-blue-50 text-blue-700 border-blue-200">
              Step {currentStep} of {STEPS.length}
            </Badge>
          </div>
          <Progress value={(currentStep / STEPS.length) * 100} className="h-2" />
          <StepIndicator currentStep={currentStep} />
        </div>

        <Card className="shadow-md border-0 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-600 to-purple-600" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {(() => { const Icon = STEPS[currentStep - 1].icon; return <Icon className="w-5 h-5 text-blue-600" />; })()}
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
                  onClick={() => setCurrentStep(s => s + 1)}
                  disabled={submitting}
                  className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-md"
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
