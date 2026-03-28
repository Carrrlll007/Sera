import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../providers/AuthProvider";
import { 
  Send, 
  Sparkles, 
  Plus, 
  Calendar, 
  FileText, 
  Briefcase, 
  ArrowRight,
  ChevronRight,
  Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { parseUserIntent } from "../lib/gemini";
import { taskService } from "../services/taskService";
import { caseService } from "../services/caseService";
import { serverTimestamp } from "firebase/firestore";

export const AskSeraPage: React.FC = () => {
  const { user, household } = useAuth();
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<{ role: 'user' | 'sera', content: string, action?: any }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleSend = async () => {
    if (!message.trim() || isProcessing || !user || !household) return;

    const userMsg = message;
    setMessage("");
    setHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsProcessing(true);

    try {
      const intent = await parseUserIntent(userMsg);
      
      let seraResponse = "";
      let action = null;

      if (userMsg.toLowerCase().includes("reimbursement") || userMsg.toLowerCase().includes("claim") || userMsg.toLowerCase().includes("track")) {
        const caseId = await caseService.createCase({
          title: intent.title,
          description: intent.description,
          status: "new",
          priority: intent.priority,
          householdId: household.id,
          authorId: user.uid,
          category: "reimbursement"
        });
        seraResponse = `I've created a new reimbursement case for you: **${intent.title}**. I'll track the progress and let you know if any documents are missing.`;
        action = { type: 'case', id: caseId, label: 'View Case' };
      } else {
        const taskId = await taskService.createTask({
          ...intent,
          householdId: household.id,
          authorId: user.uid
        });
        seraResponse = `Understood. I've added **${intent.title}** to your tasks. Would you like me to set a specific reminder for this?`;
        action = { type: 'task', id: taskId, label: 'View Task' };
      }

      setHistory(prev => [...prev, { role: 'sera', content: seraResponse, action }]);
    } catch (error) {
      setHistory(prev => [...prev, { role: 'sera', content: "I'm sorry, I had trouble processing that. Could you try rephrasing?" }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const suggestions = [
    "What is urgent this week?",
    "Reschedule my dentist appointment.",
    "Track this reimbursement claim.",
    "Show everything pending for my father."
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
                I'm your life-admin command center. Ask me to track claims, book appointments, or organize your family's schedule.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
              {suggestions.map((s) => (
                <button 
                  key={s}
                  onClick={() => setMessage(s)}
                  className="text-left p-4 bg-white border border-zinc-100 rounded-2xl text-sm font-medium text-zinc-600 hover:border-zinc-900 hover:text-zinc-900 transition-all shadow-sm"
                >
                  {s}
                </button>
              ))}
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
                "max-w-[85%] p-5 rounded-[2rem]",
                msg.role === 'user' 
                  ? "bg-zinc-900 text-white rounded-tr-none" 
                  : "bg-white border border-zinc-100 text-zinc-900 rounded-tl-none shadow-sm"
              )}>
                <p className="text-sm leading-relaxed">{msg.content}</p>
                {msg.action && (
                  <button className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-900 transition-colors">
                    {msg.action.label} <ChevronRight size={14} />
                  </button>
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
        <div className="bg-white border border-zinc-200 rounded-[2rem] shadow-2xl shadow-zinc-200 p-2 flex items-center gap-2 focus-within:ring-4 focus-within:ring-zinc-900/5 transition-all">
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
            onClick={handleSend}
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

function cn(...inputs: any[]) {
  const { clsx } = require("clsx");
  const { twMerge } = require("tailwind-merge");
  return twMerge(clsx(inputs));
}
