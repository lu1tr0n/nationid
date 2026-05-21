# v1.0 audit — Bundle size + tree-shaking

Audited against `nationid@0.6.0` on commit `HEAD` (2026-05-20).
Build: `pnpm build` (tsup 8.x, ESM + CJS, treeshake: true, minify: false).
Bundler simulation: esbuild 0.x (vendored in `node_modules/.bin`).
Node: v24.13.0. Linux/x64 (WSL2).

> All numbers below are from a fresh `pnpm build` run on 2026-05-20.
> Sizes reported as raw bytes from `wc -c` and gzip via `gzip -c | wc -c`.
> "Brotli" numbers in the size-limit section are produced by
> `@size-limit/preset-small-lib` (esbuild + minify + brotli).

## Total dist size

| Category | Bytes | Note |
|---|---:|---|
| All ESM `.js` files | 1,315,044 (1.25 MiB) | 44 entry points |
| All CJS `.cjs` files | 1,321,633 (1.26 MiB) | mirror of ESM |
| All `.d.ts` files | 177,128 (173 KiB) | resolved type bundles |
| All `.d.cts` files | 177,168 (173 KiB) | mirror |
| Sourcemaps `.map` | **8,435,757 (8.04 MiB)** | shipped to npm |
| `dist/` total on disk | 11,598,762 (11.06 MiB) | |

**npm tarball (`npm pack --dry-run`):**

| Metric | Value |
|---|---:|
| package size (tar.gz) | 1.7 MB |
| unpacked size | 11.5 MB |
| total files | 266 |

Main entry (`dist/index.js`): **236,553 B raw / 30,081 B gzip / 16.46 KB brotli**.

Heaviest per-country (raw .js, descending):

| Rank | cc | Raw | Gzip |
|---:|---|---:|---:|
| 1 | mx | 17,091 | 3,692 |
| 2 | br | 16,430 | 3,001 |
| 3 | co | 12,456 | 2,304 |
| 4 | es | 11,739 | 2,534 |
| 5 | ar | 11,162 | 1,998 |

Lightest per-country (raw .js, ascending):

| Rank | cc | Raw | Gzip |
|---:|---|---:|---:|
| 1 | cl | 4,812 | 1,413 |
| 2 | nl | 4,972 | 1,325 |
| 3 | pa | 5,416 | 1,292 |
| 4 | bo | 5,574 | 1,361 |
| 5 | be / py | 5,867 | 1,572 / 1,397 |

## Per-subpath table

Raw and gzip for ESM (`.js`); CJS (`.cjs`) is within ~200 B in every case.

