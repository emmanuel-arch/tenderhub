import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Users, Building2, DollarSign, FileText, Loader2,
  CheckCircle, XCircle, Clock, ChevronDown, Filter, Eye, AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { applicationsApi, ApplicationDto, UpdateStatusDto } from '../../services/api';
import { formatDate, formatCurrency, capitalize } from '../../utils/formatters';
import { getStatusColor } from '../../utils/statusHelpers';
import { toast } from 'sonner';

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'submitted';
type InstitutionFilter = 'all' | 'Bank' | 'Microfinance';

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  return (
    <Badge variant="outline" className={getStatusColor(s)}>
      {s === 'approved' && <CheckCircle className="w-3 h-3 mr-1" />}
      {s === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
      {(s === 'pending' || s === 'submitted') && <Clock className="w-3 h-3 mr-1" />}
      {capitalize(status)}
    </Badge>
  );
}

export function ApplicationsTab() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<ApplicationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [institutionFilter, setInstitutionFilter] = useState<InstitutionFilter>('all');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const loadApplications = () => {
    setLoading(true);
    setFetchError(null);
    applicationsApi.list()
      .then(res => setApplications(res.data))
      .catch(err => setFetchError(err.message ?? 'Failed to load applications.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadApplications(); }, []);

  const handleUpdateStatus = async (app: ApplicationDto, status: string) => {
    const dto: UpdateStatusDto = {
      status,
      notes: `Status changed to ${status} by admin.`,
      ...(status === 'Rejected' && rejectionReason ? { rejectionReason } : {}),
    };
    setUpdatingId(app.id);
    try {
      const updated = await applicationsApi.updateStatus(app.id, dto);
      setApplications(prev => prev.map(a => a.id === app.id ? updated : a));
      setExpandedId(null);
      setRejectionReason('');
      toast.success(`Application ${status.toLowerCase()}`);
    } catch (err: any) {
      toast.error('Update failed', { description: err.message });
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = applications.filter(a => {
    if (statusFilter !== 'all' && a.status.toLowerCase() !== statusFilter) return false;
    if (institutionFilter !== 'all' && a.bankInstitutionType !== institutionFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        a.tenderTitle.toLowerCase().includes(q) ||
        a.companyName.toLowerCase().includes(q) ||
        a.bankName?.toLowerCase().includes(q) ||
        a.tenderNumber?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const counts = {
    all: applications.length,
    pending: applications.filter(a => a.status.toLowerCase() === 'pending').length,
    approved: applications.filter(a => a.status.toLowerCase() === 'approved').length,
    rejected: applications.filter(a => a.status.toLowerCase() === 'rejected').length,
    submitted: applications.filter(a => a.status.toLowerCase() === 'submitted').length,
    bank: applications.filter(a => a.bankInstitutionType === 'Bank').length,
    microfinance: applications.filter(a => a.bankInstitutionType === 'Microfinance').length,
  };

  return (
    <div className="space-y-6">
      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: counts.all, color: '', icon: FileText },
          { label: 'Pending', value: counts.pending + counts.submitted, color: 'text-green-700', icon: Clock },
          { label: 'Approved', value: counts.approved, color: 'text-green-800', icon: CheckCircle },
          { label: 'Rejected', value: counts.rejected, color: 'text-red-600', icon: XCircle },
        ].map(({ label, value, color, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 mb-1">{label}</div>
                  <div className={`text-2xl font-bold ${color}`}>{value}</div>
                </div>
                <Icon className={`w-8 h-8 opacity-20 ${color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Institution Stats ── */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Bank Applications', value: counts.bank, color: 'text-blue-900' },
          { label: 'Microfinance Applications', value: counts.microfinance, color: 'text-green-800' },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-3">
              <div className="text-xs text-slate-500 mb-1">{label}</div>
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Filters ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="w-4 h-4" />
              All Applications
              <Badge variant="outline" className="ml-1">{filtered.length}</Badge>
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Input
                placeholder="Search tender, company, bank..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-8 w-48 text-sm"
              />
              <Select value={institutionFilter} onValueChange={v => setInstitutionFilter(v as InstitutionFilter)}>
                <SelectTrigger className="h-8 w-36 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Institutions</SelectItem>
                  <SelectItem value="Bank">Bank</SelectItem>
                  <SelectItem value="Microfinance">Microfinance</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={v => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger className="h-8 w-32 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-900" />
            </div>
          )}

          {!loading && fetchError && (
            <div className="py-10 text-center">
              <AlertCircle className="w-10 h-10 mx-auto text-red-500 mb-3" />
              <p className="text-red-800 font-medium mb-4">{fetchError}</p>
              <Button variant="outline" onClick={loadApplications}>Try Again</Button>
            </div>
          )}

          {!loading && !fetchError && filtered.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-slate-400 mb-4" />
              <h3 className="font-semibold mb-2">No applications found</h3>
              <p className="text-sm text-slate-500">Try adjusting the filters.</p>
            </div>
          )}

          {!loading && !fetchError && (
            <div className="space-y-3">
              {filtered.map(app => (
                <div key={app.id} className="border rounded-lg overflow-hidden">
                  {/* Card header row */}
                  <div className="flex items-start justify-between gap-4 p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <StatusBadge status={app.status} />
                        {app.bankInstitutionType && (
                          <Badge variant="outline" className={`text-xs ${app.bankInstitutionType === 'Microfinance' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-blue-50 text-blue-900 border-blue-200'}`}>
                            {app.bankInstitutionType}
                          </Badge>
                        )}
                        <span className="text-xs text-slate-400">{formatDate(app.submittedAt)}</span>
                      </div>
                      <h3 className="font-semibold text-slate-900 leading-snug line-clamp-1 mb-1">{app.tenderTitle}</h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                        <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{app.companyName || 'N/A'}</span>
                        <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" />{app.bankName}</span>
                        {app.bondAmount && <span className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" />{formatCurrency(app.bondAmount)}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 h-8"
                        onClick={() => navigate(`/application/${app.id}`)}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </Button>
                      <button
                        onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                        className="text-slate-400 hover:text-slate-700 transition-colors"
                      >
                        <ChevronDown className={`w-5 h-5 transition-transform ${expandedId === app.id ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded actions */}
                  {expandedId === app.id && (
                    <div className="border-t bg-slate-50 px-4 py-3 space-y-3">
                      {app.rejectionReason && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                          <strong>Rejection Reason:</strong> {app.rejectionReason}
                        </div>
                      )}

                      {/* Documents */}
                      {app.documents && app.documents.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-slate-700 mb-1.5">Uploaded Documents</div>
                          <div className="flex flex-wrap gap-2">
                            {app.documents.map(doc => (
                              <Badge key={doc.id} variant="outline" className="text-xs cursor-pointer hover:bg-slate-100">
                                <FileText className="w-3 h-3 mr-1" />
                                {doc.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Status Actions */}
                      {app.status.toLowerCase() !== 'approved' && app.status.toLowerCase() !== 'rejected' && (
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-slate-700">Update Status</div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              className="bg-green-800 hover:bg-green-900 text-white gap-1.5 h-8"
                              disabled={updatingId === app.id}
                              onClick={() => handleUpdateStatus(app, 'Approved')}
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="gap-1.5 h-8"
                              disabled={updatingId === app.id}
                              onClick={() => handleUpdateStatus(app, 'Rejected')}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Reject
                            </Button>
                          </div>
                          <Input
                            placeholder="Rejection reason (optional)"
                            value={rejectionReason}
                            onChange={e => setRejectionReason(e.target.value)}
                            className="h-8 text-sm max-w-xs"
                          />
                        </div>
                      )}

                      {/* Status History */}
                      {app.statusHistory && app.statusHistory.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-slate-700 mb-1.5">Status History</div>
                          <div className="space-y-1.5">
                            {app.statusHistory.map(h => (
                              <div key={h.id} className="flex items-start gap-2 text-xs text-slate-600">
                                <span className="text-slate-400 shrink-0">{formatDate(h.changedAt)}</span>
                                <Badge variant="outline" className={`text-xs py-0 ${getStatusColor(h.status.toLowerCase())}`}>{h.status}</Badge>
                                {h.notes && <span className="text-slate-500">{h.notes}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
