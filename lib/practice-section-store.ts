import { list, put } from "@vercel/blob";
import {
  PRACTICE_BLOCK_DESCRIPTIONS,
  PRACTICE_BLOCK_LABELS,
  PRACTICE_BLOCKS,
  type PracticeSection,
  type PracticeSectionInput,
} from "@/app/practice/types";

const RECORD_PREFIX = "practice-sections/records/";
const SEED_DATE = "2026-08-01T00:00:00.000Z";

function configured() { return Boolean(process.env.BLOB_READ_WRITE_TOKEN); }

function normalizeRecord(value: unknown): PracticeSection | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<PracticeSection>;
  if (!item.id || !item.title) return null;
  return { ...item, description: item.description || "", isSeed: Boolean(item.isSeed) } as PracticeSection;
}

async function storedRecords() {
  if (!configured()) return [] as PracticeSection[];
  const result = await list({ prefix: RECORD_PREFIX, limit: 1000 });
  const records = await Promise.all(result.blobs.map(async (blob) => {
    try {
      const separator = blob.url.includes("?") ? "&" : "?";
      const response = await fetch(`${blob.url}${separator}version=${encodeURIComponent(blob.etag)}`, { cache: "no-store" });
      return response.ok ? normalizeRecord(await response.json()) : null;
    } catch { return null; }
  }));
  return records.filter((record): record is PracticeSection => Boolean(record));
}

function seedSection(id: string, index: number): PracticeSection {
  return {
    id,
    title: PRACTICE_BLOCK_LABELS[id],
    description: PRACTICE_BLOCK_DESCRIPTIONS[id],
    published: true,
    archived: false,
    sortOrder: index + 1,
    createdAt: SEED_DATE,
    updatedAt: SEED_DATE,
    isSeed: true,
  };
}

export async function getPracticeSections(includeUnpublished = false, includeArchived = false) {
  const stored = await storedRecords();
  const overrides = new Map(stored.map((record) => [record.id, record]));
  const seedIds = new Set<string>(PRACTICE_BLOCKS);
  const seeds = PRACTICE_BLOCKS.map((id, index) => ({ ...seedSection(id, index), ...overrides.get(id), isSeed: true }));
  const additions = stored.filter((record) => !seedIds.has(record.id)).map((record) => ({ ...record, isSeed: false }));
  return [...seeds, ...additions]
    .filter((record) => includeArchived || !record.archived)
    .filter((record) => includeUnpublished || record.published)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));
}

export async function getPracticeSection(id: string) {
  return (await getPracticeSections(true, true)).find((record) => record.id === id) || null;
}

export async function savePracticeSection(input: PracticeSectionInput) {
  if (!configured()) throw new Error("Хранилище направлений не настроено.");
  const existing = input.id ? await getPracticeSection(input.id) : null;
  const now = new Date().toISOString();
  const record: PracticeSection = {
    ...input,
    id: existing?.id || input.id || `section-${crypto.randomUUID()}`,
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

export async function archivePracticeSection(id: string) {
  const existing = await getPracticeSection(id);
  if (!existing) return null;
  return savePracticeSection({ ...existing, id, published: false, archived: true });
}
