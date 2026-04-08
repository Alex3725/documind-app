import { NextResponse } from "next/server";

const BACKEND_BASE_URL =
  process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    const backendResponse = await fetch(`${BACKEND_BASE_URL}/api/v1/user/in`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const responseText = await backendResponse.text();
    const contentType = backendResponse.headers.get("content-type") ?? "application/json";
    const setCookieHeader = backendResponse.headers.get("set-cookie");

    const response = new NextResponse(responseText, {
      status: backendResponse.status,
      headers: {
        "Content-Type": contentType,
      },
    });

    if (setCookieHeader) {
      response.headers.set("set-cookie", setCookieHeader);
    }

    return response;
  } catch {
    return NextResponse.json(
      { message: "Impossibile contattare il backend di autenticazione." },
      { status: 502 },
    );
  }
}
