import { Upload, FileText, CheckCircle } from 'lucide-react';
import { Input } from '../ui/input';
import { getFieldError, type BackendErrors } from '../../utils/formErrors';

export interface DocumentFiles {
  taxCertificate: File | null;
  registrationCertificate: File | null;
  financialStatements: File | null;
  additionalDocuments: File | null;
}

interface DropzoneProps {
  label: string;
  accept: string;
  hint: string;
  required?: boolean;
  file: File | null;
  error?: string;
  onFileSelect: (file: File) => void;
}

function FileDropzone({ label, accept, hint, required = true, file, error, onFileSelect }: DropzoneProps) {
  return (
    <div>
      <label className={`block border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer ${
        file
          ? 'border-green-300 bg-green-50 hover:border-green-400'
          : error
            ? 'border-red-300 bg-red-50 hover:border-red-400'
            : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50/50'
      }`}>
        {file ? (
          <>
            <CheckCircle className="w-10 h-10 mx-auto text-green-500 mb-2" />
            <div className="font-medium text-green-700 mb-1">{label}</div>
            <div className="text-sm text-green-600 flex items-center justify-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              {file.name}
            </div>
          </>
        ) : (
          <>
            <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3 ${error ? 'bg-red-100' : 'bg-slate-100'}`}>
              <Upload className={`w-6 h-6 ${error ? 'text-red-400' : 'text-slate-400'}`} />
            </div>
            <div className={`font-medium mb-1 ${error ? 'text-red-700' : 'text-slate-700'}`}>
              {label}{required ? ' *' : ' (Optional)'}
            </div>
            <div className="text-sm text-slate-500 mb-1">Click to upload or drag and drop</div>
            <div className="text-xs text-slate-400">{hint}</div>
          </>
        )}
        <Input
          type="file"
          className="hidden"
          accept={accept}
          onChange={(e) => {
            const selected = e.target.files?.[0];
            if (selected) onFileSelect(selected);
          }}
        />
      </label>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

interface Props {
  files: DocumentFiles;
  onFileChange: (field: keyof DocumentFiles, file: File) => void;
  errors: BackendErrors;
}

export function DocumentUploadStep({ files, onFileChange, errors }: Props) {
  const e = (f: string) => getFieldError(errors, f);
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-700">
        Upload the required documents below. Accepted formats are PDF, JPG, and PNG.
      </div>
      <FileDropzone
        label="Tax Compliance Certificate"
        accept=".pdf,.jpg,.jpeg,.png"
        hint="PDF, JPG, or PNG (max 5MB)"
        file={files.taxCertificate}
        error={e('taxCertificate')}
        onFileSelect={(f) => onFileChange('taxCertificate', f)}
      />
      <FileDropzone
        label="Business Registration Certificate"
        accept=".pdf,.jpg,.jpeg,.png"
        hint="PDF, JPG, or PNG (max 5MB)"
        file={files.registrationCertificate}
        error={e('registrationCertificate')}
        onFileSelect={(f) => onFileChange('registrationCertificate', f)}
      />
      <FileDropzone
        label="Audited Financial Statements (Last 3 Years)"
        accept=".pdf"
        hint="PDF (max 10MB)"
        file={files.financialStatements}
        error={e('financialStatements')}
        onFileSelect={(f) => onFileChange('financialStatements', f)}
      />
      <FileDropzone
        label="Additional Documents"
        accept=""
        hint="Any format (max 10MB)"
        required={false}
        file={files.additionalDocuments}
        onFileSelect={(f) => onFileChange('additionalDocuments', f)}
      />
    </div>
  );
}
