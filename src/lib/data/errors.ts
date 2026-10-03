/**
 * Errors the data layer throws on purpose. Each message is written for the
 * admin who will see it in the panel (Stage 6+); anything else that escapes is
 * a bug or an outage and is shown as a generic failure.
 */
export class DataError extends Error {
  override name = 'DataError';
}

export class NotFoundError extends DataError {
  override name = 'NotFoundError';
  constructor(what: string) {
    super(`${what} no longer exists. It may have been deleted by another admin.`);
  }
}

export class AlreadyExistsError extends DataError {
  override name = 'AlreadyExistsError';
  constructor(what: string) {
    super(`${what} already exists.`);
  }
}

/** The optimistic-concurrency check failed: someone saved in between. */
export class ConflictError extends DataError {
  override name = 'ConflictError';
  constructor(what: string) {
    super(
      `${what} was changed by someone else after you opened it. ` +
        'Reload to see their changes, then make yours again.',
    );
  }
}

type ZodLikeError = { issues: readonly { path: readonly PropertyKey[]; message: string }[] };

/** Input that breaks a rule. `issues` maps a field path to its message. */
export class InvalidDataError extends DataError {
  override name = 'InvalidDataError';
  constructor(
    message: string,
    readonly issues: readonly { path: string; message: string }[] = [],
  ) {
    super(message);
  }

  /** From a failed schema parse: one issue per field, for the form to show. */
  static fromZod(error: ZodLikeError, message = 'Some fields need attention.'): InvalidDataError {
    return new InvalidDataError(
      message,
      error.issues.map((issue) => ({
        path: issue.path.map(String).join('.'),
        message: issue.message,
      })),
    );
  }
}

/** Too many submissions from one sender within the limit's window (the contact form). */
export class RateLimitedError extends DataError {
  override name = 'RateLimitedError';
}

/** An uploaded file that cannot be attached: wrong place, type, size, or missing. */
export class MediaError extends DataError {
  override name = 'MediaError';
}
