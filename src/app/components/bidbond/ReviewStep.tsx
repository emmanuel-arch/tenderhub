import { Separator } from '../ui/separator';
import { formatCurrency } from '../../utils/formatters';

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
}

function SummaryRow({ label, value, large = false }: { label: string; value: string; large?: boolean }) {
  return (
    <div>
      <div className="text-slate-500">{label}</div>
      <div className={`font-medium ${large ? 'text-lg' : ''}`}>{value}</div>
    </div>
  );
}

export function ReviewStep({ formData, tenderTitle, bankName, bondAmount, processingFee, processingTime }: Props) {
  return (
    <div className="space-y-6">
      <div className="bg-slate-50 rounded-lg p-6 space-y-4">
        <div>
          <h3 className="font-semibold mb-3">Application Summary</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <SummaryRow label="Tender" value={tenderTitle} />
            <SummaryRow label="Bank" value={bankName} />
            <SummaryRow label="Bond Amount" value={formatCurrency(bondAmount)} />
            <SummaryRow label="Processing Fee" value={formatCurrency(processingFee)} />
            <SummaryRow label="Processing Time" value={processingTime} />
            <SummaryRow
              label="Total Cost"
              value={formatCurrency(bondAmount + processingFee)}
              large
            />
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="font-semibold mb-3">Company Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <SummaryRow label="Company Name" value={formData.companyName || 'Not provided'} />
            <SummaryRow label="Registration Number" value={formData.registrationNumber || 'Not provided'} />
            <SummaryRow label="Contact Person" value={formData.contactPerson || 'Not provided'} />
            <SummaryRow label="Email" value={formData.email || 'Not provided'} />
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="font-semibold mb-3">Documents</h3>
          <div className="space-y-2 text-sm">
            {['Tax Compliance Certificate', 'Business Registration', 'Financial Statements'].map(doc => (
              <div key={doc} className="flex items-center justify-between">
                <span className="text-slate-600">{doc}</span>
                <span className="text-amber-600">Pending upload</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="font-semibold text-amber-900 mb-2">Terms & Conditions</h3>
        <ul className="text-sm text-amber-800 space-y-1">
          <li>• I confirm that all information provided is accurate and complete</li>
          <li>• I understand that false information may result in application rejection</li>
          <li>• I agree to pay the processing fees as stated</li>
          <li>• I accept the bank's terms and conditions for bid bond issuance</li>
        </ul>
      </div>
    </div>
  );
}
