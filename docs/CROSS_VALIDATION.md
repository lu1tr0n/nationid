# Cross-Validation

This document describes how `nationid` is cross-validated against established
reference libraries, and records every divergence we observed during the
v0.1.0 release gate.

Cross-validation is a release quality bar (Architecture §7.2): for every
document code where a JS reference library exists, `nationid` must agree with
that reference on at least 95% of synthetic vectors. Disagreements must be
explained and a "who's right" decision must be made — never silently
accommodated.

## Goal

Internal tests prove `nationid` is consistent with itself. Cross-validation
proves the algorithm is *correct* by triangulating against independent
implementations of the same standard.

## Reference libraries used

All four are added as `devDependencies` only — they never ship with the
runtime bundle.

| Library                          | Version  | License | Coverage in our scope                                  |
| -------------------------------- | -------- | ------- | ------------------------------------------------------ |
| `validator`                      | 13.15.35 | MIT     | ES_DNI, ES_NIE, AR_CUIT, BR_CPF, BR_CNPJ, US_EIN       |
| `cpf-cnpj-validator`             | 2.1.0    | MIT     | BR_CPF, BR_CNPJ                                        |
| `@brazilian-utils/brazilian-utils` | 2.3.0  | MIT     | BR_CPF, BR_CNPJ                                        |
| `rut.js`                         | 2.1.0    | MIT     | CL_RUT                                                 |

`python-stdnum` is the gold standard for breadth (~120 country modules) and
is LGPL + Python-only. It is used as a **second-pass out-of-process oracle**
during cross-validation tests only — never imported into the `nationid`
runtime, never bundled, never added to `package.json`. The
`tests/cross-validation/_stdnum-oracle.ts` adapter shells out to `python3 -c
"from stdnum.<cc> import <doc>; ..."` during the test run. Because we only
*call* python-stdnum at test time and never *redistribute* it, MIT
compatibility for the published nationid bundle is preserved. The oracle is
auto-skipped when `python3` or `python-stdnum` is unavailable, so CI does
not regress on hosts that lack Python.

## Fixture generation

All test vectors are **synthetic, generated programmatically** by
`tests/cross-validation/_helpers.ts`. No real public-figure or real-world
document number appears anywhere in the suite. Each generator:

1. Builds a body from a deterministic mulberry32 PRNG seeded by a per-code
   string (e.g. `"BR_CPF_VALID"`).
2. Computes the check digit with the canonical algorithm re-implemented from
   the published spec, NOT from the reference library's source.
3. For "invalid" sets, either flips the DV by ±1 or chooses an out-of-range
   prefix.

Per-code volume: 60 valid + 60 invalid vectors. Each input runs through every
applicable reference library, so a single vector contributes to multiple
agreement counts.

## Agreement matrix (v0.1.0 release gate)

All counts measured at 60 vectors per row. "Out of scope" means the reference
library does not implement that document type.

| Code         | vs cpf-cnpj-validator | vs brazilian-utils | vs validator.js (locale)                      | vs rut.js |
| ------------ | --------------------- | ------------------ | --------------------------------------------- | --------- |
| BR_CPF       | 60/60 valid · 60/60 invalid | 60/60 · 60/60      | 60/60 · 60/60 (`pt-BR`)                       | n/a       |
| BR_CNPJ      | 60/60 · 60/60         | 60/60 · 60/60      | 60/60 · 60/60 (`pt-BR`, raw form only)        | n/a       |
| AR_CUIT      | n/a                   | n/a                | 60/60 · 60/60 (`es-AR`, shared prefixes only) | n/a       |
| CL_RUT       | n/a                   | n/a                | n/a                                           | 60/60 · 60/60 |
| ES_DNI       | n/a                   | n/a                | 60/60 · 60/60 (`es-ES` / `isIdentityCard ES`) | n/a       |
| ES_NIE       | n/a                   | n/a                | 60/60 · 60/60 (`es-ES` / `isIdentityCard ES`) | n/a       |
| US_EIN       | n/a                   | n/a                | 60/60 · 60/60 (`en-US`)                       | n/a       |

