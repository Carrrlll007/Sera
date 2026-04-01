import { act, renderHook, waitFor } from '@testing-library/react';
import { addDoc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '../../app/providers/AuthProvider';
import { extractDocumentData } from '../../services/geminiService';
import { taskService } from '../../services/taskService';
import { toast } from 'sonner';
import { useDocumentUpload } from '../useDocumentUpload';

vi.mock('../../app/providers/AuthProvider', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../services/geminiService', () => ({
  extractDocumentData: vi.fn(),
}));

vi.mock('../../services/taskService', () => ({
  taskService: {
    createTask: vi.fn().mockResolvedValue('task-1'),
  },
}));

vi.mock('../../services/timelineService', () => ({
  timelineService: {
    logEvent: vi.fn().mockResolvedValue('event-1'),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

class MockFileReader {
  result: string | ArrayBuffer | null = null;
  onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
  onerror: ((event: ProgressEvent<FileReader>) => void) | null = null;

  readAsDataURL(file: Blob) {
    this.result = `data:${file.type};base64,ZmFrZS1iYXNlNjQ=`;
    queueMicrotask(() => {
      this.onload?.({ target: this } as unknown as ProgressEvent<FileReader>);
    });
  }
}

const originalFileReader = globalThis.FileReader;

describe('useDocumentUpload', () => {
  beforeAll(() => {
    globalThis.FileReader = MockFileReader as unknown as typeof FileReader;
  });

  afterAll(() => {
    globalThis.FileReader = originalFileReader;
  });

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useAuth).mockReturnValue({
      user: { uid: 'user-1' },
      household: { id: 'household-1' },
    } as any);

    (addDoc as any).mockResolvedValue({ id: 'document-1' });
    (updateDoc as any).mockResolvedValue(undefined);
    (getDownloadURL as any).mockResolvedValue('https://storage.example/document-1.pdf');
    (uploadBytesResumable as any).mockImplementation(() => ({
      snapshot: { ref: 'mock-upload-ref' },
      on: (
        _event: string,
        onProgress: (snapshot: { bytesTransferred: number; totalBytes: number }) => void,
        _onError: (error: unknown) => void,
        onComplete: () => Promise<void>
      ) => {
        onProgress({ bytesTransferred: 4, totalBytes: 4 });
        void onComplete();
      },
    }));
  });

  it('persists uploaded document metadata and moves the document into the analyzed state', async () => {
    vi.mocked(extractDocumentData).mockResolvedValue({
      metadata: {
        summary: 'Renew insurance claim',
        detectedDates: ['2026-05-01'],
        nextAction: 'Submit the signed form',
        category: 'insurance',
        extractedEntities: [{ name: 'Blue Cross', type: 'provider' }],
      },
    });

    const { result } = renderHook(() => useDocumentUpload());
    const file = new File(['pdf-data'], 'claim.pdf', { type: 'application/pdf' });

    let docId: string | null;
    await act(async () => {
      docId = await result.current.upload(file, { caseId: 'case-1' });
    });

    expect(docId).toBe('document-1');
    expect(addDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        caseId: 'case-1',
        name: 'claim.pdf',
        url: 'https://storage.example/document-1.pdf',
        storagePath: expect.stringContaining('claim.pdf'),
        mimeType: 'application/pdf',
        size: 8,
        status: 'uploaded',
        authorId: 'user-1',
        householdId: 'household-1',
      })
    );

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          metadata: {
            summary: 'Renew insurance claim',
            detectedDates: ['2026-05-01'],
            nextAction: 'Submit the signed form',
            category: 'insurance',
            extractedEntities: [{ name: 'Blue Cross', type: 'provider' }],
          },
          status: 'analyzed',
          updatedAt: 'mock-timestamp',
        })
      );
    });

    expect(taskService.createTask).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Review: claim.pdf',
        documentId: 'document-1',
      }),
      'user-1',
      'household-1'
    );
    expect(result.current.isAnalyzing).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('marks the document as analysis-failed when automatic extraction fails', async () => {
    vi.mocked(extractDocumentData).mockRejectedValue(new Error('Gemini unavailable'));

    const { result } = renderHook(() => useDocumentUpload());
    const file = new File(['pdf-data'], 'claim.pdf', { type: 'application/pdf' });

    await act(async () => {
      await result.current.upload(file);
    });

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          metadata: expect.objectContaining({
            summary: 'Automatic analysis was unavailable for this document.',
            analysisError: 'Automatic analysis was unavailable for this document.',
          }),
          status: 'analysis-failed',
          updatedAt: 'mock-timestamp',
        })
      );
    });

    expect(taskService.createTask).not.toHaveBeenCalled();
    expect(result.current.isAnalyzing).toBe(false);
    expect(result.current.error).toBe('The document was uploaded, but automatic analysis was unavailable.');
    expect(toast.error).toHaveBeenCalledWith(
      'The document was uploaded, but Sera had trouble analyzing it. You can still view it in your documents.'
    );
  });
});
