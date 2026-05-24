import { existsSync } from "node:fs";
import { defineConfig } from "tsup";

/**
 * Countries shipped through v0.4.0. We filter to those whose `index.ts` exists,
 * so partial drafts during development still build green.
 */
const ALL_COUNTRIES = [
  // v0.1.0
  "sv",
  "mx",
  "co",
  "br",
  "pe",
  "ar",
  "cl",
  "do",
  "gt",
  "hn",
  "cr",
  "es",
  "us",
  // v0.4.0
  "bo",
  "ec",
  "py",
  "ni",
  "pa",
  "uy",
  "ca",
  "pt",
  "ve",
  // v0.6.0
  "gb",
  "fr",
  "de",
  "it",
  "nl",
  "be",
  "ch",
  "pl",
  "se",
  "no",
  "dk",
  "fi",
  // v1.2.0 — Asia phase 1
  "in",
  // v1.7.0 — EU-VAT complete (16 EU + 1 EEA)
  "ie",
  "at",
  "lu",
  "gr",
  "cz",
  "hu",
  "ro",
  "bg",
  "hr",
  "sk",
  "si",
  "lt",
  "lv",
  "ee",
  "mt",
  "cy",
  "is",
] as const;

const COUNTRIES = ALL_COUNTRIES.filter((cc) => existsSync(`src/countries/${cc}/index.ts`));

/** Locales shipping in v0.3.0 i18n. */
const I18N_LOCALES = ["es", "en", "pt"] as const;

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "algorithms/index": "src/algorithms/index.ts",
    ...Object.fromEntries(
      COUNTRIES.map((cc) => [`countries/${cc}/index`, `src/countries/${cc}/index.ts`]),
    ),
    // v0.3.0 — DX subpaths
    "extract/index": "src/extract/index.ts",
    "pii/index": "src/pii/index.ts",
    "i18n/index": "src/i18n/index.ts",
    ...Object.fromEntries(
      I18N_LOCALES.map((loc) => [`i18n/locales/${loc}`, `src/i18n/locales/${loc}.ts`]),
    ),
    "catalog/index": "src/catalog/index.ts",
  },
  format: ["esm", "cjs"],
  dts: { resolve: true },
  splitting: false,
  sourcemap: false,
  clean: true,
  treeshake: true,
  minify: false,
  target: "es2022",
  outDir: "dist",
  outExtension({ format }) {
    return {
      js: format === "cjs" ? ".cjs" : ".js",
    };
  },
});
