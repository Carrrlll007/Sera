import { useState, useCallback } from 'react';
import { useAuth } from '../app/providers/AuthProvider';
import { documentService } from '../services/documentService';
import { taskService } from '../services/taskService';
import { extractDocumentData } from '../services/geminiService';
import { Document } from '../types';
import { toast } from 'sonner';

export interface UploadState {
  progress: number;
  isUploading: boolean;
  error: string | null;
  docId: string | null;
}

export const useDocumentUpload = () => {
  const { user, household } = useAuth();
  const [state, setState] = useState<UploadState>({
    progress: 0,
    isUploading: false,
    error: null,
    docId: null,
  });

  const upload = useCallback(async (
    file: File, 
    metadata: Partial<Document> = {}
  ) => {
    if (!user || !household) {
      const error = 'You must be logged in to upload documents';
      toast.error(error);
      setState(prev => ({ ...prev, error }));
      return null;
    }

    setState({
      progress: 0,
      isUploading: true,
      error: null,
      docId: null,
    });

    try {
      // 1. Upload and create record with progress tracking
      const docId = await documentService.uploadDocument(
        file, 
        user.uid, 
        household.id, 
        metadata,
        (progress) => setState(prev => ({ ...prev, progress }))
      );

      setState(prev => ({ ...prev, isUploading: false, docId }));
      toast.success('Document received. Sera is now analyzing the details.');

      // 2. AI Extraction (Async)
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          const data = await extractDocumentData(base64, file.type);
          
          // 3. Update with metadata
          await documentService.updateDocument(docId, {
            metadata: data,
            status: 'analyzed'
          }, user.uid, household.id);

          // 4. Create task if deadlines detected
          if (data.deadlines && data.deadlines.length > 0) {
            await taskService.createTask({
              title: `Review: ${file.name}`,
              description: data.summary || `Extracted from ${file.name}`,
              type: 'document',
              priority: 'medium',
              dueDate: data.deadlines[0] as any,
              documentId: docId
            }, user.uid, household.id);
            toast.info('A deadline was detected. A task has been created for your review.');
          }
          
          toast.success('Analysis complete. Your document is organized.');
        } catch (err) {
          console.error('AI Analysis failed:', err);
          toast.error('The document was uploaded, but Sera had trouble analyzing it. You can still view it in your documents.');
        }
      };
      reader.readAsDataURL(file);

      return docId;
    } catch (error: any) {
      console.error('Upload failed:', error);
      const errorMessage = 'We encountered an issue uploading your document. Please try again.';
      setState(prev => ({ ...prev, isUploading: false, error: errorMessage }));
      toast.error(errorMessage);
      return null;
    }
  }, [user, household]);

  const reset = useCallback(() => {
    setState({
      progress: 0,
      isUploading: false,
      error: null,
      docId: null,
    });
  }, []);

  return {
    ...state,
    upload,
    reset
  };
};
