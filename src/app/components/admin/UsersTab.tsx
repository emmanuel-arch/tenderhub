import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, UserX, UserCheck, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { usersApi, UserDto } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

const ROLE_COLORS: Record<string, string> = {
  superadmin: 'bg-purple-100 text-purple-800',
  admin:      'bg-blue-100 text-blue-800',
  client:     'bg-slate-100 text-slate-600',
};

export function UsersTab() {
  const { user: currentUser } = useAuth();
  const [users,   setUsers]   = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [working, setWorking] = useState<string | null>(null); // id of user being actioned

  const load = () => {
    setLoading(true);
    setError(null);
    usersApi.list()
      .then(setUsers)
      .catch(err => setError(err.message ?? 'Failed to load users.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handle = async (id: string, action: 'deactivate' | 'activate' | 'delete') => {
    if (action === 'delete') {
      if (!window.confirm('Permanently delete this account? This cannot be undone.')) return;
    }
    setWorking(id);
    try {
      const res = action === 'deactivate' ? await usersApi.deactivate(id)
                : action === 'activate'   ? await usersApi.activate(id)
                :                           await usersApi.delete(id);
      toast.success(res.message);
      load();
    } catch (err: any) {
      toast.error(err.message ?? 'Action failed.');
    } finally {
      setWorking(null);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-12">
      <Loader2 className="w-8 h-8 animate-spin text-blue-900" />
    </div>
  );

  if (error) return (
    <div className="py-12 text-center">
      <AlertCircle className="w-10 h-10 mx-auto text-red-500 mb-3" />
      <p className="text-red-700 mb-4">{error}</p>
      <Button variant="outline" onClick={load} className="gap-1.5">
        <RefreshCw className="w-4 h-4" /> Try Again
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{users.length} account{users.length !== 1 ? 's' : ''}</p>
        <Button variant="outline" size="sm" onClick={load} className="gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">User</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Role</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Joined</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(u => {
              const isSelf = u.id === currentUser?.id;
              const isSuperAdmin = u.role.toLowerCase() === 'superadmin';
              const busy = working === u.id;

              return (
                <tr key={u.id} className={`${!u.isActive ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {u.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{u.name} {isSelf && <span className="text-xs text-slate-400">(you)</span>}</div>
                        <div className="text-xs text-slate-500">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${ROLE_COLORS[u.role.toLowerCase()] ?? 'bg-slate-100 text-slate-600'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.isActive
                      ? <span className="text-green-700 font-medium">Active</span>
                      : <span className="text-red-600 font-medium">Deactivated</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {!isSelf && !isSuperAdmin && (
                      <div className="flex items-center gap-1 justify-end">
                        {u.isActive ? (
                          <Button
                            variant="ghost" size="sm"
                            className="gap-1 text-slate-600 hover:text-red-700 hover:bg-red-50"
                            disabled={busy}
                            onClick={() => handle(u.id, 'deactivate')}
                          >
                            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserX className="w-3.5 h-3.5" />}
                            Deactivate
                          </Button>
                        ) : (
                          <Button
                            variant="ghost" size="sm"
                            className="gap-1 text-slate-600 hover:text-green-700 hover:bg-green-50"
                            disabled={busy}
                            onClick={() => handle(u.id, 'activate')}
                          >
                            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                            Activate
                          </Button>
                        )}
                        <Button
                          variant="ghost" size="sm"
                          className="gap-1 text-slate-600 hover:text-red-700 hover:bg-red-50"
                          disabled={busy}
                          onClick={() => handle(u.id, 'delete')}
                        >
                          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          Delete
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
