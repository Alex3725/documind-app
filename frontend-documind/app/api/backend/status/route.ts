import { NextResponse } from "next/server";

const BACKEND_BASE_URL =
  process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

export async function GET() {
  const startedAt = Date.now();

  try {
    const backendResponse = await fetch(`${BACKEND_BASE_URL}/api/v1/user/in`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // Chiamata intenzionalmente con credenziali invalide: ci interessa solo sapere se il backend risponde.
      body: JSON.stringify({
        email: "healthcheck@invalid.local",
        password: "__invalid__",
      }),
      cache: "no-store",
    });

    const elapsedMs = Date.now() - startedAt;

    return NextResponse.json({
      online: true,
      connected: true,
      backendUrl: BACKEND_BASE_URL,
      statusCode: backendResponse.status,
      responseTimeMs: elapsedMs,
      message:
        backendResponse.status === 401
          ? "Backend raggiungibile: endpoint auth operativo (401 atteso su credenziali invalide)."
          : "Backend raggiungibile: risposta ricevuta dall'endpoint auth.",
    });
  } catch {
    const elapsedMs = Date.now() - startedAt;

    return NextResponse.json(
      {
        online: false,
        connected: false,
        backendUrl: BACKEND_BASE_URL,
        statusCode: null,
        responseTimeMs: elapsedMs,
        message: "Backend non raggiungibile. Verifica che SpringBoot sia avviato.",
      },
      { status: 502 },
    );
  }
}
