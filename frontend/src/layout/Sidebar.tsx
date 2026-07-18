import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../auth/auth.store';
import { LayoutDashboard, Ticket, PlusCircle, LogOut, Shield } from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
    },
    {
      name: 'Tickets',
      path: '/tickets',
      icon: Ticket,
    },
    {
      name: 'New Ticket',
      path: '/tickets/new',
      icon: PlusCircle,
    },
  ];

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-screen shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-gray-800 gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/20">
          H
        </div>
        <div>
          <h1 className="font-bold text-white leading-none text-sm">AntiHelpdesk</h1>
          <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">
            {user?.organization?.name || 'Workspace'}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200 border border-transparent'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-gray-400 group-hover:text-gray-200'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Details & Logout */}
      <div className="p-4 border-t border-gray-800 space-y-4">
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center font-bold text-gray-300 text-sm border border-gray-700">
            {user?.firstName?.[0] || 'U'}{user?.lastName?.[0] || 'U'}
          </div>
          <div className="overflow-hidden min-w-0">
            <h4 className="text-sm font-semibold text-white leading-tight truncate">
              {user?.firstName} {user?.lastName}
            </h4>
            <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1 mt-0.5 uppercase tracking-wide">
              <Shield className="w-3 h-3 text-indigo-500" />
              {user?.role}
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20 cursor-pointer"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}
