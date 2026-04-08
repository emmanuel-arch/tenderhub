import { ApiError } from '../services/api';

// Maps ASP.NET Core DTO field names → frontend form field names
const FIELD_MAP: Record<string, string> = {
  CompanyName:                'companyName',
  BusinessRegistrationNumber: 'registrationNumber',
  ContactPerson:              'contactPerson',
  PhoneNumber:                'phone',
  ContactEmail:               'email',
  PhysicalAddress:            'address',
  AnnualRevenue:              'annualRevenue',
  CompanyNetWorth:            'netWorth',
  BankAccountNumber:          'bankAccount',
};

export type BackendErrors = Record<string, string[]> | null | undefined;

/**
 * Look up the error message for a form field from raw backend ModelState errors.
 * Loops through backend keys, maps to frontend field names, returns first message if matched.
 */
export function getFieldError(errors: BackendErrors, formField: string): string | undefined {
  if (!errors) return undefined;
  for (const [key, msgs] of Object.entries(errors)) {
    const mapped = FIELD_MAP[key] ?? key.charAt(0).toLowerCase() + key.slice(1);
    if (mapped === formField) {
      return Array.isArray(msgs) ? msgs[0] : String(msgs);
    }
  }
  return undefined;
}

/** Extract raw backend errors from a caught API error response. */
export function extractBackendErrors(err: unknown): BackendErrors {
  if (err instanceof ApiError && err.errors) return err.errors;
  return null;
}
