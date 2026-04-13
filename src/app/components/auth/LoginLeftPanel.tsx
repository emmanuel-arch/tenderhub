import { Building2, Shield, CheckCircle, TrendingUp } from 'lucide-react';

export function LoginLeftPanel() {
  return (
    <div className="hidden lg:flex lg:w-[48%] bg-slate-50 flex-col justify-between p-12 border-r border-slate-100">
      <div className="space-y-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-900 text-sm px-3 py-1.5 rounded-full border border-green-200">
            <TrendingUp className="w-3.5 h-3.5" />
            615+ Active Tenders Available
          </div>
          <h2 className="text-4xl font-bold text-slate-900 leading-tight">
            Win More Tenders,<br />
            <span className="text-green-800">Faster Than Ever</span>
          </h2>
          <p className="text-slate-500 text-base leading-relaxed">
            TenderHub aggregates government and private sector tenders in one place — so you spend less time searching and more time winning.
          </p>
        </div>

        <div className="space-y-3">
          {[
            {
              icon: Building2,
              color: 'bg-blue-50 text-blue-900',
              title: 'All Sources in One Place',
              desc: 'Tenders from tenders.go.ke, KRA, county governments, and private organisations — aggregated and kept up to date.',
            },
            {
              icon: Shield,
              color: 'bg-green-50 text-green-700',
              title: 'Bid Bond Applications',
              desc: 'Apply for bid bonds through our partner banks directly from the platform. Track status in real time.',
            },
            {
              icon: CheckCircle,
              color: 'bg-green-50 text-green-800',
              title: 'Never Miss a Deadline',
              desc: 'Active tenders are refreshed every 6 hours. Expired tenders are automatically removed from your feed.',
            },
          ].map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="flex items-start gap-4 p-4 rounded-xl bg-white border border-slate-200">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">{title}</div>
                <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { value: '615+', label: 'Active Tenders' },
            { value: '4',    label: 'Categories' },
            { value: '24/7', label: 'Access' },
          ].map(({ value, label }) => (
            <div key={label} className="text-center p-4 rounded-xl bg-white border border-slate-200">
              <div className="text-2xl font-bold text-slate-900">{value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
