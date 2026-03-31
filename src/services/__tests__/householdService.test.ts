import { describe, it, expect, vi, beforeEach } from 'vitest';
import { householdService } from '../householdService';
import { addDoc, collection } from 'firebase/firestore';

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
    (addDoc as any)
      .mockResolvedValueOnce({ id: 'household-456' }) // Household creation
      .mockResolvedValueOnce({ id: 'member-789' }); // Initial member creation

    const result = await householdService.createHousehold(householdName, ownerId, ownerEmail, ownerDisplayName);

    expect(result).toEqual({ householdId: 'household-456', memberId: 'member-789' });
    
    // Check if household was created with correct members array
    expect(addDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        name: householdName,
        ownerId: ownerId,
        members: [ownerId],
      })
    );

    // Check if member record was created with correct role
    expect(addDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        uid: ownerId,
        role: 'admin',
      })
    );
  });
});