**Aggregate: 100% agreement on every cross-validatable code (first pass).**

## Second-pass agreement matrix (vs `python-stdnum 2.2`)

The second pass closes the coverage gap above by triangulating against
`python-stdnum 2.2` (LGPL, Python). Tests live in
`tests/cross-validation/stdnum-<cc>.test.ts` and use `_stdnum-oracle.ts` to
batch-call `python3` for each test file.

| Code               | python-stdnum module       | Vectors per side | Agreement      |
| ------------------ | -------------------------- | ---------------- | -------------- |
| MX_CURP            | `stdnum.mx.curp`           | 40 valid · 40 invalid | 40/40 · 40/40 |
| MX_RFC_PF          | `stdnum.mx.rfc` (`validate_check_digits=True`) | 40 · 40 | 40/40 · 40/40 |
| MX_RFC_PM          | `stdnum.mx.rfc` (`validate_check_digits=True`) | 40 · 40 | 40/40 · 40/40 |
| CO_NIT             | `stdnum.co.nit`            | 40 · 40          | 40/40 · 40/40 |
| PE_RUC             | `stdnum.pe.ruc`            | 40 · 40 (shared zone) | 40/40 · 40/40 |
| PE_DNI             | `stdnum.pe.cui`            | 40 valid (format) | 40/40         |
| DO_CEDULA          | `stdnum.do.cedula`         | 40 · 40          | 40/40 · 40/40 |
| DO_RNC             | `stdnum.do.rnc`            | 40 · 40          | 40/40 · 40/40 |
| GT_NIT             | `stdnum.gt.nit`            | 40 · 40          | 40/40 · 40/40 |
| ES_DNI             | `stdnum.es.dni`            | 40 · 40          | 40/40 · 40/40 |
| ES_NIE             | `stdnum.es.nie`            | 40 · 40          | 40/40 · 40/40 |
| ES_NIF_PJ (CIF)    | `stdnum.es.cif`            | 40 · 40          | 40/40 · 40/40 |
| CR_CEDULA_FISICA   | `stdnum.cr.cpf`            | 40 valid (format) | 40/40         |
| CR_CEDULA_JURIDICA | `stdnum.cr.cpj`            | 40 valid (format, shared subtypes) | 40/40 |
| US_SSN             | `stdnum.us.ssn`            | 40 · 40          | 40/40 · 40/40 |
| US_ITIN            | `stdnum.us.itin`           | 40 valid (shared groups) | 40/40 |
| US_EIN             | `stdnum.us.ein`            | 40 · 40          | 40/40 · 40/40 |

**Aggregate (second pass): 100% agreement on every cross-validatable code
within the documented shared scope.** Total new cross-validation tests
added: 1,261 across 7 country files.

Codes still uncovered by any external reference: SV_DUI, SV_NIT (see D7),
HN_DNI, HN_RTN, AR_DNI, AR_CUIL, GT_DPI, CO_CC/CE/TI, MX_CURP-extranjero
edge cases, CR_DIMEX. These remain covered by internal unit tests plus
issuer-spec citations.

## Documented divergences

These are real differences between `nationid` and a reference library. None
of them invalidates the 95% gate — each is either out-of-scope for the
reference, or is a known reference-library limitation where `nationid`
follows the issuer specification.

### D1 — AR_CUIT prefixes 25 and 26

- **What**: AFIP RG 10/97 lists `20, 23, 24, 25, 26, 27, 30, 33, 34` as valid
  CUIT prefixes for personas físicas/jurídicas. validator.js v13.15.x's
  `es-AR` regex is `/(20|23|24|27|30|33|34)[0-9]{8}[0-9]/` — `25` and `26`
  are missing.
