# ADR-0002: `parse()` returns a discriminated union; the public API does not throw on input

- **Status**: Accepted
- **Date**: 2026-05-09
- **Deciders**: maintainers (initial v0.1 cohort)
- **Tags**: api, error-handling

## Context and Problem Statement

`validate()` returns a boolean. That is sufficient for a checkbox-shaped UI
("is this DUI valid?") but loses information that callers frequently need:
*why* did validation fail? An empty string, a too-short body, a regex miss,
and a checksum miss are four distinct UX paths and at least three distinct
analytics buckets.

The library therefore needs a richer entry point. The shape of that entry
point determines how downstream code handles failure:

- An exception-based API forces every consumer to wrap every call in
  `try/catch`. Failure is the common case for user-typed input, so this
  produces noisy code and pollutes async stacks.
- A nullable return loses the failure reason.
- A discriminated union forces the caller to check `ok` once and gives them
  typed access to the failure reason.

The decision also has downstream impact on tooling: `Result`-style wrappers,
`neverthrow`, and React Query's error boundaries all integrate cleanly with a
plain returned shape and awkwardly with thrown exceptions for expected cases.

## Considered Options

1. **Throw on failure** — `parse(input)` returns the success shape or throws a
   typed `ParseError` subclass.
2. **Discriminated union** — `parse(input)` returns
   `{ ok: true, ... } | { ok: false, code, reason: { kind } }`. No exceptions
   for input failures.
3. **Tuple result** — `parse(input)` returns `[error, value]` (Go-style).

## Decision Outcome

Chosen option: **Discriminated union**, because it gives callers exhaustive
type-narrowing without `try/catch` and works uniformly across sync, async,
and functional pipelines. The shape is documented in
`src/core/types.ts:97-116`:

```ts
export type ParseResult =
  | { ok: true;  code; normalized; formatted; confidence }
  | { ok: false; code; reason: ParseError };

export type ParseError =
  | { kind: "empty" }
  | { kind: "too_short" }
  | { kind: "too_long" }
  | { kind: "invalid_format" }
  | { kind: "invalid_checksum" };
```

No public function on the input path throws on bad input. `validate()`,
`normalize()`, `format()`, and `parse()` are total over `string`. The five
`ParseError.kind` variants partition the failure space well enough that
property test P4 (see `docs/PROPERTY_TESTS.md`) can assert exhaustiveness.

There is one deliberate exception: `getSpec(code)` throws when `code` is not
registered (`src/index.ts:87-93`). That throw signals a *programming error*
(an unknown literal), not a runtime input error. A consumer who passed a
hard-coded `DocumentTypeCode` literal that was later removed needs a loud
failure, not a silent `undefined`. TypeScript's literal union prevents this
at compile time for any properly typed caller; the runtime throw exists as a
defense-in-depth for callers who erase the type at the boundary (`as any`,
JSON-derived strings, etc.).

### Consequences

- Callers must check `result.ok` before reading success fields. TypeScript
  enforces the narrowing at compile time, so missed checks fail to typecheck
  rather than crashing at runtime.
- Failure paths read like ordinary control flow. No `try/catch` boilerplate
  for the common case.
- `parse()` cannot use spread-and-pray patterns: code that does
  `const { normalized } = parse(...)` will read `undefined` on failure.
- `getSpec()` is the only public function that throws, and that asymmetry
  must be documented in the README and JSDoc so it does not surprise
  callers.
- Adding new `ParseError.kind` variants in the future is a minor breaking
  change for consumers who exhaustively switch on `kind`. The variant set
  shipped in v0.1 is intentionally small (5 cases) to keep this surface
  stable.

## More info

- Type definitions: `src/core/types.ts:92-116`, `src/core/types.ts:138-146`
- Root entry: `src/index.ts:124-129`
- Reference implementation: `src/countries/sv/dui.ts:53-75`
- Property test exhaustiveness: `docs/PROPERTY_TESTS.md` (P2, P4, P8)
- Original ADR seed: `nationid-research/ARCHITECTURE.md` §10 ADR-004
