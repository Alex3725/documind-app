import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BACKEND_BASE_URL =
  process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const prefix = url.searchParams.get("prefix") ?? "";
    const limit = url.searchParams.get("limit") ?? "10";
    const cookieHeader = request.headers.get("cookie") ?? "";

    const backendUrl = new URL(`${BACKEND_BASE_URL}/api/v1/tags/search`);
    backendUrl.searchParams.set("prefix", prefix);
    backendUrl.searchParams.set("limit", limit);

    const backendResponse = await fetch(backendUrl, {
      headers: {
        cookie: cookieHeader,
      },
      cache: "no-store",
    });

    const responseText = await backendResponse.text();
    const contentType = backendResponse.headers.get("content-type") ?? "application/json";

    return new NextResponse(responseText, {
      status: backendResponse.status,
      headers: { "Content-Type": contentType },
    });
  } catch {
    return NextResponse.json({ tags: [] }, { status: 502 });
  }
}
