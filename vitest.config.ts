import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Dist tests import from the published `nationid` package (via the
    // `exports` map), which only resolves after `pnpm build`. They have
    // their own runner via `vitest.dist.config.ts` invoked by `pnpm
    // test:dist` AFTER the build step in `pnpm verify`. Excluding here
    // prevents double-execution and the package-not-resolvable error
    // under vitest 4 / Vite 7's stricter resolver.
    exclude: ["**/node_modules/**", "tests/dist/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/**/index.ts"],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90,
      },
    },
  },
});
