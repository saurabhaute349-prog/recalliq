import fs from "node:fs";

const p = "src/components/meetings/transcript-upload-panel.tsx";
let s = fs.readFileSync(p, "utf8");
const nl = s.includes("\r\n") ? "\r\n" : "\n";

s = s.replace(
  '<motion.div className="flex min-w-0 items-start gap-2">',
  '<motion.div className="flex min-w-0 items-start gap-2">'.replace("motion.", ""),
);

s = s.replace(
  '<motion.div className="flex shrink-0 gap-0.5">',
  '<motion.div className="flex shrink-0 gap-0.5">'.replace("motion.", ""),
);

const bad =
  `                      </motion.div>${nl}                    </motion.div>${nl}                    <div className="flex shrink-0 gap-0.5">`;
const good =
  `                      </motion.div>${nl}                    </div>${nl}                    <div className="flex shrink-0 gap-0.5">`;

if (s.includes(bad)) {
  s = s.replace(bad, good);
  console.log("fixed middle");
} else {
  console.warn("middle pattern missing");
}

fs.writeFileSync(p, s);
