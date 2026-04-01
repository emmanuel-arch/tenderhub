import { useEffect, useState } from 'react';
import { Users, Building2, DollarSign, FileText, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { applicationsApi, ApplicationDto } from '../../services/api';
import { formatDate, formatCurrency, capitalize } from '../../utils/formatters';
import { getStatusColor } from '../../utils/statusHelpers';
import { toast } from 'sonner';

export function ApplicationsTab() {
  const [applications, setApplications] = useState<ApplicationDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    applicationsApi.list()
      .then(res => setApplications(res.data))
      .catch(err => toast.error('Failed to load applications', { description: err.message }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>All User Applications</CardTitle>
        <p className="text-sm text-slate-600 mt-1">Track and monitor all bid bond applications from clients</p>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        )}

        {!loading && (
          <div className="space-y-4">
            {applications.map(app => (
              <div key={app.id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{app.tenderTitle}</h3>
                      <Badge variant="outline" className={getStatusColor(app.status)}>
                        {capitalize(app.status)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span><strong>Company:</strong> {app.companyName || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        <span><strong>Bank:</strong> {app.bankName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        <span><strong>Amount:</strong> {app.bondAmount ? formatCurrency(app.bondAmount) : 'N/A'}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-600 mt-2">
                      <div><strong>Tender Number:</strong> {app.tenderNumber}</div>
                      <div><strong>Submitted:</strong> {formatDate(app.submittedAt)}</div>
                    </div>

                    {app.documents && app.documents.length > 0 && (
                      <div className="mt-3">
                        <div className="text-sm font-medium text-slate-700 mb-1">Uploaded Documents:</div>
                        <div className="flex flex-wrap gap-2">
                          {app.documents.map(doc => (
                            <Badge key={doc.id} variant="outline" className="text-xs">
                              <FileText className="w-3 h-3 mr-1" />
                              {doc.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {app.rejectionReason && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                    <strong>Rejection Reason:</strong> {app.rejectionReason}
                  </div>
                )}
              </div>
            ))}

            {applications.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                <h3 className="font-semibold mb-2">No Applications Yet</h3>
                <p className="text-slate-600">No bid bond applications have been submitted yet.</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
