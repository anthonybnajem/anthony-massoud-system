/**
 * Writes locales/en.json and locales/ar.json from lib/translations.ts.
 * Run with: npm run sync-locales or npx tsx scripts/sync-locales.ts
 * Use these JSON files in Electron or as the single source of truth per language.
 */

import * as fs from "fs";
import * as path from "path";
import { translations } from "../lib/translations";

const root = process.cwd();
const localesDir = path.join(root, "locales");

fs.mkdirSync(localesDir, { recursive: true });

const enPath = path.join(localesDir, "en.json");
const arPath = path.join(localesDir, "ar.json");

fs.writeFileSync(enPath, JSON.stringify(translations.en, null, 2), "utf8");
fs.writeFileSync(arPath, JSON.stringify(translations.ar, null, 2), "utf8");

console.log("Written", enPath, "and", arPath);