- **Who's right**: AFIP. validator.js's regex is incomplete.
- **Decision**: nationid keeps the full AFIP set. The cross-validation suite
  splits prefixes into `CUIT_PREFIXES_SHARED` (the seven both libs accept)
  for the agreement test, plus an explicit "nationid accepts, validator
  rejects" assertion using `CUIT_PREFIXES_NATIONID_ONLY = ["25","26"]` in
  `tests/cross-validation/validator-js.test.ts`. This documents the
  divergence in code rather than papering over it.
- **Source**: AFIP RG 10/1997 §3, https://www.arca.gob.ar/.

### D2 — AR_CUIT bodies whose check digit would be 10

- **What**: For ~9% of bodies, the mod-11 algorithm produces `dv === 10`,
  which is invalid as a single character. nationid (per AFIP § 4) treats the
  body itself as invalid and expects AFIP to reissue with a different prefix
  (e.g. switching from `20` to `23`). validator.js v13.15.x silently rewrites
  `dv = 10 → dv = 9` and returns `true` if the input has digit `9` in that
  position.
- **Who's right**: AFIP / nationid. validator.js's behavior matches an older
  pre-RG-10/97 convention but contradicts the current spec.
- **Decision**: nationid leaves the rule as-is. The cross-validation
  generator skips bodies that produce `dv === 10` so the apples-to-apples
  agreement count is not polluted by inputs that exercise this rule.

### D3 — BR_CNPJ formatted with dots/slashes

- **What**: `cpf-cnpj-validator` and `@brazilian-utils/brazilian-utils` both
  accept `11.222.333/0001-81`. validator.js v13.15.x `pt-BR` regex
  `(?:^\d{3}\.\d{3}\.\d{3}-\d{2}$)|(?:^\d{11}$)|(?:^[A-Z0-9]{12}\d{2}$)`
  accepts CPF with dots but rejects CNPJ with dots or slashes — only the
  bare 14-character form is accepted.
- **Who's right**: Both, on different axes. validator.js is intentionally
  strict on CNPJ format; the BR-specific libs and nationid normalize first.
- **Decision**: nationid normalizes the input before checking, matching
  Receita Federal's display convention. The cross-validation suite feeds
  validator.js the unformatted (raw) form to compare algorithm only.

### D4 — ES_NIF_PJ (CIF) — out of scope for validator.js

- **What**: validator.js `es-ES` regex
  `/^(\d{0,8}|[XYZKLM]\d{7})[A-HJ-NP-TV-Z]$/i` accepts only DNI and NIE
  shapes; the entity-NIF (legacy CIF, e.g. `A78135280`) is never accepted.
- **Who's right**: Neither side disagrees on algorithm — the reference simply
  doesn't implement this document type.
- **Decision**: ES_NIF_PJ is excluded from the cross-validation suite. The
  internal `tests/countries/es.test.ts` covers it with hand-built fixtures
  per AEAT spec.

### D5 — US_SSN, US_ITIN — out of scope for validator.js

- **What**: validator.js `en-US` regex `/^\d{2}[- ]{0,1}\d{7}$/` is 9 chars
  with a hyphen at position 2 — only the EIN shape. SSN (`AAA-GG-SSSS`) and
  ITIN (`9NN-NN-NNNN`) are not implemented.
- **Decision**: SSN and ITIN are excluded from cross-validation. Internal
  `tests/countries/us.test.ts` covers them with SSA POMS / IRS Pub 1915
  rules.

### D7 — SV_NIT — out of scope for python-stdnum cross-validation

- **What**: `python-stdnum.stdnum.sv.nit` uses a **two-algorithm** scheme
  branched on the correlative digits 10..12 (≤ 100 = "old" rule
  `(sum % 11) % 10`; > 100 = "new" rule with weights `(2,7,6,5,4,3,2,7,6,5,
  4,3,2)` and `(-sum % 11) % 10`), plus a first-digit constraint of `0`,
  `1`, or `9`. nationid uses a single mod-11 with weights 14..2 and the
  classic `11 - (sum mod 11)` mapping. The two implementations disagree on
  the vast majority of bodies whose correlative is > 100.