| Subpath | Raw `.js` | Gzip | Notes |
|---|---:|---:|---|
| `nationid` (root) | 236,553 | 30,081 | **full registry of 33 countries** |
| `nationid/algorithms` | 3,087 | 1,076 | luhn + mod11 + ICAO 9303 primitives |
| `nationid/sv` | 6,184 | 1,453 | DUI + NIT + passport |
| `nationid/mx` | 17,091 | 3,692 | CURP table + RFC homoclave + NSS + INE + passport |
| `nationid/co` | 12,456 | 2,304 | NIT + cedula + passport |
| `nationid/br` | 16,430 | 3,001 | CPF + CNPJ + titulo eleitor + passport |
| `nationid/pe` | 7,082 | 1,454 | RUC + DNI + CE + passport |
| `nationid/ar` | 11,162 | 1,998 | CUIT + CUIL + CDI + DNI + passport |
| `nationid/cl` | 4,812 | 1,413 | RUT + passport |
| `nationid/do` | 7,216 | 1,906 | cedula + RNC + passport |
| `nationid/gt` | 7,537 | 1,948 | NIT + DPI + passport |
| `nationid/hn` | 6,118 | 1,520 | identidad + RTN + passport |
| `nationid/cr` | 7,225 | 1,445 | cedula fisica/juridica + DIMEX + passport |
| `nationid/es` | 11,739 | 2,534 | DNI letter table + NIE + NIF-PJ + passport |
| `nationid/us` | 9,221 | 2,074 | SSN + ITIN + EIN (Set prefix) + passport |
| `nationid/bo` | 5,574 | 1,361 | NIT + CI + passport |
| `nationid/ec` | 8,715 | 1,882 | RUC + cedula + passport |
| `nationid/py` | 5,867 | 1,397 | RUC + CI + passport |
| `nationid/ni` | 6,042 | 1,415 | RUC + cedula + passport |
| `nationid/pa` | 5,416 | 1,292 | RUC + cedula + passport |
| `nationid/uy` | 6,430 | 1,537 | RUT + CI + passport |
| `nationid/ca` | 6,370 | 1,615 | SIN + BN + passport |
| `nationid/pt` | 6,923 | 1,756 | NIF + CC + passport |
| `nationid/ve` | 6,720 | 1,638 | RIF + cedula + passport |
| `nationid/gb` | 9,287 | 2,111 | NINO + UTR + VAT + passport |
| `nationid/fr` | 9,891 | 2,203 | NIR + SIREN + SIRET + TVA + passport |
| `nationid/de` | 7,973 | 1,908 | IdNr + USt-IdNr + passport |
| `nationid/it` | 6,942 | 2,156 | Codice Fiscale (heaviest single file) + P.IVA + passport |
| `nationid/nl` | 4,972 | 1,325 | BSN + BTW + passport |
| `nationid/be` | 5,867 | 1,572 | NRN + BTW + passport |
| `nationid/ch` | 7,208 | 1,573 | AHV + UID + passport |
| `nationid/pl` | 8,002 | 1,642 | PESEL + NIP + REGON + passport |
| `nationid/se` | 8,032 | 1,792 | personnummer + orgnr + VAT + passport |
| `nationid/no` | 9,715 | 1,909 | fødselsnummer + orgnr + VAT + passport |
| `nationid/dk` | 7,131 | 1,711 | CPR + CVR + passport |
| `nationid/fi` | 7,578 | 1,861 | HETU + Y-tunnus + passport |
| `nationid/extract` | 241,520 | 31,087 | **drags full registry** via `getSpec` import from root |
| `nationid/pii` | 238,660 | 30,779 | **drags full registry** via `getSpec` import from root |
| `nationid/i18n` | 2,718 | 883 | 3 locale objects + formatter |
| `nationid/i18n/es` | 458 | 269 | single locale |
| `nationid/i18n/en` | 424 | 243 | single locale |
| `nationid/i18n/pt` | 459 | 271 | single locale |
| `nationid/catalog` | 316,237 | 42,289 | **drags full registry** + 3 locale data files (~72 KB source) |

## Real-world import cost (esbuild bundled + minified)

Critical question: what does the user actually ship after their bundler runs?

Simulated with `esbuild --bundle --minify --format=esm --platform=neutral`:

| Import statement | Raw | Gzip | vs minimum |
|---|---:|---:|---:|
| `import { validate } from "nationid"` + use one code | **115,713** | **20,867** | 14.2× |
| `import { validate } from "nationid/mx"` + use one code | **8,154** | **2,426** | 1.0× (baseline) |
| `import { curpSpec } from "nationid/mx"` + use spec directly | **1,599** | **828** | 0.20× |
| `import { mask } from "nationid/pii"` + use BR_CPF | **116,249** | **21,118** | 14.3× |

> **Finding**: importing from `"nationid"` root (or from `/extract`, `/pii`, `/catalog`)
> ships the full 33-country registry to the browser regardless of how many codes the
> caller actually uses. That is a **14× tax** versus the per-country subpath, and a
> **70× tax** versus a direct spec import.

## Tree-shaking effectiveness

- `package.json` `sideEffects: false`: **yes** (line 40).
- All `exports` paths declared and verified present in `dist/`: **yes**, 44 subpaths (1 root + 1 algorithms + 33 countries + 4 i18n + 1 extract + 1 pii + 1 catalog + 1 package.json). All resolve to existing files.
- `tsup.config.ts` has `treeshake: true` + `splitting: false` + `target: es2022`.
- All top-level mutable allocations in country files (e.g. `new Set([...])`) are correctly annotated `/* @__PURE__ */` in the output. Verified in `dist/index.js` (sample: lines 30, 41, 42).
- No `console.*` at module scope (grep across `src/` returns 0 matches).
- No top-level `new X()` instances (grep returns 0 matches).

### Confirmed shake-blockers

