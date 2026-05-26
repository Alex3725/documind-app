import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BACKEND_BASE_URL =
  process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get("cookie") ?? "";
    const backendResponse = await fetch(`${BACKEND_BASE_URL}/api/v1/folders/trash`, {
      headers: { cookie: cookieHeader },
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
