import React from "react";
import { useAuth } from "../providers/AuthProvider";
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar, 
  FileText, 
  Briefcase, 
  Users, 
  MessageSquare,
  LogOut,
  Bell,
  Search
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { signOut } from "../firebase";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, household } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState("");

  const navItems = [
    { to: "/", icon: <LayoutDashboard size={20} />, label: "Home" },
    { to: "/tasks", icon: <CheckSquare size={20} />, label: "Tasks" },
    { to: "/calendar", icon: <Calendar size={20} />, label: "Calendar" },
    { to: "/documents", icon: <FileText size={20} />, label: "Documents" },
    { to: "/cases", icon: <Briefcase size={20} />, label: "Cases" },
    { to: "/family", icon: <Users size={20} />, label: "Family" },
    { to: "/ask", icon: <MessageSquare size={20} />, label: "Ask Sera" },
  ];

  return (
    <div className="h-screen bg-zinc-50 flex flex-col md:flex-row overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-zinc-200 bg-white flex-col p-6">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-9 h-9 bg-zinc-900 rounded-xl flex items-center justify-center shadow-lg shadow-zinc-200">
            <span className="text-white font-display font-bold text-xl">S</span>
          </div>
          <span className="font-display font-bold text-2xl tracking-tight text-zinc-900">Sera</span>
        </div>

        <nav className="flex-1 space-y-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-zinc-900 text-white shadow-xl shadow-zinc-200 translate-x-1" 
                  : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
              )}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-zinc-100">
          <div className="flex items-center gap-3 px-2 mb-6">
            <div className="w-10 h-10 rounded-full bg-zinc-100 overflow-hidden border-2 border-white shadow-sm">
              <img src={user?.photoURL || ""} alt={user?.displayName || ""} referrerPolicy="no-referrer" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-zinc-900 truncate">{user?.displayName}</p>
              <p className="text-xs text-zinc-500 truncate">{household?.name}</p>
            </div>
          </div>
          <button 
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header */}
        <header className="h-20 border-b border-zinc-100 bg-white/80 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-20">
          <div className="flex-1 max-w-xl">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search appointments, documents, cases..." 
                className="w-full bg-zinc-50 border-none rounded-2xl py-2.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-zinc-900/5 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-5 ml-6">
            <button className="p-2.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 rounded-xl transition-all relative">
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-zinc-900 rounded-full border-2 border-white" />
            </button>
            <div className="md:hidden w-9 h-9 rounded-full bg-zinc-100 overflow-hidden border-2 border-white shadow-sm">
              <img src={user?.photoURL || ""} alt={user?.displayName || ""} referrerPolicy="no-referrer" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto bg-zinc-50/50">
          <div className="max-w-6xl mx-auto p-8 pb-32">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Nav */}
      <nav className="md:hidden h-20 border-t border-zinc-100 bg-white/90 backdrop-blur-xl flex items-center justify-around px-4 pb-2">
        {navItems.slice(0, 5).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              "flex flex-col items-center gap-1.5 px-3 py-2 transition-all duration-200",
              isActive ? "text-zinc-900" : "text-zinc-400"
            )}
          >
            {item.icon}
            <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
