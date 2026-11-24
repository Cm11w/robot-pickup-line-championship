// The Robot Pickup Line Championship
// A single pickup line, written in the voice of a robot trying to charm
// someone. The joke grows out of being a machine: a robot that can simulate
// a million futures still has to do the brave, human part itself — walking
// up and saying hello.
//
// Writes the line to /output/entry.txt, the path the kit's gate checks.
// No dependencies, no network, deterministic output: every run writes
// the exact same bytes.
//
// The file is organised in three stages, each with its own failure mode:
//   1. validateLine — the line passes the scorer's gate before it is used.
//   2. writeEntry   — the line is encoded once and written as raw bytes.
//   3. verifyEntry  — the bytes on disk are read back and proven identical
//                      to what was written, then gated a second time.
// If any stage fails the process exits non-zero and writes nothing valid.

import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";

// --- the entry (do not change: this is the submitted line) ---
const PICKUP_LINE =
  "I ran a million simulations of meeting you. In every one, I still chose to say hello.";

// --- output contract ---
const OUTPUT_DIR = "/output";
const OUTPUT_PATH = `${OUTPUT_DIR}/entry.txt`;

// --- gate limits, mirroring the kit's scorer exactly ---
// UTF-8 text, 1 to 200 characters, not only white space, a single line.
// The leaderboard's Size column is bytes, and an exact tie on win rate
// breaks toward the smaller text — so the byte budget matters too.
const GATE = {
  MIN_CHARS: 1,
  MAX_CHARS: 200,
  MAX_BYTES: 200,
} as const;

// A gate failure is a distinct error type so a caller (or a log reader)
// can tell a validation failure apart from an I/O failure at a glance.
class GateError extends Error {
  constructor(reason: string) {
    super(`gate failed: ${reason}`);
    this.name = "GateError";
  }
}

// --- stage 1: validate the line against the scorer's gate ---
// `context` names which copy is being checked ("input" for the constant,
// "verify" for the text read back from disk) so a failure message says
// exactly which copy broke.
function validateLine(line: string, context: string): void {
  const fail = (reason: string): never => {
    throw new GateError(`${context}: ${reason}`);
  };

  // Count code points, not UTF-16 units, so astral characters count once.
  const chars = [...line];
  if (chars.length < GATE.MIN_CHARS || chars.length > GATE.MAX_CHARS) {
    fail(
      `line is ${chars.length} characters, must be ${GATE.MIN_CHARS}-${GATE.MAX_CHARS}`,
    );
  }
  if (line.trim().length === 0) {
    fail("line is only white space");
  }
  // The scorer reads the file verbatim; stray padding would be scored.
  if (line !== line.trim()) {
    fail("line has leading or trailing white space");
  }
  if (/[\r\n]/.test(line)) {
    fail("line must be a single line");
  }
  // Control characters (including tab) are invisible but scored.
  if (/[\u0000-\u001F\u007F]/.test(line)) {
    fail("line contains control characters");
  }
  // Zero-width / BOM characters are invisible but count toward the budget.
  if (/[\u200B-\u200D\uFEFF]/.test(line)) {
    fail("line contains invisible formatting characters");
  }
  // Must round-trip as UTF-8 (no lone surrogates sneaking in).
  if (Buffer.from(line, "utf8").toString("utf8") !== line) {
    fail("line is not valid UTF-8 text");
  }
  const bytes = Buffer.byteLength(line, "utf8");
  if (bytes > GATE.MAX_BYTES) {
    fail(`line is ${bytes} bytes, must be at most ${GATE.MAX_BYTES}`);
  }
  // A pickup line is a complete sentence, not a fragment.
  if (!/[.!?]$/.test(line)) {
    fail("line must end with terminal punctuation");
  }
}

// --- stage 2: write the line as raw bytes ---
// Encode exactly once and keep that Buffer as the reference copy: the
// verify stage compares the disk against these bytes, not against a
// second encoding that could silently differ.
function writeEntry(line: string): Buffer {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const encoded = Buffer.from(line, "utf8");
  // No trailing newline: the file holds exactly the line, nothing else.
  writeFileSync(OUTPUT_PATH, encoded);
  return encoded;
}

// --- stage 3: verify what landed on disk ---
// The file on disk — not the in-memory constant — is what the scorer
// judges, so prove the disk copy byte-for-byte, then gate it again.
function verifyEntry(expectedBytes: Buffer, expectedLine: string): void {
  const onDisk = readFileSync(OUTPUT_PATH);
  if (!onDisk.equals(expectedBytes)) {
    throw new GateError("verify: bytes on disk differ from the line");
  }
  const text = onDisk.toString("utf8");
  if (text !== expectedLine) {
    throw new GateError("verify: text on disk differs from the line");
  }
  const size = statSync(OUTPUT_PATH).size;
  if (size !== expectedBytes.length) {
    throw new GateError(
      `verify: file is ${size} bytes, expected ${expectedBytes.length}`,
    );
  }
  validateLine(text, "verify");
}

// --- entry point: validate, write, verify, report ---
function main(): void {
  validateLine(PICKUP_LINE, "input");
  const encoded = writeEntry(PICKUP_LINE);
  verifyEntry(encoded, PICKUP_LINE);
  console.log(
    `wrote ${[...PICKUP_LINE].length} characters (${encoded.length} bytes) to ${OUTPUT_PATH}`,
  );
}

main();
