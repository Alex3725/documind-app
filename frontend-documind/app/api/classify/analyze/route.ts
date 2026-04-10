import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BACKEND_BASE_URL =
  process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const cookieHeader = request.headers.get("cookie") ?? "";

    const backendResponse = await fetch(`${BACKEND_BASE_URL}/api/v1/classify/analyze`, {
      method: "POST",
      headers: {
        cookie: cookieHeader,
      },
      body: formData,
      cache: "no-store",
    });

    const responseText = await backendResponse.text();
    const contentType = backendResponse.headers.get("content-type") ?? "application/json";

    return new NextResponse(responseText, {
      status: backendResponse.status,
      headers: { "Content-Type": contentType },
    });
  } catch {
    return NextResponse.json(
      { message: "Impossibile contattare il backend." },
      { status: 502 }
    );
  }
}
