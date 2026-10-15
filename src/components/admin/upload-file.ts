import {
  type UploadRequest,
  type UploadTarget,
  type UploadTicket,
  uploadLimits,
} from '@/lib/schemas/upload';

/**
 * The browser half of the upload flow (rule 11): prepare a file, ask
 * `/api/admin/upload` for a presigned URL, PUT the file straight to storage.
 * The record is saved separately, by a Server Action that verifies the URL.
 */

/** Long edge of an uploaded image: sharp on any screen the site targets. */
export const MAX_IMAGE_EDGE = 2400;
const WEBP_QUALITY = 0.85;

/**
 * How many files are decoded, re-encoded and uploaded at once. Each one holds
 * a full-size bitmap while it is converted, so a folder of phone photos
 * dropped in one go would otherwise exhaust a laptop's memory and time out.
 */
export const MAX_CONCURRENT_UPLOADS = 3;

/**
 * Runs tasks at most `limit` at a time, the rest waiting in the order they
 * were queued. A finishing task hands its slot straight to the next waiting
 * one, so a task queued meanwhile can never squeeze in over the limit.
 */
export function createTaskQueue(limit: number) {
  let running = 0;
  const waiting: (() => void)[] = [];

  const acquire = async () => {
    if (running < limit) {
      running += 1;
      return;
    }
    await new Promise<void>((resolve) => waiting.push(resolve));
  };
  const release = () => {
    const next = waiting.shift();
    if (next) next();
    else running -= 1;
  };

  return async function run<T>(task: () => Promise<T>): Promise<T> {
    await acquire();
    try {
      return await task();
    } finally {
      release();
    }
  };
}

/** Every upload on the page shares these slots, whichever field started it. */
export const queueUpload = createTaskQueue(MAX_CONCURRENT_UPLOADS);

export type PreparedFile = {
  body: Blob;
  contentType: string;
  /** Pixel size, for images; the page reserves the space before it loads. */
  width: number | null;
  height: number | null;
};

/** The size an image is scaled to so its long edge is at most `MAX_IMAGE_EDGE`. */
export function fitWithin(width: number, height: number, maxEdge = MAX_IMAGE_EDGE) {
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/**
 * Images are scaled down and re-encoded as WebP, which cuts phone photos to a
 * fraction of their size. If the browser cannot encode WebP, the original is
 * kept when its type is allowed. PDFs pass through unchanged.
 */
export async function prepareFile(file: File, target: UploadTarget): Promise<PreparedFile> {
  const allowed: Readonly<Record<string, string>> = uploadLimits(target).types;
  if (!file.type.startsWith('image/')) {
    if (!(file.type in allowed)) throw new Error(`${file.name}: not an allowed file type.`);
    return { body: file, contentType: file.type, width: null, height: null };
  }

  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error(`${file.name}: this image could not be read.`);
  });
  const size = fitWithin(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, size.width, size.height);
  bitmap.close();

  const webp = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY),
  );
  if (webp?.type === 'image/webp') {
    return { body: webp, contentType: 'image/webp', ...size };
  }
  if (file.type in allowed) return { body: file, contentType: file.type, ...size };
  throw new Error(`${file.name}: this browser cannot convert the image. Try a JPEG or PNG.`);
}

/** Ask for a presigned URL and PUT the file there; resolves to its public URL. */
export async function uploadPrepared(
  prepared: PreparedFile,
  { target, recordId }: { target: UploadTarget; recordId: string | null },
  onProgress: (fraction: number) => void,
): Promise<string> {
  const request: UploadRequest = {
    target,
    recordId,
    contentType: prepared.contentType,
    size: prepared.body.size,
  };
  const response = await fetch('/api/admin/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  const reply = (await response.json().catch(() => ({}))) as Partial<UploadTicket> & {
    error?: string;
  };
  if (!response.ok || !reply.uploadUrl || !reply.url || !reply.headers) {
    throw new Error(reply.error ?? 'The upload could not be started.');
  }

  // XMLHttpRequest, not fetch: it reports upload progress.
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', reply.uploadUrl!);
    for (const [name, value] of Object.entries(reply.headers!)) xhr.setRequestHeader(name, value);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`The upload failed (${xhr.status}). Try again.`));
    xhr.onerror = () => reject(new Error('The connection dropped during the upload. Try again.'));
    xhr.send(prepared.body);
  });
  onProgress(1);
  return reply.url;
}
