import { NextResponse } from "next/server";
import type { SubmissionKind } from "@/app/student/types";
import { requestHasSameOrigin } from "@/lib/admin-auth";
import { getAudioExercise } from "@/lib/audio-store";
import { getSubmissions, saveStudentSubmission } from "@/lib/classroom-store";
import { getPracticeExercise } from "@/lib/practice-store";
import { getAuthenticatedStudent } from "@/lib/student-auth";

async function taskTitle(kind: SubmissionKind, taskId: string) {
  if (kind === "practice") {
    const item = await getPracticeExercise(taskId);
    return item && item.published && !item.archived ? item.title : null;
  }
  const item = await getAudioExercise(taskId);
  if (!item || !item.published) return null;
  if (kind === "audio" && !item.availableInAudio) return null;
  if (kind === "exam" && !item.availableInExam) return null;
  return item.title;
}

export async function GET() {
  const student = await getAuthenticatedStudent();
  if (!student) return NextResponse.json({ error: "Требуется вход ученика." }, { status: 401 });
  return NextResponse.json({ student, submissions: await getSubmissions(student.id) });
}

export async function POST(request: Request) {
  if (!requestHasSameOrigin(request)) return NextResponse.json({ error: "Недопустимый источник запроса." }, { status: 403 });
  const student = await getAuthenticatedStudent();
  if (!student) return NextResponse.json({ error: "Сначала войдите как ученик." }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { kind?: SubmissionKind; taskId?: string; answer?: string; notes?: string };
  if (!body.kind || !["practice", "audio", "exam"].includes(body.kind) || !body.taskId) return NextResponse.json({ error: "Не удалось определить задание." }, { status: 400 });
  const answer = body.answer?.trim() || "";
  const notes = body.notes?.trim() || "";
  if (!answer) return NextResponse.json({ error: "Сначала напишите ответ." }, { status: 400 });
  if (answer.length > 50000 || notes.length > 30000) return NextResponse.json({ error: "Работа слишком большая для отправки." }, { status: 400 });
  const title = await taskTitle(body.kind, body.taskId);
  if (!title) return NextResponse.json({ error: "Задание больше не опубликовано." }, { status: 404 });
  const submission = await saveStudentSubmission({ studentId: student.id, kind: body.kind, taskId: body.taskId, taskTitle: title, answer, notes });
  return NextResponse.json({ submission });
}
