// Dungeon Cards — entrypoint.
// Run with: node main.ts
// Copies the playable game (index.html, css/, js/) into out/.
// Deterministic: the same input files always produce the same bytes.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root: string = fileURLToPath(new URL(".", import.meta.url));
const outDir: string = process.env.MAKEFUN_OUTPUT_DIR || join(root, "out");

function totalBytes(dir: string): number {
  let total = 0;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    total += st.isDirectory() ? totalBytes(p) : st.size;
  }
  return total;
}

function countFiles(dir: string): number {
  let n = 0;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    n += statSync(p).isDirectory() ? countFiles(p) : 1;
  }
  return n;
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
cpSync(join(root, "index.html"), join(outDir, "index.html"));
cpSync(join(root, "css"), join(outDir, "css"), { recursive: true });
cpSync(join(root, "js"), join(outDir, "js"), { recursive: true });

const files = countFiles(outDir);
const bytes = totalBytes(outDir);
console.log("Dungeon Cards build: " + files + " files, " + bytes + " bytes -> " + outDir);
if (!existsSync(join(outDir, "index.html"))) {
  throw new Error("build failed: out/index.html missing");
}
