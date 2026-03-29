import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../app/providers/AuthProvider';
import { useHousehold } from './useHousehold';
import { documentService } from '../services/documentService';
import { taskService } from '../services/taskService';
import { extractDocumentData } from '../services/geminiService';
import { Document } from '../types';
import { toast } from 'sonner';
import { canUserView, canUserEdit } from '../utils/permissions';

export const useDocuments = () => {
  const { user, household } = useAuth();
  const { userRole } = useHousehold();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!household) return;
    setIsLoading(true);
    return documentService.subscribeToHouseholdDocuments(household.id, (docs) => {
      setDocuments(docs);
      setIsLoading(false);
    });
  }, [household]);

  const visibleDocuments = useMemo(() => {
    if (!user?.uid) return [];
    return documents.filter(doc => canUserView(user.uid, userRole, doc));
  }, [documents, user?.uid, userRole]);

  const uploadDocument = useCallback(async (file: File) => {
    if (!user || !household) {
      toast.error('You must be logged in to upload documents');
      return null;
    }

    try {
      // 1. Upload and create record
      const docId = await documentService.uploadDocument(file, user.uid, household.id);
      if (!docId) throw new Error('Failed to create document record');

      toast.success('Document uploaded. Analyzing...');

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
            toast.info('Deadline detected. Task created.');
          }
          
          toast.success('Analysis complete');
        } catch (err) {
          console.error('AI Analysis failed:', err);
          toast.error('Failed to analyze document, but it was uploaded successfully.');
        }
      };
      reader.readAsDataURL(file);

      return docId;
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload document');
      return null;
    }
  }, [user, household]);

  const deleteDocument = useCallback(async (docId: string, storagePath: string) => {
    if (!user || !household) return;
    
    const doc = documents.find(d => d.id === docId);
    if (doc && !canUserEdit(user.uid, userRole, doc)) {
      toast.error("You don't have permission to delete this document");
      return;
    }

    try {
      await documentService.deleteDocument(docId, storagePath, user.uid, household.id);
      toast.success('Document deleted');
    } catch (error) {
      toast.error('Failed to delete document');
    }
  }, [user, household, documents, userRole]);

  return {
    documents: visibleDocuments,
    allDocuments: documents,
    isLoading,
    uploadDocument,
    deleteDocument
  };
};
