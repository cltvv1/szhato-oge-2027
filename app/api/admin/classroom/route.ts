import { NextResponse } from "next/server";
import { isAdminAuthenticated, requestHasSameOrigin } from "@/lib/admin-auth";
import { classroomConfigured } from "@/lib/classroom-security";
import { archiveStudent, createStudent, deleteStudent, getStudents, getSubmissions, regenerateStudentCode, reviewSubmission } from "@/lib/classroom-store";

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Требуется вход." }, { status: 401 });
  if (!classroomConfigured()) return NextResponse.json({ error: "Кабинет учеников ещё не настроен." }, { status: 503 });
  const [students, submissions] = await Promise.all([getStudents(true), getSubmissions()]);
  return NextResponse.json({ students, submissions });
}

export async function POST(request: Request) {
  if (!requestHasSameOrigin(request)) return NextResponse.json({ error: "Недопустимый источник запроса." }, { status: 403 });
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Требуется вход." }, { status: 401 });
  if (!classroomConfigured()) return NextResponse.json({ error: "Кабинет учеников ещё не настроен." }, { status: 503 });
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  if (body.action === "createStudent") {
    const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
    if (displayName.length < 2 || displayName.length > 100) return NextResponse.json({ error: "Введите имя ученика от 2 до 100 символов." }, { status: 400 });
    return NextResponse.json(await createStudent(displayName));
  }
  if (body.action === "regenerateCode") {
    const result = typeof body.studentId === "string" ? await regenerateStudentCode(body.studentId) : null;
    return result ? NextResponse.json(result) : NextResponse.json({ error: "Ученик не найден." }, { status: 404 });
  }
  if (body.action === "archiveStudent") {
    const student = typeof body.studentId === "string" ? await archiveStudent(body.studentId) : null;
    return student ? NextResponse.json({ student }) : NextResponse.json({ error: "Ученик не найден." }, { status: 404 });
  }
  if (body.action === "deleteStudent") {
    const deleted = typeof body.studentId === "string" && await deleteStudent(body.studentId);
    return deleted ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Ученик не найден." }, { status: 404 });
  }
  if (body.action === "reviewSubmission") {
    const id = typeof body.submissionId === "string" ? body.submissionId : "";
    const status = body.status === "returned" ? "returned" : "reviewed";
    const maxScore = Number(body.maxScore);
    const score = body.score === null || body.score === "" ? null : Number(body.score);
    const feedback = typeof body.feedback === "string" ? body.feedback.trim() : "";
    if (!id || !Number.isInteger(maxScore) || maxScore < 1 || maxScore > 100) return NextResponse.json({ error: "Укажите корректную шкалу оценки." }, { status: 400 });
    if (score !== null && (!Number.isFinite(score) || score < 0 || score > maxScore)) return NextResponse.json({ error: "Оценка должна быть в пределах выбранной шкалы." }, { status: 400 });
    if (feedback.length > 10000) return NextResponse.json({ error: "Комментарий слишком длинный." }, { status: 400 });
    const submission = await reviewSubmission({ id, status, score, maxScore, feedback });
    return submission ? NextResponse.json({ submission }) : NextResponse.json({ error: "Работа не найдена." }, { status: 404 });
  }
  return NextResponse.json({ error: "Неизвестное действие." }, { status: 400 });
}
