# Style Guide

## TypeScript

- `target: ES2022`, `lib: ES2023`, `moduleResolution: Bundler`
- `strict: true` plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`
- Imports use the `.ts` extension explicitly: `import type { DocumentSpec } from "../core/types.ts"`
- `import type` for type-only imports (enforced by `verbatimModuleSyntax: true`)
- No `any`. Use `unknown` and narrow.
- No `as const` for entire arrays of primitives unless the element type matters externally — prefer `readonly`

## Naming

| Concept | Convention | Example |
|---------|-----------|---------|
| Public types | `PascalCase` | `DocumentSpec`, `ParseResult` |
| Internal types | `PascalCase` | `WeightVector` |
| Constants | `SCREAMING_SNAKE_CASE` | `RAW_REGEX`, `WEIGHTS` |
| Functions | `camelCase` | `validate`, `mod11WeightedSum` |
| Files | `kebab-case.ts` for shared, lowercase for country code (`sv`, `mx`) |
| Tests | mirror src path with `.test.ts` |

## DocumentTypeCode format

Always `{ISO-2}_{TYPE}`. Multi-variant docs use suffixes: `MX_RFC_PF` (persona física), `MX_RFC_PM` (persona moral), `CR_CEDULA_FISICA` vs `CR_CEDULA_JURIDICA`.

These codes are **public stable contracts**. Once shipped they cannot be renamed — only added.

## DocumentSpec rules

Every spec must have:

- `code`: the `DocumentTypeCode` literal
- `country`: the `CountryCode` literal
- `scope`: `'personal' | 'tax' | 'both'`
- `labelKey`: i18n key path
- `rawRegex`: regex matching the normalized form
- `mask`: cleave-style display mask
- `hasCheckDigit`: true iff the algorithm enforces a check digit (not just regex)
- `confidence`: `'high' | 'moderate' | 'low' | 'unconfirmed'`
- `validate`, `normalize`, `format`, `parse` methods

Public-facing identifiers MUST never throw on invalid input. Use `parse` for the discriminated-result variant; `validate` returns `boolean`.

## Comments

- JSDoc on every exported `*Spec` constant citing the official source URL
- One-line comments explain *why*, never *what*
- No commented-out code in commits

## Tests

- Vitest with `describe`/`it` blocks
- Group by document, then by behavior
- Each spec has at least: 5 valid, 5 invalid format, 3 invalid checksum, 3 edge cases
- Test vectors are synthetic — never real numbers
- Cross-reference an existing library where one exists for the same document; document discrepancies in the country's `docs/countries/<cc>.md`

## Bundle size

Per `package.json#size-limit`:

- Core (root): 5 KB gzipped
- Per-country: 3 KB gzipped

If a country bundle blows the budget, split tables into a separate file under `src/algorithms/tables/` and lazy-load only when the algorithm needs them.

## Commit messages

[Conventional Commits 1.0.0](https://www.conventionalcommits.org/). See [CONTRIBUTING.md](../CONTRIBUTING.md) for prefix conventions.

## Lint and format

`pnpm lint` runs Biome 2.x with this repo's `biome.json`. Format on save is recommended. CI fails on lint errors.
