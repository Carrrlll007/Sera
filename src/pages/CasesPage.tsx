import React, { useState, useEffect } from "react";
import { useAuth } from "../providers/AuthProvider";
import { caseService } from "../services/caseService";
import { Case, CaseStatus } from "../types";
import { 
  Briefcase, 
  Plus, 
  Search, 
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  MessageSquare,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

export const CasesPage: React.FC = () => {
  const { household } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);

  useEffect(() => {
    if (!household) return;
    return caseService.subscribeToHouseholdCases(household.id, setCases);
  }, [household]);

  const statusMap: Record<CaseStatus, { label: string, color: string, icon: any }> = {
    "new": { label: "New", color: "bg-blue-50 text-blue-600", icon: <Sparkles size={14} /> },
    "in-progress": { label: "In Progress", color: "bg-zinc-100 text-zinc-600", icon: <Clock size={14} /> },
    "waiting-on-document": { label: "Waiting on Document", color: "bg-amber-50 text-amber-600", icon: <FileText size={14} /> },
    "waiting-on-response": { label: "Waiting on Response", color: "bg-amber-50 text-amber-600", icon: <MessageSquare size={14} /> },
    "ready-to-submit": { label: "Ready to Submit", color: "bg-green-50 text-green-600", icon: <CheckCircle2 size={14} /> },
    "submitted": { label: "Submitted", color: "bg-green-100 text-green-700", icon: <CheckCircle2 size={14} /> },
    "resolved": { label: "Resolved", color: "bg-zinc-900 text-white", icon: <CheckCircle2 size={14} /> },
    "escalated": { label: "Escalated", color: "bg-red-50 text-red-600", icon: <AlertCircle size={14} /> }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-zinc-900 mb-2">Cases</h1>
          <p className="text-zinc-500">Manage multi-step life situations like claims and applications.</p>
        </div>
        <button className="bg-zinc-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200">
          <Plus size={20} />
          New Case
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Case List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="text" 
              placeholder="Search cases..." 
              className="w-full bg-white border border-zinc-100 rounded-2xl py-3 pl-12 pr-4 text-sm shadow-sm focus:ring-2 focus:ring-zinc-900/5 transition-all"
            />
          </div>

          {cases.length === 0 ? (
            <div className="bg-white border border-dashed border-zinc-200 rounded-[2.5rem] p-20 text-center">
              <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Briefcase className="text-zinc-300" size={32} />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">No active cases</h3>
              <p className="text-zinc-500 max-w-xs mx-auto">
                Sera helps you track complex processes like insurance claims, refunds, or school applications.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {cases.map((c) => (
                <CaseRow 
                  key={c.id} 
                  caseData={c} 
                  statusInfo={statusMap[c.status]}
                  active={selectedCase?.id === c.id}
                  onClick={() => setSelectedCase(c)} 
                />
              ))}
            </div>
          )}
        </div>

        {/* Case Detail Sidebar */}
        <div className="lg:col-span-1">
          <AnimatePresence mode="wait">
            {selectedCase ? (
              <motion.div
                key={selectedCase.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white border border-zinc-100 rounded-[2.5rem] p-8 shadow-sm sticky top-28"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5", statusMap[selectedCase.status].color)}>
                    {statusMap[selectedCase.status].icon}
                    {statusMap[selectedCase.status].label}
                  </div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Priority: {selectedCase.priority}</span>
                </div>

                <h3 className="text-2xl font-display font-bold text-zinc-900 mb-2">{selectedCase.title}</h3>
                <p className="text-sm text-zinc-500 mb-8">{selectedCase.description}</p>

                <div className="space-y-8">
                  {/* Timeline */}
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">Case Timeline</h4>
                    <div className="space-y-6 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-zinc-100">
                      <TimelineStep 
                        active
                        title="Waiting on document"
                        description="Sera detected a missing medical referral for this claim."
                        time="2 days ago"
                      />
                      <TimelineStep 
                        title="Case created"
                        description="Initial claim details extracted from uploaded bill."
                        time="5 days ago"
                      />
                    </div>
                  </div>

                  {/* Next Action */}
                  <div className="p-6 bg-zinc-900 text-white rounded-[2rem] shadow-xl shadow-zinc-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles size={16} className="text-zinc-400" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Sera's Recommendation</span>
                    </div>
                    <p className="text-sm font-medium mb-6 leading-relaxed">
                      This case has been waiting 10 days. Would you like me to send a follow-up email to the provider?
                    </p>
                    <button className="w-full bg-white text-zinc-900 py-3 rounded-xl font-bold text-xs hover:bg-zinc-100 transition-all flex items-center justify-center gap-2">
                      Send Follow-up <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-zinc-50/50 border border-dashed border-zinc-200 rounded-[2.5rem] p-12 text-center h-[400px] flex flex-col items-center justify-center">
                <Briefcase className="text-zinc-300 mb-4" size={32} />
                <p className="text-sm text-zinc-400 font-medium">Select a case to view its timeline and next actions.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const CaseRow = ({ caseData, statusInfo, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={cn(
      "w-full text-left p-6 rounded-[2rem] border transition-all duration-300 flex items-center gap-6 group",
      active 
        ? "bg-white border-zinc-900 shadow-xl shadow-zinc-200" 
        : "bg-white border-zinc-100 hover:border-zinc-300 shadow-sm"
    )}
  >
    <div className={cn(
      "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors",
      active ? "bg-zinc-900 text-white" : "bg-zinc-50 text-zinc-400 group-hover:bg-zinc-100"
    )}>
      <Briefcase size={24} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-3 mb-1">
        <h4 className="font-bold text-zinc-900 truncate">{caseData.title}</h4>
        <div className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest", statusInfo.color)}>
          {statusInfo.label}
        </div>
      </div>
      <p className="text-xs text-zinc-500 truncate">{caseData.description}</p>
    </div>
    <ChevronRight size={18} className={cn("transition-transform", active ? "text-zinc-900 translate-x-1" : "text-zinc-300")} />
  </button>
);

const TimelineStep = ({ active, title, description, time }: any) => (
  <div className="relative pl-6">
    <div className={cn(
      "absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 bg-white",
      active ? "border-zinc-900" : "border-zinc-200"
    )} />
    <h5 className={cn("text-sm font-bold mb-0.5", active ? "text-zinc-900" : "text-zinc-400")}>{title}</h5>
    <p className="text-xs text-zinc-500 mb-1">{description}</p>
    <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">{time}</p>
  </div>
);

const Sparkles = ({ size, className }: any) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
  </svg>
);

function cn(...inputs: any[]) {
  const { clsx } = require("clsx");
  const { twMerge } = require("tailwind-merge");
  return twMerge(clsx(inputs));
}
