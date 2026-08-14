import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

test("uses course navigation with student results and no duplicate home link", async () => {
  const shell = await source("app/components/AppShell.tsx");

  for (const href of ["/theory", "/practice", "/audio", "/simulator"]) {
    assert.match(shell, new RegExp(`href: "${href.replace("/", "\\/")}"`));
  }
  assert.match(shell, /href: "\/student"/);
  assert.doesNotMatch(shell, /href:\s*"\/"/);
  assert.match(shell, /href="\/"/);
  assert.match(shell, /\/api\/course-summary/);
});

test("keeps student work encrypted and exposes teacher review through protected routes", async () => {
  await Promise.all([
    access(new URL("app/student/StudentDashboard.tsx", root)),
    access(new URL("app/admin/ClassroomAdmin.tsx", root)),
    access(new URL("app/api/student/submissions/route.ts", root)),
    access(new URL("app/api/admin/classroom/route.ts", root)),
  ]);

  const [security, studentAuth, store, studentRoute, adminRoute, practice, audio, exam] = await Promise.all([
    source("lib/classroom-security.ts"),
    source("lib/student-auth.ts"),
    source("lib/classroom-store.ts"),
    source("app/api/student/submissions/route.ts"),
    source("app/api/admin/classroom/route.ts"),
    source("app/practice/PracticeClient.tsx"),
    source("app/audio/AudioCatalogClient.tsx"),
    source("app/simulator/ExamSimulator.tsx"),
  ]);

  assert.match(security, /aes-256-gcm/);
  assert.match(security, /CLASSROOM_SECRET/);
  assert.match(studentAuth, /httpOnly:\s*true/);
  assert.match(studentAuth, /sameSite:\s*"strict"/);
  assert.match(store, /encryptClassroomRecord\(value\)/);
  assert.match(adminRoute, /isAdminAuthenticated/);
  assert.match(studentRoute, /getAuthenticatedStudent/);
  assert.match(practice, /kind="practice"/);
  assert.match(audio, /kind="audio"/);
  assert.match(exam, /kind="exam"/);
});

test("serves author-managed theory lessons with optional tests", async () => {
  await Promise.all([
    access(new URL("app/theory/TheoryClient.tsx", root)),
    access(new URL("app/admin/TheoryAdmin.tsx", root)),
    access(new URL("app/api/admin/theory-lessons/route.ts", root)),
    access(new URL("lib/theory-store.ts", root)),
  ]);

  const [page, client, admin, store] = await Promise.all([
    source("app/theory/page.tsx"),
    source("app/theory/TheoryClient.tsx"),
    source("app/admin/TheoryAdmin.tsx"),
    source("lib/theory-store.ts"),
  ]);

  assert.match(page, /getTheoryLessons\(\)/);
  assert.match(client, /lesson\.question\.correctOptionId/);
  assert.match(admin, /hasQuestion/);
  assert.match(admin, /questionOptionsText/);
  assert.match(store, /BLOB_READ_WRITE_TOKEN/);
});

test("keeps practice directions dynamic and author-managed", async () => {
  await Promise.all([
    access(new URL("app/practice/PracticeClient.tsx", root)),
    access(new URL("app/admin/PracticeSectionsAdmin.tsx", root)),
    access(new URL("app/api/admin/practice-sections/route.ts", root)),
    access(new URL("lib/practice-section-store.ts", root)),
  ]);

  const [page, practice, admin, route] = await Promise.all([
    source("app/practice/page.tsx"),
    source("app/practice/PracticeClient.tsx"),
    source("app/admin/PracticeAdmin.tsx"),
    source("app/api/admin/practice-exercises/route.ts"),
  ]);

  assert.match(page, /getPracticeSections\(\)/);
  assert.match(page, /visibleSectionIds\.has\(exercise\.block\)/);
  assert.match(practice, /visibleSections\.map/);
  assert.match(practice, /useState<string \| null>\(null\)/);
  assert.match(practice, /setFilter\(block\);\s*setOpen\(null\);/);
  assert.match(admin, /PracticeSectionsAdmin/);
  assert.match(route, /getPracticeSection/);
});

test("permanently removes archived author content only after explicit confirmation", async () => {
  const [practiceAdmin, sectionsAdmin, theoryAdmin, practiceRoute, sectionsRoute, theoryRoute, practiceStore, sectionsStore, theoryStore] = await Promise.all([
    source("app/admin/PracticeAdmin.tsx"),
    source("app/admin/PracticeSectionsAdmin.tsx"),
    source("app/admin/TheoryAdmin.tsx"),
    source("app/api/admin/practice-exercises/route.ts"),
    source("app/api/admin/practice-sections/route.ts"),
    source("app/api/admin/theory-lessons/route.ts"),
    source("lib/practice-store.ts"),
    source("lib/practice-section-store.ts"),
    source("lib/theory-store.ts"),
  ]);

  for (const admin of [practiceAdmin, sectionsAdmin, theoryAdmin]) {
    assert.match(admin, /Удалить навсегда/);
    assert.match(admin, /window\.confirm/);
    assert.match(admin, /permanent=true/);
  }
  for (const route of [practiceRoute, sectionsRoute, theoryRoute]) {
    assert.match(route, /searchParams\.get\("permanent"\) === "true"/);
    assert.match(route, /Сначала перенесите/);
  }
  assert.match(sectionsRoute, /Сначала удалите все задания/);
  assert.match(practiceStore, /deletePracticeExercise/);
  assert.match(sectionsStore, /deletePracticeSection/);
  assert.match(theoryStore, /deleteTheoryLesson/);
});

test("uses one audio library for free training and a protected exam flow", async () => {
  await Promise.all([
    access(new URL("app/audio/AudioCatalogClient.tsx", root)),
    access(new URL("app/simulator/ExamSimulator.tsx", root)),
    access(new URL("app/api/admin/exercises/route.ts", root)),
  ]);

  const [audioPage, catalog, examPage, exam, admin] = await Promise.all([
    source("app/audio/page.tsx"),
    source("app/audio/AudioCatalogClient.tsx"),
    source("app/simulator/page.tsx"),
    source("app/simulator/ExamSimulator.tsx"),
    source("app/admin/AdminDashboard.tsx"),
  ]);

  assert.match(audioPage, /getAudioExercises\(false, "audio"\)/);
  assert.match(catalog, /onlyUnfinished/);
  assert.match(catalog, /randomExercise/);
  assert.match(examPage, /getAudioExercises\(false, "exam"\)/);
  assert.doesNotMatch(examPage, /sourceText:\s*item\.sourceText/);
  assert.match(exam, /listens >= 2/);
  assert.match(exam, /onEnded={listeningEnded}/);
  assert.match(admin, /availableInAudio/);
  assert.match(admin, /availableInExam/);
});

test("keeps admin credentials server-side and session cookies hardened", async () => {
  const [auth, uploadRoute, gitignore] = await Promise.all([
    source("lib/admin-auth.ts"),
    source("app/api/admin/audio/upload/route.ts"),
    source(".gitignore"),
  ]);

  assert.match(auth, /process\.env\.ADMIN_PASSWORD/);
  assert.match(auth, /process\.env\.ADMIN_SESSION_SECRET/);
  assert.match(auth, /httpOnly:\s*true/);
  assert.match(auth, /sameSite:\s*"strict"/);
  assert.match(uploadRoute, /maximumSizeInBytes:\s*100\s*\*\s*1024\s*\*\s*1024/);
  assert.match(gitignore, /^\.env\*/m);
  assert.doesNotMatch(auth, /ADMIN_PASSWORD\s*=/);
});
