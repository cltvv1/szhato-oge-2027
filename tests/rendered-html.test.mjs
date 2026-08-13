import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

test("uses a four-part course navigation without a duplicate home link", async () => {
  const shell = await source("app/components/AppShell.tsx");

  for (const href of ["/theory", "/practice", "/audio", "/simulator"]) {
    assert.match(shell, new RegExp(`href: "${href.replace("/", "\\/")}"`));
  }
  assert.doesNotMatch(shell, /href:\s*"\/"/);
  assert.match(shell, /href="\/"/);
  assert.match(shell, /\/api\/course-summary/);
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
  assert.match(admin, /PracticeSectionsAdmin/);
  assert.match(route, /getPracticeSection/);
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
