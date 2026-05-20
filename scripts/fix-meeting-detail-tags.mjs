import fs from "node:fs";

const p = "src/components/meetings/meeting-detail-view.tsx";
let s = fs.readFileSync(p, "utf8");
const nl = s.includes("\r\n") ? "\r\n" : "\n";
const endDiv = "</" + "div>";

const fixes = [
  [
    `                  ) : null}${nl}                </motion.div>${nl}              ),`,
    `                  ) : null}${nl}                ${endDiv}${nl}              ),`,
  ],
  [
    `              </Button>${nl}            </motion.div>${nl}          ) : null}${nl}          <AnimatePresence>`,
    `              </Button>${nl}            ${endDiv}${nl}          ) : null}${nl}          <AnimatePresence>`,
  ],
  [
    `<div ref={threadEndRef} className="h-4" />${nl}        </motion.div>`,
    `<div ref={threadEndRef} className="h-4" />${nl}        ${endDiv}`,
  ],
];

for (const [from, to] of fixes) {
  if (!s.includes(from)) {
    console.warn("missing:", from.slice(0, 50).replace(/\r/g, "\\r"));
  } else {
    s = s.replace(from, to);
    console.log("fixed one");
  }
}

fs.writeFileSync(p, s);
