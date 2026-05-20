import fs from "node:fs";

const files = process.argv.slice(2);

for (const file of files) {
  let s = fs.readFileSync(file, "utf8");
  s = s.replaceAll("<motion.div", "<div");
  s = s.replaceAll("</motion.div>", "</div>");
  fs.writeFileSync(file, s);
  console.log("fixed", file);
}
