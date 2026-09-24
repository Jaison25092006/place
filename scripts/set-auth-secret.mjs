// Generates a strong AUTH_SECRET and writes it into .env.local in place.
// Prints nothing but a confirmation — the secret never reaches your terminal.
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const FILE = ".env.local";

if (!existsSync(FILE)) {
  console.error(`${FILE} not found. Copy .env.example to .env.local first.`);
  process.exit(1);
}

const secret = randomBytes(32).toString("base64");
const original = readFileSync(FILE, "utf8");

const updated = /^AUTH_SECRET=.*$/m.test(original)
  ? original.replace(/^AUTH_SECRET=.*$/m, `AUTH_SECRET="${secret}"`)
  : `${original.replace(/\s*$/, "")}\nAUTH_SECRET="${secret}"\n`;

writeFileSync(FILE, updated);
console.log(`AUTH_SECRET written to ${FILE} (${secret.length} chars). Not printed.`);
