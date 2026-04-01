import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import { ArrowLeft, ArrowRight, Check, Upload, FileText, Building2, DollarSign } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { CompanyInfoStep } from './bidbond/CompanyInfoStep';
import { FinancialDetailsStep } from './bidbond/FinancialDetailsStep';
import { DocumentUploadStep } from './bidbond/DocumentUploadStep';
import { ReviewStep } from './bidbond/ReviewStep';
import { tendersApi, applicationsApi, BankDto } from '../services/api';
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
  taxCertificate: null, registrationCertificate: null,
  financialStatements: null, additionalDocuments: null,
};

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="grid grid-cols-4 gap-4 mt-6">
      {STEPS.map(step => {
        const Icon = step.icon;
        const isActive    = currentStep === step.number;
        const isCompleted = currentStep > step.number;
        return (
          <div
            key={step.number}
            className={`flex flex-col items-center text-center ${
              isActive ? 'text-slate-900' : isCompleted ? 'text-green-600' : 'text-slate-400'
            }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
              isActive    ? 'bg-slate-900 text-white' :
              isCompleted ? 'bg-green-100 text-green-600' :
                            'bg-slate-100 text-slate-400'
            }`}>
              {isCompleted ? <Check className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
            </div>
            <div className="text-xs font-medium">{step.title}</div>
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
  const [submitting, setSubmitting] = useState(false);

  if (!tender || !bank) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md">
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
          tenderNumber: tender.tenderNumber,
          procuringEntity: tender.procuringEntity,
          deadline: new Date(tender.deadline).toISOString(),
          industry: tender.industry,
          bidBondRequired: tender.bidBondRequired,
          bidBondAmount: tender.bidBondAmount,
          category: tender.category === 'government' ? 'Government' : 'Private',
          subCategory: tender.subCategory ?? 'Goods',
          summary: tender.summary,
          description: tender.description,
          documentUrl: tender.documentUrl ?? '',
          requiredDocuments: tender.requiredDocuments ?? [],
        });
        backendTenderId = created.id;
      }

      await applicationsApi.create({
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
      case 3: return <DocumentUploadStep />;
      case 4: return (
        <ReviewStep
          formData={formData}
          tenderTitle={tender.title}
          bankName={bank.name}
          bondAmount={tender.bidBondAmount}
          processingFee={tryParseAmount(bank.fees)}
          processingTime={bank.processingTime}
        />
      );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster />

      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button variant="ghost" onClick={() => navigate(`/tender/${id}/banks`)} className="mb-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Bank Selection
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Bid Bond Application</h1>
            <span className="text-sm text-slate-600">Step {currentStep} of {STEPS.length}</span>
          </div>
          <Progress value={(currentStep / STEPS.length) * 100} className="h-2" />
          <StepIndicator currentStep={currentStep} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
          </CardHeader>
          <CardContent>
            {renderStep()}

            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button variant="outline" onClick={() => setCurrentStep(s => s - 1)} disabled={currentStep === 1 || submitting}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              {currentStep < STEPS.length ? (
                <Button onClick={() => setCurrentStep(s => s + 1)} disabled={submitting}>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button size="lg" onClick={handleSubmit} disabled={submitting}>
                  <Check className="w-4 h-4 mr-2" />
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
