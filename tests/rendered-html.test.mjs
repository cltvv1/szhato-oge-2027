import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

test("includes the public audio catalog and author panel", async () => {
  await Promise.all([
    access(new URL("app/audio/page.tsx", root)),
    access(new URL("app/admin/page.tsx", root)),
    access(new URL("app/api/audio-exercises/route.ts", root)),
    access(new URL("app/api/admin/exercises/route.ts", root)),
  ]);

  const [shell, catalog, admin] = await Promise.all([
    source("app/components/AppShell.tsx"),
    source("app/audio/page.tsx"),
    source("app/admin/AdminDashboard.tsx"),
  ]);

  assert.match(shell, /href:\s*"\/audio"/);
  assert.match(catalog, /getAudioExercises\(false\)/);
  assert.match(admin, /handleUploadUrl:\s*"\/api\/admin\/audio\/upload"/);
  assert.match(admin, /published/);
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
