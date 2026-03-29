import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../app/providers/AuthProvider";
import { 
  Send, 
  Sparkles, 
  Plus, 
  Calendar, 
  FileText, 
  Briefcase, 
  ArrowRight,
  ChevronRight,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { aiPlannerService } from "../services/aiPlannerService";
import { useTasks } from "../hooks/useTasks";
import { useCases } from "../hooks/useCases";
import { useAppointments } from "../hooks/useAppointments";
import { useReminders } from "../hooks/useReminders";
import { useRecommendations } from "../hooks/useRecommendations";
import { AIActionPlan, AIAction, Recommendation } from "../types";
import { RecommendationCard } from "../components/RecommendationCard";
import { Timestamp } from "firebase/firestore";
import { addDays, parseISO } from "date-fns";
import { cn } from "../utils/cn";
import { toast } from "sonner";

interface ChatMessage {
  role: 'user' | 'sera';
  content: string;
  plan?: AIActionPlan;
  executed?: boolean;
}

export const AskSeraPage: React.FC = () => {
  const { user, household } = useAuth();
  const navigate = useNavigate();
  const { createTask } = useTasks();
  const { createCase } = useCases();
  const { createAppointment } = useAppointments();
  const { createReminder } = useReminders();
  const { recommendations } = useRecommendations();
  
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleSend = async (textOverride?: string) => {
    const text = textOverride || message;
    if (!text.trim() || isProcessing || !user || !household) return;

    setMessage("");
    setHistory(prev => [...prev, { role: 'user', content: text }]);
    setIsProcessing(true);

    try {
      const plan = await aiPlannerService.planActions(text);
      
      setHistory(prev => [...prev, { 
        role: 'sera', 
        content: plan.summary, 
        plan: plan 
      }]);
    } catch (error) {
      console.error(error);
      setHistory(prev => [...prev, { role: 'sera', content: "I'm sorry, I had trouble generating that plan. Could you try rephrasing?" }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const executePlan = async (msgIndex: number) => {
    const msg = history[msgIndex];
    if (!msg.plan || msg.executed || !user || !household) return;

    setIsProcessing(true);
    const toastId = toast.loading("Executing plan...");

    try {
      // Map to store created entity IDs for linking
      const createdIds: Record<string, string> = {};

      for (const action of msg.plan.actions) {
        if (action.action === 'create') {
          let createdId: string | null = null;

          if (action.type === 'case') {
            createdId = await createCase({
              title: action.title,
              description: action.description,
              status: "new",
              priority: action.priority,
              category: action.data.category || "other",
              metadata: action.data.metadata
            }) || null;
          } else if (action.type === 'appointment') {
            const date = action.data.date ? Timestamp.fromDate(parseISO(action.data.date)) : Timestamp.now();
            createdId = await createAppointment({
              title: action.title,
              date,
              state: "scheduled",
              type: action.data.type || "general",
              provider: action.data.provider || "TBD",
              notes: action.description,
              caseId: action.data.caseId === 'NEW_CASE' ? createdIds['case'] : action.data.caseId
            }) || null;
          } else if (action.type === 'task') {
            const dueDate = action.data.dueDate ? Timestamp.fromDate(parseISO(action.data.dueDate)) : null;
            createdId = await createTask({
              title: action.title,
              description: action.description,
              status: "pending",
              priority: action.priority,
              type: action.data.type || "other",
              dueDate: dueDate as any,
              caseId: action.data.caseId === 'NEW_CASE' ? createdIds['case'] : action.data.caseId
            }) || null;
          } else if (action.type === 'reminder') {
            const targetDate = action.data.targetDate ? Timestamp.fromDate(parseISO(action.data.targetDate)) : Timestamp.now();
            createdId = await createReminder({
              title: action.title,
              targetDate,
              type: action.data.type || "nudge",
              linkedEntityType: action.data.linkedEntityType || "task",
              linkedEntityId: action.data.linkedEntityId === 'NEW_ENTITY' ? (createdIds['task'] || createdIds['case'] || createdIds['appointment']) : action.data.linkedEntityId
            }) || null;
          }

          if (createdId) {
            createdIds[action.type] = createdId;
          }
        }
      }

      setHistory(prev => {
        const newHistory = [...prev];
        newHistory[msgIndex] = { ...newHistory[msgIndex], executed: true };
        return newHistory;
      });

      toast.success("Plan executed successfully", { id: toastId });
    } catch (error) {
      console.error("Execution failed:", error);
      toast.error("Failed to execute some actions", { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const suggestions = [
    "What is urgent this week?",
    "I need to track a reimbursement for my dental visit for $250.",
    "Schedule a checkup with Dr. Smith for next Friday at 10am.",
    "Remind me to follow up on the insurance claim in 3 days."
  ];

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col max-w-3xl mx-auto">
      <div className="flex-1 overflow-y-auto space-y-8 p-4 scroll-smooth" ref={scrollRef}>
        {history.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-8">
            <div className="w-20 h-20 bg-zinc-900 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-zinc-200 rotate-3">
              <Sparkles className="text-white" size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-display font-bold text-zinc-900 mb-3">How can I help you today?</h2>
              <p className="text-zinc-500 max-w-sm mx-auto">
                Ask me to organize a complex claim, schedule a follow-up, or summarize your household's upcoming week. I'm here to offload the mental burden of life's administration.
              </p>
            </div>
            <div className="w-full max-w-md space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {suggestions.map((s) => (
                  <button 
                    key={s}
                    onClick={() => handleSend(s)}
                    className="text-left p-4 bg-white border border-zinc-100 rounded-2xl text-sm font-medium text-zinc-600 hover:border-zinc-900 hover:text-zinc-900 transition-all shadow-sm"
                  >
                    {s}
                  </button>
                ))}
              </div>

              {recommendations.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    <Zap size={12} className="text-amber-500" /> Sera's Insights
                  </div>
                  <div className="space-y-3">
                    {recommendations.slice(0, 2).map((rec) => (
                      <RecommendationCard 
                        key={rec.id}
                        recommendation={rec as Recommendation}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          history.map((msg, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex flex-col",
                msg.role === 'user' ? "items-end" : "items-start"
              )}
            >
              <div className={cn(
                "max-w-[90%] p-6 rounded-[2.5rem]",
                msg.role === 'user' 
                  ? "bg-zinc-900 text-white rounded-tr-none" 
                  : "bg-white border border-zinc-100 text-zinc-900 rounded-tl-none shadow-sm"
              )}>
                <p className="text-sm leading-relaxed">{msg.content}</p>
                
                {msg.plan && (
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">
                      <Zap size={12} className="text-amber-500" /> Sera's Proposed Plan
                    </div>
                    
                    <div className="space-y-3">
                      {msg.plan.actions.map((action, idx) => (
                        <div key={idx} className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-white rounded-lg border border-zinc-100">
                                {action.type === 'task' && <CheckCircle2 size={14} className="text-zinc-400" />}
                                {action.type === 'case' && <Briefcase size={14} className="text-zinc-400" />}
                                {action.type === 'appointment' && <Calendar size={14} className="text-zinc-400" />}
                                {action.type === 'document' && <FileText size={14} className="text-zinc-400" />}
                              </div>
                              <span className="text-xs font-bold text-zinc-900">{action.title}</span>
                            </div>
                            <span className={cn(
                              "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                              action.priority === 'urgent' ? "bg-red-100 text-red-600" :
                              action.priority === 'high' ? "bg-amber-100 text-amber-600" :
                              "bg-zinc-100 text-zinc-600"
                            )}>
                              {action.priority}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500 mb-2">{action.description}</p>
                          <p className="text-[10px] italic text-zinc-400">Reasoning: {action.reasoning}</p>
                        </div>
                      ))}
                    </div>

                    {!msg.executed ? (
                      <button 
                        onClick={() => executePlan(i)}
                        disabled={isProcessing}
                        className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold text-sm hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 mt-4"
                      >
                        Apply Plan <ArrowRight size={18} />
                      </button>
                    ) : (
                      <div className="w-full bg-emerald-50 text-emerald-600 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 mt-4">
                        <CheckCircle2 size={18} /> Plan Applied
                      </div>
                    )}

                    {msg.plan.suggestedQuestions.length > 0 && (
                      <div className="pt-4 flex flex-wrap gap-2">
                        {msg.plan.suggestedQuestions.map((q, idx) => (
                          <button 
                            key={idx}
                            onClick={() => handleSend(q)}
                            className="text-[10px] font-medium text-zinc-500 hover:text-zinc-900 bg-zinc-50 px-3 py-1.5 rounded-full border border-zinc-100 transition-all"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
        {isProcessing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-zinc-400">
            <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" />
            <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.2s]" />
            <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.4s]" />
          </motion.div>
        )}
      </div>

      {/* Input Bar */}
      <div className="pt-8">
        <div className="bg-white border border-zinc-200 rounded-[2.5rem] shadow-2xl shadow-zinc-200 p-2 flex items-center gap-2 focus-within:ring-4 focus-within:ring-zinc-900/5 transition-all">
          <button className="p-3 text-zinc-400 hover:text-zinc-900 transition-colors">
            <Plus size={24} />
          </button>
          <input 
            type="text" 
            placeholder="Ask Sera anything..." 
            className="flex-1 bg-transparent border-none focus:ring-0 text-base py-3 px-2"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isProcessing}
          />
          <button 
            onClick={() => handleSend()}
            disabled={!message.trim() || isProcessing}
            className="bg-zinc-900 text-white p-3 rounded-2xl hover:bg-zinc-800 disabled:opacity-50 disabled:pointer-events-none transition-all"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

// Removed local cn function as it's now imported from ../lib/utils
