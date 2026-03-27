import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, ArrowRight, Check, Upload, FileText, Building2, DollarSign } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { tenders, banks } from '../data/mockData';
import { CompanyInfoStep } from './bidbond/CompanyInfoStep';
import { FinancialDetailsStep } from './bidbond/FinancialDetailsStep';
import { DocumentUploadStep } from './bidbond/DocumentUploadStep';
import { ReviewStep } from './bidbond/ReviewStep';

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
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(INITIAL_FORM);

  const tender = tenders.find(t => t.id === id);
  const bank   = banks.find(b => b.id === bankId);

  if (!tender || !bank) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader><CardTitle>Invalid Request</CardTitle></CardHeader>
          <CardContent><Button onClick={() => navigate('/')}>Back to Tenders</Button></CardContent>
        </Card>
      </div>
    );
  }

  const handleChange = (field: string, value: string) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const calculateFees = () => {
    const [basePart, percentPart] = bank.fees.split(' + ');
    const baseFee = parseInt(basePart.replace(/[^0-9]/g, ''));
    const percentage = parseFloat(percentPart) / 100;
    return baseFee + tender.bidBondAmount * percentage;
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
          processingFee={calculateFees()}
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
          processingFee={calculateFees()}
          processingTime={bank.processingTime}
        />
      );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
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
              <Button variant="outline" onClick={() => setCurrentStep(s => s - 1)} disabled={currentStep === 1}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              {currentStep < STEPS.length ? (
                <Button onClick={() => setCurrentStep(s => s + 1)}>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button size="lg" onClick={() => navigate('/dashboard', { state: { showSuccess: true } })}>
                  <Check className="w-4 h-4 mr-2" />
                  Submit Application
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