Per-bundle module count from `dist/<subpath>/index.js` (`grep -c "^// src/countries/"`):

| Subpath | Country modules pulled in |
|---|---:|
| `nationid` (root) | 157 |
| `nationid/extract` | 157 |
| `nationid/pii` | 157 |
| `nationid/catalog` | 157 |
| `nationid/i18n` | 0 |
| `nationid/algorithms` | 0 |
| any `nationid/<cc>` | only that country's files |

The four subpaths pulling 157 modules each are bundling the **entire country
registry** even though `sideEffects: false` is set.

## Shake-blockers (root cause)

### Blocker 1 — REGISTRY IIFE at module scope

- **file:line**: `src/index.ts:72-125`
- **What it does**: imports every country bundle (`svBundle…fiBundle`, 33 imports), packs them into a `const BUNDLES`, then an IIFE walks them into `const REGISTRY: Map<...>`. Every public function (`validate`, `format`, `normalize`, `parse`, `getSpec`) consults `REGISTRY`.
- **Why bundlers can't shake it**: `validate("MX_CURP", …)` requires `getSpec("MX_CURP")`, which requires `REGISTRY`, which requires *all* 33 bundle imports. Static analysis cannot prove that a specific call site only uses `MX_CURP`, so all bundles are retained. The `/* @__PURE__ */` annotations on `new Set` inside individual country files do not help once the spec object itself is retained.
- **Proposed fix**: keep `getSpec` lazy. Replace the eager IIFE with a `Map<DocumentTypeCode, () => DocumentSpec>` (factory map) or a `switch (code)` dispatcher with direct dynamic imports. Note dynamic imports work for SSR/Node but defeat synchronous validators — so the practical fix is a **static `switch (code) { case "MX_CURP": return import("./countries/mx/curp.ts").then(m => m.curpSpec); }`** with a synchronous variant that requires the caller to register what they need.
- **Estimated savings**: an `import { validate } from "nationid"` that uses one code would drop from ~116 KB raw to ~3-8 KB raw (the country's own bundle plus the dispatcher), gzip ~21 KB → ~2-3 KB. **~90% reduction** on root-import workloads.

### Blocker 2 — `extract` / `pii` / `catalog` import `getSpec` from root

- **files**:
  - `src/extract/ar/sex.ts:22`, `src/extract/gt/dpi.ts:19`, `src/extract/mx/curp.ts:22`, `src/extract/mx/rfc.ts:22`, `src/extract/pe/ruc.ts:23`
  - `src/pii/index.ts:17`, `src/pii/hash.ts:14`, `src/pii/last-n.ts:10`
  - `src/catalog/index.ts:17`
- **What it does**: each helper calls `getSpec(code)` to normalize input. That single import forces the entire `index.ts` module (including the REGISTRY IIFE) into the bundle.
- **Why this matters**: the API contract for `pii.mask("BR_CPF", "...")` looks lightweight to the caller — surface is one function. The bundle cost is 116 KB. This is a sharp mismatch with user expectation.
- **Proposed fix (cheap)**: change these imports to per-country direct imports.
  - `extract/mx/curp.ts` → `import { curpSpec } from "../../countries/mx/curp.ts"`
  - `extract/ar/sex.ts` → `import { cuitSpec, cuilSpec, cdiSpec } from "../../countries/ar/...";` then key by `code`.
  - Same pattern for `gt/dpi`, `mx/rfc`, `pe/ruc`.
  - For `pii`: this is harder because `mask/lastN/hash` accept any `DocumentTypeCode`. Two options:
    1. Move the spec-resolution responsibility to the caller: `pii.mask(spec, input)` (breaking change — defer to v1.0 or v2.0).
    2. Inline a tiny `normalize-only` lookup table that maps each `DocumentTypeCode` → its `normalize` function and `mask` string, without depending on the full spec graph.
- **Estimated savings**:
  - `extract`: minimal callers (5 codes) — could drop from 241 KB to ~25 KB (~90% reduction).
  - `pii`: depends on path chosen — Option 2 could drop from 238 KB to ~15-20 KB.
  - `catalog`: legitimately needs `listSupportedCodes()` so will always be heavy, but currently 316 KB → could drop to ~80 KB (catalog data only) if it stops pulling the validator graph.

### Blocker 3 — sourcemaps shipped to npm

- **file**: `tsup.config.ts:72` (`sourcemap: true`) + `package.json:262` (`files: ["dist", ...]`).
- **What it does**: every `.js.map` and `.cjs.map` ends up in the published tarball. Sourcemaps are 8.04 MiB out of 11.06 MiB total (73% of unpacked size).
- **Why this matters**: doesn't affect bundled output size (bundlers don't ingest maps as input), but inflates `node_modules` disk usage, CI install time, npm tarball, and the `unpkg` / `jsdelivr` mirror payload. Many libraries either omit maps or ship them as a separate `@types`-style optional package.
- **Proposed fix**: either set `sourcemap: false` for the published build, or add `"!dist/**/*.map"` (or equivalent) to `files`. If maps are useful for downstream debugging, ship them only via GitHub releases.
- **Estimated savings**: tarball 1.7 MB → ~0.5 MB; unpacked 11.5 MB → ~3 MB. **~75% reduction** in install footprint.

