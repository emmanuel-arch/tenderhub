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
    <div className="space-y-4">
      <div>
        <Label htmlFor="companyName">Company Name *</Label>
        <Input
          id="companyName"
          value={formData.companyName}
          onChange={(e) => onChange('companyName', e.target.value)}
          placeholder="Enter your company name"
        />
      </div>

      <div>
        <Label htmlFor="registrationNumber">Business Registration Number *</Label>
        <Input
          id="registrationNumber"
          value={formData.registrationNumber}
          onChange={(e) => onChange('registrationNumber', e.target.value)}
          placeholder="e.g., PVT-1234567890"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="contactPerson">Contact Person *</Label>
          <Input
            id="contactPerson"
            value={formData.contactPerson}
            onChange={(e) => onChange('contactPerson', e.target.value)}
            placeholder="Full name"
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            placeholder="+254 700 000 000"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="email">Email Address *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => onChange('email', e.target.value)}
          placeholder="email@company.com"
        />
      </div>

      <div>
        <Label htmlFor="address">Physical Address *</Label>
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
