import { DollarSign } from 'lucide-react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { formatCurrency } from '../../utils/formatters';
import { getFieldError, type BackendErrors } from '../../utils/formErrors';

interface Props {
  annualRevenue: string;
  netWorth: string;
  bankName: string;
  bondAmount: number;
  processingFee: number;
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

export function FinancialDetailsStep({
  annualRevenue,
  netWorth,
  bankName,
  bondAmount,
  processingFee,
  onChange,
  errors,
}: Props) {
  const e = (f: string) => getFieldError(errors, f);
  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-200 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5 text-blue-900" />
          </div>
          <div>
            <div className="font-medium text-blue-900 text-sm">Bond Amount (Auto-calculated)</div>
            <div className="text-2xl font-bold text-blue-900 mt-1">{formatCurrency(bondAmount)}</div>
            <div className="text-sm text-blue-900 mt-1">Processing fee: {formatCurrency(processingFee)}</div>
            <div className="text-xs text-blue-900 mt-1 font-medium">Total: {formatCurrency(bondAmount + processingFee)}</div>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="annualRevenue" className="text-sm font-medium">Annual Revenue (Last Financial Year) *</Label>
        <Input
          id="annualRevenue"
          value={annualRevenue}
          onChange={(e) => onChange('annualRevenue', e.target.value)}
          placeholder="Enter amount in KES"
          className={fieldClass(e('annualRevenue'))}
        />
        <FieldError msg={e('annualRevenue')} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="netWorth" className="text-sm font-medium">Company Net Worth *</Label>
        <Input
          id="netWorth"
          value={netWorth}
          onChange={(e) => onChange('netWorth', e.target.value)}
          placeholder="Enter amount in KES"
          className={fieldClass(e('netWorth'))}
        />
        <FieldError msg={e('netWorth')} />
      </div>

    </div>
  );
}
