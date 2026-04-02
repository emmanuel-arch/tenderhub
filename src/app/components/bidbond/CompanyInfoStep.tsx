import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

interface FormFields {
  companyName: string;
  registrationNumber: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
}

interface Props {
  formData: FormFields;
  onChange: (field: string, value: string) => void;
}

export function CompanyInfoStep({ formData, onChange }: Props) {
  return (
    <div className="space-y-5">
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-700">
        Fields marked with * are required to proceed with your application.
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="companyName" className="text-sm font-medium">Company Name *</Label>
        <Input
          id="companyName"
          value={formData.companyName}
          onChange={(e) => onChange('companyName', e.target.value)}
          placeholder="Enter your company name"
          className="h-11"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="registrationNumber" className="text-sm font-medium">Business Registration Number *</Label>
        <Input
          id="registrationNumber"
          value={formData.registrationNumber}
          onChange={(e) => onChange('registrationNumber', e.target.value)}
          placeholder="e.g., PVT-1234567890"
          className="h-11"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="contactPerson" className="text-sm font-medium">Contact Person *</Label>
          <Input
            id="contactPerson"
            value={formData.contactPerson}
            onChange={(e) => onChange('contactPerson', e.target.value)}
            placeholder="Full name"
            className="h-11"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-sm font-medium">Phone Number *</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            placeholder="+254 700 000 000"
            className="h-11"
          />
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
          className="h-11"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="address" className="text-sm font-medium">Physical Address *</Label>
        <Textarea
          id="address"
          value={formData.address}
          onChange={(e) => onChange('address', e.target.value)}
          placeholder="Enter your company's physical address"
          rows={3}
        />
      </div>
    </div>
  );
}