- **Who's right**: both are reverse-engineered. The Ministerio de
  Hacienda has not published the verification formula; nationid cites
  "DGII validates the result" via private observation, python-stdnum
  cites a community forum thread. Neither is authoritative.
- **Decision**: SV_NIT is excluded from python-stdnum cross-validation.
  Confidence stays at `moderate` per the existing nationid JSDoc. Internal
  fixtures continue to verify nationid's algorithm against itself.
  Resolution requires either (a) MH publishing an official spec or (b)
  bulk validation against a representative sample of MH-issued NITs from a
  trusted source — both deferred past v0.1.0.

### D8 — PE_RUC prefix `16` (no domiciliado especial)

- **What**: SUNAT issues RUC with prefixes `10, 15, 16, 17, 20`. nationid's
  regex matches all five. `python-stdnum.stdnum.pe.ruc` v2.2 enforces
  `('10', '15', '17', '20')` only — `16` is missing.
- **Who's right**: SUNAT / nationid. Prefix `16` is the historical
  "no domiciliado especial" range and remains in active use.
- **Decision**: nationid keeps the full SUNAT set. The cross-validation
  generator splits prefixes into a 4-prefix shared set for the
  agreement-rate test plus an explicit "nationid accepts, stdnum rejects"
  assertion using `RUC_PREFIXES_NATIONID_ONLY = ["16"]`.

### D9 — PE_RUC mod-11 residue mapping for `r ∈ {0, 1}`

- **What**: per SUNAT (RS 210-2004) the RUC verifier algorithm maps
  - `r = 0 → DV = 0`
  - `r = 1 → DV = 1`
  - `r ≥ 2 → DV = 11 - r`
  python-stdnum 2.2 uses the shortcut `DV = (11 - r) % 10`, which maps
  `r = 0 → DV = 1` and `r = 1 → DV = 0` — opposite to SUNAT for those two
  residues.
- **Who's right**: SUNAT / nationid. The shortcut is incorrect for the
  edge case (and disagrees with SUNAT-issued RUCs in the wild).
- **Decision**: nationid keeps the SUNAT mapping. The cross-validation
  generator skips bodies where `r ∈ {0, 1}` for the agreement test, and
  an explicit divergence test (`generateValidRucsDvDivergence`) asserts
  that nationid accepts SUNAT-correct DVs while python-stdnum rejects
  them. Worth filing upstream against python-stdnum.

### D10 — US_ITIN groups 50-65 (post-2012 IRS Pub. 1915 expansion)

- **What**: per current IRS Publication 1915, ITIN groups (positions 4-5)
  are valid in the ranges `50-65, 70-88, 90-92, 94-99`. nationid follows
  this. `python-stdnum.stdnum.us.itin` v2.2 only accepts groups in
  `70-99 \ {89, 93}`, missing the post-2012 IRS expansion to `50-65`.
- **Who's right**: IRS / nationid. The 50-65 range was opened up by IRS
  notice 2012-15.
- **Decision**: nationid keeps the IRS Pub. 1915 ranges. The
  cross-validation generator restricts the agreement-rate test to the
  shared subset (`70-88, 90-92, 94-99`) and adds an explicit "nationid
  accepts, stdnum rejects" test for groups in `50-65`. Worth filing
  upstream against python-stdnum.

### D11 — US_SSN famous-blacklist (python-stdnum only)

- **What**: `python-stdnum.stdnum.us.ssn` v2.2 hard-codes a 3-element
  blacklist of historically-cancelled SSNs (`078-05-1120`, `457-55-5462`,
  `219-09-9999`) — promotional or pamphlet SSNs that the SSA cancelled
  decades ago. nationid does not replicate this list because (a) those
  SSNs technically pass the SSA structural rules and (b) the canonical
  SSA "always invalid" specification only lists the area `000`, area
  `666`, and the entire `9xx` range, not specific number tuples.
- **Who's right**: a judgement call. python-stdnum is more conservative
  (rejects SSNs that even the SSA reportedly recognizes as invalid),
  nationid sticks to the published SSA structural rules.
