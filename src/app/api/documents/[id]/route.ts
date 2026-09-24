import { readFile } from "node:fs/promises";
import { prisma } from "@/lib/db";
import { storedPath } from "@/lib/storage";

export const runtime = "nodejs";

/** Streams an uploaded file back from /uploads. No auth — this is a demo. */
export async function GET(
  _request: Request,
  context: RouteContext<"/api/documents/[id]">,
) {
  const { id } = await context.params;

  const doc = await prisma.document.findUnique({
    where: { id },
    select: { storedName: true, originalName: true, mimeType: true },
  });
  if (!doc) return new Response("Not found", { status: 404 });

  try {
    const bytes = await readFile(storedPath(doc.storedName));
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": doc.mimeType || "application/octet-stream",
        "Content-Disposition": `inline; filename="${doc.originalName.replace(/"/g, "")}"`,
        "Cache-Control": "private, max-age=0, must-revalidate",
      },
    });
  } catch {
    return new Response("File missing from /uploads — re-run the seed.", { status: 410 });
  }
}
