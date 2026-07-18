import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../api/client';
import { useAuthStore } from '../../auth/auth.store';
import {
  FolderOpen,
  UserCheck,
  CircleDot,
  AlertTriangle,
  Clock,
  TrendingUp,
  Activity,
  CheckCircle2
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: () => apiFetch('/dashboard/summary'),
  });

  const { data: statusStats, isLoading: isStatusLoading } = useQuery({
    queryKey: ['dashboardStatus'],
    queryFn: () => apiFetch('/dashboard/tickets-by-status'),
  });

  const { data: priorityStats, isLoading: isPriorityLoading } = useQuery({
    queryKey: ['dashboardPriority'],
    queryFn: () => apiFetch('/dashboard/tickets-by-priority'),
  });

  const { data: slaStats, isLoading: isSlaLoading } = useQuery({
    queryKey: ['dashboardSla'],
    queryFn: () => apiFetch('/dashboard/sla-summary'),
  });

  const loading = isSummaryLoading || isStatusLoading || isPriorityLoading || isSlaLoading;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-900 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-900 rounded-xl border border-gray-800 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-900 rounded-xl border border-gray-800 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Define metric items
  const metrics = [
    {
      title: 'Total Open',
      value: summary?.totalOpen ?? 0,
      icon: FolderOpen,
      color: 'text-indigo-400 border-indigo-500/20 bg-indigo-500/5',
      glow: 'shadow-indigo-500/5',
    },
    {
      title: 'Assigned to Me',
      value: summary?.assignedToMe ?? 0,
      icon: UserCheck,
      color: 'text-purple-400 border-purple-500/20 bg-purple-500/5',
      glow: 'shadow-purple-500/5',
    },
    {
      title: 'Unassigned',
      value: summary?.unassigned ?? 0,
      icon: CircleDot,
      color: 'text-sky-400 border-sky-500/20 bg-sky-500/5',
      glow: 'shadow-sky-500/5',
    },
    {
      title: 'Urgent Tickets',
      value: summary?.urgent ?? 0,
      icon: AlertTriangle,
      color: 'text-rose-400 border-rose-500/20 bg-rose-500/5',
      glow: 'shadow-rose-500/5',
    },
    {
      title: 'SLA Breached',
      value: summary?.overdueSla ?? 0,
      icon: Clock,
      color: 'text-amber-400 border-amber-500/20 bg-amber-500/5',
      glow: 'shadow-amber-500/5',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Welcome back, {user?.firstName}!
        </h2>
        <p className="text-gray-400 mt-1">
          Here is your live multi-tenant helpdesk dashboard summary.
        </p>
      </div>

      {/* Grid of Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.title}
              className={`bg-gray-900 border border-gray-800 p-5 rounded-xl flex items-center justify-between shadow-lg ${m.glow} transition-transform hover:-translate-y-0.5`}
            >
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  {m.title}
                </span>
                <h3 className="text-3xl font-bold text-white mt-1.5">{m.value}</h3>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${m.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid of details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ticket Status dial cards */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              <span>Tickets by Status</span>
            </h4>
          </div>
          <div className="space-y-4">
            {Object.entries(statusStats || {}).map(([status, count]) => {
              const total = Object.values(statusStats || {}).reduce((a: any, b: any) => a + b, 0) || 1;
              const percent = Math.round((Number(count) / Number(total)) * 100);

              let barColor = 'bg-gray-700';
              if (status === 'OPEN') barColor = 'bg-indigo-500';
              if (status === 'IN_PROGRESS') barColor = 'bg-purple-500';
              if (status === 'WAITING_ON_CUSTOMER') barColor = 'bg-sky-500';
              if (status === 'WAITING_ON_INTERNAL') barColor = 'bg-amber-500';
              if (status === 'RESOLVED') barColor = 'bg-emerald-500';
              if (status === 'CLOSED') barColor = 'bg-gray-600';

              return (
                <div key={status} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-gray-400">{status.replace(/_/g, ' ')}</span>
                    <span className="text-white">{count} ({percent}%)</span>
                  </div>
                  <div className="w-full h-2 bg-gray-950 rounded-full overflow-hidden">
                    <div className={`h-full ${barColor}`} style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority dial card */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-purple-400" />
              <span>Tickets by Priority</span>
            </h4>
          </div>
          <div className="space-y-4">
            {Object.entries(priorityStats || {}).map(([priority, count]) => {
              const total = Object.values(priorityStats || {}).reduce((a: any, b: any) => a + b, 0) || 1;
              const percent = Math.round((Number(count) / Number(total)) * 100);

              let barColor = 'bg-gray-700';
              if (priority === 'LOW') barColor = 'bg-gray-600';
              if (priority === 'MEDIUM') barColor = 'bg-indigo-500';
              if (priority === 'HIGH') barColor = 'bg-amber-500';
              if (priority === 'URGENT') barColor = 'bg-rose-500';

              return (
                <div key={priority} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-gray-400">{priority}</span>
                    <span className="text-white">{count} ({percent}%)</span>
                  </div>
                  <div className="w-full h-2 bg-gray-950 rounded-full overflow-hidden">
                    <div className={`h-full ${barColor}`} style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SLA Health Indicator */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>SLA Health Summary</span>
              </h4>
            </div>

            <div className="flex justify-center py-4">
              <div className="relative w-36 h-36 rounded-full border-8 border-gray-950 flex items-center justify-center">
                {/* Circular indicator style */}
                <div className="text-center">
                  <span className="text-4xl font-extrabold text-white">
                    {slaStats?.total ? Math.round((Number(slaStats.active) / Number(slaStats.total)) * 100) : 100}%
                  </span>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-gray-500 mt-1">
                    Healthy Active
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-gray-800 pt-4 mt-6 text-center">
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Breached SLA
              </span>
              <h5 className="text-xl font-bold text-rose-400 mt-0.5">{slaStats?.breached ?? 0}</h5>
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Active SLAs
              </span>
              <h5 className="text-xl font-bold text-emerald-400 mt-0.5">{slaStats?.active ?? 0}</h5>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
