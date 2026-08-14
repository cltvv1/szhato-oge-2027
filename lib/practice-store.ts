import { del, list, put } from "@vercel/blob";
import { exercises as seedExercises } from "@/app/data";
import type { PracticeExercise, PracticeExerciseInput } from "@/app/practice/types";

const RECORD_PREFIX = "practice-exercises/records/";
const SEED_DATE = "2026-08-01T00:00:00.000Z";

function configured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function normalizeRecord(value: unknown): PracticeExercise | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<PracticeExercise>;
  if (!item.id || !item.title || !item.block || !item.source || !item.prompt || !item.model) return null;
  return { ...item, deleted: Boolean(item.deleted), isSeed: Boolean(item.isSeed) } as PracticeExercise;
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

async function storedRecords() {
  if (!configured()) return [] as PracticeExercise[];
  const result = await list({ prefix: RECORD_PREFIX, limit: 1000 });
  const records = await Promise.all(result.blobs.map((blob) => {
    const separator = blob.url.includes("?") ? "&" : "?";
    return fetchRecord(`${blob.url}${separator}version=${encodeURIComponent(blob.etag)}`);
  }));
  return records.filter((record): record is PracticeExercise => Boolean(record));
}

function seedRecord(index: number): PracticeExercise {
  const seed = seedExercises[index];
  const positionInBlock = seedExercises.slice(0, index + 1).filter((exercise) => exercise.block === seed.block).length;
  return {
    ...seed,
    published: true,
    archived: false,
    deleted: false,
    sortOrder: positionInBlock,
    createdAt: SEED_DATE,
    updatedAt: SEED_DATE,
    isSeed: true,
  };
}

export async function getPracticeExercises(includeUnpublished = false, includeArchived = false) {
  const stored = await storedRecords();
  const overrides = new Map(stored.map((record) => [record.id, record]));
  const seedIds = new Set(seedExercises.map((exercise) => exercise.id));
  const mergedSeeds = seedExercises.map((_, index) => {
    const base = seedRecord(index);
    const override = overrides.get(base.id);
    return override ? { ...base, ...override, isSeed: true } : base;
  });
  const additions = stored.filter((record) => !seedIds.has(record.id)).map((record) => ({ ...record, isSeed: false }));

  return [...mergedSeeds, ...additions]
    .filter((record) => !record.deleted)
    .filter((record) => includeArchived || !record.archived)
    .filter((record) => includeUnpublished || record.published)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));
}

export async function getPracticeExercise(id: string) {
  const records = await getPracticeExercises(true, true);
  return records.find((record) => record.id === id) || null;
}

export async function savePracticeExercise(input: PracticeExerciseInput) {
  if (!configured()) throw new Error("Хранилище заданий не настроено.");
  const existing = input.id ? await getPracticeExercise(input.id) : null;
  const now = new Date().toISOString();
  const record: PracticeExercise = {
    ...input,
    id: existing?.id || input.id || `practice-${crypto.randomUUID()}`,
    archived: input.archived ?? false,
    deleted: input.deleted ?? false,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    isSeed: existing?.isSeed || false,
  };

  await put(`${RECORD_PREFIX}${record.id}.json`, JSON.stringify(record), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json; charset=utf-8",
  });
  return record;
}

export async function archivePracticeExercise(id: string) {
  const existing = await getPracticeExercise(id);
  if (!existing) return null;
  return savePracticeExercise({
    ...existing,
    id: existing.id,
    published: false,
    archived: true,
  });
}

export async function deletePracticeExercise(id: string) {
  const existing = await getPracticeExercise(id);
  if (!existing) return false;
  if (existing.isSeed) {
    await savePracticeExercise({ ...existing, id, published: false, archived: true, deleted: true });
  } else {
    await del(`${RECORD_PREFIX}${id}.json`);
  }
  return true;
}
