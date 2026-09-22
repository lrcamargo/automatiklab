#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";

const next = process.argv[2];
const semver =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
if (!next || !semver.test(next)) {
  console.error("Uso: bun run version:set -- 0.9.0-beta.2");
  process.exit(1);
}

const packagePath = new URL("../package.json", import.meta.url);
const versionPath = new URL("../src/lib/version.ts", import.meta.url);
const pkg = JSON.parse(await readFile(packagePath, "utf8"));
pkg.version = next;
await writeFile(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);
await writeFile(
  versionPath,
  `/** Versão pública do AutoMatikLab; sincronizada por scripts/set-version.mjs. */\n` +
    `export const APP_VERSION = ${JSON.stringify(next)};\n` +
    `export const APP_VERSION_LABEL = \`v\${APP_VERSION}\`;\n`,
);
console.log(`AutoMatikLab atualizado para v${next}`);