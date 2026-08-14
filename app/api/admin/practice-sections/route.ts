import { NextResponse } from "next/server";
import type { PracticeSectionInput } from "@/app/practice/types";
import { isAdminAuthenticated, requestHasSameOrigin } from "@/lib/admin-auth";
import { archivePracticeSection, deletePracticeSection, getPracticeSection, getPracticeSections, savePracticeSection } from "@/lib/practice-section-store";
import { getPracticeExercises } from "@/lib/practice-store";

function validate(input: Partial<PracticeSectionInput>) {
  if (!input.title?.trim()) return "Укажите название направления.";
  if (input.title.length > 100) return "Название слишком длинное.";
  if ((input.description?.length || 0) > 1000) return "Описание слишком длинное.";
  if (typeof input.sortOrder !== "number" || !Number.isInteger(input.sortOrder) || input.sortOrder < 1 || input.sortOrder > 9999) return "Укажите позицию в списке.";
  return null;
}

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Требуется вход." }, { status: 401 });
  return NextResponse.json({ sections: await getPracticeSections(true, true) });
}

export async function POST(request: Request) {
  if (!requestHasSameOrigin(request)) return NextResponse.json({ error: "Недопустимый источник запроса." }, { status: 403 });
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Требуется вход." }, { status: 401 });
  const input = (await request.json()) as PracticeSectionInput;
  const error = validate(input);
  if (error) return NextResponse.json({ error }, { status: 400 });
  const section = await savePracticeSection({ ...input, title: input.title.trim(), description: input.description.trim(), archived: false });
  return NextResponse.json({ section });
}

export async function DELETE(request: Request) {
  if (!requestHasSameOrigin(request)) return NextResponse.json({ error: "Недопустимый источник запроса." }, { status: 403 });
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Требуется вход." }, { status: 401 });
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Не указан идентификатор." }, { status: 400 });
  if (url.searchParams.get("permanent") === "true") {
    const existing = await getPracticeSection(id);
    if (!existing) return NextResponse.json({ error: "Направление не найдено." }, { status: 404 });
    if (!existing.archived) return NextResponse.json({ error: "Сначала перенесите направление в архив." }, { status: 409 });
    const exercises = await getPracticeExercises(true, true);
    if (exercises.some((exercise) => exercise.block === id)) {
      return NextResponse.json({ error: "Сначала удалите все задания этого направления из архива." }, { status: 409 });
    }
    await deletePracticeSection(id);
    return NextResponse.json({ ok: true });
  }
  const section = await archivePracticeSection(id);
  if (!section) return NextResponse.json({ error: "Направление не найдено." }, { status: 404 });
  return NextResponse.json({ section });
}
