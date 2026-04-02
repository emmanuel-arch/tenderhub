import { CheckCircle, AlertTriangle, FileText } from 'lucide-react';
import { Separator } from '../ui/separator';
import { formatCurrency } from '../../utils/formatters';
import type { DocumentFiles } from './DocumentUploadStep';

interface FormSnapshot {
  companyName: string;
  registrationNumber: string;
  contactPerson: string;
  email: string;
}

interface Props {
  formData: FormSnapshot;
  tenderTitle: string;
  bankName: string;
  bondAmount: number;
  processingFee: number;
  processingTime: string;
  files: DocumentFiles;
}

function SummaryRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-start py-2">
      <span className="text-slate-500 text-sm">{label}</span>
      <span className={`font-medium text-sm text-right max-w-[60%] ${highlight ? 'text-lg text-slate-900' : ''}`}>{value}</span>
    </div>
  );
}

export function ReviewStep({ formData, tenderTitle, bankName, bondAmount, processingFee, processingTime, files }: Props) {
  const docEntries: { label: string; file: File | null }[] = [
    { label: 'Tax Compliance Certificate', file: files.taxCertificate },
    { label: 'Business Registration Certificate', file: files.registrationCertificate },
    { label: 'Audited Financial Statements', file: files.financialStatements },
    { label: 'Additional Documents', file: files.additionalDocuments },
  ];
  return (
    <div className="space-y-6">
      {/* Application Summary */}
      <div className="rounded-xl border bg-gradient-to-br from-slate-50 to-white p-6 space-y-1">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-blue-600" />
          Application Summary
        </h3>
        <SummaryRow label="Tender" value={tenderTitle} />
        <Separator />
        <SummaryRow label="Bank" value={bankName} />
        <Separator />
        <SummaryRow label="Bond Amount" value={formatCurrency(bondAmount)} />
        <Separator />
        <SummaryRow label="Processing Fee" value={formatCurrency(processingFee)} />
        <Separator />
        <SummaryRow label="Processing Time" value={processingTime} />
        <Separator />
        <div className="flex justify-between items-center py-3 bg-blue-50 -mx-6 px-6 mt-2 rounded-b-xl">
          <span className="font-semibold text-blue-900">Total Cost</span>
          <span className="text-xl font-bold text-blue-900">{formatCurrency(bondAmount + processingFee)}</span>
        </div>
      </div>

      {/* Company Information */}
      <div className="rounded-xl border p-6 space-y-1">
        <h3 className="font-semibold text-slate-900 mb-4">Company Information</h3>
        <SummaryRow label="Company Name" value={formData.companyName || 'Not provided'} />
        <Separator />
        <SummaryRow label="Registration Number" value={formData.registrationNumber || 'Not provided'} />
        <Separator />
        <SummaryRow label="Contact Person" value={formData.contactPerson || 'Not provided'} />
        <Separator />
        <SummaryRow label="Email" value={formData.email || 'Not provided'} />
      </div>

      {/* Documents */}
      <div className="rounded-xl border p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Documents</h3>
        <div className="space-y-3">
          {docEntries.map(({ label, file }) => (
            <div key={label} className={`flex items-center justify-between p-3 rounded-lg border ${
              file
                ? 'bg-green-50 border-green-100'
                : 'bg-amber-50 border-amber-100'
            }`}>
              <div className="flex items-center gap-2">
                {file ? <FileText className="w-4 h-4 text-green-600" /> : null}
                <span className="text-sm text-slate-700 font-medium">{label}</span>
              </div>
              {file ? (
                <span className="text-xs text-green-600 font-medium bg-green-100 px-2 py-1 rounded-full">
                  {file.name}
                </span>
              ) : (
                <span className="text-xs text-amber-600 font-medium bg-amber-100 px-2 py-1 rounded-full">
                  Not uploaded
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Terms & Conditions */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
        <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          Terms & Conditions
        </h3>
        <ul className="space-y-2">
          {[
            'I confirm that all information provided is accurate and complete',
            'I understand that false information may result in application rejection',
            'I agree to pay the processing fees as stated',
            'I accept the bank\'s terms and conditions for bid bond issuance',
          ].map((term, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
              <CheckCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              {term}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
