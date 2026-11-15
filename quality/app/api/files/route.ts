import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/db/admin";

// Streams a stored file to signed-in staff only. The storage bucket is private.
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const path = req.nextUrl.searchParams.get("path");
  if (!path || path.includes("..")) return new NextResponse("Bad request", { status: 400 });

  const { data, error } = await createAdminClient().storage.from("files").download(path);
  if (error || !data) return new NextResponse("Not found", { status: 404 });
  const name = path.split("/").pop() ?? "file.pdf";
  return new NextResponse(data, {
    headers: {
      "Content-Type": data.type || "application/pdf",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(name)}`,
      "Cache-Control": "private, max-age=300",
    },
  });
}
