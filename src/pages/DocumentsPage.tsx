import React, { useState, useEffect } from "react";
import { useAuth } from "../providers/AuthProvider";
import { documentService } from "../services/documentService";
import { Document } from "../types";
import { 
  FileText, 
  Upload, 
  Search, 
  Filter, 
  MoreVertical, 
  ChevronRight,
  Clock,
  User,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { extractDocumentData } from "../lib/gemini";
import { taskService } from "../services/taskService";

export const DocumentsPage: React.FC = () => {
  const { household, user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  useEffect(() => {
    if (!household) return;
    return documentService.subscribeToHouseholdDocuments(household.id, setDocuments);
  }, [household]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !household) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const data = await extractDocumentData(base64, file.type);
        
        const docId = await documentService.createDocument({
          name: file.name,
          type: file.type,
          url: "https://picsum.photos/seed/doc/400/600", // Placeholder
          householdId: household.id,
          authorId: user.uid,
          metadata: data
        });

        if (data.deadlines?.length > 0) {
          await taskService.createTask({
            title: `Review: ${file.name}`,
            description: data.summary || `Extracted from ${file.name}`,
            type: "document",
            priority: "medium",
            dueDate: data.deadlines[0], // Simplified
            householdId: household.id,
            authorId: user.uid,
            documentId: docId
          });
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-zinc-900 mb-2">Documents</h1>
          <p className="text-zinc-500">Upload letters, forms, or bills. Sera will organize them.</p>
        </div>
        <label className="cursor-pointer">
          <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
          <div className="bg-zinc-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200">
            {isUploading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Upload size={20} />}
            Upload Document
          </div>
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Document List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="text" 
              placeholder="Search documents..." 
              className="w-full bg-white border border-zinc-100 rounded-2xl py-3 pl-12 pr-4 text-sm shadow-sm focus:ring-2 focus:ring-zinc-900/5 transition-all"
            />
          </div>

          {documents.length === 0 ? (
            <div className="bg-white border border-dashed border-zinc-200 rounded-[2.5rem] p-20 text-center">
              <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FileText className="text-zinc-300" size={32} />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">No documents yet</h3>
              <p className="text-zinc-500 max-w-xs mx-auto mb-8">
                Upload letters, forms, bills, or confirmations. Sera will organize them and help you act on what matters.
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
                  <button className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors">
                    <MoreVertical size={20} />
                  </button>
                </div>

                <h3 className="text-xl font-bold text-zinc-900 mb-2">{selectedDoc.name}</h3>
                <p className="text-sm text-zinc-500 mb-8">Uploaded {format(selectedDoc.createdAt.toDate(), 'MMM d, yyyy')}</p>

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
                    <DetailItem icon={<User size={14} />} label="Person" value="Household Shared" />
                    <DetailItem icon={<Clock size={14} />} label="Deadlines" value={selectedDoc.metadata?.detectedDates?.[0] || "None detected"} />
                  </div>

                  <button className="w-full bg-zinc-100 text-zinc-900 py-4 rounded-2xl font-bold text-sm hover:bg-zinc-200 transition-all mt-4">
                    View Full Document
                  </button>
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
    <p className="text-xs text-zinc-500">{format(doc.createdAt.toDate(), 'MMM d, yyyy')}</p>
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

function cn(...inputs: any[]) {
  const { clsx } = require("clsx");
  const { twMerge } = require("tailwind-merge");
  return twMerge(clsx(inputs));
}
