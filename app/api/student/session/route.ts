import { NextResponse } from "next/server";
import { requestHasSameOrigin } from "@/lib/admin-auth";
import { classroomConfigured } from "@/lib/classroom-security";
import { findStudentByCode } from "@/lib/classroom-store";
import { createStudentSession, getAuthenticatedStudent, STUDENT_COOKIE, studentCookieOptions } from "@/lib/student-auth";

const attempts = new Map<string, { count: number; resetAt: number }>();
function clientKey(request: Request) { return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local"; }

export async function GET() {
  const student = await getAuthenticatedStudent();
  return student ? NextResponse.json({ student }) : NextResponse.json({ error: "Вход не выполнен." }, { status: 401 });
}

export async function POST(request: Request) {
  if (!requestHasSameOrigin(request)) return NextResponse.json({ error: "Недопустимый источник запроса." }, { status: 403 });
  if (!classroomConfigured()) return NextResponse.json({ error: "Кабинет учеников ещё не настроен." }, { status: 503 });
  const key = clientKey(request);
  const now = Date.now();
  const state = attempts.get(key);
  if (state && state.resetAt > now && state.count >= 10) return NextResponse.json({ error: "Слишком много попыток. Попробуйте через 15 минут." }, { status: 429 });
  const body = (await request.json().catch(() => ({}))) as { accessCode?: string };
  const student = body.accessCode && body.accessCode.length <= 50 ? await findStudentByCode(body.accessCode) : null;
  if (!student) {
    const current = state && state.resetAt > now ? state : { count: 0, resetAt: now + 15 * 60 * 1000 };
    attempts.set(key, { ...current, count: current.count + 1 });
    return NextResponse.json({ error: "Код не найден. Проверьте символы или попросите учителя выдать новый код." }, { status: 401 });
  }
  attempts.delete(key);
  const response = NextResponse.json({ student });
  response.cookies.set(STUDENT_COOKIE, createStudentSession(student), studentCookieOptions());
  return response;
}

export async function DELETE(request: Request) {
  if (!requestHasSameOrigin(request)) return NextResponse.json({ error: "Недопустимый источник запроса." }, { status: 403 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(STUDENT_COOKIE, "", { ...studentCookieOptions(), maxAge: 0 });
  return response;
}
