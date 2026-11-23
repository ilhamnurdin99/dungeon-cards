// Dungeon Cards — entrypoint.
// Run with: node main.ts
// Copies the playable game (index.html, css/, js/) into the output directory.
// The output directory is $MAKEFUN_OUTPUT_DIR when set (the grader provides a
// writable /output), otherwise ./out next to this file.
// Deterministic: the same input files always produce the same bytes.
// Plain JavaScript (no TypeScript annotations) so it runs on any Node.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || join(root, "out");

function totalBytes(dir) {
  let total = 0;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    total += st.isDirectory() ? totalBytes(p) : st.size;
  }
  return total;
}

function countFiles(dir) {
  let n = 0;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    n += statSync(p).isDirectory() ? countFiles(p) : 1;
  }
  return n;
}

// Empty the output directory WITHOUT removing the directory itself:
// the grader mounts /output as a volume, and removing a mountpoint fails.
mkdirSync(outDir, { recursive: true });
for (const name of readdirSync(outDir)) {
  rmSync(join(outDir, name), { recursive: true, force: true });
}
cpSync(join(root, "index.html"), join(outDir, "index.html"));
cpSync(join(root, "css"), join(outDir, "css"), { recursive: true });
cpSync(join(root, "js"), join(outDir, "js"), { recursive: true });

const files = countFiles(outDir);
const bytes = totalBytes(outDir);
console.log("Dungeon Cards build: " + files + " files, " + bytes + " bytes -> " + outDir);
if (!existsSync(join(outDir, "index.html"))) {
  throw new Error("build failed: out/index.html missing");
}
