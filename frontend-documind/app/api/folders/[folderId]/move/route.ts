import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BACKEND_BASE_URL =
  process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

export async function POST(request: NextRequest, { params }: { params: Promise<{ folderId: string }> }) {
  try {
    const cookieHeader = request.headers.get("cookie") ?? "";
    const payload = await request.json();
    const { folderId } = await params;

    const backendResponse = await fetch(`${BACKEND_BASE_URL}/api/v1/folders/${folderId}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: cookieHeader },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const responseText = await backendResponse.text();
    return new NextResponse(responseText, {
      status: backendResponse.status,
      headers: { "Content-Type": backendResponse.headers.get("content-type") ?? "application/json" },
    });
  } catch {
    return NextResponse.json({ message: "Impossibile contattare il backend." }, { status: 502 });
  }
}
