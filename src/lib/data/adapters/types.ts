import type { Collection } from '../keys';

/**
 * The two storage ports. Everything above them — validation, versions, files,
 * cache tags — is storage-agnostic, so moving off Redis or R2 means writing one
 * new adapter that passes the same contract tests (tests/unit/data), and
 * changing nothing else.
 */

/* -------------------------------------------------------------------------- */
/* Records                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * One change in an atomic write.
 *
 * - `version` is the record's new `updatedAt`.
 * - `expectedVersion` is the `updatedAt` the writer last saw; the write fails
 *   with a conflict if the stored one differs. `null` skips the check (the
 *   record must still exist).
 * - `score` orders the collection's index (start time, upload time, rank…).
 */
export type WriteOp =
  | {
      kind: 'create';
      collection: Collection;
      id: string;
      data: string;
      version: string;
      score: number;
    }
  | {
      kind: 'replace';
      collection: Collection;
      id: string;
      data: string;
      version: string;
      expectedVersion: string | null;
      score: number;
    }
  | { kind: 'remove'; collection: Collection; id: string; expectedVersion: string | null };

export type ListOptions = {
  /** By index score. Default `asc`. */
  order?: 'asc' | 'desc';
  offset?: number;
  /** Default: everything from `offset` on. */
  limit?: number;
};

/** A stored record as raw JSON, not yet validated. */
export type RawRecord = { id: string; data: string | null };

export interface RecordStore {
  /** The raw JSON of one record, or null. */
  get(collection: Collection, id: string): Promise<string | null>;
  /**
   * Records in index order. `data` is null when the index names a record that
   * no longer exists (the caller logs and skips it).
   */
  list(collection: Collection, options?: ListOptions): Promise<RawRecord[]>;
  count(collection: Collection): Promise<number>;
  /**
   * Apply every op or none. Checks run first, against the state before the
   * write; on the first failure nothing is written and the matching error is
   * thrown: `AlreadyExistsError`, `NotFoundError` or `ConflictError`.
   * A record may appear at most once per call.
   */
  write(ops: readonly WriteOp[]): Promise<void>;
}

/** Thrown by a store when a check fails; the repository turns it into a DataError. */
export class WriteCheckError extends Error {
  constructor(
    readonly reason: 'exists' | 'missing' | 'conflict',
    readonly op: WriteOp,
  ) {
    super(`Write check failed (${reason}) for ${op.collection} ${op.id}`);
  }
}

/** Reject a batch that touches one record twice; its checks would be meaningless. */
export function assertDistinctRecords(ops: readonly WriteOp[]): void {
  const seen = new Set<string>();
  for (const op of ops) {
    const key = `${op.collection}\u0000${op.id}`;
    if (seen.has(key)) throw new Error(`A write touches ${op.collection} ${op.id} twice`);
    seen.add(key);
  }
}

/* -------------------------------------------------------------------------- */
/* Files                                                                      */
/* -------------------------------------------------------------------------- */

export type ObjectInfo = { size: number; contentType: string | null };

export interface ObjectStorage {
  /** A URL the browser can PUT one file to, valid for `expiresInSeconds`. */
  presignPut(key: string, expiresInSeconds: number): Promise<string>;
  /** Size and type of a stored object, or null if there is none. */
  head(key: string): Promise<ObjectInfo | null>;
  /** Server-side writes: the nightly backup's JSON (Stage 10). */
  put(key: string, body: string, contentType: string): Promise<void>;
  /** Deleting a missing object is not an error. */
  delete(key: string): Promise<void>;
  /** Every key starting with `prefix`. */
  list(prefix: string): Promise<string[]>;
}