- **Decision**: the cross-validation generator avoids these specific
  three numbers so the agreement count is unaffected. If a future caller
  asks for the famous-blacklist behavior we can add an opt-in option,
  but the default remains the SSA structural rules only.

### D6 — validator.js NIE prefix tolerance (K, L, M)

- **What**: validator.js `es-ES` regex tolerates leading `[XYZKLM]`. nationid
  ES_NIE strictly requires `[XYZ]` per Orden INT/2058/2008 (the operative
  Spanish NIE regulation). `K`, `L`, `M` are legacy prefixes from old NIF
  formats no longer issued.
- **Who's right**: nationid (current regulation). Note that this is a
  *generosity* divergence: validator.js will accept some legacy strings
  nationid rejects. Our generator only produces `[XYZ]` prefixes, so the
  agreement number is unaffected.
- **Decision**: keep nationid strict to the current regulation.

### D12 — ES_NIF_PJ (CIF) — `K`-prefix entities

- **What**: the research file `countries-comprehensive-tier2.md:145`
  prescribes letter-DV mandatory for prefixes `[K,P,Q,R,S,N,W]`. The shipped
  `nationid` impl (`src/countries/es/shared.ts:CIF_PREFIX_LETTER_DV`) and
  `nationid` regex (`src/countries/es/nif-pj.ts`) drop `K`. Inputs starting
  with `K` are rejected as `invalid_format` rather than evaluated.
- **Why**: `K`-prefix CIFs (Españoles residentes en el extranjero, certain
  legacy persona-jurídica wrappers) were retired as a NIF persona-jurídica
  letter in 2008 by AEAT. Modern AEAT issuance does not assign `K` to new
  jurídica entities; legacy `K`-prefix holders were migrated to other
  prefixes (typically `S` or `T`).
- **Reference behavior**:
  - `validator.js` v13.15 also drops `K` (matches nationid).
  - `python-stdnum 2.2`'s `stdnum.es.cif` is maximally permissive with the
    in-source comment "there seems to be conflicting information on which
    organisation types should have which type of check digit (alphabetic or
    numeric) so we support either here." It accepts either DV form for any
    of `ABCDEFGHJNPQRSUVW` but does NOT include `K` either.
- **Who's right**: nationid + validator.js (modern AEAT operating practice).
  The research file's listing was a pre-2008 snapshot.
- **Decision**: keep nationid strict (no `K`). If a downstream consumer has
  a real legacy K-prefix CIF, they can issue a feature request and we'll
  add a `legacy: true` opt-in flag in v0.2+.

## Bugs found and fixed during cross-validation

### B2 — MX RFC homoclave: SAT character-value table had a +1 offset

- **File**: `src/countries/mx/shared.ts` (`RFC_TABLE`).
- **Before**: ` `→0, `0`→1, ..., `9`→10, `A`→11, ..., `N`→24, `&`→25, `O`→26,
  ..., `Z`→37 (38 entries; digits start at 1, space at 0).
- **After**: `0`→0, ..., `9`→9, `A`→10, ..., `N`→23, `&`→24, `O`→25, ...,
  `Z`→36, ` `→37, `Ñ`→38 (39 entries; matches SAT Anexo 19 RMF "Tabla de
  equivalencia para la verificación del homoclave del RFC" and
  `python-stdnum.stdnum.mx.rfc._alphabet`).
- **Why**: every value was shifted by +1 from the canonical SAT table. The
  total weighted-sum offset was `Σ(1 * (13-i)) for i in 0..11 = 90`, and
  `90 mod 11 = 2`. So every nationid RFC checksum was off by 2 mod 11,
  producing the wrong DV character for every real-world RFC.
