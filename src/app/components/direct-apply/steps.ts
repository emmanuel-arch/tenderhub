import { ClipboardList, Landmark, Building2, DollarSign, Upload, FileText } from 'lucide-react';

export const STEPS = [
  { number: 1, title: 'Tender Details',      icon: ClipboardList },
  { number: 2, title: 'Select Provider',     icon: Landmark },
  { number: 3, title: 'Company Information', icon: Building2 },
  { number: 4, title: 'Financial Details',   icon: DollarSign },
  { number: 5, title: 'Document Upload',     icon: Upload },
  { number: 6, title: 'Review & Submit',     icon: FileText },
];

export interface TenderInfo {
  title: string;
  tenderNumber: string;
  procuringEntity: string;
  deadline: string;
  bidBondAmount: string;
  category: string;
}
