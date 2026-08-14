import { NextResponse } from "next/server";
import type { TheoryLessonInput } from "@/app/theory/types";
import { isAdminAuthenticated, requestHasSameOrigin } from "@/lib/admin-auth";
import { archiveTheoryLesson, deleteTheoryLesson, getTheoryLesson, getTheoryLessons, saveTheoryLesson } from "@/lib/theory-store";

function validate(input: Partial<TheoryLessonInput>) {
  if (!input.short?.trim() || !input.title?.trim() || !input.intro?.trim()) return "Заполните короткое название, заголовок и вступление.";
  if (!Array.isArray(input.body) || !input.body.some((line) => line.trim())) return "Добавьте хотя бы один абзац урока.";
  if (typeof input.minutes !== "number" || !Number.isInteger(input.minutes) || input.minutes < 1 || input.minutes > 120) return "Укажите время от 1 до 120 минут.";
  if (typeof input.sortOrder !== "number" || !Number.isInteger(input.sortOrder) || input.sortOrder < 1 || input.sortOrder > 9999) return "Укажите позицию урока.";
  if (input.question) {
    if (!input.question.prompt.trim()) return "Добавьте вопрос теста.";
    if (input.question.options.length < 2 || input.question.options.some((option) => !option.text.trim())) return "Добавьте не менее двух вариантов ответа.";
    if (!input.question.options.some((option) => option.id === input.question?.correctOptionId)) return "Выберите правильный вариант.";
  }
  return null;
}

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Требуется вход." }, { status: 401 });
  return NextResponse.json({ lessons: await getTheoryLessons(true, true) });
}

export async function POST(request: Request) {
  if (!requestHasSameOrigin(request)) return NextResponse.json({ error: "Недопустимый источник запроса." }, { status: 403 });
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Требуется вход." }, { status: 401 });
  const input = (await request.json()) as TheoryLessonInput;
  const error = validate(input);
  if (error) return NextResponse.json({ error }, { status: 400 });
  const lesson = await saveTheoryLesson({
    ...input,
    short: input.short.trim(), title: input.title.trim(), intro: input.intro.trim(),
    body: input.body.map((line) => line.trim()).filter(Boolean),
    bullets: input.bullets.map((line) => line.trim()).filter(Boolean),
    callout: input.callout.trim(), before: input.before.trim(), after: input.after.trim(),
    question: input.question ? {
      ...input.question,
      prompt: input.question.prompt.trim(), explanation: input.question.explanation.trim(),
      options: input.question.options.map((option) => ({ ...option, text: option.text.trim() })),
    } : null,
    archived: false,
  });
  return NextResponse.json({ lesson });
}

export async function DELETE(request: Request) {
  if (!requestHasSameOrigin(request)) return NextResponse.json({ error: "Недопустимый источник запроса." }, { status: 403 });
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Требуется вход." }, { status: 401 });
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Не указан идентификатор." }, { status: 400 });
  if (url.searchParams.get("permanent") === "true") {
    const existing = await getTheoryLesson(id);
    if (!existing) return NextResponse.json({ error: "Урок не найден." }, { status: 404 });
    if (!existing.archived) return NextResponse.json({ error: "Сначала перенесите урок в архив." }, { status: 409 });
    await deleteTheoryLesson(id);
    return NextResponse.json({ ok: true });
  }
  const lesson = await archiveTheoryLesson(id);
  if (!lesson) return NextResponse.json({ error: "Урок не найден." }, { status: 404 });
  return NextResponse.json({ lesson });
}
