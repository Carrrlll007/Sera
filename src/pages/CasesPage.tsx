import React, { useState, useEffect } from "react";
import { useCases } from "../hooks/useCases";
import { useRecommendations } from "../hooks/useRecommendations";
import { Case, CaseStatus, TimelineEvent, Recommendation } from "../types";
import { RecommendationCard } from "../components/RecommendationCard";
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
  ArrowRight,
  Shield,
  Send,
  User,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { cn } from "../utils/cn";
import { VALID_CASE_TRANSITIONS } from "../constants/caseTransitions";

import { CaseModal } from "../components/CaseModal";

export const CasesPage: React.FC = () => {
  const { cases, subscribeToCaseTimeline, updateCaseStatus, addCaseNote } = useCases();
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const { recommendations: caseRecommendations } = useRecommendations(
    selectedCase ? { entityId: selectedCase.id, entityType: "case" } : undefined
  );
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [note, setNote] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  useEffect(() => {
    if (!selectedCase?.id) {
      setTimeline([]);
      return;
    }
    return subscribeToCaseTimeline(selectedCase.id, setTimeline);
  }, [selectedCase?.id, subscribeToCaseTimeline]);

  // Keep selected case in sync with the list
  useEffect(() => {
    if (selectedCase) {
      const updated = cases.find(c => c.id === selectedCase.id);
      if (updated) setSelectedCase(updated);
    }
  }, [cases, selectedCase?.id]);

  const handleAddNote = async () => {
    if (!selectedCase || !note.trim() || isSubmittingNote) return;
    setIsSubmittingNote(true);
    try {
      await addCaseNote(selectedCase.id, note);
      setNote("");
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const statusMap: Record<CaseStatus, { label: string, color: string, icon: any }> = {
    "new": { label: "New", color: "bg-blue-50 text-blue-600", icon: <Zap size={14} /> },
    "active": { label: "Active", color: "bg-zinc-100 text-zinc-600", icon: <Clock size={14} /> },
    "waiting-on-document": { label: "Waiting on Document", color: "bg-amber-50 text-amber-600", icon: <FileText size={14} /> },
    "waiting-on-response": { label: "Waiting on Response", color: "bg-amber-50 text-amber-600", icon: <MessageSquare size={14} /> },
    "ready-to-submit": { label: "Ready to Submit", color: "bg-green-50 text-green-600", icon: <CheckCircle2 size={14} /> },
    "submitted": { label: "Submitted", color: "bg-green-100 text-green-700", icon: <CheckCircle2 size={14} /> },
    "resolved": { label: "Resolved", color: "bg-zinc-900 text-white", icon: <CheckCircle2 size={14} /> },
    "archived": { label: "Archived", color: "bg-zinc-100 text-zinc-400", icon: <Shield size={14} /> }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-zinc-900 mb-2">Cases</h1>
          <p className="text-zinc-500">Manage multi-step life situations like claims and applications.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-zinc-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200"
        >
          <Plus size={20} />
          New Case
        </button>
      </div>

      <CaseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

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
                Sera helps you manage multi-step life situations like insurance claims, medical follow-ups, or school applications. Start a case to offload the complexity.
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
                className="bg-white border border-zinc-100 rounded-[2.5rem] p-8 shadow-sm sticky top-28 max-h-[calc(100vh-120px)] overflow-y-auto"
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
                  {/* Status Transitions */}
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">Update Status</h4>
                    <div className="flex flex-wrap gap-2">
                      {VALID_CASE_TRANSITIONS[selectedCase.status].map((nextStatus) => (
                        <button
                          key={nextStatus}
                          onClick={() => updateCaseStatus(selectedCase.id, nextStatus)}
                          className={cn(
                            "px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border",
                            statusMap[nextStatus].color,
                            "border-transparent hover:border-zinc-900"
                          )}
                        >
                          {statusMap[nextStatus].label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Next Action / Recommendations */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Sera's Intelligence</h4>
                    {caseRecommendations.length === 0 ? (
                      <div className="p-6 bg-zinc-50 border border-dashed border-zinc-200 rounded-[2rem] text-center">
                        <p className="text-xs text-zinc-400">No specific recommendations for this case.</p>
                      </div>
                    ) : (
                      caseRecommendations.map((rec) => (
                        <RecommendationCard 
                          key={rec.id}
                          recommendation={rec as Recommendation}
                        />
                      ))
                    )}
                  </div>

                  {/* Communication Log / Notes */}
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">Notes & Log</h4>
                    <div className="flex gap-2 mb-4">
                      <input 
                        type="text" 
                        placeholder="Add a note..." 
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                        className="flex-1 bg-zinc-50 border-none rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-zinc-900/5"
                      />
                      <button 
                        onClick={handleAddNote}
                        disabled={!note.trim() || isSubmittingNote}
                        className="p-2 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 disabled:opacity-50"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">Case Timeline</h4>
                    <div className="space-y-6 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-zinc-100">
                      {timeline.length === 0 ? (
                        <p className="text-xs text-zinc-400 italic pl-6">No events recorded yet.</p>
                      ) : (
                        timeline.map((event, idx) => (
                          <TimelineStep 
                            key={event.id || idx}
                            active={idx === 0}
                            title={event.type.replace(/_/g, ' ')}
                            description={event.description}
                            author={event.authorName}
                            time={event.createdAt ? format(event.createdAt.toDate(), 'MMM d, h:mm a') : 'Just now'}
                          />
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-zinc-50/50 border border-dashed border-zinc-200 rounded-[2.5rem] p-12 text-center h-[400px] flex flex-col items-center justify-center">
                <Briefcase className="text-zinc-300 mb-4" size={32} />
                <p className="text-sm text-zinc-400 font-medium">Select a case to view its progress, intelligence, and next actions.</p>
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

const TimelineStep = ({ active, title, description, author, time }: any) => (
  <div className="relative pl-6">
    <div className={cn(
      "absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 bg-white",
      active ? "border-zinc-900" : "border-zinc-200"
    )} />
    <div className="flex items-center justify-between gap-2 mb-0.5">
      <h5 className={cn("text-[10px] font-bold uppercase tracking-widest", active ? "text-zinc-900" : "text-zinc-400")}>{title}</h5>
      <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">{time}</span>
    </div>
    <p className="text-xs text-zinc-500 mb-1 leading-relaxed">{description}</p>
    {author && (
      <div className="flex items-center gap-1 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
        <User size={10} /> {author}
      </div>
    )}
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

// Removed local cn function as it's now imported from ../lib/utils
