import fs from "node:fs";
import path from "node:path";

const files = [
  "src/components/marketing/product-preview.tsx",
  "src/components/marketing/hero-section.tsx",
];

for (const rel of files) {
  const file = path.join(process.cwd(), rel);
  if (!fs.existsSync(file)) continue;
  let s = fs.readFileSync(file, "utf8");
  // Fix common mistaken closing tags after plain <motion.div> was meant to be <motion.div>
  const fixes = [
    ["<motion.div className=\"flex items-center gap-2 border-b", "<div className=\"flex items-center gap-2 border-b"],
    ["<motion.div className=\"grid gap-0", "<div className=\"grid gap-0"],
    ["<motion.div className=\"border-b border-border/80 p-5", "<motion.div className=\"border-b border-border/80 p-5"],
    ["<motion.div className=\"space-y-4 p-5\"", "<div className=\"space-y-4 p-5\""],
    ["<motion.div className=\"rounded-lg border", "<div className=\"rounded-lg border"],
    ["<motion.div className=\"rounded-xl border border-primary/20 bg-primary/5", "<motion.div className=\"rounded-xl border border-primary/20 bg-primary/5"],
  ];
  for (const [from, to] of fixes) {
    if (from !== to) s = s.split(from).join(to);
  }
  // Closing tags: after </motion.div> that closes plain divs - heuristic replace
  s = s.replace(
    /(\n        <\/motion.div>\n        <div className="grid)/g,
    "\n        </div>\n        <div className=\"grid",
  );
  fs.writeFileSync(file, s);
  console.log("processed", rel);
}
