import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { getFieldError, type BackendErrors } from '../../utils/formErrors';

interface FormFields {
  companyName: string;
  registrationNumber: string;
  kraPin: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
}

interface Props {
  formData: FormFields;
  onChange: (field: string, value: string) => void;
  errors: BackendErrors;
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-red-600 mt-1">{msg}</p>;
}

function fieldClass(error?: string) {
  return `h-11${error ? ' border-red-400 focus-visible:ring-red-400' : ''}`;
}

export function CompanyInfoStep({ formData, onChange, errors }: Props) {
  const e = (f: string) => getFieldError(errors, f);
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="companyName" className="text-sm font-medium">Company / Business Name *</Label>
        <Input
          id="companyName"
          value={formData.companyName}
          onChange={(e) => onChange('companyName', e.target.value)}
          placeholder="Enter your company or business name"
          className={fieldClass(e('companyName'))}
        />
        <FieldError msg={e('companyName')} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="registrationNumber" className="text-sm font-medium">Business Registration Number *</Label>
          <Input
            id="registrationNumber"
            value={formData.registrationNumber}
            onChange={(e) => onChange('registrationNumber', e.target.value)}
            placeholder="e.g., PVT-1234567890"
            className={fieldClass(e('registrationNumber'))}
          />
          <FieldError msg={e('registrationNumber')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="kraPin" className="text-sm font-medium">KRA PIN *</Label>
          <Input
            id="kraPin"
            value={formData.kraPin}
            onChange={(e) => onChange('kraPin', e.target.value)}
            placeholder="e.g., A001234567B"
            className={fieldClass(e('kraPin'))}
          />
          <FieldError msg={e('kraPin')} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="contactPerson" className="text-sm font-medium">Contact Person *</Label>
          <Input
            id="contactPerson"
            value={formData.contactPerson}
            onChange={(e) => onChange('contactPerson', e.target.value)}
            placeholder="Full name"
            className={fieldClass(e('contactPerson'))}
          />
          <FieldError msg={e('contactPerson')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-sm font-medium">Phone Number *</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            placeholder="+254 700 000 000"
            className={fieldClass(e('phone'))}
          />
          <FieldError msg={e('phone')} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-sm font-medium">Email Address *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => onChange('email', e.target.value)}
          placeholder="email@company.com"
          className={fieldClass(e('email'))}
        />
        <FieldError msg={e('email')} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="address" className="text-sm font-medium">Physical Address *</Label>
        <Textarea
          id="address"
          value={formData.address}
          onChange={(e) => onChange('address', e.target.value)}
          placeholder="Enter your company's physical address"
          rows={3}
          className={e('address') ? 'border-red-400 focus-visible:ring-red-400' : ''}
        />
        <FieldError msg={e('address')} />
      </div>
    </div>
  );
}
