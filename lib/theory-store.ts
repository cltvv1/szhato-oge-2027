import { list, put } from "@vercel/blob";
import { lessons as seedLessons } from "@/app/data";
import type { TheoryLesson, TheoryLessonInput } from "@/app/theory/types";

const RECORD_PREFIX = "theory-lessons/records/";
const SEED_DATE = "2026-08-01T00:00:00.000Z";

function configured() { return Boolean(process.env.BLOB_READ_WRITE_TOKEN); }

function normalizeRecord(value: unknown): TheoryLesson | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<TheoryLesson>;
  if (!item.id || !item.title || !item.short || !item.intro || !Array.isArray(item.body)) return null;
  return {
    ...item,
    bullets: Array.isArray(item.bullets) ? item.bullets : [],
    callout: item.callout || "",
    before: item.before || "",
    after: item.after || "",
    question: item.question || null,
    isSeed: Boolean(item.isSeed),
  } as TheoryLesson;
}

async function storedRecords() {
  if (!configured()) return [] as TheoryLesson[];
  const result = await list({ prefix: RECORD_PREFIX, limit: 1000 });
  const records = await Promise.all(result.blobs.map(async (blob) => {
    try {
      const separator = blob.url.includes("?") ? "&" : "?";
      const response = await fetch(`${blob.url}${separator}version=${encodeURIComponent(blob.etag)}`, { cache: "no-store" });
      return response.ok ? normalizeRecord(await response.json()) : null;
    } catch { return null; }
  }));
  return records.filter((record): record is TheoryLesson => Boolean(record));
}

function seedLesson(index: number): TheoryLesson {
  const lesson = seedLessons[index];
  return {
    ...lesson,
    bullets: lesson.bullets || [],
    callout: lesson.callout || "",
    before: lesson.before || "",
    after: lesson.after || "",
    question: null,
    published: true,
    archived: false,
    sortOrder: index + 1,
    createdAt: SEED_DATE,
    updatedAt: SEED_DATE,
    isSeed: true,
  };
}

export async function getTheoryLessons(includeUnpublished = false, includeArchived = false) {
  const stored = await storedRecords();
  const overrides = new Map(stored.map((record) => [record.id, record]));
  const seedIds = new Set(seedLessons.map((lesson) => lesson.id));
  const seeds = seedLessons.map((_, index) => {
    const base = seedLesson(index);
    return { ...base, ...overrides.get(base.id), isSeed: true };
  });
  const additions = stored.filter((record) => !seedIds.has(record.id)).map((record) => ({ ...record, isSeed: false }));
  return [...seeds, ...additions]
    .filter((record) => includeArchived || !record.archived)
    .filter((record) => includeUnpublished || record.published)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));
}

export async function getTheoryLesson(id: string) {
  return (await getTheoryLessons(true, true)).find((record) => record.id === id) || null;
}

export async function saveTheoryLesson(input: TheoryLessonInput) {
  if (!configured()) throw new Error("Хранилище теории не настроено.");
  const existing = input.id ? await getTheoryLesson(input.id) : null;
  const now = new Date().toISOString();
  const record: TheoryLesson = {
    ...input,
    id: existing?.id || input.id || `lesson-${crypto.randomUUID()}`,
    archived: input.archived ?? false,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    isSeed: existing?.isSeed || false,
  };
  await put(`${RECORD_PREFIX}${record.id}.json`, JSON.stringify(record), {
    access: "public", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json; charset=utf-8",
  });
  return record;
}

export async function archiveTheoryLesson(id: string) {
  const existing = await getTheoryLesson(id);
  if (!existing) return null;
  return saveTheoryLesson({ ...existing, id, published: false, archived: true });
}
