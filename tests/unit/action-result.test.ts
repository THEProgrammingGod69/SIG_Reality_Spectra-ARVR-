import { describe, expect, it, vi } from 'vitest';

import { toActionFailure } from '@/lib/action-result';
import { NotSignedInError } from '@/lib/auth/errors';
import {
  AlreadyExistsError,
  ConflictError,
  InvalidDataError,
  MediaError,
  NotFoundError,
  RateLimitedError,
} from '@/lib/data/errors';

/** How a failed save reaches the admin, or the visitor on /contact (D-030, D-032). */
describe('toActionFailure', () => {
  it.each([
    [new NotSignedInError(), 'signed-out'],
    [new ConflictError('This event'), 'conflict'],
    [new AlreadyExistsError('This event'), 'conflict'],
    [new NotFoundError('This event'), 'not-found'],
    [new MediaError('The poster is too large.'), 'media'],
    [new RateLimitedError('Please try again in an hour.'), 'limited'],
  ] as const)('passes on the admin-facing message of %s', (error, reason) => {
    expect(toActionFailure(error)).toEqual({
      ok: false,
      reason,
      message: error.message,
      issues: [],
    });
  });

  it('keeps per-field issues for the form', () => {
    const error = new InvalidDataError('Some fields need attention.', [
      { path: 'title', message: 'Too short' },
    ]);
    expect(toActionFailure(error)).toMatchObject({
      reason: 'invalid',
      issues: [{ path: 'title', message: 'Too short' }],
    });
  });

  it('logs anything unexpected and reports it without internals', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const failure = toActionFailure(new Error('ECONNRESET redis.internal:6379'));

    expect(failure.reason).toBe('failed');
    expect(failure.message).not.toContain('ECONNRESET');
    expect(log).toHaveBeenCalledOnce();
  });
});
