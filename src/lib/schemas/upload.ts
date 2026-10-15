import { z } from 'zod';

import { recordId } from './fields';

/**
 * The browser-upload contract (rule 11), shared by the admin uploader, the
 * token route (`/api/admin/upload`) and the data layer's attach check.
 *
 * Every file belongs to one place in one record. The folder is derived from
 * that place, so a URL can be checked against the record it is being attached
 * to: an event's photo cannot be attached to another event, or as a poster.
 */

const MB = 1024 * 1024;

export const MEDIA_KINDS = {
  image: {
    /** The admin uploader converts images to WebP first; the rest are fallbacks. */
    types: { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/avif': 'avif' },
    maxBytes: 5 * MB,
  },
  pdf: {
    types: { 'application/pdf': 'pdf' },
    maxBytes: 10 * MB,
  },
} as const;

type MediaKind = keyof typeof MEDIA_KINDS;

export const UPLOAD_TARGETS = {
  'event-poster': { kind: 'image', folder: (id: string) => `events/${id}/poster/` },
  'event-photo': { kind: 'image', folder: (id: string) => `events/${id}/photos/` },
  'gallery-photo': { kind: 'image', folder: (id: string) => `gallery/${id}/` },
  'member-photo': { kind: 'image', folder: (id: string) => `team/${id}/` },
  /** The site has one roles PDF, so it is not filed under a record id. */
  'roles-pdf': { kind: 'pdf', folder: () => 'recruitment/' },
} as const satisfies Record<string, { kind: MediaKind; folder: (id: string) => string }>;

export type UploadTarget = keyof typeof UPLOAD_TARGETS;

const targetIds = Object.keys(UPLOAD_TARGETS) as [UploadTarget, ...UploadTarget[]];

/** Targets that are filed under a record id (all but the site-wide roles PDF). */
function needsRecordId(target: UploadTarget): boolean {
  return target !== 'roles-pdf';
}

/** Where a file for this target and record lives, relative to the namespace. */
export function uploadFolder(target: UploadTarget, id: string | null): string {
  if (needsRecordId(target) && id === null) {
    throw new Error(`An upload for ${target} needs the record id`);
  }
  return UPLOAD_TARGETS[target].folder(id ?? '');
}

/** The content types and size limit for a target. */
export function uploadLimits(target: UploadTarget) {
  return MEDIA_KINDS[UPLOAD_TARGETS[target].kind];
}

/** The file extension for an allowed content type, or null if it is not allowed. */
export function uploadExtension(target: UploadTarget, contentType: string): string | null {
  const types: Readonly<Record<string, string>> = uploadLimits(target).types;
  return types[contentType] ?? null;
}

/** What the admin uploader asks `/api/admin/upload` for. */
export const UploadRequestSchema = z
  .object({
    target: z.enum(targetIds),
    recordId: recordId.nullable().default(null),
    contentType: z.string().min(1),
    /** Bytes. Checked again against the stored object when it is attached. */
    size: z.int().min(1),
  })
  .superRefine((request, ctx) => {
    if (needsRecordId(request.target) !== (request.recordId !== null)) {
      ctx.addIssue({
        code: 'custom',
        path: ['recordId'],
        message: needsRecordId(request.target)
          ? 'This upload needs the id of the record it belongs to'
          : 'This upload does not belong to a record',
      });
    }
    if (uploadExtension(request.target, request.contentType) === null) {
      ctx.addIssue({
        code: 'custom',
        path: ['contentType'],
        message: `Not an allowed file type for ${request.target}`,
      });
    }
    const { maxBytes } = uploadLimits(request.target);
    if (request.size > maxBytes) {
      ctx.addIssue({
        code: 'custom',
        path: ['size'],
        message: `Files for ${request.target} must be at most ${maxBytes / MB} MB`,
      });
    }
  });

export type UploadRequest = z.input<typeof UploadRequestSchema>;

/** What the token route returns: where to PUT the file, and its final URL. */
export type UploadTicket = {
  /** Presigned, short-lived URL; PUT the file body here. */
  uploadUrl: string;
  /** Send exactly these headers with the PUT. */
  headers: { 'Content-Type': string };
  /** The public URL to attach to the record once the upload succeeds. */
  url: string;
  expiresAt: string;
  /**
   * Null: PUT the whole file once. A number: the upload goes through a
   * size-capped function (Netlify Blobs, local data mode), so a larger file
   * is sent as consecutive parts of at most this many bytes, each to
   * `uploadUrl` plus `&part=<i>&parts=<n>`, in order.
   */
  partBytes: number | null;
};

/** A file a record refers to, with the place it was uploaded for. */
export type MediaRef = { url: string; target: UploadTarget; recordId: string | null };
