import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../../api/client';
import { ArrowLeft, Loader2, Plus } from 'lucide-react';

const ticketSchema = z.object({
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(120, 'Title must not exceed 120 characters'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
});

type TicketForm = z.infer<typeof ticketSchema>;

export default function CreateTicketPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<TicketForm>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      priority: 'MEDIUM'
    }
  });

  const onSubmit = async (data: TicketForm) => {
    setError(null);
    setLoading(true);
    try {
      const result = await apiFetch('/tickets', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      navigate(`/tickets/${result.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/tickets')}
          className="p-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Create Support Ticket</h2>
          <p className="text-gray-400 mt-1">Submit a new request to the workspace queue.</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 p-8 rounded-xl shadow-lg">
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1.5">
              Subject / Title
            </label>
            <input
              id="title"
              type="text"
              className="block w-full px-3 py-2.5 bg-gray-950 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
              placeholder="e.g. Database connection is failing"
              {...register('title')}
            />
            {errors.title && (
              <p className="mt-1.5 text-xs text-red-400">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-300 mb-1.5">
              Priority Level
            </label>
            <select
              id="priority"
              className="block w-full px-3 py-2.5 bg-gray-950 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm cursor-pointer"
              {...register('priority')}
            >
              <option value="LOW">Low (72h SLA)</option>
              <option value="MEDIUM">Medium (48h SLA)</option>
              <option value="HIGH">High (24h SLA)</option>
              <option value="URGENT">Urgent (4h SLA)</option>
            </select>
            {errors.priority && (
              <p className="mt-1.5 text-xs text-red-400">{errors.priority.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1.5">
              Detailed Description
            </label>
            <textarea
              id="description"
              rows={6}
              className="block w-full px-3 py-2.5 bg-gray-950 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
              placeholder="Provide a detailed description of the bug, issue, or request..."
              {...register('description')}
            />
            {errors.description && (
              <p className="mt-1.5 text-xs text-red-400">{errors.description.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={() => navigate('/tickets')}
              className="px-4 py-2.5 bg-transparent border border-gray-800 hover:bg-gray-800 text-gray-300 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-700/50 text-white rounded-lg text-sm font-semibold shadow-lg hover:shadow-indigo-500/20 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Submit Ticket</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
