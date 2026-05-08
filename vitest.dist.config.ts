import { defineConfig } from "vitest/config";

/**
 * Run tests against the BUILT output via the package's `exports` map.
 * Catches packaging bugs (broken exports, missing types, ESM/CJS interop).
 *
 * Run after `pnpm build`: `pnpm test:dist`.
 */
export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    include: ["tests/dist/**/*.test.ts"],
    exclude: ["**/node_modules/**", "dist/**"],
  },
});
