import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { 
  LayoutGrid, 
  CheckSquare, 
  Calendar, 
  FileText, 
  Briefcase, 
  Users, 
  MessageSquare,
  LogOut
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuth } from './providers/AuthProvider';
import { auth } from '../services/firebase';

const NAV_ITEMS = [
  { to: '/', icon: LayoutGrid, label: 'Home' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/cases', icon: Briefcase, label: 'Cases' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/documents', icon: FileText, label: 'Documents' },
  { to: '/family', icon: Users, label: 'Family' },
  { to: '/ask', icon: MessageSquare, label: 'Ask Sera' },
];

export const AppShell: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-zinc-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-zinc-100 flex flex-col shrink-0">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-zinc-900 rounded-xl flex items-center justify-center">
              <span className="text-white font-display font-bold text-xl">S</span>
            </div>
            <h1 className="text-2xl font-display font-bold tracking-tighter text-zinc-900">Sera</h1>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Life, Handled.</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }: { isActive: boolean }) => cn(
                "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all group",
                isActive 
                  ? "bg-zinc-900 text-white shadow-xl shadow-zinc-200" 
                  : "text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50"
              )}
            >
              {({ isActive }) => (
                <>
                  <item.icon size={20} className={cn("transition-colors", isActive ? "text-white" : "text-zinc-300 group-hover:text-zinc-900")} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-50">
          <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 bg-zinc-200 rounded-full overflow-hidden shrink-0">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-400">
                    <Users size={16} />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-zinc-900 truncate">{user?.displayName || 'User'}</p>
                <button 
                  onClick={() => auth.signOut()}
                  className="text-[10px] font-bold text-zinc-400 hover:text-red-500 transition-colors flex items-center gap-1"
                >
                  <LogOut size={10} />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="max-w-6xl mx-auto p-12">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
