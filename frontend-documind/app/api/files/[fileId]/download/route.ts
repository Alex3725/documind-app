import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BACKEND_BASE_URL =
  process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

export async function GET(request: NextRequest, { params }: { params: Promise<{ fileId: string }> }) {
  try {
    const cookieHeader = request.headers.get("cookie") ?? "";
    const { fileId } = await params;

    const backendResponse = await fetch(`${BACKEND_BASE_URL}/api/v1/files/${fileId}/download`, {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });

    if (!backendResponse.ok) {
      const responseText = await backendResponse.text();
      return new NextResponse(responseText, {
        status: backendResponse.status,
        headers: { "Content-Type": backendResponse.headers.get("content-type") ?? "application/json" },
      });
    }

    const buffer = Buffer.from(await backendResponse.arrayBuffer());
    return new NextResponse(buffer, {
      status: backendResponse.status,
      headers: {
        "Content-Type": backendResponse.headers.get("content-type") ?? "application/octet-stream",
        "Content-Disposition": backendResponse.headers.get("content-disposition") ?? "attachment",
        "Content-Length": backendResponse.headers.get("content-length") ?? String(buffer.length),
      },
    });
  } catch {
    return NextResponse.json({ message: "Impossibile contattare il backend." }, { status: 502 });
  }
}
