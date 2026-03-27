import { DollarSign } from 'lucide-react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { formatCurrency } from '../../utils/formatters';

interface Props {
  annualRevenue: string;
  netWorth: string;
  bankAccount: string;
  bankName: string;
  bondAmount: number;
  processingFee: number;
  onChange: (field: string, value: string) => void;
}

export function FinancialDetailsStep({
  annualRevenue,
  netWorth,
  bankAccount,
  bankName,
  bondAmount,
  processingFee,
  onChange,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <DollarSign className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <div className="font-medium text-blue-900">Bond Amount (Auto-calculated)</div>
            <div className="text-2xl font-bold text-blue-900 mt-1">{formatCurrency(bondAmount)}</div>
            <div className="text-sm text-blue-700 mt-1">Processing fee: {formatCurrency(processingFee)}</div>
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="annualRevenue">Annual Revenue (Last Financial Year) *</Label>
        <Input
          id="annualRevenue"
          value={annualRevenue}
          onChange={(e) => onChange('annualRevenue', e.target.value)}
          placeholder="Enter amount in KES"
        />
      </div>

      <div>
        <Label htmlFor="netWorth">Company Net Worth *</Label>
        <Input
          id="netWorth"
          value={netWorth}
          onChange={(e) => onChange('netWorth', e.target.value)}
          placeholder="Enter amount in KES"
        />
      </div>

      <div>
        <Label htmlFor="bankAccount">Bank Account Number (with {bankName}) *</Label>
        <Input
          id="bankAccount"
          value={bankAccount}
          onChange={(e) => onChange('bankAccount', e.target.value)}
          placeholder="Enter your account number"
        />
        <p className="text-sm text-slate-500 mt-1">
          If you don't have an account, one will be opened during processing
        </p>
      </div>
    </div>
  );
}
