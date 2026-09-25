import type { NextConfig } from "next";

/**
 * Uploaded enrollment documents are scans — a filled packet is routinely several
 * megabytes, and the blank 2026 employee packet alone is 3 MB. Server Actions
 * cap request bodies at 1 MB by default, which rejected them outright.
 *
 * MAX_UPLOAD_BYTES in src/config/uploads.ts sits below this on purpose: the
 * limit here applies to the whole multipart body including boundaries and part
 * headers, so the app can refuse an oversized file with a readable message
 * before the framework refuses the request with a crash page.
 */
const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "32mb",
    },
  },
};

export default nextConfig;
