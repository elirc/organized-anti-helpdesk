import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../../api/client';
import { useAuthStore } from '../../../auth/auth.store';
import {
  ArrowLeft,
  Clock,
  User,
  AlertTriangle,
  Send,
  Lock,
  MessageSquare,
  History,
  CheckCircle,
  FolderMinus,
  Loader2,
  Trash2
} from 'lucide-react';

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  OPEN: ['IN_PROGRESS'],
  IN_PROGRESS: ['WAITING_ON_CUSTOMER', 'WAITING_ON_INTERNAL', 'RESOLVED'],
  WAITING_ON_CUSTOMER: ['IN_PROGRESS'],
  WAITING_ON_INTERNAL: ['IN_PROGRESS'],
  RESOLVED: ['CLOSED', 'IN_PROGRESS'],
  CLOSED: []
};

export default function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [commentBody, setCommentBody] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [transitionLoading, setTransitionLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch Ticket Details
  const { data: ticket, isLoading: isTicketLoading } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => apiFetch(`/tickets/${id}`),
  });

  // Fetch Org Users for Assignment
  const { data: orgUsers } = useQuery({
    queryKey: ['orgUsers'],
    queryFn: () => apiFetch('/auth/users'),
    enabled: user?.role !== 'REQUESTER',
  });

  // Filter org users to find assignees (Only Owners, Admins, and Agents can be assigned)
  const assignees = orgUsers?.filter((u: any) => u.role !== 'REQUESTER') || [];

  // Fetch Comments
  const { data: comments, isLoading: isCommentsLoading } = useQuery({
    queryKey: ['comments', id],
    queryFn: () => apiFetch(`/tickets/${id}/comments`),
  });

  // Post Comment Mutation
  const postCommentMutation = useMutation({
    mutationFn: (data: { body: string; isInternal: boolean }) =>
      apiFetch(`/tickets/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      setCommentBody('');
      queryClient.invalidateQueries({ queryKey: ['comments', id] });
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
    },
  });

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentBody.trim()) return;
    postCommentMutation.mutate({ body: commentBody, isInternal });
  };

  const handleStatusChange = async (newStatus: string) => {
    setTransitionLoading(true);
    try {
      await apiFetch(`/tickets/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
    } catch (err: any) {
      alert(err.message || 'Status transition failed');
    } finally {
      setTransitionLoading(false);
    }
  };

  const handleAssignChange = async (assigneeId: string) => {
    setAssignLoading(true);
    try {
      await apiFetch(`/tickets/${id}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({ assignedToId: assigneeId === 'unassigned' ? null : assigneeId }),
      });
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
    } catch (err: any) {
      alert(err.message || 'Assignment failed');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleDeleteTicket = async () => {
    if (!window.confirm('Are you sure you want to delete this ticket? This cannot be undone.')) return;
    setDeleteLoading(true);
    try {
      await apiFetch(`/tickets/${id}`, {
        method: 'DELETE',
      });
      navigate('/tickets');
    } catch (err: any) {
      alert(err.message || 'Failed to delete ticket');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (isTicketLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-gray-900 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-gray-900 rounded-xl border border-gray-800 animate-pulse" />
          <div className="h-96 bg-gray-900 rounded-xl border border-gray-800 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-bold text-white">Ticket Not Found</h3>
        <button onClick={() => navigate('/tickets')} className="mt-4 text-indigo-400 font-semibold flex items-center gap-2 mx-auto hover:text-indigo-300">
          <ArrowLeft className="w-4 h-4" /> Go back to Queue
        </button>
      </div>
    );
  }

  const slaBreached = new Date(ticket.slaDueAt) < new Date() && ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED';
  const isAgentOrAdmin = user?.role !== 'REQUESTER';

  // Get allowed target statuses for the current user
  const getNextStatuses = () => {
    const list = ALLOWED_TRANSITIONS[ticket.status] || [];
    if (user?.role === 'REQUESTER') {
      // Requesters can only transition to RESOLVED or CLOSED
      return list.filter((s) => s === 'RESOLVED' || s === 'CLOSED');
    }
    return list;
  };

  const nextStatuses = getNextStatuses();

  const getStatusLabel = (s: string) => {
    let style = 'bg-gray-800 text-gray-400 border border-gray-700';
    if (s === 'OPEN') style = 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
    if (s === 'IN_PROGRESS') style = 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
    if (s === 'WAITING_ON_CUSTOMER') style = 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
    if (s === 'WAITING_ON_INTERNAL') style = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    if (s === 'RESOLVED') style = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    if (s === 'CLOSED') style = 'bg-gray-800 text-gray-500 border border-gray-800';
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${style}`}>
        {s.replace(/_/g, ' ')}
      </span>
    );
  };

  const getPriorityColor = (p: string) => {
    if (p === 'LOW') return 'text-gray-400 bg-gray-800/50';
    if (p === 'MEDIUM') return 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/20';
    if (p === 'HIGH') return 'text-amber-400 bg-amber-500/10 border border-amber-500/20';
    return 'text-rose-400 bg-rose-500/10 border border-rose-500/20 animate-pulse';
  };

  // Timeline list combinations of activities & comments
  const timelineItems = [
    ...(comments || []).map((c: any) => ({
      type: 'comment',
      id: c.id,
      date: new Date(c.createdAt),
      data: c,
    })),
    ...(ticket.activities || []).map((a: any) => ({
      type: 'activity',
      id: a.id,
      date: new Date(a.createdAt),
      data: a,
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div className="space-y-6">
      {/* Detail Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/tickets')}
            className="p-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-extrabold text-white tracking-tight">{ticket.title}</h2>
              {getStatusLabel(ticket.status)}
            </div>
            <p className="text-gray-400 text-sm mt-1">
              Ticket ID: {ticket.id} • Created on {new Date(ticket.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Delete option for Owner/Admin */}
        {(user?.role === 'OWNER' || user?.role === 'ADMIN') && (
          <button
            onClick={handleDeleteTicket}
            disabled={deleteLoading}
            className="px-4 py-2.5 bg-red-950/20 border border-red-500/20 hover:bg-red-500/10 text-red-400 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {deleteLoading ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <Trash2 className="w-4.5 h-4.5" />}
            <span>Delete Ticket</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details & Timeline / Discussion */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Description */}
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-md">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Description</h3>
            <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
          </div>

          {/* Timeline & Collaboration */}
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-md space-y-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-2">
              <History className="w-4.5 h-4.5 text-indigo-400" />
              <span>Discussion & Activity Timeline</span>
            </h3>

            {/* Render chronological timeline */}
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {timelineItems.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-sm">No activity recorded yet.</div>
              ) : (
                timelineItems.map((item: any) => {
                  if (item.type === 'comment') {
                    const c = item.data;
                    return (
                      <div
                        key={`comment-${c.id}`}
                        className={`p-4 rounded-xl border flex gap-3 ${
                          c.isInternal
                            ? 'bg-purple-950/10 border-purple-500/20 text-purple-200'
                            : 'bg-gray-950/40 border-gray-800 text-gray-200'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center font-bold text-xs shrink-0 border border-gray-700">
                          {c.author?.firstName?.[0] || 'U'}{c.author?.lastName?.[0] || 'U'}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-white">
                              {c.author?.firstName} {c.author?.lastName}
                              {c.isInternal && (
                                <span className="ml-2 text-[10px] uppercase font-extrabold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                                  Internal Note
                                </span>
                              )}
                            </span>
                            <span className="text-gray-500">{new Date(c.createdAt).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed mt-1">{c.body}</p>
                        </div>
                      </div>
                    );
                  } else {
                    const a = item.data;
                    let actionText = '';
                    if (a.action === 'CREATED') actionText = 'created the ticket';
                    if (a.action === 'STATUS_CHANGED') actionText = `changed status from ${a.oldValue} to ${a.newValue}`;
                    if (a.action === 'ASSIGNED') actionText = a.newValue ? `assigned the ticket to user ID ${a.newValue}` : 'unassigned the ticket';
                    if (a.action === 'NOTE_ADDED') actionText = 'added an internal note';
                    if (a.action === 'COMMENT_ADDED') actionText = 'added a public comment';

                    return (
                      <div key={`activity-${a.id}`} className="flex items-center gap-3 text-xs text-gray-500 bg-gray-950/15 border border-transparent px-4 py-1.5 rounded-lg">
                        <History className="w-3.5 h-3.5 text-gray-600" />
                        <span>
                          <strong className="text-gray-400">Actor</strong> {actionText} • {new Date(a.createdAt).toLocaleString()}
                        </span>
                      </div>
                    );
                  }
                })
              )}
            </div>

            {/* Post comment box */}
            <form onSubmit={handlePostComment} className="border-t border-gray-800 pt-4 space-y-4">
              {isAgentOrAdmin && (
                <div className="flex bg-gray-950 p-0.5 rounded-lg border border-gray-800 max-w-xs">
                  <button
                    type="button"
                    onClick={() => setIsInternal(false)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      !isInternal ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    Public Comment
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsInternal(true)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      isInternal ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <Lock className="w-3 h-3" />
                      <span>Internal Note</span>
                    </div>
                  </button>
                </div>
              )}

              <div className="relative">
                <textarea
                  rows={3}
                  className="block w-full px-3 py-2.5 bg-gray-950 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                  placeholder={isInternal ? 'Type an internal note hidden from requester...' : 'Type a reply to requester...'}
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                />
                <div className="absolute bottom-2 right-2">
                  <button
                    type="submit"
                    disabled={postCommentMutation.isPending || !commentBody.trim()}
                    className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg transition-colors cursor-pointer"
                  >
                    {postCommentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Workflow Control, SLA, Assignee Metadata */}
        <div className="space-y-6">
          {/* Workflow & Status Controller */}
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-md space-y-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Workflow Controller</h3>

            {/* Change Status */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Change Status</label>
              {nextStatuses.length === 0 ? (
                <div className="text-xs text-gray-500 bg-gray-950/30 p-2.5 border border-gray-800/80 rounded-lg">
                  No next status transitions permitted from current state.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {nextStatuses.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      disabled={transitionLoading}
                      className="px-3 py-2 bg-gray-950 border border-gray-800 hover:bg-gray-800/80 text-gray-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {transitionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>{s.replace(/_/g, ' ')}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Change Assignee */}
            {isAgentOrAdmin && (
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Assign Ticket</label>
                <div className="relative">
                  <select
                    className="block w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-xs cursor-pointer"
                    value={ticket.assignedToId || 'unassigned'}
                    onChange={(e) => handleAssignChange(e.target.value)}
                    disabled={assignLoading}
                  >
                    <option value="unassigned">Unassigned</option>
                    {assignees.map((a: any) => (
                      <option key={a.id} value={a.id}>
                        {a.firstName} {a.lastName} ({a.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* SLA Tracker */}
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-md space-y-4">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-2">
              <Clock className="w-4.5 h-4.5 text-indigo-400" />
              <span>SLA Target Details</span>
            </h3>

            <div className={`p-4 rounded-xl border ${slaBreached ? 'bg-rose-950/10 border-rose-500/20 text-rose-200' : 'bg-emerald-950/10 border-emerald-500/20 text-emerald-200'}`}>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                <AlertTriangle className={`w-4 h-4 ${slaBreached ? 'text-rose-500 animate-pulse' : 'text-emerald-500'}`} />
                <span>{slaBreached ? 'SLA Target Breached' : 'SLA Target Active'}</span>
              </div>
              <div className="text-sm mt-2">
                Deadline: <strong className="text-white">{new Date(ticket.slaDueAt).toLocaleString()}</strong>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-500 font-semibold">Priority</span>
                <div className={`mt-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase inline-block ${getPriorityColor(ticket.priority)}`}>
                  {ticket.priority}
                </div>
              </div>
              <div>
                <span className="text-gray-500 font-semibold">Creator</span>
                <div className="text-white font-semibold mt-1 truncate">
                  {ticket.createdBy?.firstName} {ticket.createdBy?.lastName}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
