import React, { useState, useEffect } from "react";
import { useAuth } from "../app/providers/AuthProvider";
import { useDocuments } from "../hooks/useDocuments";
import { householdService } from "../services/householdService";
import { Document, HouseholdMember } from "../types";
import { 
  FileText, 
  Search, 
  Filter, 
  MoreVertical, 
  ChevronRight,
  Clock,
  User,
  AlertCircle,
  Trash2,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { toDate } from "../utils/dateUtils";
import { cn } from "../utils/cn";
import { DocumentUpload } from "../components/DocumentUpload";

export const DocumentsPage: React.FC = () => {
  const { household, user } = useAuth();
  const { documents, deleteDocument, isLoading } = useDocuments();
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  useEffect(() => {
    if (!household) return;
    return householdService.subscribeToHouseholdMembers(household.id, setMembers);
  }, [household]);

  const getMemberName = (uid: string) => {
    const member = members.find(m => m.uid === uid);
    return member?.displayName || "Household Shared";
  };

  const handleDelete = async (doc: Document) => {
    if (window.confirm("Are you sure you want to delete this document? This cannot be undone.")) {
      await deleteDocument(doc.id, doc.storagePath);
      if (selectedDoc?.id === doc.id) setSelectedDoc(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-zinc-900 mb-2">Documents</h1>
          <p className="text-zinc-500">Upload letters, forms, or bills. Sera will organize them.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Document List */}
        <div className="lg:col-span-2 space-y-6">
          <DocumentUpload />

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="text" 
              placeholder="Search documents..." 
              className="w-full bg-white border border-zinc-100 rounded-2xl py-3 pl-12 pr-4 text-sm shadow-sm focus:ring-2 focus:ring-zinc-900/5 transition-all"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center p-20">
              <div className="w-8 h-8 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : documents.length === 0 ? (
            <div className="bg-white border border-dashed border-zinc-200 rounded-[2.5rem] p-20 text-center">
              <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FileText className="text-zinc-300" size={32} />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">Your digital filing cabinet is empty</h3>
              <p className="text-zinc-500 max-w-xs mx-auto mb-8">
                Upload letters, bills, or forms. Centralizing your documents ensures you never lose a critical piece of information.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {documents.map((doc) => (
                <DocumentCard 
                  key={doc.id} 
                  doc={doc} 
                  active={selectedDoc?.id === doc.id}
                  onClick={() => setSelectedDoc(doc)} 
                />
              ))}
            </div>
          )}
        </div>

        {/* Document Detail Sidebar */}
        <div className="lg:col-span-1">
          <AnimatePresence mode="wait">
            {selectedDoc ? (
              <motion.div
                key={selectedDoc.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white border border-zinc-100 rounded-[2.5rem] p-8 shadow-sm sticky top-28"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center">
                    <FileText className="text-zinc-900" size={24} />
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleDelete(selectedDoc)}
                      className="p-2 text-zinc-300 hover:text-red-500 transition-colors"
                      title="Delete document"
                    >
                      <Trash2 size={20} />
                    </button>
                    <button className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors">
                      <MoreVertical size={20} />
                    </button>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-zinc-900 mb-2">{selectedDoc.name}</h3>
                <p className="text-sm text-zinc-500 mb-8">Uploaded {format(toDate(selectedDoc.createdAt)!, 'MMM d, yyyy')}</p>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">Sera's Summary</h4>
                    <p className="text-sm text-zinc-600 leading-relaxed bg-zinc-50 p-4 rounded-2xl">
                      {selectedDoc.metadata?.summary || "Processing document details..."}
                    </p>
                  </div>

                  {selectedDoc.metadata?.nextAction && (
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">Recommended Next Action</h4>
                      <div className="flex items-center gap-3 p-4 bg-zinc-900 text-white rounded-2xl">
                        <AlertCircle size={18} className="text-amber-400 shrink-0" />
                        <p className="text-xs font-medium">{selectedDoc.metadata.nextAction}</p>
                      </div>
                    </div>
                  )}

                  <div className="pt-6 border-t border-zinc-100 space-y-4">
                    <DetailItem icon={<User size={14} />} label="Person" value={getMemberName(selectedDoc.authorId)} />
                    <DetailItem icon={<Clock size={14} />} label="Deadlines" value={selectedDoc.metadata?.detectedDates?.[0] || "None detected"} />
                  </div>

                  <a 
                    href={selectedDoc.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full bg-zinc-100 text-zinc-900 py-4 rounded-2xl font-bold text-sm hover:bg-zinc-200 transition-all mt-4 flex items-center justify-center gap-2"
                  >
                    View Full Document <ExternalLink size={16} />
                  </a>
                </div>
              </motion.div>
            ) : (
              <div className="bg-zinc-50/50 border border-dashed border-zinc-200 rounded-[2.5rem] p-12 text-center h-[400px] flex flex-col items-center justify-center">
                <FileText className="text-zinc-300 mb-4" size={32} />
                <p className="text-sm text-zinc-400 font-medium">Select a document to view details and recommendations.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const DocumentCard = ({ doc, onClick, active }: any) => (
  <button 
    onClick={onClick}
    className={cn(
      "w-full text-left p-6 rounded-[2rem] border transition-all duration-300 group",
      active 
        ? "bg-white border-zinc-900 shadow-xl shadow-zinc-200" 
        : "bg-white border-zinc-100 hover:border-zinc-300 shadow-sm"
    )}
  >
    <div className="flex items-center justify-between mb-6">
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
        active ? "bg-zinc-900 text-white" : "bg-zinc-50 text-zinc-400 group-hover:bg-zinc-100"
      )}>
        <FileText size={20} />
      </div>
      <ChevronRight size={16} className={cn("transition-transform", active ? "text-zinc-900 translate-x-1" : "text-zinc-300")} />
    </div>
    <h4 className="font-bold text-zinc-900 mb-1 truncate">{doc.name}</h4>
    <p className="text-xs text-zinc-500">{format(toDate(doc.createdAt)!, 'MMM d, yyyy')}</p>
  </button>
);

const DetailItem = ({ icon, label, value }: any) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2 text-zinc-400">
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </div>
    <span className="text-xs font-bold text-zinc-900">{value}</span>
  </div>
);

// Removed local cn function as it's now imported from ../lib/utils
