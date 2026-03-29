import React from "react";
import { 
  Sparkles, 
  AlertCircle, 
  Clock, 
  FileText, 
  Briefcase, 
  Calendar,
  ArrowRight,
  Info
} from "lucide-react";
import { Recommendation } from "../types";
import { useNavigate } from "react-router-dom";
import { cn } from "../utils/cn";

interface RecommendationCardProps {
  recommendation: Recommendation;
  className?: string;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({ 
  recommendation,
  className 
}) => {
  const navigate = useNavigate();

  const getIcon = () => {
    switch (recommendation.type) {
      case "stale_case": return <Clock className="text-amber-500" size={18} />;
      case "missing_document": return <FileText className="text-blue-500" size={18} />;
      case "appointment_prep": return <Calendar className="text-purple-500" size={18} />;
      case "urgent_deadline": return <AlertCircle className="text-red-500" size={18} />;
      case "follow_up_needed": return <Briefcase className="text-emerald-500" size={18} />;
      default: return <Sparkles className="text-zinc-400" size={18} />;
    }
  };

  const getPriorityColor = () => {
    switch (recommendation.priority) {
      case "critical": return "bg-red-50 text-red-700 border-red-100";
      case "high": return "bg-amber-50 text-amber-700 border-amber-100";
      case "medium": return "bg-blue-50 text-blue-700 border-blue-100";
      case "low": return "bg-zinc-50 text-zinc-700 border-zinc-100";
      default: return "bg-zinc-50 text-zinc-700 border-zinc-100";
    }
  };

  return (
    <div className={cn(
      "group relative bg-white border border-zinc-100 rounded-[2rem] p-6 hover:border-zinc-900 transition-all shadow-sm hover:shadow-xl hover:shadow-zinc-200/50",
      className
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-zinc-50 rounded-2xl group-hover:bg-zinc-900 group-hover:text-white transition-colors">
            {getIcon()}
          </div>
          <div>
            <div className={cn(
              "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border mb-1 inline-block",
              getPriorityColor()
            )}>
              {recommendation.priority}
            </div>
            <h3 className="text-sm font-bold text-zinc-900 leading-tight">
              {recommendation.title}
            </h3>
          </div>
        </div>
      </div>

      <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
        {recommendation.description}
      </p>

      {recommendation.reasoning && (
        <div className="flex items-start gap-2 p-3 bg-zinc-50 rounded-xl mb-4">
          <Info size={12} className="text-zinc-400 mt-0.5 shrink-0" />
          <p className="text-[10px] text-zinc-500 italic leading-snug">
            {recommendation.reasoning}
          </p>
        </div>
      )}

      <button 
        onClick={() => navigate(recommendation.actionRoute)}
        className="w-full bg-zinc-900 text-white py-3 rounded-xl font-bold text-xs hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
      >
        {recommendation.actionLabel} <ArrowRight size={14} />
      </button>
    </div>
  );
};