- **Detection**: cross-validation against `python-stdnum.stdnum.mx.rfc`
  with `validate_check_digits=True`. python-stdnum's published doctest
  values `GODE561231GR8` (PF) and `MAB9307148T4` (PM) failed nationid
  validation; conversely, every fixture in nationid's own
  `tests/countries/mx.test.ts` (e.g. `MELO850315H79`) failed
  python-stdnum's check-digit validation. After the fix the doctest
  values pass nationid and the regenerated fixtures (e.g. `MELO850315H70`)
  pass both libs.
- **Authority**: SAT Anexo 19 of the Resolución Miscelánea Fiscal (RMF) —
  the official "Tabla 1" assigns digits `0-9` to values `0-9` and letters
  `A-N` to `10-23`, with `&`=24, `O-Z`=25-36, space=37, `Ñ`=38. This is
  the canonical published table used by every certified Mexican PAC and
  matches `python-stdnum`'s implementation. The previous nationid table
  was a community-derived variant that had drifted by one slot.
- **Impact**: the fix is a hard breaking change for any external caller
  who hard-coded RFC fixtures generated against v0.1.0's broken table.
  Internal-test fixtures were regenerated; downstream consumers must
  update theirs. Confidence remains `moderate` because no first-party
  SAT fixture set is published, but the algorithm is now demonstrably
  consistent with both the SAT spec and python-stdnum.
- **Doc updates**: `src/countries/mx/{shared,rfc-pf,rfc-pm}.ts` JSDoc
  blocks now cite the SAT Anexo 19 table layout and the python-stdnum
  cross-validation event. `tests/countries/mx.test.ts` fixture comments
  were updated with the corrected DVs.

### B1 — US_EIN: prefixes 69, 70, 96, 97 were incorrectly accepted

- **File**: `src/countries/us/shared.ts` (`buildEinPrefixes`)
- **Before**: ranges `[1,6], [10,16], [20,27], [30,48], [50,77], [80,88],
  [90,99]` — total 87 prefixes.
- **After**: ranges `[1,6], [10,16], [20,27], [30,48], [50,68], [71,77],
  [80,88], [90,95], [98,99]` — total 83 prefixes.
- **Why**: validator.js's `enUsCampusPrefix` table (sourced from the IRS
  campus-by-campus list, https://www.irs.gov/businesses/small-businesses-self-employed/how-eins-are-assigned-and-valid-ein-prefixes)
  enumerates exactly the 83 prefixes that have ever been assigned to a
  campus. nationid's nine over-broad ranges accidentally added `69, 70, 96,
  97`, none of which appear on the IRS list. Cross-validation flagged the
  miss as 6/60 valid disagreements before the fix; agreement is now 60/60.
- **Authority**: IRS published list (campus-by-campus). validator.js's
  prefix set matches it. This is the correct source.
- **Doc updates**: also amended the prefix range comment in
  `src/countries/us/ein.ts` and the matching comment in
  `tests/cross-validation/_helpers.ts`. The fixtures in
  `tests/countries/us.test.ts` use prefixes within the corrected ranges, so
  no test changes were needed.

## How to add a new cross-validation pair

1. Pick a reference library on npm with a permissive license (MIT/BSD/ISC)
   and add it to `devDependencies` only.
2. Add a generator pair to `tests/cross-validation/_helpers.ts` that
   produces `count` valid + `count` invalid synthetic vectors. Re-implement
   the algorithm from the published spec; do not import from the reference
   library.
3. Create `tests/cross-validation/<lib>.test.ts` using the
   `it.each(VECTORS)("both ... %s", input => { ... })` pattern.
4. Update the agreement matrix in this file. If a discrepancy is found,
   triage:
   - If `nationid` is wrong, fix `src/` and cite the cross-validation
     evidence in the JSDoc.
   - If the reference is wrong, document under "Documented divergences"
     here with the issuer-spec citation and a decision note.
   - If neither side is wrong (different scope), mark "out of scope" and
     restrict the comparison fixture set so only the overlapping shape is
     compared.

## CI integration

Cross-validation tests run as part of the default `pnpm test` because they
are fast (≈10s end-to-end for 1,600+ assertions). They are NOT a separate
opt-in suite — that would let regressions slip through.
