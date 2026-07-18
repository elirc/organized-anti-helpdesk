import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../../api/client';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../auth/auth.store';
import {
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  AlertCircle
} from 'lucide-react';

export default function TicketListPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>('');
  const [priority, setPriority] = useState<string>('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Build query string
  const queryParams = new URLSearchParams({
    page: String(page),
    pageSize: '10',
    sortBy,
    sortDirection,
  });

  if (status) queryParams.set('status', status);
  if (priority) queryParams.set('priority', priority);
  if (search) queryParams.set('search', search);

  const { data, isLoading } = useQuery({
    queryKey: ['tickets', page, status, priority, search, sortBy, sortDirection],
    queryFn: () => apiFetch(`/tickets?${queryParams.toString()}`),
  });

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
    setPage(1);
  };

  const getStatusBadge = (s: string) => {
    let style = 'bg-gray-800 text-gray-400';
    if (s === 'OPEN') style = 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
    if (s === 'IN_PROGRESS') style = 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
    if (s === 'WAITING_ON_CUSTOMER') style = 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
    if (s === 'WAITING_ON_INTERNAL') style = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    if (s === 'RESOLVED') style = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    if (s === 'CLOSED') style = 'bg-gray-800 text-gray-500 border border-gray-800';
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${style}`}>
        {s.replace(/_/g, ' ')}
      </span>
    );
  };

  const getPriorityBadge = (p: string) => {
    let style = 'bg-gray-800 text-gray-400';
    if (p === 'LOW') style = 'bg-gray-800/80 text-gray-400';
    if (p === 'MEDIUM') style = 'bg-indigo-500/10 text-indigo-400';
    if (p === 'HIGH') style = 'bg-amber-500/10 text-amber-400';
    if (p === 'URGENT') style = 'bg-rose-500/10 text-rose-400 animate-pulse border border-rose-500/20';
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${style}`}>
        {p}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Tickets Queue</h2>
          <p className="text-gray-400 mt-1">Manage, filter, and track support requests across the tenant workspace.</p>
        </div>
        <button
          onClick={() => navigate('/tickets/new')}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold shadow-lg hover:shadow-indigo-500/20 transition-all flex items-center gap-2 group cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Ticket</span>
        </button>
      </div>

      {/* Filters & search controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-900 border border-gray-800 p-4 rounded-xl shadow-md">
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
            <Search className="w-4.5 h-4.5" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {/* Status */}
        <div className="relative">
          <select
            className="block w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm cursor-pointer"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="WAITING_ON_CUSTOMER">Waiting on Customer</option>
            <option value="WAITING_ON_INTERNAL">Waiting on Internal</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        {/* Priority */}
        <div className="relative">
          <select
            className="block w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm cursor-pointer"
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>

        {/* Info card display count */}
        <div className="flex items-center justify-end text-xs font-semibold text-gray-500 pr-2">
          Total Queue: {data?.pagination?.totalItems ?? 0} tickets
        </div>
      </div>

      {/* Tickets List Area */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-900 border border-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : data?.data?.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 p-12 text-center rounded-xl">
          <AlertCircle className="w-10 h-10 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white">No Tickets Found</h3>
          <p className="text-gray-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search query, selecting different filters, or creating a new ticket.
          </p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-lg overflow-hidden">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-950/40 text-xs font-bold text-gray-400 uppercase">
                <th className="p-4 pl-6 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('title')}>
                  <div className="flex items-center gap-1.5">
                    <span>Ticket Subject</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('status')}>
                  <div className="flex items-center gap-1.5">
                    <span>Status</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('priority')}>
                  <div className="flex items-center gap-1.5">
                    <span>Priority</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="p-4">Assigned Agent</th>
                <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('slaDueAt')}>
                  <div className="flex items-center gap-1.5">
                    <span>SLA Deadline</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {data?.data?.map((ticket: any) => {
                const slaBreached = new Date(ticket.slaDueAt) < new Date() && ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED';
                const formattedSla = new Date(ticket.slaDueAt).toLocaleString();

                return (
                  <tr
                    key={ticket.id}
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                    className="hover:bg-gray-800/30 transition-colors cursor-pointer text-sm"
                  >
                    <td className="p-4 pl-6">
                      <div className="font-semibold text-white truncate max-w-xs md:max-w-md">{ticket.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Created by {ticket.createdBy?.firstName} {ticket.createdBy?.lastName} • {new Date(ticket.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4">{getStatusBadge(ticket.status)}</td>
                    <td className="p-4">{getPriorityBadge(ticket.priority)}</td>
                    <td className="p-4 text-gray-300">
                      {ticket.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span>{ticket.assignedTo.firstName} {ticket.assignedTo.lastName}</span>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-xs italic">Unassigned</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Clock className={`w-4 h-4 ${slaBreached ? 'text-rose-500 animate-pulse' : 'text-gray-400'}`} />
                        <span className={slaBreached ? 'text-rose-400 font-semibold' : 'text-gray-300'}>
                          {formattedSla}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination controls */}
          {data?.pagination?.totalPages > 1 && (
            <div className="h-16 flex items-center justify-between px-6 bg-gray-950/30 border-t border-gray-800 text-sm font-medium text-gray-400">
              <div>
                Showing Page {page} of {data.pagination.totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="p-2 bg-gray-900 border border-gray-800 rounded-lg disabled:opacity-50 text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page === data.pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                  className="p-2 bg-gray-900 border border-gray-800 rounded-lg disabled:opacity-50 text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
