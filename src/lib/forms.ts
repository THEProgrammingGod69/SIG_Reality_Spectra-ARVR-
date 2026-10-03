/**
 * Helpers shared by every react-hook-form form, admin and public alike.
 */

/**
 * For `register(…, { setValueAs: blankToNull })` on an optional text field:
 * an empty box means "not set" (null), not an empty string.
 */
export function blankToNull(value: string | null | undefined): string | null {
  return value?.trim() ? value : null;
}
