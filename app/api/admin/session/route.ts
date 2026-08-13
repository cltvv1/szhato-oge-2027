import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  adminAuthConfigured,
  adminCookieOptions,
  createAdminSession,
  requestHasSameOrigin,
  verifyAdminPassword,
} from "@/lib/admin-auth";

const attempts = new Map<string, { count: number; resetAt: number }>();

function clientKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export async function POST(request: Request) {
  if (!requestHasSameOrigin(request)) {
    return NextResponse.json({ error: "Недопустимый источник запроса." }, { status: 403 });
  }
  if (!adminAuthConfigured()) {
    return NextResponse.json({ error: "Администратор ещё не настроен." }, { status: 503 });
  }

  const key = clientKey(request);
  const now = Date.now();
  const state = attempts.get(key);
  if (state && state.resetAt > now && state.count >= 8) {
    return NextResponse.json({ error: "Слишком много попыток. Попробуйте через 15 минут." }, { status: 429 });
  }

  const body = (await request.json().catch(() => ({}))) as { password?: string };
  if (!body.password || body.password.length > 200 || !verifyAdminPassword(body.password)) {
    const current = state && state.resetAt > now ? state : { count: 0, resetAt: now + 15 * 60 * 1000 };
    attempts.set(key, { ...current, count: current.count + 1 });
    return NextResponse.json({ error: "Неверный пароль." }, { status: 401 });
  }

  attempts.delete(key);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, createAdminSession(), adminCookieOptions());
  return response;
}

export async function DELETE(request: Request) {
  if (!requestHasSameOrigin(request)) {
    return NextResponse.json({ error: "Недопустимый источник запроса." }, { status: 403 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, "", { ...adminCookieOptions(), maxAge: 0 });
  return response;
}

