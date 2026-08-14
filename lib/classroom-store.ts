import { del, list, put } from "@vercel/blob";
import { randomBytes } from "node:crypto";
import type { StudentProfile, StudentSubmission, SubmissionKind } from "@/app/student/types";
import { classroomConfigured, decryptClassroomRecord, encryptClassroomRecord, studentCodeLookup } from "@/lib/classroom-security";

const STUDENT_PREFIX = "classroom/students/";
const CODE_PREFIX = "classroom/codes/";
const SUBMISSION_PREFIX = "classroom/submissions/";
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

type StoredStudent = StudentProfile & { codeHash: string };
type CodeRecord = { studentId: string };

async function readEncrypted<T>(url: string, etag?: string) {
  try {
    const separator = url.includes("?") ? "&" : "?";
    const response = await fetch(`${url}${separator}version=${encodeURIComponent(etag || "current")}`, { cache: "no-store" });
    if (!response.ok) return null;
    return decryptClassroomRecord<T>(await response.text());
  } catch {
    return null;
  }
}

async function recordAt<T>(pathname: string) {
  if (!classroomConfigured()) return null;
  const result = await list({ prefix: pathname, limit: 1 });
  const blob = result.blobs.find((item) => item.pathname === pathname);
  return blob ? readEncrypted<T>(blob.url, blob.etag) : null;
}

async function writeEncrypted(pathname: string, value: unknown) {
  if (!classroomConfigured()) throw new Error("Кабинет учеников не настроен.");
  await put(pathname, encryptClassroomRecord(value), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/octet-stream",
  });
}

async function recordsUnder<T>(prefix: string) {
  if (!classroomConfigured()) return [] as T[];
  const result = await list({ prefix, limit: 1000 });
  const records = await Promise.all(result.blobs.map((blob) => readEncrypted<T>(blob.url, blob.etag)));
  return records.filter((record) => record !== null) as T[];
}

function publicStudent(student: StoredStudent): StudentProfile {
  const { codeHash: _codeHash, ...profile } = student;
  void _codeHash;
  return profile;
}

function newAccessCode() {
  const bytes = randomBytes(8);
  const raw = Array.from(bytes, (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join("");
  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
}

export async function getStudents(includeInactive = true) {
  const students = await recordsUnder<StoredStudent>(STUDENT_PREFIX);
  return students.filter((student) => includeInactive || student.active).map(publicStudent).sort((a, b) => a.displayName.localeCompare(b.displayName, "ru"));
}

export async function getStudent(id: string) {
  const student = await recordAt<StoredStudent>(`${STUDENT_PREFIX}${id}.bin`);
  return student ? publicStudent(student) : null;
}

async function getStoredStudent(id: string) {
  return recordAt<StoredStudent>(`${STUDENT_PREFIX}${id}.bin`);
}

export async function createStudent(displayName: string) {
  const now = new Date().toISOString();
  const id = `student-${crypto.randomUUID()}`;
  const accessCode = newAccessCode();
  const codeHash = studentCodeLookup(accessCode);
  const student: StoredStudent = { id, displayName, codeHint: accessCode.slice(-4), codeHash, active: true, createdAt: now, updatedAt: now };
  await Promise.all([
    writeEncrypted(`${STUDENT_PREFIX}${id}.bin`, student),
    writeEncrypted(`${CODE_PREFIX}${codeHash}.bin`, { studentId: id } satisfies CodeRecord),
  ]);
  return { student: publicStudent(student), accessCode };
}

export async function findStudentByCode(accessCode: string) {
  const codeHash = studentCodeLookup(accessCode);
  const mapping = await recordAt<CodeRecord>(`${CODE_PREFIX}${codeHash}.bin`);
  if (!mapping) return null;
  const student = await getStoredStudent(mapping.studentId);
  return student?.active && student.codeHash === codeHash ? publicStudent(student) : null;
}

export async function regenerateStudentCode(id: string) {
  const existing = await getStoredStudent(id);
  if (!existing) return null;
  const accessCode = newAccessCode();
  const codeHash = studentCodeLookup(accessCode);
  const updated: StoredStudent = { ...existing, active: true, codeHash, codeHint: accessCode.slice(-4), updatedAt: new Date().toISOString() };
  await Promise.all([
    writeEncrypted(`${STUDENT_PREFIX}${id}.bin`, updated),
    writeEncrypted(`${CODE_PREFIX}${codeHash}.bin`, { studentId: id } satisfies CodeRecord),
    del(`${CODE_PREFIX}${existing.codeHash}.bin`).catch(() => undefined),
  ]);
  return { student: publicStudent(updated), accessCode };
}

export async function archiveStudent(id: string) {
  const existing = await getStoredStudent(id);
  if (!existing) return null;
  const updated: StoredStudent = { ...existing, active: false, updatedAt: new Date().toISOString() };
  await Promise.all([
    writeEncrypted(`${STUDENT_PREFIX}${id}.bin`, updated),
    del(`${CODE_PREFIX}${existing.codeHash}.bin`).catch(() => undefined),
  ]);
  return publicStudent(updated);
}

export async function deleteStudent(id: string) {
  const existing = await getStoredStudent(id);
  if (!existing) return false;
  const submissions = await getSubmissions(id);
  await Promise.all([
    del([`${STUDENT_PREFIX}${id}.bin`, ...submissions.map((item) => `${SUBMISSION_PREFIX}${item.id}.bin`)]),
    del(`${CODE_PREFIX}${existing.codeHash}.bin`).catch(() => undefined),
  ]);
  return true;
}

export async function getSubmissions(studentId?: string) {
  const records = await recordsUnder<StudentSubmission>(SUBMISSION_PREFIX);
  return records.filter((record) => !studentId || record.studentId === studentId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function saveStudentSubmission(input: { studentId: string; kind: SubmissionKind; taskId: string; taskTitle: string; answer: string; notes: string }) {
  const existing = (await getSubmissions(input.studentId)).find((item) => item.kind === input.kind && item.taskId === input.taskId && item.status === "pending");
  const now = new Date().toISOString();
  const submission: StudentSubmission = {
    id: existing?.id || `submission-${crypto.randomUUID()}`,
    ...input,
    status: "pending",
    score: null,
    maxScore: input.kind === "practice" ? 5 : 6,
    feedback: "",
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    reviewedAt: null,
  };
  await writeEncrypted(`${SUBMISSION_PREFIX}${submission.id}.bin`, submission);
  return submission;
}

export async function reviewSubmission(input: { id: string; status: "reviewed" | "returned"; score: number | null; maxScore: number; feedback: string }) {
  const existing = await recordAt<StudentSubmission>(`${SUBMISSION_PREFIX}${input.id}.bin`);
  if (!existing) return null;
  const now = new Date().toISOString();
  const updated: StudentSubmission = { ...existing, ...input, updatedAt: now, reviewedAt: now };
  await writeEncrypted(`${SUBMISSION_PREFIX}${updated.id}.bin`, updated);
  return updated;
}
