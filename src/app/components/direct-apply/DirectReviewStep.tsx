import type { BankDto } from '../../services/api';
import type { DocumentFiles } from '../bidbond/DocumentUploadStep';
import type { TenderInfo } from './steps';

interface Props {
  tenderInfo: TenderInfo;
  bank: BankDto;
  formData: Record<string, string>;
  files: DocumentFiles;
}

export function DirectReviewStep({ tenderInfo, bank, formData, files }: Props) {
  const amount = parseFloat(tenderInfo.bidBondAmount) || 0;
  return (
    <div className="space-y-6 text-sm">
      <div>
        <h3 className="font-semibold text-slate-700 mb-2">Tender</h3>
        <div className="bg-slate-50 rounded-lg p-3 space-y-1 text-slate-600">
          <div><span className="font-medium">Title:</span> {tenderInfo.title}</div>
          {tenderInfo.tenderNumber && <div><span className="font-medium">Number:</span> {tenderInfo.tenderNumber}</div>}
          {tenderInfo.procuringEntity && <div><span className="font-medium">Entity:</span> {tenderInfo.procuringEntity}</div>}
          {tenderInfo.deadline && <div><span className="font-medium">Deadline:</span> {new Date(tenderInfo.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>}
          <div><span className="font-medium">Bid Bond:</span> KES {amount.toLocaleString()}</div>
          <div><span className="font-medium">Category:</span> {tenderInfo.category}</div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-slate-700 mb-2">Provider</h3>
        <div className="bg-slate-50 rounded-lg p-3 text-slate-600 space-y-1">
          <div className="font-medium text-slate-900">{bank.name}</div>
          <div>Processing time: {bank.processingTime}</div>
          <div>Fees: {bank.fees}</div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-slate-700 mb-2">Company</h3>
        <div className="bg-slate-50 rounded-lg p-3 space-y-1 text-slate-600">
          <div className="font-medium text-slate-900">{formData.companyName}</div>
          <div>Reg No: {formData.registrationNumber}</div>
          <div>{formData.contactPerson} · {formData.phone} · {formData.email}</div>
          <div>{formData.address}</div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-slate-700 mb-2">Documents</h3>
        <div className="bg-slate-50 rounded-lg p-3 space-y-1 text-slate-600">
          {files.taxCertificate          && <div>✓ Tax Compliance Certificate</div>}
          {files.registrationCertificate && <div>✓ Business Registration Certificate</div>}
          {files.financialStatements     && <div>✓ Audited Financial Statements</div>}
          {files.additionalDocuments     && <div>✓ Additional Documents</div>}
        </div>
      </div>
    </div>
  );
}
