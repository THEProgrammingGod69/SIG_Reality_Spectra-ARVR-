import { describe, expect, it } from 'vitest';

import { createTaskQueue, MAX_CONCURRENT_UPLOADS } from '@/components/admin/upload-file';

/** The admin uploads' concurrency cap: a dropped folder is processed a few files at a time. */

/** A task that runs until the test lets it finish. */
function deferred() {
  let finish!: () => void;
  let fail!: (error: Error) => void;
  const done = new Promise<void>((resolve, reject) => {
    finish = resolve;
    fail = reject;
  });
  return { done, finish, fail };
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('createTaskQueue', () => {
  it('runs at most `limit` tasks at once, the rest in the order queued', async () => {
    const queue = createTaskQueue(MAX_CONCURRENT_UPLOADS);
    const tasks = Array.from({ length: 7 }, deferred);
    const started: number[] = [];
    let running = 0;
    let peak = 0;

    const all = tasks.map((task, index) =>
      queue(async () => {
        started.push(index);
        running += 1;
        peak = Math.max(peak, running);
        await task.done;
        running -= 1;
      }),
    );

    await settle();
    expect(started).toEqual([0, 1, 2]);

    tasks[1]!.finish();
    await settle();
    expect(started).toEqual([0, 1, 2, 3]);

    // A task queued while others wait goes to the back, never over the limit.
    const late = deferred();
    all.push(queue(() => late.done));
    for (const task of tasks) task.finish();
    late.finish();
    await Promise.all(all);

    expect(started).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(peak).toBe(MAX_CONCURRENT_UPLOADS);
  });

  it('frees the slot of a task that fails', async () => {
    const queue = createTaskQueue(1);
    const failing = queue(() => Promise.reject(new Error('Upload refused')));
    const next = queue(async () => 'uploaded');
    await expect(failing).rejects.toThrow('Upload refused');
    await expect(next).resolves.toBe('uploaded');
  });
});
