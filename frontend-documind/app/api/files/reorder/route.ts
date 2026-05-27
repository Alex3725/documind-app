import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BACKEND_BASE_URL =
  process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const cookieHeader = request.headers.get("cookie") ?? "";

    const backendResponse = await fetch(`${BACKEND_BASE_URL}/api/v1/files/reorder`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: cookieHeader,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const responseText = await backendResponse.text();
    const contentType = backendResponse.headers.get("content-type") ?? "application/json";

    return new NextResponse(responseText, {
      status: backendResponse.status,
      headers: { "Content-Type": contentType },
    });
  } catch {
    return NextResponse.json({ status: "error", results: [] }, { status: 502 });
  }
}
