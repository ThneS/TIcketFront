import { describe, it, expect } from 'vitest';
import { mapError } from '../errors';

describe('mapError', () => {
  it('maps user rejection', () => {
    const e = { message: 'User rejected the request.' };
    const m = mapError(e);
    expect(m.category).toBe('userRejected');
  });
  it('maps contract revert', () => {
    const e = { message: 'execution reverted: REASON' };
    const m = mapError(e);
    expect(m.category).toBe('contractRevert');
  });
  it('fallback unknown', () => {
    const e = { message: 'some strange text' };
    const m = mapError(e);
    expect(m.category).toBe('unknown');
  });
});
