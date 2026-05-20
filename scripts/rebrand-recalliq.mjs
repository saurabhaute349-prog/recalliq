import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "src");
const EXTRA = [
  path.join(process.cwd(), "env.example"),
  path.join(process.cwd(), ".env.example"),
  path.join(process.cwd(), "docs", "deployment-checklist.md"),
];

const SKIP_PARTS = [
  "node_modules",
  "meetingmind-recent",
  "meetingmind-recent-opened",
];

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, files);
    else if (/\.(tsx?|css|md)$/.test(name)) files.push(p);
  }
  return files;
}

const replacements = [
  ["MeetingMind Pro", "Recalliq Pro"],
  ["MeetingMind", "Recalliq"],
  ["meetingmind-export", "recalliq-export"],
];

let count = 0;

for (const file of [...walk(ROOT), ...EXTRA]) {
  if (!fs.existsSync(file)) continue;
  let s = fs.readFileSync(file, "utf8");
  const orig = s;
  if (file.includes("supabase")) continue;
  if (file.includes("components\\brand\\logo.tsx") && s.includes("MeetingMindLogo")) continue;
  if (file.includes("components/brand/logo.tsx") && s.includes("MeetingMindLogo")) continue;
  if (file.includes("components\\brand\\index.ts")) continue;
  if (file.includes("components/brand/index.ts")) continue;

  for (const [from, to] of replacements) {
    if (SKIP_PARTS.some((skip) => from.includes(skip))) continue;
    s = s.split(from).join(to);
  }

  if (s !== orig) {
    fs.writeFileSync(file, s);
    count++;
    console.log("updated", path.relative(process.cwd(), file));
  }
}

console.log("done", count, "files");
