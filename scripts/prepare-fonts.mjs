import { mkdir, copyFile, access } from "node:fs/promises";
import { join } from "node:path";

const out = join(process.cwd(), "public", "fonts");
await mkdir(out, { recursive: true });

const files = [
  ["@fontsource/nunito", "nunito-latin-400-normal.woff2"],
  ["@fontsource/nunito", "nunito-latin-600-normal.woff2"],
  ["@fontsource/nunito", "nunito-latin-700-normal.woff2"],
  ["@fontsource/nunito", "nunito-latin-800-normal.woff2"],
  ["@fontsource/outfit", "outfit-latin-600-normal.woff2"],
  ["@fontsource/outfit", "outfit-latin-700-normal.woff2"],
  ["@fontsource/outfit", "outfit-latin-800-normal.woff2"],
];

for (const [pkg, file] of files) {
  const src = join(process.cwd(), "node_modules", pkg, "files", file);
  await access(src);
  await copyFile(src, join(out, file));
}

// Keep licenses alongside the project source (not required at runtime).
const licenseOut = join(process.cwd(), "FONT_LICENSES");
await mkdir(licenseOut, { recursive: true });
await copyFile(
  join(process.cwd(), "node_modules", "@fontsource", "nunito", "LICENSE"),
  join(licenseOut, "NUNITO-OFL.txt")
);
await copyFile(
  join(process.cwd(), "node_modules", "@fontsource", "outfit", "LICENSE"),
  join(licenseOut, "OUTFIT-OFL.txt")
);

console.log("Fonts locales prêtes : Outfit + Nunito");
