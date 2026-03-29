import React from "react";
import { useAuth } from "../app/providers/AuthProvider";
import { 
  Calendar, 
  FileText, 
  Clock, 
  AlertCircle, 
  ChevronRight,
  ArrowRight,
  Plus,
  Sparkles,
  Briefcase,
  CheckCircle2,
  User,
  Zap,
  LayoutDashboard,
  History
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { toDate } from "../utils/dateUtils";
import { Link } from "react-router-dom";
import { cn } from "../utils/cn";
import { RecommendationCard } from "../components/RecommendationCard";
import { useDashboard } from "../hooks/useDashboard";
import { Recommendation } from "../types";

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const { 
    isLoading, 
    attentionToday, 
    urgentThisWeek, 
    unresolvedAndWaiting, 
    recommendations,
    recentActivity 
  } = useDashboard();

  const firstName = user?.displayName?.split(" ")[0] || "there";

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-160px)] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center animate-pulse">
          <Sparkles className="text-white" size={24} />
        </div>
        <p className="text-zinc-500 font-medium animate-pulse">Sera is preparing your day...</p>
      </div>
    );
  }

  const hasNoData = 
    attentionToday.total === 0 && 
    urgentThisWeek.total === 0 && 
    unresolvedAndWaiting.total === 0 && 
    recentActivity.length === 0;

  if (hasNoData) {
    return (
      <div className="h-[calc(100vh-160px)] flex flex-col items-center justify-center text-center space-y-8">
        <div className="w-20 h-20 bg-zinc-50 rounded-[2.5rem] flex items-center justify-center">
          <LayoutDashboard className="text-zinc-300" size={40} />
        </div>
        <div>
          <h2 className="text-3xl font-display font-bold text-zinc-900 mb-3">Welcome to Sera, {firstName}.</h2>
          <p className="text-zinc-500 max-w-sm mx-auto">
            Your dashboard is currently empty. Sera helps you offload life's administrative complexity so you can focus on what matters.
          </p>
        </div>
        <div className="flex gap-4">
          <Link to="/tasks" className="bg-zinc-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200">
            <Plus size={20} /> Add Task
          </Link>
          <Link to="/documents" className="bg-white border border-zinc-200 text-zinc-900 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-zinc-50 transition-all">
            <FileText size={20} /> Upload Document
          </Link>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-12 pb-12"
    >
      {/* Warm Greeting */}
      <section>
        <motion.h1 variants={item} className="text-4xl font-display font-bold tracking-tight text-zinc-900 mb-2">
          Good morning, {firstName}.
        </motion.h1>
        <motion.p variants={item} className="text-zinc-500 text-lg">
          Your life is handled. Here is what matters today.
        </motion.p>
      </section>

      {/* Pulse Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-12">
          {/* Attention Today */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Zap size={20} className="text-amber-500" />
              <h2 className="text-xl font-display font-bold text-zinc-900">Needs Attention Today</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {attentionToday.total === 0 ? (
                <div className="sm:col-span-2 p-8 bg-zinc-50 border border-dashed border-zinc-200 rounded-[2rem] text-center">
                  <p className="text-sm text-zinc-400 font-medium">Your agenda is clear for today. Enjoy the calm.</p>
                </div>
              ) : (
                <>
                  {attentionToday.tasks.map(t => (
                    <DashboardCard 
                      key={t.id}
                      type="task"
                      title={t.title}
                      priority={t.priority}
                      link="/tasks"
                    />
                  ))}
                  {attentionToday.appointments.map(a => (
                    <DashboardCard 
                      key={a.id}
                      type="appointment"
                      title={a.title}
                      time={format(toDate(a.date)!, 'h:mm a')}
                      link="/calendar"
                    />
                  ))}
                  {attentionToday.reminders.map(r => (
                    <DashboardCard 
                      key={r.id}
                      type="reminder"
                      title={r.title}
                      link="/tasks"
                    />
                  ))}
                </>
              )}
            </div>
          </section>

          {/* This Week's Horizon */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Calendar size={20} className="text-zinc-900" />
              <h2 className="text-xl font-display font-bold text-zinc-900">This Week's Horizon</h2>
            </div>
            <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-8 shadow-sm">
              {urgentThisWeek.total === 0 ? (
                <p className="text-sm text-zinc-400 italic">Your upcoming week is currently open.</p>
              ) : (
                <div className="space-y-4">
                  {urgentThisWeek.tasks.map(t => (
                    <HorizonItem 
                      key={t.id}
                      title={t.title}
                      date={format(toDate(t.dueDate)!, 'EEE, MMM d')}
                      type="Task"
                    />
                  ))}
                  {urgentThisWeek.appointments.map(a => (
                    <HorizonItem 
                      key={a.id}
                      title={a.title}
                      date={format(toDate(a.date)!, 'EEE, MMM d')}
                      type="Appointment"
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Unresolved & Waiting */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Clock size={20} className="text-zinc-900" />
              <h2 className="text-xl font-display font-bold text-zinc-900">Unresolved & Waiting</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {unresolvedAndWaiting.total === 0 ? (
                <div className="sm:col-span-2 p-8 bg-zinc-50 border border-dashed border-zinc-200 rounded-[2rem] text-center">
                  <p className="text-sm text-zinc-400 font-medium">Everything is currently moving forward. No items are pending on others.</p>
                </div>
              ) : (
                <>
                  {unresolvedAndWaiting.cases.map(c => (
                    <DashboardCard 
                      key={c.id}
                      type="case"
                      title={c.title}
                      status={c.status.replace(/-/g, ' ')}
                      link="/cases"
                    />
                  ))}
                  {unresolvedAndWaiting.documents.map(d => (
                    <DashboardCard 
                      key={d.id}
                      type="document"
                      title={d.name}
                      status={d.status}
                      link="/documents"
                    />
                  ))}
                </>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-12">
          {/* Sera's Intelligence */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Sparkles size={20} className="text-zinc-900" />
              <h2 className="text-xl font-display font-bold text-zinc-900">Sera's Intelligence</h2>
            </div>
            <div className="space-y-4">
              {recommendations.length === 0 ? (
                <div className="p-6 bg-zinc-50 border border-dashed border-zinc-200 rounded-3xl text-center">
                  <p className="text-xs text-zinc-400">Your intelligence feed is clear. Sera will surface insights as your household data grows.</p>
                </div>
              ) : (
                recommendations.slice(0, 3).map((rec) => (
                  <RecommendationCard 
                    key={rec.id}
                    recommendation={rec as Recommendation}
                  />
                ))
              )}
            </div>
          </section>

          {/* Recent Activity */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <History size={20} className="text-zinc-900" />
                <h2 className="text-xl font-display font-bold text-zinc-900">Household Activity</h2>
              </div>
            </div>
            <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-8 shadow-sm">
              <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-zinc-100">
                {recentActivity.length === 0 ? (
                  <p className="text-sm text-zinc-400 italic pl-8">No recent activity. Your household is currently in a state of calm.</p>
                ) : (
                  recentActivity.map((event, idx) => (
                    <TimelineItem 
                      key={event.id || idx}
                      time={event.createdAt ? format(toDate(event.createdAt)!, 'h:mm a') : 'Just now'}
                      title={event.type.replace(/_/g, ' ')}
                      description={event.description}
                      author={event.authorName}
                    />
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </motion.div>
  );
};

const DashboardCard = ({ type, title, priority, status, time, link }: any) => (
  <Link to={link} className="block group">
    <div className="bg-white border border-zinc-100 p-6 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-zinc-200/50 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white transition-colors">
          {type === 'task' && <CheckCircle2 size={18} />}
          {type === 'appointment' && <Calendar size={18} />}
          {type === 'reminder' && <Clock size={18} />}
          {type === 'case' && <Briefcase size={18} />}
          {type === 'document' && <FileText size={18} />}
        </div>
        {priority && (
          <span className={cn(
            "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full",
            priority === 'urgent' ? "bg-red-50 text-red-600" : "bg-zinc-100 text-zinc-600"
          )}>
            {priority}
          </span>
        )}
        {time && <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{time}</span>}
      </div>
      <h4 className="font-bold text-zinc-900 text-sm mb-1 line-clamp-1">{title}</h4>
      {status && <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{status}</p>}
    </div>
  </Link>
);

const HorizonItem = ({ title, date, type }: any) => (
  <div className="flex items-center justify-between py-3 border-b border-zinc-50 last:border-0">
    <div className="flex items-center gap-4">
      <div className="w-2 h-2 rounded-full bg-zinc-900" />
      <div>
        <p className="text-sm font-bold text-zinc-900">{title}</p>
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{type}</p>
      </div>
    </div>
    <span className="text-xs font-medium text-zinc-500">{date}</span>
  </div>
);

const RecommendationItem = ({ text, action, link, type }: any) => (
  <div className={cn(
    "p-6 rounded-[2rem] shadow-lg shadow-zinc-200/50 flex flex-col gap-4",
    type === 'urgent' ? "bg-zinc-900 text-white" : "bg-white border border-zinc-100 text-zinc-900"
  )}>
    <p className="text-sm font-medium leading-relaxed">{text}</p>
    <Link to={link} className={cn(
      "w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all",
      type === 'urgent' ? "bg-white text-zinc-900 hover:bg-zinc-100" : "bg-zinc-900 text-white hover:bg-zinc-800"
    )}>
      {action} <ArrowRight size={14} />
    </Link>
  </div>
);

const TimelineItem = ({ time, title, description, author }: any) => (
  <div className="relative pl-8">
    <div className="absolute left-0 top-1.5 w-[23px] h-[23px] bg-white border-2 border-zinc-100 rounded-full flex items-center justify-center">
      <div className="w-2 h-2 bg-zinc-900 rounded-full" />
    </div>
    <div className="flex items-center justify-between gap-2 mb-1">
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{time}</p>
      {author && (
        <div className="flex items-center gap-1 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
          <User size={10} /> {author}
        </div>
      )}
    </div>
    <h4 className="font-bold text-zinc-900 text-sm mb-1 uppercase tracking-tight">{title}</h4>
    <p className="text-sm text-zinc-500 leading-relaxed">{description}</p>
  </div>
);
