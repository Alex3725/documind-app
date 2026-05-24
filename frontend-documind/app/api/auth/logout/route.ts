import { NextResponse } from "next/server";

const BACKEND_BASE_URL =
  process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") ?? "";

    const backendResponse = await fetch(`${BACKEND_BASE_URL}/api/v1/user/out`, {
      method: "POST",
      headers: {
        cookie: cookieHeader,
      },
      cache: "no-store",
    });

    const response = new NextResponse(null, {
      status: backendResponse.status,
    });

    const setCookieHeader = backendResponse.headers.get("set-cookie");
    if (setCookieHeader) {
      response.headers.set("set-cookie", setCookieHeader);
    }

    return response;
  } catch {
    return NextResponse.json(
      { message: "Impossibile contattare il backend di logout." },
      { status: 502 },
    );
  }
}