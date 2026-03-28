import React, { useState, useEffect } from "react";
import { useAuth } from "../providers/AuthProvider";
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
  CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { taskService } from "../services/taskService";
import { caseService } from "../services/caseService";
import { Task, Case } from "../types";

export const HomePage: React.FC = () => {
  const { user, household } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!household) return;
    
    const unsubTasks = taskService.subscribeToHouseholdTasks(household.id, (data) => {
      setTasks(data);
      setLoading(false);
    });
    
    const unsubCases = caseService.subscribeToHouseholdCases(household.id, setCases);

    return () => {
      unsubTasks();
      unsubCases();
    };
  }, [household]);

  const firstName = user?.displayName?.split(" ")[0] || "there";
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const urgentTasks = pendingTasks.filter(t => t.priority === 'urgent' || t.priority === 'high');
  const activeCases = cases.filter(c => c.status !== 'resolved');

  const recommendations = [
    ...(activeCases.length > 0 ? [{
      text: `The case "${activeCases[0].title}" has been active for a while. Should I send a follow-up?`,
      action: "Follow-up",
      link: "/cases"
    }] : []),
    ...(pendingTasks.length > 5 ? [{
      text: "You have several pending tasks. Would you like me to prioritize them for you?",
      action: "Prioritize",
      link: "/tasks"
    }] : []),
    {
      text: "Upload your latest medical bill or insurance letter to keep your records updated.",
      action: "Upload",
      link: "/documents"
    }
  ];

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

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-12"
    >
      {/* Warm Greeting */}
      <section>
        <motion.h1 variants={item} className="text-4xl font-display font-bold tracking-tight text-zinc-900 mb-2">
          Good morning, {firstName}.
        </motion.h1>
        <motion.p variants={item} className="text-zinc-500 text-lg">
          {loading ? "Sera is preparing your day..." : "Your life is handled. Here is what matters today."}
        </motion.p>
      </section>

      {/* Priority Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <PriorityCard 
          variants={item}
          title="Urgent Tasks"
          description={urgentTasks.length > 0 
            ? `You have ${urgentTasks.length} high-priority items needing attention.`
            : "No urgent tasks at the moment. Enjoy the calm."}
          icon={<AlertCircle className={urgentTasks.length > 0 ? "text-red-500" : "text-zinc-300"} />}
          action="View Tasks"
          link="/tasks"
        />
        <PriorityCard 
          variants={item}
          title="Active Cases"
          description={activeCases.length > 0 
            ? `Tracking ${activeCases.length} ongoing processes for your household.`
            : "No active cases being tracked right now."}
          icon={<Briefcase className={activeCases.length > 0 ? "text-blue-500" : "text-zinc-300"} />}
          action="View Cases"
          link="/cases"
        />
        <PriorityCard 
          variants={item}
          title="Pending Tasks"
          description={`Total of ${pendingTasks.length} responsibilities across all categories.`}
          icon={<CheckCircle2 className="text-zinc-900" />}
          action="Manage Tasks"
          link="/tasks"
        />
      </div>

      {/* Recommendations */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <Sparkles size={20} className="text-zinc-900" />
          <h2 className="text-xl font-display font-bold text-zinc-900">Sera Recommends</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.slice(0, 2).map((rec, i) => (
            <RecommendationItem 
              key={i}
              variants={item}
              text={rec.text}
              action={rec.action}
              link={rec.link}
            />
          ))}
        </div>
      </section>

      {/* Recent Progress */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display font-bold text-zinc-900">Recent Progress</h2>
          <button className="text-sm font-bold text-zinc-500 hover:text-zinc-900 transition-colors flex items-center gap-1">
            View Timeline <ChevronRight size={16} />
          </button>
        </div>
        <div className="bg-white border border-zinc-100 rounded-3xl p-8 shadow-sm">
          <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-zinc-100">
            <TimelineItem 
              time="2 hours ago"
              title="Document processed"
              description="Medical bill for January was extracted and linked to Health Case."
            />
            <TimelineItem 
              time="Yesterday"
              title="Appointment scheduled"
              description="Annual checkup with Dr. Smith confirmed for April 12th."
            />
          </div>
        </div>
      </section>
    </motion.div>
  );
};

const PriorityCard = ({ title, description, icon, action, variants, link }: any) => (
  <motion.div 
    variants={variants}
    className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:shadow-zinc-200/50 transition-all duration-300 group"
  >
    <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
      {icon}
    </div>
    <h3 className="font-bold text-zinc-900 mb-2">{title}</h3>
    <p className="text-sm text-zinc-500 leading-relaxed mb-6">{description}</p>
    <Link to={link || "/"} className="text-sm font-bold text-zinc-900 flex items-center gap-2 group-hover:gap-3 transition-all">
      {action} <ArrowRight size={16} />
    </Link>
  </motion.div>
);

const RecommendationItem = ({ text, action, variants, link }: any) => (
  <motion.div 
    variants={variants}
    className="flex items-center justify-between p-5 bg-zinc-900 text-white rounded-2xl shadow-lg shadow-zinc-200"
  >
    <p className="text-sm font-medium text-zinc-300 max-w-[70%]">{text}</p>
    <Link to={link || "/"} className="text-xs font-bold bg-white text-zinc-900 px-4 py-2 rounded-xl hover:bg-zinc-100 transition-colors">
      {action}
    </Link>
  </motion.div>
);

const TimelineItem = ({ time, title, description }: any) => (
  <div className="relative pl-8">
    <div className="absolute left-0 top-1.5 w-[23px] h-[23px] bg-white border-2 border-zinc-100 rounded-full flex items-center justify-center">
      <div className="w-2 h-2 bg-zinc-900 rounded-full" />
    </div>
    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">{time}</p>
    <h4 className="font-bold text-zinc-900 text-sm mb-1">{title}</h4>
    <p className="text-sm text-zinc-500">{description}</p>
  </div>
);
