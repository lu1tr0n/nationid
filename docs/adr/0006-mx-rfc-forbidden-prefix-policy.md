# ADR-0006: MX_RFC palabras altisonantes — reject without auto-substitution

- **Status**: Accepted
- **Date**: 2026-05-09
- **Deciders**: maintainers (initial v0.1 cohort)
- **Tags**: country-mx, validation, data-quality

## Context and Problem Statement

SAT publishes a list of approximately 80 four-letter combinations
(palabras altisonantes / vulgar terms) that may not appear as the first
four characters of an RFC for personas físicas. The list lives in
`src/countries/mx/shared.ts:164-246` as `RFC_FORBIDDEN_PREFIXES` and is
sourced from SAT Anexo 1-A § 2 of the Resolución Miscelánea Fiscal.

SAT's *issuance* pipeline handles the conflict by substituting the
fourth letter with `X` before the homoclave is derived. A taxpayer
whose surnames-plus-given-name initials would produce, say, `BUEY...`
receives an RFC starting with `BUEX...`. The substitution happens at
the SAT side; downstream validators see only the substituted form.

`nationid` is a validator, not an issuer. It receives the final RFC
string and must decide:

- **Reject** the unmasked form on the grounds that SAT would never
  have issued it that way.
- **Substitute** the fourth letter with `X` and re-derive the
  homoclave silently, mimicking SAT's behavior.
- **Warn and accept** — flag the input but return `valid`.

## Considered Options

1. **Reject** — return `invalid_format` whenever the prefix matches the
   forbidden list.
2. **Auto-substitute** — overwrite the fourth letter with `X` inside
   `normalize()` and validate the substituted form.
3. **Warn and accept** — surface a soft signal but treat the value as
   valid for `validate()`.

## Decision Outcome

Chosen option: **Reject**, because the input is not what SAT issues and
silent substitution would mask data-quality bugs at the call site.

The implementation lives at `src/countries/mx/rfc-pf.ts:77`:

```ts
if (RFC_FORBIDDEN_PREFIXES.has(cleaned.slice(0, 4))) return false;
```

and in the `parse()` path at `src/countries/mx/rfc-pf.ts:111-113`,
returning `{ ok: false, reason: { kind: 'invalid_format' } }`.

Option 2 was rejected for two reasons:

- We cannot reproduce SAT's full historical issuance state. The
  substitution is one part of a larger derivation that also involves
  the homoclave (positions 11-12), which depends on the *original*
  surname/name strings — strings that the validator does not have.
  Rewriting the fourth letter without recomputing the homoclave
  would produce a string that no longer validates against itself.
- Silent substitution masks legitimate caller bugs. If a downstream
  app stored the unmasked prefix, the validator's job is to surface
  that error, not paper over it.

Option 3 (warn and accept) was rejected for the same reasons stated in
ADR-0003: a `console.warn` is not a composable signal and accepting
the value forces every consumer to layer their own forbidden-prefix
filter on top of a validator that already has the list.

### Consequences

- The vast majority of real-world RFCs validate correctly because
  SAT's substitution happens before issuance — the actual stored
  prefix is `BUEX`, not `BUEY`, and `BUEX` is not in the forbidden
  list.
- A small fraction of legacy or error-state RFCs that retained the
  unmasked prefix in downstream systems will be flagged invalid by
  `nationid` while the homoclave digit happens to align. This is
  vanishingly rare in practice and is the correct outcome — the
  stored value is wrong relative to SAT's issuance.
- A consumer who needs the substitution behavior (e.g. an importer
  that ingests untrusted CSV exports and wants to remediate forbidden
  prefixes inline) must perform the substitution themselves before
  calling `validate()`.
- The forbidden list is data, not law. If SAT publishes an updated
  Anexo 1-A § 2 that adds or removes entries, the list in
  `src/countries/mx/shared.ts` must be updated and shipped as a
  patch release. Maintainers should track Anexo 1-A revisions when
  RMF reforms ship.
- A future v0.2+ may expose `{ substituteForbiddenPrefix: true }` as
  an opt-in if a documented use case appears. None has surfaced as
  of v0.1.

## More info

- Forbidden list: `src/countries/mx/shared.ts:154-246`
- Validator integration: `src/countries/mx/rfc-pf.ts:77`
- Parse-path integration: `src/countries/mx/rfc-pf.ts:111-113`
- JSDoc: `src/countries/mx/rfc-pf.ts:8-11`
- Authority: SAT Anexo 1-A § 2 of the RMF; CFF Art. 27
- Related ADR: ADR-0003 (rejected the warn-and-accept pattern at the
  library level)
