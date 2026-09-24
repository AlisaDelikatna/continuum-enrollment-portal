import { createHash, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

/** Uploads live on local disk at <project root>/uploads, outside git. */
export const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export async function ensureUploadDir() {
  await mkdir(UPLOAD_DIR, { recursive: true });
}

/** Strips directory traversal and keeps the stored filename collision-free. */
export function safeStoredName(originalName: string) {
  const base = path.basename(originalName).replace(/[^\w.\-]+/g, "_").slice(-80);
  return `${randomUUID()}__${base || "upload.bin"}`;
}

export function storedPath(storedName: string) {
  // basename() again so a crafted DB value can never escape UPLOAD_DIR.
  return path.join(UPLOAD_DIR, path.basename(storedName));
}

export async function saveUpload(file: File) {
  await ensureUploadDir();
  const storedName = safeStoredName(file.name);
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(storedPath(storedName), bytes);
  return {
    storedName,
    originalName: file.name,
    mimeType: file.type || "application/octet-stream",
    size: bytes.byteLength,
    checksum: createHash("sha256").update(bytes).digest("hex").slice(0, 12),
  };
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
