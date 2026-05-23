# Contributing to nationid

Thanks for your interest in improving `nationid`. This document explains how to add countries, fix algorithms, and propose changes.

## Quick links

- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Security policy](./SECURITY.md)
- [Governance](./docs/GOVERNANCE.md)
- [Style guide](./docs/STYLE_GUIDE.md)

## Local setup

Requires Node 20+ and pnpm 9+.

```sh
git clone https://github.com/lu1tr0n/nationid.git
cd nationid
pnpm install
pnpm verify   # runs lint, typecheck, test, build, dist tests
```

Useful scripts:

| Command | Purpose |
|---------|---------|
| `pnpm test` | Run unit tests |
| `pnpm test:watch` | Watch mode |
| `pnpm typecheck` | TS strict checks |
| `pnpm lint` | Biome lint + format check |
| `pnpm lint:fix` | Auto-fix issues |
| `pnpm build` | Build dist with tsup |
| `pnpm test:dist` | Run tests against built output |
| `pnpm size` | Verify bundle budgets |
| `pnpm changeset` | Add a changeset for your PR |

## Where things live

```
src/
  core/           # types, normalize helpers (do not edit lightly)
  algorithms/     # shared math primitives (Luhn, mod-11, etc.)
  countries/<cc>/ # per-country folders — most contributions go here
  index.ts        # root API + REGISTRY

tests/
  countries/<cc>.test.ts # one test file per country
  algorithms/            # algorithm primitive tests
  dist/                  # tests against built output (do not skip these)

docs/
  countries/<cc>.md      # per-country reference, sources, examples
```

## Workflow for common contributions

### Adding a new country

1. Read `docs/countries/_template.md` and create `docs/countries/<cc>.md` first — citing every official source you used.
2. Create `src/countries/<cc>/<doc>.ts` for each document type, exporting one `DocumentSpec` per file.
3. Create `src/countries/<cc>/index.ts` that exports `validate`, `format`, `normalize`, `parse`, the country bundle, and individual specs.
4. Extend `src/core/types.ts`: add the country code to `CountryCode` and document codes to `DocumentTypeCode`.
5. Update `src/index.ts`: import the bundle and add its specs to the registry.
6. Update `package.json` exports map and `tsup.config.ts` country list.
7. Write `tests/countries/<cc>.test.ts` with at least 5 valid + 5 invalid + 3 edge case vectors per document.
8. Run `pnpm verify` and ensure everything passes.
9. Add a changeset: `pnpm changeset` and choose `minor` for a new country.
10. Open a PR using the country-add template.

### Correcting an algorithm

1. Open an issue first using the `algorithm_correction` template — include the official source that proves the current implementation is wrong.
2. Add new test vectors that fail under the current implementation and pass under the correct one.
3. Fix the implementation.
4. Verify all existing vectors still pass.
5. Add a changeset of `patch` severity.

### Fixing a bug

1. Add a regression test that reproduces the bug.
2. Fix the bug.
3. Add a changeset of `patch` severity.

## Quality bar

Every PR must:

- Pass `pnpm verify` locally
- Stay within the bundle size budget defined in `package.json#size-limit`
- Cite official sources for any algorithm change
- Use synthetic test vectors only — **never commit real document numbers**, even your own or your company's
- Include a changeset describing the change in plain language

## Commit conventions

We follow [Conventional Commits 1.0.0](https://www.conventionalcommits.org/). Common prefixes:

| Prefix | When to use |
|--------|-------------|
| `feat:` | New country, new document, new public API |
| `fix:` | Algorithm correction, type fix, bug fix |
| `docs:` | README, country docs, comments |
| `test:` | Test additions / improvements |
| `refactor:` | Internal restructure with no behavior change |
| `perf:` | Performance improvement |
| `chore:` | Dependencies, tooling, CI |

Breaking changes get a `!` after the type: `feat!: rename DocumentSpec.code to id`.

## License

By contributing you agree that your contributions are licensed under the [MIT License](./LICENSE).

## Recognition

Contributors are credited in [CHANGELOG.md](./CHANGELOG.md) under each release. Significant ongoing contributors may be invited as maintainers.
