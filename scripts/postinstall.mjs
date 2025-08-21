// scripts/postinstall.mjs
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

const root = process.cwd();

async function ensureDir(p) {
  await fsp.mkdir(p, { recursive: true });
}

async function ensureStyles() {
  const stylesPath = path.join(root, "src", "styles.css");
  if (fs.existsSync(stylesPath)) return false;

  await ensureDir(path.dirname(stylesPath));
  const css = `/* Auto-created by postinstall to ensure horizontal columns */
*{box-sizing:border-box}
html,body,#app{height:100%}

.board{
  display:grid;
  grid-auto-flow:column;
  grid-auto-columns:20rem;
  gap:16px;
  overflow-x:auto;
  padding:8px 12px 12px;
  align-items:start;
}
.column{min-width:20rem}

.stack{border:1px solid #ddd;border-radius:8px;background:#fff;margin-bottom:12px;overflow:hidden}
.stack .row{padding:12px;display:flex;justify-content:space-between;align-items:start}
.stack .meta{font-size:12px;color:#666;margin-top:2px}

.btn{border:1px solid #bbb;padding:4px 8px;border-radius:6px;background:#fafafa;cursor:pointer}
.btn:hover{background:#f0f0f0}

/* Prevent long text from bleeding outside cards */
li, .note, .stack, .column{
  word-break:break-word;
  overflow-wrap:anywhere;
}
`;
  await fsp.writeFile(stylesPath, css, "utf8");
  return true;
}

async function ensureLayoutImport() {
  const layoutPath = path.join(root, "src", "routes", "+layout.tsx");
  if (!fs.existsSync(layoutPath)) return false;

  let src = await fsp.readFile(layoutPath, "utf8");
  if (src.includes("styles.css")) return false;

  // Insert import at the top
  src = `import '~/styles.css';\n` + src;
  await fsp.writeFile(layoutPath, src, "utf8");
  return true;
}

async function copyEnv() {
  const from = path.join(root, ".env.example");
  const to = path.join(root, ".env.local");
  if (!fs.existsSync(from) || fs.existsSync(to)) return false;
  await fsp.copyFile(from, to);
  return true;
}

(async () => {
  const results = {
    stylesCreated: await ensureStyles(),
    layoutPatched: await ensureLayoutImport(),
    envCopied: await copyEnv(),
  };

  // Friendly summary
  const lines = [
    "tinkrnotes postinstall:",
    `  • styles.css ${results.stylesCreated ? "created" : "ok"}`,
    `  • +layout.tsx import ${results.layoutPatched ? "added" : "ok"}`,
    `  • .env.local ${results.envCopied ? "copied from .env.example" : "ok or not needed"}`
  ];
  console.log(lines.join("\n"));
})().catch((err) => {
  console.warn("postinstall encountered an issue (safe to ignore for dev):", err?.message || err);
});