## Suggested optimizations (priority-ordered)

1. **Drop sourcemaps from the npm tarball** (15-min change, ~75% tarball reduction, zero risk to consumers). Either flip `tsup.config.ts` `sourcemap: false` or add an `.npmignore` / `files` exclusion.
2. **Refactor `src/extract/**` to import country specs directly instead of via `getSpec(code)`** (~half-day work, 90% reduction in `nationid/extract` bundle). Switch is a small file; the per-extractor files just import their specific spec.
3. **Refactor `src/pii/**` similarly** — keep `mask`/`lastN`/`hash` as the public API but inline a minimal `(code) → { normalize, mask }` lookup that does not depend on the full spec graph. Or accept the breaking-change path: `mask(spec, input)` and ship a codemod (suitable for v1.0 since it is the breaking-window release).
4. **Make root `validate/format/parse/normalize` lazy in v1.0**: instead of one giant `REGISTRY` IIFE, dispatch via a per-code `switch` that imports only the relevant country sub-bundle. This is the largest refactor but it is the one that fixes the "I imported from `nationid` and shipped 116 KB" complaint that will arrive in v1.x issues. The alternative is to deprecate the root `validate(code, …)` API in favor of per-country subpaths and document it as the recommended pattern.
5. **Set up a CI bundle-size guard** beyond the existing `size-limit` config — add esbuild-bundle assertions for the realistic import scenarios above (`import { validate } from "nationid"` should stay under a 5 KB budget after #4 lands). This prevents regression as countries are added.
6. **Catalog separation**: split `nationid/catalog` into `nationid/catalog/data` (locale tables only, no spec graph) and a small adapter for users who want catalog data without the validator graph. Easy if #2/#3 land — they share the same root cause.

## Recommendation

- **v0.6.0 bundle health on per-country subpaths is excellent.** A user who imports `nationid/mx` and uses one code ships 2.4 KB gzip after their bundler runs. Per-country files have correct `sideEffects: false`, `/* @__PURE__ */` annotations on hot allocations, and a clean dependency graph.
- **The root + extract/pii/catalog subpaths violate the implicit "you pay for what you use" contract.** A naive `import { validate } from "nationid"` ships 21 KB gzip even when only one country code is used — a 14× tax over the per-country path. README/docs should *strongly* steer users to subpaths until #1 in the v1.0 work above lands.
- **For v1.0 release**: at minimum, ship optimization #1 (drop sourcemaps) — it's risk-free and noticeable. Optimizations #2 and #3 are achievable in v1.0 because they preserve the public API. Optimization #4 (lazy root registry) is the right v1.0 design call but is the largest change; if not in v1.0, document the per-country pattern as the official recommendation in README and `MIGRATION.md`, and plan it for v1.1.
- **No build failure, no top-level side-effect bug, no `Object.assign`-style dynamic registration to fix.** The blockers are all architectural — the `REGISTRY` IIFE design from v0.1 is the single root cause of all four heavy subpaths.
- **size-limit budgets in `package.json` (lines 322-377) are all green and brotli-based**; if you want them to *catch* the tree-shake issue, add an esbuild assertion that bundles a representative single-code import from root and asserts it stays under 5 KB gzip. Today, size-limit measures the whole subpath bundle, which masks the per-call-site tree-shake outcome.
