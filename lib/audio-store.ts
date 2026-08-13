import { del, list, put } from "@vercel/blob";
import type { AudioExercise, AudioExerciseInput } from "@/app/audio/types";

const RECORD_PREFIX = "audio-exercises/records/";

function configured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function normalizeRecord(value: unknown): AudioExercise | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<AudioExercise>;
  if (!item.id || !item.title || !item.audioUrl || !item.audioPathname) return null;
  return item as AudioExercise;
}

async function fetchRecord(url: string) {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;
    return normalizeRecord(await response.json());
  } catch {
    return null;
  }
}

export async function getAudioExercises(includeDrafts = false) {
  if (!configured()) return [] as AudioExercise[];
  const result = await list({ prefix: RECORD_PREFIX, limit: 1000 });
  const records = await Promise.all(result.blobs.map((blob) => fetchRecord(blob.url)));
  return records
    .filter((record): record is AudioExercise => Boolean(record))
    .filter((record) => includeDrafts || record.published)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getAudioExercise(id: string) {
  const records = await getAudioExercises(true);
  return records.find((record) => record.id === id) || null;
}

export async function saveAudioExercise(input: AudioExerciseInput) {
  if (!configured()) throw new Error("Хранилище аудио не настроено.");
  const existing = input.id ? await getAudioExercise(input.id) : null;
  const now = new Date().toISOString();
  const id = existing?.id || input.id || crypto.randomUUID();
  const record: AudioExercise = {
    ...input,
    id,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  await put(`${RECORD_PREFIX}${id}.json`, JSON.stringify(record), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json; charset=utf-8",
  });

  if (existing && existing.audioPathname !== record.audioPathname) {
    await del(existing.audioUrl).catch(() => undefined);
  }
  return record;
}

export async function deleteAudioExercise(id: string) {
  if (!configured()) throw new Error("Хранилище аудио не настроено.");
  const existing = await getAudioExercise(id);
  if (!existing) return false;
  await Promise.all([
    del(existing.audioUrl),
    del(`${RECORD_PREFIX}${id}.json`),
  ]);
  return true;
}

