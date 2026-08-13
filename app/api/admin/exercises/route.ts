import { NextResponse } from "next/server";
import { AUDIO_DIFFICULTIES, type AudioExerciseInput } from "@/app/audio/types";
import { isAdminAuthenticated, requestHasSameOrigin } from "@/lib/admin-auth";
import { deleteAudioExercise, getAudioExercises, saveAudioExercise } from "@/lib/audio-store";

async function authorized() {
  return isAdminAuthenticated();
}

function validate(input: Partial<AudioExerciseInput>) {
  if (!input.title?.trim()) return "Укажите название упражнения.";
  if (!input.sourceText?.trim()) return "Добавьте исходный текст.";
  if (!input.audioUrl || !input.audioPathname) return "Загрузите аудиофайл.";
  if (!input.difficulty || !AUDIO_DIFFICULTIES.includes(input.difficulty)) return "Выберите уровень сложности.";
  if ((input.title?.length || 0) > 140) return "Название слишком длинное.";
  if ((input.sourceText?.length || 0) > 30000) return "Текст слишком длинный.";
  return null;
}

export async function GET() {
  if (!(await authorized())) return NextResponse.json({ error: "Требуется вход." }, { status: 401 });
  return NextResponse.json({ exercises: await getAudioExercises(true) });
}

export async function POST(request: Request) {
  if (!requestHasSameOrigin(request)) return NextResponse.json({ error: "Недопустимый источник запроса." }, { status: 403 });
  if (!(await authorized())) return NextResponse.json({ error: "Требуется вход." }, { status: 401 });
  const input = (await request.json()) as AudioExerciseInput;
  const error = validate(input);
  if (error) return NextResponse.json({ error }, { status: 400 });
  const exercise = await saveAudioExercise({
    ...input,
    title: input.title.trim(),
    description: input.description.trim(),
    sourceText: input.sourceText.trim(),
    sourceName: input.sourceName.trim(),
  });
  return NextResponse.json({ exercise });
}

export async function DELETE(request: Request) {
  if (!requestHasSameOrigin(request)) return NextResponse.json({ error: "Недопустимый источник запроса." }, { status: 403 });
  if (!(await authorized())) return NextResponse.json({ error: "Требуется вход." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Не указан идентификатор." }, { status: 400 });
  await deleteAudioExercise(id);
  return NextResponse.json({ ok: true });
}

