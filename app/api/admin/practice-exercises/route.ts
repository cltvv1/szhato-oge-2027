import { NextResponse } from "next/server";
import {
  PRACTICE_LEVELS,
  type PracticeExerciseInput,
} from "@/app/practice/types";
import { isAdminAuthenticated, requestHasSameOrigin } from "@/lib/admin-auth";
import {
  archivePracticeExercise,
  deletePracticeExercise,
  getPracticeExercise,
  getPracticeExercises,
  savePracticeExercise,
} from "@/lib/practice-store";
import { getPracticeSection, getPracticeSections } from "@/lib/practice-section-store";

function validate(input: Partial<PracticeExerciseInput>) {
  if (!input.title?.trim()) return "Укажите название задания.";
  if (!input.source?.trim()) return "Добавьте исходный текст.";
  if (!input.prompt?.trim()) return "Добавьте формулировку задания.";
  if (!input.model?.trim()) return "Добавьте возможный разбор.";
  if (!input.block) return "Выберите направление практики.";
  if (!input.level || !PRACTICE_LEVELS.includes(input.level)) return "Выберите уровень сложности.";
  if (typeof input.minutes !== "number" || !Number.isInteger(input.minutes) || input.minutes < 1 || input.minutes > 120) return "Укажите время от 1 до 120 минут.";
  if (typeof input.sortOrder !== "number" || !Number.isInteger(input.sortOrder) || input.sortOrder < 1 || input.sortOrder > 9999) return "Укажите позицию в списке.";
  if (input.title.length > 140) return "Название слишком длинное.";
  if (input.source.length > 30000 || input.prompt.length > 10000 || input.model.length > 30000) return "Один из текстов слишком длинный.";
  return null;
}

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Требуется вход." }, { status: 401 });
  const [exercises, sections] = await Promise.all([getPracticeExercises(true, true), getPracticeSections(true, true)]);
  return NextResponse.json({ exercises, sections });
}

export async function POST(request: Request) {
  if (!requestHasSameOrigin(request)) return NextResponse.json({ error: "Недопустимый источник запроса." }, { status: 403 });
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Требуется вход." }, { status: 401 });
  const input = (await request.json()) as PracticeExerciseInput;
  const error = validate(input);
  if (error) return NextResponse.json({ error }, { status: 400 });
  const section = await getPracticeSection(input.block);
  if (!section || section.archived) return NextResponse.json({ error: "Выбранное направление не найдено или находится в архиве." }, { status: 400 });

  const exercise = await savePracticeExercise({
    ...input,
    title: input.title.trim(),
    source: input.source.trim(),
    prompt: input.prompt.trim(),
    model: input.model.trim(),
    archived: false,
  });
  return NextResponse.json({ exercise });
}

export async function DELETE(request: Request) {
  if (!requestHasSameOrigin(request)) return NextResponse.json({ error: "Недопустимый источник запроса." }, { status: 403 });
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Требуется вход." }, { status: 401 });
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Не указан идентификатор." }, { status: 400 });
  if (url.searchParams.get("permanent") === "true") {
    const existing = await getPracticeExercise(id);
    if (!existing) return NextResponse.json({ error: "Задание не найдено." }, { status: 404 });
    if (!existing.archived) return NextResponse.json({ error: "Сначала перенесите задание в архив." }, { status: 409 });
    await deletePracticeExercise(id);
    return NextResponse.json({ ok: true });
  }
  const exercise = await archivePracticeExercise(id);
  if (!exercise) return NextResponse.json({ error: "Задание не найдено." }, { status: 404 });
  return NextResponse.json({ exercise });
}
