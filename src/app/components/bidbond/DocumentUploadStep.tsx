import { Upload } from 'lucide-react';
import { Input } from '../ui/input';

interface DropzoneProps {
  label: string;
  accept: string;
  hint: string;
  required?: boolean;
}

function FileDropzone({ label, accept, hint, required = true }: DropzoneProps) {
  return (
    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 transition-colors cursor-pointer">
      <Upload className="w-12 h-12 mx-auto text-slate-400 mb-2" />
      <div className="font-medium mb-1">{label}{required ? ' *' : ' (Optional)'}</div>
      <div className="text-sm text-slate-500 mb-2">Click to upload or drag and drop</div>
      <div className="text-xs text-slate-400">{hint}</div>
      <Input type="file" className="hidden" accept={accept} />
    </div>
  );
}

export function DocumentUploadStep() {
  return (
    <div className="space-y-4">
      <FileDropzone
        label="Tax Compliance Certificate"
        accept=".pdf,.jpg,.jpeg,.png"
        hint="PDF, JPG, or PNG (max 5MB)"
      />
      <FileDropzone
        label="Business Registration Certificate"
        accept=".pdf,.jpg,.jpeg,.png"
        hint="PDF, JPG, or PNG (max 5MB)"
      />
      <FileDropzone
        label="Audited Financial Statements (Last 3 Years)"
        accept=".pdf"
        hint="PDF (max 10MB)"
      />
      <FileDropzone
        label="Additional Documents"
        accept=""
        hint="Any format (max 10MB)"
        required={false}
      />
    </div>
  );
}
