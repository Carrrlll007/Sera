import { describe, it, expect, vi, beforeEach } from 'vitest';
import { householdService } from '../householdService';
import { addDoc, deleteDoc, doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';

describe('Household Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a household and add the creator as admin', async () => {
    const householdName = 'The Smiths';
    const ownerId = 'user-123';
    const ownerEmail = 'smith@example.com';
    const ownerDisplayName = 'John Smith';

    // Mock addDoc to return references with ids
    (addDoc as any).mockResolvedValueOnce({ id: 'household-456' });

    const result = await householdService.createHousehold(householdName, ownerId, ownerEmail, ownerDisplayName);

    expect(result).toEqual({ householdId: 'household-456', memberId: ownerId });
    
    // Check if household was created with correct members array
    expect(addDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        name: householdName,
        ownerId: ownerId,
        members: [ownerId],
      })
    );

    expect(setDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        uid: ownerId,
        role: 'admin',
      })
    );
  });

  it('stores added members under their auth uid and updates the household membership array', async () => {
    (getDoc as any).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ members: ['admin-1'] }),
    });

    const memberId = await householdService.addMember('household-456', {
      uid: 'member-123',
      displayName: 'Jane Smith',
      email: 'jane@example.com',
      role: 'member',
    });

    expect(memberId).toBe('member-123');
    expect(updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        members: ['admin-1', 'member-123'],
      })
    );
    expect(setDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        uid: 'member-123',
        displayName: 'Jane Smith',
      })
    );
    expect(doc).toHaveBeenCalledWith(undefined, 'households', 'household-456', 'members', 'member-123');
  });

  it('deletes the member document when removing a member', async () => {
    (getDoc as any).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ members: ['admin-1', 'member-123'] }),
    });

    await householdService.removeMember('household-456', 'member-123', 'member-123');

    expect(deleteDoc).toHaveBeenCalled();
    expect(updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        members: ['admin-1'],
      })
    );
  });
});
