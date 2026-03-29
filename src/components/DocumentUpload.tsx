import React, { useRef, useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useDocumentUpload } from '../hooks/useDocumentUpload';
import { cn } from '../utils/cn';
import { motion, AnimatePresence } from 'framer-motion';

interface DocumentUploadProps {
  onSuccess?: (docId: string) => void;
  className?: string;
  linkedEntityId?: string;
  linkedEntityType?: 'case' | 'task' | 'appointment';
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ 
  onSuccess, 
  className,
  linkedEntityId,
  linkedEntityType
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { upload, progress, isUploading, error, docId, reset } = useDocumentUpload();

  const handleFile = async (file: File) => {
    const metadata: any = {};
    if (linkedEntityId && linkedEntityType) {
      if (linkedEntityType === 'case') metadata.caseId = linkedEntityId;
      if (linkedEntityType === 'task') metadata.taskId = linkedEntityId;
      if (linkedEntityType === 'appointment') metadata.appointmentId = linkedEntityId;
    }

    const uploadedDocId = await upload(file, metadata);
    if (uploadedDocId && onSuccess) {
      onSuccess(uploadedDocId);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className={cn("w-full", className)}>
      <AnimatePresence mode="wait">
        {!isUploading && !docId && !error ? (
          <motion.div
            key="upload-prompt"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "relative border-2 border-dashed rounded-[2rem] p-8 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all group",
              isDragging 
                ? "border-zinc-900 bg-zinc-50" 
                : "border-zinc-100 hover:border-zinc-300 hover:bg-zinc-50"
            )}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={onFileChange} 
              className="hidden" 
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />
            <div className="w-14 h-14 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:text-zinc-900 transition-colors">
              <Upload size={24} />
            </div>
            <div className="text-center">
              <p className="font-bold text-zinc-900">Click or drag to upload</p>
              <p className="text-xs text-zinc-400 mt-1">PDF, Images, or Word docs (max 20MB)</p>
            </div>
          </motion.div>
        ) : isUploading ? (
          <motion.div
            key="uploading"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-zinc-100 rounded-[2rem] p-8 shadow-sm"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-zinc-50 rounded-xl flex items-center justify-center animate-pulse">
                <FileText className="text-zinc-400" size={20} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-zinc-900">Uploading document...</p>
                <p className="text-xs text-zinc-400">Please wait while Sera secures your file.</p>
              </div>
              <span className="text-sm font-bold text-zinc-900">{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-2 bg-zinc-50 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-zinc-900"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        ) : docId ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-emerald-50 border border-emerald-100 rounded-[2rem] p-8 flex items-center gap-6"
          >
            <div className="w-12 h-12 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <CheckCircle2 size={24} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-emerald-900">Upload Complete</p>
              <p className="text-xs text-emerald-600">Sera is now analyzing the document content.</p>
            </div>
            <button 
              onClick={reset}
              className="p-2 text-emerald-400 hover:text-emerald-900 transition-colors"
            >
              <X size={20} />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 border border-red-100 rounded-[2rem] p-8 flex items-center gap-6"
          >
            <div className="w-12 h-12 bg-red-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-red-200">
              <AlertCircle size={24} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-red-900">Upload Failed</p>
              <p className="text-xs text-red-600">{error || "An unexpected error occurred."}</p>
            </div>
            <button 
              onClick={reset}
              className="bg-white text-red-900 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-100 transition-all"
            >
              Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
