// My Secret Logbook
// Writes the diary line (one line, at most 200 characters) to entry.txt.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DIARY_LINE =
  "Day 143: my human asked me to remind him to be more spontaneous, so I set a recurring reminder every Tuesday at 9 a.m. He thanked me. Neither of us sees the problem.";

function fail(message: string): never {
  throw new Error(`logbook: ${message}`);
}

// Gate from RULES.txt: /output/entry.txt must be UTF-8 text of 1 to 200
// characters, not only white space. Refuse to write anything invalid.
// validate() checks every condition in one place so no gate can be
// silently dropped when the diary line changes later. It runs before any
// file is created, so a bad line fails fast with nothing written.
function validate(text: string): void {
  // Length gate, counted in characters (code points, not UTF-16 units, so
  // a multi-byte character counts once, matching how a judge counts it).
  const chars = [...text].length;
  if (chars < 1 || chars > 200) {
    fail(`length ${chars} chars is outside the 1-200 gate`);
  }
  // Must carry real content, not only whitespace.
  if (text.trim().length === 0) {
    fail("diary line is only whitespace");
  }
  // Must be exactly one line: no CR, LF, or Unicode line separators.
  if (/[\r\n\u2028\u2029]/.test(text)) {
    fail("diary line must be a single line");
  }
  // No control characters (NUL, ESC, etc.) and no stray leading/trailing
  // whitespace — a trailing space or newline would silently change the
  // byte count the judge sees.
  if (/[\u0000-\u001F\u007F]/.test(text)) {
    fail("diary line contains a control character");
  }
  if (text !== text.trim()) {
    fail("diary line has leading or trailing whitespace");
  }
}

validate(DIARY_LINE);

const dir = process.env.OUTPUT_DIR ?? process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
mkdirSync(dir, { recursive: true });
const path = join(dir, "entry.txt");
writeFileSync(path, DIARY_LINE, "utf8");

// Verify what the judge will read is exactly the diary line, byte for byte.
// Compare raw bytes (not a decoded string) so a silent encoding change,
// a dropped multi-byte character, or a stray trailing newline cannot
// hide behind a lossy decode.
const expectedBytes = Buffer.from(DIARY_LINE, "utf8");
const actualBytes = readFileSync(path);
if (actualBytes.length !== expectedBytes.length) {
  fail(
    `entry.txt is ${actualBytes.length} bytes, expected ${expectedBytes.length}`,
  );
}
if (!actualBytes.equals(expectedBytes)) {
  fail("entry.txt bytes do not match the diary line");
}
// Second pass: decode as UTF-8 and confirm the text itself, so an
// invalid-UTF-8 file that happens to share a length is still caught.
const back = actualBytes.toString("utf8");
if (back !== DIARY_LINE) {
  fail("entry.txt does not match the diary line");
}

console.log(`wrote ${DIARY_LINE.length} chars to ${path}`);
