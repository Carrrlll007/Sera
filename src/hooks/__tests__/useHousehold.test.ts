import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '../../app/providers/AuthProvider';
import { householdService } from '../../services/householdService';
import { toast } from 'sonner';
import { useHousehold } from '../useHousehold';

vi.mock('../../app/providers/AuthProvider', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../services/householdService', () => ({
  householdService: {
    addMember: vi.fn(),
    updateMemberRole: vi.fn(),
    removeMember: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useHousehold', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows an admin to perform member management actions', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { uid: 'admin-1' },
      household: { id: 'household-1' },
      members: [],
      userRole: 'admin',
      loading: false,
    } as any);

    const { result } = renderHook(() => useHousehold());

    await act(async () => {
      await result.current.addMember({
        uid: 'member-2',
        displayName: 'Member Two',
        email: 'member2@example.com',
        role: 'member',
      });
      await result.current.updateMemberRole('member-2', 'caregiver');
      await result.current.removeMember('member-2', 'member-2');
    });

    expect(householdService.addMember).toHaveBeenCalledWith(
      'household-1',
      expect.objectContaining({
        uid: 'member-2',
        role: 'member',
      })
    );
    expect(householdService.updateMemberRole).toHaveBeenCalledWith('household-1', 'member-2', 'caregiver');
    expect(householdService.removeMember).toHaveBeenCalledWith('household-1', 'member-2', 'member-2');
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('blocks non-admin users before member management service calls are made', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { uid: 'member-1' },
      household: { id: 'household-1' },
      members: [],
      userRole: 'member',
      loading: false,
    } as any);

    const { result } = renderHook(() => useHousehold());

    await act(async () => {
      await result.current.addMember({
        uid: 'member-2',
        displayName: 'Member Two',
        email: 'member2@example.com',
        role: 'member',
      });
      await result.current.updateMemberRole('member-2', 'caregiver');
      await result.current.removeMember('member-2', 'member-2');
    });

    expect(householdService.addMember).not.toHaveBeenCalled();
    expect(householdService.updateMemberRole).not.toHaveBeenCalled();
    expect(householdService.removeMember).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("You don't have permission to add members");
    expect(toast.error).toHaveBeenCalledWith("You don't have permission to change roles");
    expect(toast.error).toHaveBeenCalledWith("You don't have permission to remove members");
  });
});
