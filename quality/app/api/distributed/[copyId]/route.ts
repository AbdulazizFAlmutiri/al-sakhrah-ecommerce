import { NextResponse, type NextRequest } from "next/server";
import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";
import { getCurrentUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/db/admin";

// Returns a controlled copy: the approved PDF (or one of its forms, ?form=ID)
// with "CONTROLLED COPY No. XX - DEPT" stamped on every page.
export async function GET(req: NextRequest, ctx: { params: Promise<{ copyId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const { copyId } = await ctx.params;
  const formId = req.nextUrl.searchParams.get("form");
  const db = createAdminClient();

  const { data: copy } = await db.from("distributed_copies").select("*, documents(code, file_ar)").eq("id", copyId).maybeSingle();
  if (!copy) return new NextResponse("Not found", { status: 404 });

  let path: string | null = copy.documents?.file_ar ?? null;
  let code: string = copy.documents?.code ?? "";
  if (formId) {
    const { data: form } = await db.from("forms").select("code, file, document_id").eq("id", formId).maybeSingle();
    if (!form || form.document_id !== copy.document_id) return new NextResponse("Not found", { status: 404 });
    path = form.file;
    code = form.code;
  }
  if (!path) return new NextResponse("No file", { status: 404 });

  const { data: file } = await db.storage.from("files").download(path);
  if (!file) return new NextResponse("Not found", { status: 404 });

  const pdf = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  const no = String(copy.copy_number).padStart(2, "0");
  const cancelled = copy.status === "cancelled";
  const stamp = `${cancelled ? "CANCELLED " : ""}CONTROLLED COPY No. ${no} - ${copy.department}`;
  const color = cancelled ? rgb(0.75, 0.1, 0.1) : rgb(0.04, 0.16, 0.52);
  for (const page of pdf.getPages()) {
    const { width, height } = page.getSize();
    const size = Math.max(8, Math.min(11, width / 60));
    const w = font.widthOfTextAtSize(stamp, size);
    page.drawRectangle({ x: width - w - 24, y: height - 30, width: w + 12, height: size + 10, borderColor: color, borderWidth: 1, color: rgb(1, 1, 1), opacity: 0.85 });
    page.drawText(stamp, { x: width - w - 18, y: height - 30 + 6, size, font, color });
    if (cancelled) page.drawText("CANCELLED", { x: width * 0.2, y: height * 0.4, size: 72, font, color, opacity: 0.18, rotate: degrees(35) });
  }
  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${code}-copy-${no}-${copy.department}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
