/**
 * Per-file upload ceiling.
 *
 * Deliberately below the Server Action `bodySizeLimit` in next.config.ts, which
 * governs the entire multipart body — potentially several files plus boundary
 * and header overhead. Leaving headroom means an oversized file is refused with
 * a message the enrollee can act on, rather than a framework error page.
 */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export const MAX_UPLOAD_LABEL = "25 MB";

/** Ceiling across one multi-slot submission, e.g. the enrollment wizard. */
export const MAX_UPLOAD_TOTAL_BYTES = 30 * 1024 * 1024;

export function tooLarge(bytes: number) {
  return bytes > MAX_UPLOAD_BYTES;
}

export function describeSize(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
