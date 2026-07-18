import { useAuthStore } from '../auth/auth.store';
import { Calendar, Search } from 'lucide-react';

export default function Header() {
  const { user } = useAuthStore();
  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-8 shrink-0">
      <div className="flex items-center gap-3 bg-gray-950/40 border border-gray-800/80 px-3 py-1.5 rounded-lg max-w-xs w-full text-gray-500 text-sm">
        <Search className="w-4 h-4" />
        <span className="text-xs">Quick search...</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-400 bg-gray-950/40 border border-gray-800/85 px-3 py-1.5 rounded-lg">
          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
          <span>{dateStr}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-300">
            {user?.organization?.name}
          </span>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </div>
    </header>
  );
}
