import { cookies } from "next/headers";
import type { StudentProfile } from "@/app/student/types";
import { classroomSecret, safeClassroomEqual, signClassroomValue } from "@/lib/classroom-security";
import { getStudent } from "@/lib/classroom-store";

export const STUDENT_COOKIE = "szhato_student";
const SESSION_SECONDS = 30 * 24 * 60 * 60;

export function createStudentSession(student: StudentProfile) {
  const payload = Buffer.from(JSON.stringify({ studentId: student.id, expiresAt: Date.now() + SESSION_SECONDS * 1000 })).toString("base64url");
  return `${payload}.${signClassroomValue(payload)}`;
}

export function verifyStudentSession(token?: string) {
  if (!token || !classroomSecret()) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeClassroomEqual(signature, signClassroomValue(payload))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { studentId?: string; expiresAt?: number };
    return parsed.studentId && typeof parsed.expiresAt === "number" && parsed.expiresAt > Date.now() ? parsed.studentId : null;
  } catch {
    return null;
  }
}

export async function getAuthenticatedStudent() {
  const store = await cookies();
  const id = verifyStudentSession(store.get(STUDENT_COOKIE)?.value);
  if (!id) return null;
  const student = await getStudent(id);
  return student?.active ? student : null;
}

export function studentCookieOptions() {
  return { httpOnly: true, sameSite: "strict" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_SECONDS };
}
