import { describe, expect, it } from 'vitest';

import { MAX_TOASTS, type Toast, toastReducer } from '@/components/admin/toaster';

const toast = (id: number): Toast => ({ id, tone: 'success', message: `Saved ${id}` });

describe('toastReducer', () => {
  it('adds and dismisses notifications', () => {
    const shown = toastReducer(toastReducer([], { type: 'add', toast: toast(1) }), {
      type: 'add',
      toast: toast(2),
    });
    expect(shown.map((item) => item.id)).toEqual([1, 2]);
    expect(toastReducer(shown, { type: 'dismiss', id: 1 }).map((item) => item.id)).toEqual([2]);
  });

  it('keeps only the newest few', () => {
    let toasts: Toast[] = [];
    for (let id = 1; id <= MAX_TOASTS + 2; id += 1) {
      toasts = toastReducer(toasts, { type: 'add', toast: toast(id) });
    }
    expect(toasts).toHaveLength(MAX_TOASTS);
    expect(toasts[0]?.id).toBe(3);
  });
});
