import { beforeEach, describe, expect, it, vi } from 'vitest';
import { addDoc, getDoc, updateDoc } from 'firebase/firestore';
import { getNextRecommendedAction } from '../../constants/caseTransitions';
import { caseService } from '../caseService';
import { timelineService } from '../timelineService';

vi.mock('../timelineService', () => ({
  timelineService: {
    logEvent: vi.fn().mockResolvedValue('event-id'),
  },
}));

describe('caseService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a case and logs a timeline event', async () => {
    const mockCaseData = { title: 'Test Case', description: 'Testing' };
    const authorId = 'user-123';
    const authorName = 'John Doe';
    const householdId = 'household-456';

    (addDoc as any).mockResolvedValueOnce({ id: 'case-789' });

    const result = await caseService.createCase(mockCaseData, authorId, authorName, householdId);

    expect(result).toBe('case-789');
    expect(addDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        title: 'Test Case',
        description: 'Testing',
        status: 'new',
        priority: 'medium',
        authorId,
        householdId,
        metadata: expect.objectContaining({
          nextRecommendedAction: getNextRecommendedAction('new'),
        }),
      })
    );
    expect(timelineService.logEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        entityId: 'case-789',
        entityType: 'case',
        type: 'created',
        description: expect.stringContaining('Test Case'),
      })
    );
  });

  it('updates a valid case status transition and logs the resulting timeline entry', async () => {
    (getDoc as any).mockResolvedValue({
      exists: () => true,
      data: () => ({ status: 'new' }),
    });

    await caseService.updateCaseStatus(
      'case-789',
      'active',
      'user-123',
      'John Doe',
      'household-456',
      'Called insurer'
    );

    expect(updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        status: 'active',
        'metadata.nextRecommendedAction': getNextRecommendedAction('active'),
        'metadata.lastActionTaken': 'Called insurer',
        updatedAt: 'mock-timestamp',
      })
    );
    expect(timelineService.logEvent).toHaveBeenCalledWith({
      householdId: 'household-456',
      authorId: 'user-123',
      authorName: 'John Doe',
      entityId: 'case-789',
      entityType: 'case',
      type: 'status_change',
      description: 'Called insurer',
      metadata: {
        oldStatus: 'new',
        newStatus: 'active',
        reason: 'Called insurer',
      },
    });
  });

  it('rejects invalid case status transitions without writing a fake timeline event', async () => {
    (getDoc as any).mockResolvedValue({
      exists: () => true,
      data: () => ({ status: 'resolved' }),
    });

    await expect(
      caseService.updateCaseStatus(
        'case-789',
        'active',
        'user-123',
        'John Doe',
        'household-456'
      )
    ).rejects.toThrow(/^Invalid transition from resolved to active$/);

    expect(updateDoc).not.toHaveBeenCalled();
    expect(timelineService.logEvent).not.toHaveBeenCalled();
  });
});
