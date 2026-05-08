import { existsSync } from "node:fs";
import { defineConfig } from "tsup";

/**
 * Countries shipping in v0.1.0. We filter to those whose `index.ts` exists,
 * so partial drafts during development still build green.
 */
const ALL_COUNTRIES = [
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
] as const;

const COUNTRIES = ALL_COUNTRIES.filter((cc) => existsSync(`src/countries/${cc}/index.ts`));

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "algorithms/index": "src/algorithms/index.ts",
    ...Object.fromEntries(
      COUNTRIES.map((cc) => [`countries/${cc}/index`, `src/countries/${cc}/index.ts`]),
    ),
  },
  format: ["esm", "cjs"],
  dts: { resolve: true },
  splitting: false,
  sourcemap: true,
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
