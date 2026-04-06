import { CheckCircle, Clock, XCircle, FileText } from 'lucide-react';

export const getStatusIcon = (status: string) => {
  const s = status.toLowerCase();
  if (s.includes('approved')) return <CheckCircle className="w-5 h-5 text-green-600" />;
  if (s.includes('rejected')) return <XCircle className="w-5 h-5 text-red-600" />;
  if (s.includes('pending') || s.includes('review')) return <Clock className="w-5 h-5 text-amber-600" />;
  return <FileText className="w-5 h-5 text-blue-900" />;
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'approved': return 'bg-green-100 text-green-800 border-green-200';
    case 'pending':  return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
    default:         return 'bg-blue-100 text-blue-900 border-blue-200';
  }
};
