import { describe, it, expect } from 'vitest';
import { VALID_CASE_TRANSITIONS, getNextRecommendedAction } from '../caseTransitions';

describe('Case Transitions Logic', () => {
  it('should allow valid transitions from "new"', () => {
    const allowed = VALID_CASE_TRANSITIONS['new'];
    expect(allowed).toContain('active');
    expect(allowed).toContain('archived');
    expect(allowed).not.toContain('resolved');
  });

  it('should allow re-opening an archived case', () => {
    const allowed = VALID_CASE_TRANSITIONS['archived'];
    expect(allowed).toContain('active');
  });

  it('should return correct recommended action for "new" status', () => {
    const action = getNextRecommendedAction('new');
    expect(action).toContain('Review case details');
  });

  it('should return correct recommended action for "resolved" status', () => {
    const action = getNextRecommendedAction('resolved');
    expect(action).toContain('Case is complete');
  });
});
