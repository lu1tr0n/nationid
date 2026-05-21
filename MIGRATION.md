# Migration guide

Two migration paths live in this document:

- **v0.x → v1.0** ([§0 below](#0-migrating-from-v0x-to-v10)) — three small breaking changes inside `nationid` itself.
- **`validator.js` / `cpf-cnpj-validator` / `brazilian-utils` / `rut.js` → `nationid`** ([§1 onward](#1-why-migrate)) — drop-in replacement recipes.

---

## 0. Migrating from v0.x to v1.0

`nationid` v1.0 ships the API-stability promise. Most of the v0.6 surface is unchanged. Three intentional breakings are listed below, ordered by likely user impact.

### 0.1 `mask()` now throws on unknown codes (symmetry fix)

**v0.x:** `pii.mask(code, input)` silently returned `input` unchanged when `code` was not a registered `DocumentTypeCode`. Its siblings `pii.hash` and `pii.lastN` already threw `Error("nationid/pii.<fn>: no spec registered for "<code>"")`. The asymmetry meant the same caller code worked or broke depending on which primitive it picked.

**v1.0:** all three throw on unknown code.

```ts
// BEFORE — soft fallback (now removed)
const out = mask("XX_UNKNOWN", "12345"); // "12345"

// AFTER — throws
const out = mask("XX_UNKNOWN", "12345"); // ❌ Error: no spec registered for "XX_UNKNOWN"
```

**Migration:** if you relied on the soft fallback (rare — `code` is type-checked at compile time by the `DocumentTypeCode` union), wrap calls in a `try/catch` or gate on `listSupportedCodes().includes(code)` first. In practice, the only callers that hit this path were ones using `as DocumentTypeCode` to suppress a real type error.

### 0.2 `package.json` `exports` denies undocumented subpaths

**v0.x:** importing from non-public subpaths like `nationid/core/normalize` or `nationid/countries/mx/curp` worked because Node fell back to the file system after the explicit exports map missed.

**v1.0:** the exports map ends with `"./*": null`, which denies any subpath not listed. Only the documented entries resolve: `nationid`, `nationid/algorithms`, `nationid/<cc>` (34 country subpaths), `nationid/extract`, `nationid/pii`, `nationid/catalog`, `nationid/i18n` (+ `/en`, `/es`, `/pt`).

**Migration:** if you imported a private internal, switch to a documented subpath. Per-country specs are re-exported by their country bundle (`import { curpSpec } from "nationid/mx"`); algorithm primitives come from `nationid/algorithms`. If you need a primitive that is not exported, open an issue — the gap probably points at a missing public API rather than a need to escape the deny rule.

### 0.3 `CA_PASAPORTE` and `ES_PASAPORTE` demote `high → moderate`

**v0.x:** both passports declared `confidence: "high"`.

**v1.0:** both demote to `"moderate"`. The runtime regex and validation are unchanged. The reason: neither IRCC (Canada) nor DGP (Spain) publishes a first-party format spec we can cite. The library inherited the patterns from Microsoft Purview's DLP catalog and the corresponding Wikipedia articles. After v1.0 ships a governance test (`tests/governance/confidence-citations.test.ts`) that fails CI when a `high` spec lacks an issuer-grade citation, these two no longer qualify.

**Migration:** if you branch on `confidence === "high"` to decide whether to accept the document without secondary verification (e.g., KYC tiering), audit the call sites that touched CA / ES passports. The library's runtime behaviour is unchanged — only the metadata field shifted. If you require structural confidence, switch to `country === "X" && code === "X_PASAPORTE"` plus your own out-of-band check.

### 0.4 Type-only narrowing in `nationid/extract` (compile-only, no runtime change)

This is **not** a runtime break — `nationid/extract` behaves identically at runtime in v1.0 — but it can surface a type error for users in strict TypeScript whose code did not previously narrow the first argument.

**v0.x:**
```ts
extractDOB(code: DocumentTypeCode, input: string): DateOfBirth | null
extractSex(code: DocumentTypeCode, input: string): Sex | null
extractRegion(code: DocumentTypeCode, input: string): Region | null
```
Any of the 124 codes typed-checked at the call site. Codes that don't structurally encode the field returned `null` at runtime.

**v1.0:** each function constrains the first argument to the codes that actually encode that field, via a mapped type over the internal `SUPPORT_TABLE`:
```ts
extractDOB(code: CodesSupporting<"dob">,    input: string): DateOfBirth | null
extractSex(code: CodesSupporting<"sex">,    input: string): Sex | null
extractRegion(code: CodesSupporting<"region">, input: string): Region | null
```
Today `CodesSupporting<"dob"> = "MX_CURP" | "MX_RFC_PF"`, `CodesSupporting<"sex"> = "MX_CURP" | "AR_CUIT" | "AR_CUIL" | "AR_CDI"`, and `CodesSupporting<"region"> = "MX_CURP" | "GT_DPI" | "PE_RUC"`. The union grows automatically as new countries are added to `SUPPORT_TABLE`.

**What this means for your code:**

1. **Direct literal calls keep working:**
   ```ts
   extractDOB("MX_CURP", input); // ✅ unchanged
   extractDOB("CL_RUT",  input); // ❌ compile error in v1.0 (silently returned null in v0.x)
   ```

2. **Variable-typed calls now require a narrow:** if you pass a variable typed `DocumentTypeCode`, TypeScript can no longer prove the call is safe.

   ```ts
   function showDob(code: DocumentTypeCode, value: string) {
     extractDOB(code, value); // ❌ v1.0 — DocumentTypeCode not assignable to CodesSupporting<"dob">
   }
   ```

   Fix with the existing `supports()` runtime guard, which narrows automatically:
   ```ts
   import { extractDOB, supports } from "nationid/extract";

   function showDob(code: DocumentTypeCode, value: string) {
     if (supports(code, "dob")) {
       extractDOB(code, value); // ✅ code is now CodesSupporting<"dob">
     }
   }
   ```

   Or, if you genuinely want the old "try and fall back to null" shape, cast at the call site and document the cast:
   ```ts
   extractDOB(code as Parameters<typeof extractDOB>[0], value); // returns null at runtime if unsupported
   ```

3. **Runtime behaviour is identical.** Nothing about the `null` return path changed. If you were already gating with `supports()` (the documented pattern), v1.0 picks up the type narrowing for free with zero code change.

### What did NOT change

- All `validate / format / normalize / parse / getSpec / listSupportedCodes` signatures stay backward-compatible at the type level. `parse()` and `getSpec()` are now generic over `<C extends DocumentTypeCode>`, but with `DocumentTypeCode` as the default parameter — existing `: ParseResult` and `: DocumentSpec` annotations keep working.
- All country bundles (`mxBundle`, `brBundle`, …) keep the same shape and contents.
- All 34 country subpaths keep the same entry points.
- All translations (`nationid/i18n/{en,es,pt}`) keep the same keys.
- Tarball is **76% smaller** (1.7 MB → 413 KB) thanks to dropped sourcemaps and `extract`/`pii` no longer pulling the root REGISTRY. No code change needed to benefit.

### Upgrade in one line

```bash
pnpm add nationid@1.0.0
# or
npm install nationid@1.0.0
# or
yarn upgrade nationid@1.0.0
```

Re-run your test suite. If `pnpm typecheck` and `pnpm test` stay green, you are done.

---

Move from `validator.js`, `cpf-cnpj-validator`, `@brazilian-utils/brazilian-utils`, or `rut.js` to `nationid` in under ten minutes per library, with cross-validated test evidence that the swap is behaviourally safe.

This guide is paired with [`docs/CROSS_VALIDATION.md`](docs/CROSS_VALIDATION.md), which documents every observed divergence at the v0.1.0 release gate. When this document references a divergence (e.g. `D1`, `D2`), the link points at the canonical entry there.

> Estimated reading time: 12 minutes. Per-library recipe time: 5–10 minutes.

## 1. Why migrate?

The four reference libraries below are well-maintained, MIT-licensed, and remain credible for their published scope. `nationid` exists for the case the others do not cover well: a single TypeScript-first surface for thirteen countries (twenty-eight document codes) with checksum verification, tree-shakable subpath imports, zero runtime dependencies, and a typed `parse()` result instead of a boolean. If you only need Brazilian CPF/CNPJ in Node, `cpf-cnpj-validator` is fine; if you ship a multi-country product, `nationid` collapses four ad-hoc dependencies into one.

---

## 2. Compatibility matrix

The columns reflect what each reference library implements **today** in its current published version. `nationid` columns reflect the v0.1.0 release.

| Document | nationid code | validator.js | cpf-cnpj-validator | brazilian-utils | rut.js |
|----------|---------------|:------------:|:------------------:|:---------------:|:------:|
| BR CPF | `BR_CPF` | ✅ (`pt-BR`) | ✅ | ✅ | — |
| BR CNPJ | `BR_CNPJ` | ✅ (raw only, see [D3](docs/CROSS_VALIDATION.md#d3--br_cnpj-formatted-with-dotsslashes)) | ✅ | ✅ | — |
| AR CUIT | `AR_CUIT` | ✅ (`es-AR`, prefixes `25/26` missing — see [D1](docs/CROSS_VALIDATION.md#d1--ar_cuit-prefixes-25-and-26)) | — | — | — |
| AR CUIL | `AR_CUIL` | — | — | — | — |
| AR DNI | `AR_DNI` | — | — | — | — |
| CL RUT/RUN | `CL_RUT` | — | — | — | ✅ |
| ES DNI | `ES_DNI` | ✅ (`es-ES`) | — | — | — |
| ES NIE | `ES_NIE` | ✅ (`es-ES`, accepts legacy `K/L/M` — see [D6](docs/CROSS_VALIDATION.md#d6--validatorjs-nie-prefix-tolerance-k-l-m)) | — | — | — |
| ES NIF (CIF, persona jurídica) | `ES_NIF_PJ` | — (out of scope, see [D4](docs/CROSS_VALIDATION.md#d4--es_nif_pj-cif--out-of-scope-for-validatorjs)) | — | — | — |
| US EIN | `US_EIN` | ✅ (`en-US`) | — | — | — |
| US SSN | `US_SSN` | — (see [D5](docs/CROSS_VALIDATION.md#d5--us_ssn-us_itin--out-of-scope-for-validatorjs)) | — | — | — |
| US ITIN | `US_ITIN` | — | — | — | — |
| SV DUI / NIT | `SV_DUI`, `SV_NIT` | — | — | — | — |
| MX CURP / RFC PF / RFC PM | `MX_CURP`, `MX_RFC_PF`, `MX_RFC_PM` | — | — | — | — |
| CO CC / CE / TI / Pasaporte / NIT | `CO_CC`, `CO_CE`, `CO_TI`, `CO_PASAPORTE`, `CO_NIT` | — | — | — | — |
| PE DNI / CE / RUC | `PE_DNI`, `PE_CE`, `PE_RUC` | — | — | — | — |
| DO Cédula / RNC | `DO_CEDULA`, `DO_RNC` | — | — | — | — |
| GT DPI / NIT | `GT_DPI`, `GT_NIT` | — | — | — | — |
| HN DNI / RTN | `HN_DNI`, `HN_RTN` | — | — | — | — |
| CR Cédula física / DIMEX / Cédula jurídica | `CR_CEDULA_FISICA`, `CR_DIMEX`, `CR_CEDULA_JURIDICA` | — | — | — | — |

`validator.js` retains uniquely strong coverage of European tax IDs (Belgium, Bulgaria, Croatia, Cyprus, Czech Republic, etc.) that `nationid` does not yet ship. If your scope is dominated by EU tax IDs outside Spain, keep `validator.js` for those locales and use `nationid` alongside it for the Latin American and identity-card workload.

---

## 3. API mapping cheatsheet

One-line equivalents. Substitute the appropriate `DocumentTypeCode` (e.g. `BR_CPF`, `CL_RUT`, `ES_DNI`).

| Operation | Reference call | nationid equivalent |
|-----------|----------------|---------------------|
| Validate | `validator.isTaxID(x, 'pt-BR')` | `validate('BR_CPF', x)` |
| Validate | `cpf.isValid(x)` / `isValidCpf(x)` | `validate('BR_CPF', x)` |
| Validate | `rut.validate(x)` | `validate('CL_RUT', x)` |
| Format | `cpf.format(x)` / `rut.format(x)` | `format(code, x)` |
| Strip | `cpf.strip(x)` / `rut.clean(x)` | `normalize(code, x)` |
| Detailed parse | _(no equivalent)_ | `parse(code, x)` |
| Generate fixture | `cpf.generate()` | _(out of scope; keep in test code)_ |

---

## 4. Migration recipes

### 4.1 From `validator.js`

**Coverage delta** in your scope:

- Already supported by `nationid`: `BR_CPF`, `BR_CNPJ`, `AR_CUIT`, `ES_DNI`, `ES_NIE`, `US_EIN`.
- Now supported (was missing in `validator.js`): `ES_NIF_PJ` (CIF), `US_SSN`, `US_ITIN`, `AR_CUIL`, `AR_DNI`, plus every other country in the matrix above (SV, MX, CO, PE, GT, HN, CR, DO, CL).
- Different behaviour: AR_CUIT prefixes `25/26` ([D1](docs/CROSS_VALIDATION.md#d1--ar_cuit-prefixes-25-and-26)); AR_CUIT bodies whose `dv === 10` ([D2](docs/CROSS_VALIDATION.md#d2--ar_cuit-bodies-whose-check-digit-would-be-10)); BR_CNPJ formatted with dots/slashes ([D3](docs/CROSS_VALIDATION.md#d3--br_cnpj-formatted-with-dotsslashes)); ES_NIE legacy `K/L/M` prefix ([D6](docs/CROSS_VALIDATION.md#d6--validatorjs-nie-prefix-tolerance-k-l-m)).

**Install**:

```sh
pnpm remove validator @types/validator
pnpm add nationid
```

If `validator` is still used elsewhere (URLs, emails, EU tax IDs outside `nationid`'s scope), keep it; the two coexist without conflict.

**Code changes**:

Before:

```ts
import validator from "validator";

const cpfOk = validator.isTaxID("529.982.247-25", "pt-BR");
const dniOk = validator.isIdentityCard("12345678Z", "ES");
const einOk = validator.isTaxID("12-3456789", "en-US");
```

After:

```ts
import { validate } from "nationid";

const cpfOk = validate("BR_CPF", "529.982.247-25");
const dniOk = validate("ES_DNI", "12345678Z");
const einOk = validate("US_EIN", "12-3456789");
```

For tree-shaken bundles, prefer the country subpath:

```ts
import { validate } from "nationid/br";

const cpfOk = validate("CPF", "529.982.247-25");
```

**Equivalents table**:

| `validator.js` call | `nationid` equivalent |
|---------------------|------------------------|
| `isTaxID(x, 'pt-BR')` for 11-digit input | `validate('BR_CPF', x)` |
| `isTaxID(x, 'pt-BR')` for 14-digit input | `validate('BR_CNPJ', x)` |
| `isTaxID(x, 'es-AR')` | `validate('AR_CUIT', x)` |
| `isTaxID(x, 'es-ES')` | `validate('ES_DNI', x)` or `validate('ES_NIE', x)` |
| `isTaxID(x, 'en-US')` | `validate('US_EIN', x)` |
| `isIdentityCard(x, 'ES')` | `validate('ES_DNI', x)` or `validate('ES_NIE', x)` |
| `isIdentityCard(x, 'AR')` | `validate('AR_DNI', x)` |
| `isIdentityCard(x, locale)` for non-listed locales | _stay on `validator.js`_ |

**Caveats specific to `validator.js`** (every bullet is a place where `nationid` returns a different boolean for the same input):

- CNPJ dotted/slashed form (`11.222.333/0001-81`): `nationid` accepts; `validator.js pt-BR` rejects. See [D3](docs/CROSS_VALIDATION.md#d3--br_cnpj-formatted-with-dotsslashes).
- AR_CUIT prefixes `25` / `26`: `nationid` accepts (AFIP RG 10/97); `validator.js es-AR` rejects. See [D1](docs/CROSS_VALIDATION.md#d1--ar_cuit-prefixes-25-and-26).
- AR_CUIT bodies whose DV would be `10`: `nationid` rejects (AFIP §4); `validator.js` silently maps to `9` and accepts. See [D2](docs/CROSS_VALIDATION.md#d2--ar_cuit-bodies-whose-check-digit-would-be-10).
- ES_NIE legacy prefixes `K` / `L` / `M`: `nationid` rejects (Orden INT/2058/2008); `validator.js es-ES` accepts. See [D6](docs/CROSS_VALIDATION.md#d6--validatorjs-nie-prefix-tolerance-k-l-m).

---

### 4.2 From `cpf-cnpj-validator`

**Coverage delta**:

- Already supported: `BR_CPF`, `BR_CNPJ`.
- Now supported (was missing): every other country in the matrix above.
- Different behaviour: none observed — agreement is 60/60 valid and 60/60 invalid on synthetic vectors at the v0.1.0 release gate.

**Install**:

```sh
pnpm remove cpf-cnpj-validator
pnpm add nationid
```

**Code changes**:

Before:

```ts
import { cpf, cnpj } from "cpf-cnpj-validator";

const cpfOk = cpf.isValid("529.982.247-25");
const cnpjOk = cnpj.isValid("11.222.333/0001-81");
const cpfFormatted = cpf.format("52998224725");
const cpfStripped = cpf.strip("529.982.247-25");
```

After:

```ts
import { validate, format, normalize } from "nationid/br";

const cpfOk = validate("CPF", "529.982.247-25");
const cnpjOk = validate("CNPJ", "11.222.333/0001-81");
const cpfFormatted = format("CPF", "52998224725");
const cpfStripped = normalize("CPF", "529.982.247-25");
```

**Equivalents table**:

| `cpf-cnpj-validator` call | `nationid` equivalent |
|---------------------------|------------------------|
| `cpf.isValid(x)` | `validate('CPF', x)` from `nationid/br`, or `validate('BR_CPF', x)` from root |
| `cpf.format(x)` | `format('CPF', x)` from `nationid/br` |
| `cpf.strip(x)` | `normalize('CPF', x)` from `nationid/br` |
| `cnpj.isValid(x)` | `validate('CNPJ', x)` from `nationid/br` |
| `cnpj.format(x)` | `format('CNPJ', x)` from `nationid/br` |
| `cnpj.strip(x)` | `normalize('CNPJ', x)` from `nationid/br` |
| `cpf.generate()`, `cnpj.generate()` | _no public equivalent — keep your fixture helper or move it to test code_ |

**Caveats specific to `cpf-cnpj-validator`**:

- Both libraries reject all-same-digit placeholders (`00000000000`, `11111111111`, …) before checksum. See the placeholder test in `tests/cross-validation/cpf-cnpj-validator.test.ts:62-83`.
- If you call `cpf.generate()` to mint test fixtures inside production code, move that import into a `__tests__` or dev-only module. `nationid` omits generators from the runtime surface to keep the bundle small.

---

### 4.3 From `@brazilian-utils/brazilian-utils`

**Coverage delta**:

- Already supported: `BR_CPF`, `BR_CNPJ`.
- Now supported (was missing): every other country in the matrix above.
- Different behaviour: none observed — agreement is 60/60 valid and 60/60 invalid on synthetic vectors. `brazilian-utils` covers additional Brazilian artefacts (CEP, license plates, phone numbers, bank identifiers) which are out of scope for `nationid`.

**Install**:

```sh
pnpm remove @brazilian-utils/brazilian-utils
pnpm add nationid
```

If your code uses `brazilian-utils` for things outside identity / tax IDs (CEP, plates, phones), keep the dependency for those; replace only the CPF / CNPJ calls.

**Code changes**:

Before:

```ts
import { isValidCpf, isValidCnpj } from "@brazilian-utils/brazilian-utils";

const cpfOk = isValidCpf("529.982.247-25");
const cnpjOk = isValidCnpj("11.222.333/0001-81");
```

After:

```ts
import { validate } from "nationid/br";

const cpfOk = validate("CPF", "529.982.247-25");
const cnpjOk = validate("CNPJ", "11.222.333/0001-81");
```

**Equivalents table**:

| `brazilian-utils` call | `nationid` equivalent |
|------------------------|------------------------|
| `isValidCpf(x)` | `validate('CPF', x)` from `nationid/br` |
| `isValidCnpj(x)` | `validate('CNPJ', x)` from `nationid/br` |
| `formatCpf(x)` | `format('CPF', x)` |
| `formatCnpj(x)` | `format('CNPJ', x)` |
| `isValidCep`, `isValidPhone`, `isValidPlate`, ... | _no equivalent — keep `brazilian-utils`_ |

**Caveats specific to `brazilian-utils`**:

- Both libraries reject all-same-digit placeholders and compute the canonical mod-11 the same way. The migration is functionally identical; the win is the smaller surface area when CPF/CNPJ is all you import.
- `brazilian-utils` 2.x supports the alphanumeric CNPJ for the Receita Federal July 2026 rollout. `nationid` v0.1 covers numeric CNPJ only; alphanumeric is tracked under ADR-001 for a follow-up release.

---

### 4.4 From `rut.js`

**Coverage delta**:

- Already supported: `CL_RUT` (covers both RUT and RUN — Chile uses the same checksum).
- Now supported (was missing): every other country in the matrix above.
- Different behaviour: none observed — agreement is 60/60 valid and 60/60 invalid on synthetic vectors, and `nationid` accepts `rut.js`'s formatted output verbatim (verifier letter `K` uppercase).

**Install**:

```sh
pnpm remove rut.js
pnpm add nationid
```

**Code changes**:

Before:

```ts
import { validate as rutValidate, format as rutFormat, clean as rutClean } from "rut.js";

const ok = rutValidate("12.345.678-5");
const formatted = rutFormat("123456785");
const cleaned = rutClean("12.345.678-5");
```

After:

```ts
import { validate, format, normalize } from "nationid/cl";

const ok = validate("RUT", "12.345.678-5");
const formatted = format("RUT", "123456785");
const cleaned = normalize("RUT", "12.345.678-5");
```

**Equivalents table**:

| `rut.js` call | `nationid` equivalent |
|---------------|------------------------|
| `validate(x)` | `validate('RUT', x)` from `nationid/cl` |
| `format(x)` | `format('RUT', x)` from `nationid/cl` |
| `clean(x)` | `normalize('RUT', x)` from `nationid/cl` |
| `getCheckDigit(x)` | _no public equivalent in v0.1; compute via `validate` round-trip or open a feature request_ |

**Caveats specific to `rut.js`**:

- `rut.js` returns the verifier letter `K` uppercase. `nationid`'s `normalize` does the same. A round-trip `rutClean → validate('RUT', ...)` succeeds for every valid input we tested.
- The Chilean SII algorithm has not changed since `rut.js`'s 2021 publication, so behavioural drift is not expected. The cross-validation suite re-runs on every `nationid` release.

---

## 5. Behavioural differences you must know

These are the cases where `nationid` returns a different boolean from a reference library on the same input. Each links to the canonical entry in `docs/CROSS_VALIDATION.md`.

### 5.1 All-same-digit rejection (BR_CPF, BR_CNPJ)

`00000000000`, `11111111111`, `99999999999` (and the analogous CNPJ placeholders) pass the bare mod-11 math but are not valid documents. `nationid`, `cpf-cnpj-validator`, `brazilian-utils`, and `validator.js pt-BR` all reject them. If you wrote a custom validator that compared only the checksum, expect `nationid` to reject placeholders your code accepted.

### 5.2 dv = 10 handling (AR_CUIT, GT_DPI, others)

For about 9% of randomly chosen bodies, the canonical mod-11 produces a check digit of `10`, which cannot be encoded as a single character. `nationid` follows AFIP §4 and the equivalent rules elsewhere: the body is invalid and is expected to be reissued under a different prefix. `validator.js` instead silently rewrites `dv = 10` to `9` and returns `true` for any input whose final character is `9` in that position. See [D2](docs/CROSS_VALIDATION.md#d2--ar_cuit-bodies-whose-check-digit-would-be-10).

### 5.3 Format-only vs checksum semantics

Documents whose `confidence` is `low` or `unconfirmed` (read it via `getSpec(code).confidence`) validate by format only — `nationid` cannot confirm the check digit because no authoritative algorithm has been published. Examples in v0.1: certain CR DIMEX shapes, some HN DNI subtypes. Surface a "format verified, issuer not confirmed" hint in your UI for these codes. See the README's "Confidence flag" section.

### 5.4 `parse()` vs reference-library boolean returns

Reference libraries return `true` / `false`. `nationid` exposes both styles:

```ts
import { parse, validate } from "nationid";

const ok: boolean = validate("BR_CPF", input);

const result = parse("BR_CPF", input);
if (result.ok) {
  result.normalized; // "52998224725"
  result.formatted;  // "529.982.247-25"
  result.confidence; // "high"
} else {
  result.reason.kind; // "empty" | "too_short" | "too_long" | "invalid_format" | "invalid_checksum"
}
```

If your existing code uses booleans and a separate `if (!input) return false`, `parse()` lets you collapse those branches and surface a typed reason to the user. The `parse()` method **never throws**.

### 5.5 Whitespace and case handling

Every `nationid` validator runs `normalize()` first: it trims, strips separators (`.`, `-`, `/`, spaces), and uppercases letters. `validator.js` requires a specific shape per locale (`pt-BR` rejects formatted CNPJ; see [D3](docs/CROSS_VALIDATION.md#d3--br_cnpj-formatted-with-dotsslashes)). `cpf-cnpj-validator`, `brazilian-utils`, and `rut.js` normalize before validating, matching `nationid`. Drop any hand-rolled pre-trim step you wrapped around `validator.isTaxID`.

---

## 6. Side-by-side migration script

A pragmatic find-and-replace covers the majority of call sites. Run these from the repo root and review the diff before committing. Run your test suite after each block. The scripts cover idiomatic call sites; aliased imports and multi-line calls need manual review.

```sh
# cpf-cnpj-validator → nationid/br
rg -l "cpf-cnpj-validator" --type=ts \
  | xargs sed -i \
    -e "s/import { cpf, cnpj } from ['\"]cpf-cnpj-validator['\"];/import { validate, format, normalize } from 'nationid\/br';/" \
    -e "s/cpf\.isValid(\([^)]\+\))/validate('CPF', \1)/g" \
    -e "s/cnpj\.isValid(\([^)]\+\))/validate('CNPJ', \1)/g" \
    -e "s/cpf\.format(\([^)]\+\))/format('CPF', \1)/g" \
    -e "s/cnpj\.format(\([^)]\+\))/format('CNPJ', \1)/g" \
    -e "s/cpf\.strip(\([^)]\+\))/normalize('CPF', \1)/g" \
    -e "s/cnpj\.strip(\([^)]\+\))/normalize('CNPJ', \1)/g"

# rut.js → nationid/cl
rg -l "from ['\"]rut\.js['\"]" --type=ts \
  | xargs sed -i \
    -e "s/import { validate as rutValidate, format as rutFormat, clean as rutClean } from ['\"]rut\.js['\"];/import { validate, format, normalize } from 'nationid\/cl';/" \
    -e "s/rutValidate(\([^)]\+\))/validate('RUT', \1)/g" \
    -e "s/rutFormat(\([^)]\+\))/format('RUT', \1)/g" \
    -e "s/rutClean(\([^)]\+\))/normalize('RUT', \1)/g"
```

`validator.js` is harder to scriptify because the same `isTaxID` call carries the locale as a positional argument; replace those by hand or extend the script per locale.

---

## 7. Validating the migration

The safest migration runs both libraries side-by-side over your real input set for a release cycle, then drops the old library once the diff log is empty. Reproduce the cross-validation pattern in your own test file:

```ts
import { describe, expect, it } from "vitest";
import { cpf } from "cpf-cnpj-validator";
import { validate } from "nationid/br";

const SAMPLE_INPUTS = [
  "529.982.247-25",
  "11144477735",
  "00000000000",          // placeholder, both reject
  "529.982.247-26",       // bad DV, both reject
];

describe("nationid agrees with cpf-cnpj-validator on production inputs", () => {
  it.each(SAMPLE_INPUTS)("both libraries return the same boolean for %s", (input) => {
    expect(validate("CPF", input)).toBe(cpf.isValid(input));
  });
});
```

If the suite is green for one full release cycle on production traffic, remove the reference dependency. For a richer diff log, wrap both validators in your own helper and emit a structured-log line on every disagreement. Strip personally identifiable input before logging.

---

## 8. FAQ

**Q: Will `nationid` ever depend on `validator.js` or `cpf-cnpj-validator`?**
No. `nationid` ships zero runtime dependencies; the reference libraries are `devDependencies` consumed exclusively by the cross-validation test suite.

**Q: What if my application also validates URLs or emails?**
Keep `validator.js` for those. The two libraries do not collide and `validator.js` remains the right choice for URL, email, IP, MAC, JWT, and credit-card shape checks.

**Q: I need a country `nationid` does not yet ship.**
Pin the reference library for that country and add `nationid` only for the countries it covers. The roadmap (see README) lists the v0.2 batch (UY, VE, PA, EC, BO, PY, NI, CA, PT).

**Q: Will my CPF / CNPJ test fixtures still pass?**
Yes, provided they were generated against the canonical mod-11 spec. Fixtures stored as constants from `cpf.generate()` continue to pass; agreement is 60/60 valid and 60/60 invalid on the synthetic suite.

**Q: My MX RFC fixtures fail.**
`nationid` v0.1.0 corrected the SAT homoclave table that several community libraries shipped with a +1 offset. Re-generate fixtures against SAT Anexo 19; see bug `B2` in `docs/CROSS_VALIDATION.md`.

**Q: Why does `validate('AR_CUIT', x)` return `true` for inputs `validator.js` rejects?**
You are likely hitting an AFIP-issued `25` or `26` prefix that `validator.js`'s regex omits. `nationid` follows AFIP RG 10/97 verbatim. See [D1](docs/CROSS_VALIDATION.md#d1--ar_cuit-prefixes-25-and-26).

**Q: Can I import everything from `nationid` to keep one import line?**

```ts
// @ts-expect-error — works at runtime but defeats tree-shaking
import * as nationid from "nationid";
```

Avoid the namespace import. Use named imports from the root for multi-country code (`import { validate } from "nationid"`) or country subpaths for tree-shaken bundles (`import { validate } from "nationid/br"`). Single-country bundles are roughly 3–5 KB gzipped.

**Q: Does `parse()` throw on garbage input?**
Never. `parse()` returns a discriminated union; the `ok: false` branch carries a `reason.kind` (`empty`, `too_short`, `too_long`, `invalid_format`, `invalid_checksum`). `getSpec()` does throw if passed an unknown code, since that is a programming error.

**Q: Is there a CommonJS build?**
Yes. The package exposes both ESM and CJS via `package.json` `exports`, with types emitted for both.

**Q: Where do I see performance numbers?**
See `BENCHMARKS.md` (forward link, lands separately). This guide intentionally does not quote latency or throughput.

**Q: How do I report a divergence I think is a bug in `nationid`?**
Open an issue with the input, the document code, the expected output, the reference library compared against, and a citation to the issuer specification.

---

## 9. Rollback strategy

`nationid` adds a single dependency and the migration is mechanical. Rolling back is symmetrical:

1. Reinstall the reference library you removed.
2. Revert the import diff (`git revert <migration-commit>` is usually sufficient).
3. Re-run your test suite. If it was green before the migration and you co-existed both libraries during validation (see §7), it will be green after the revert.
4. Keep `nationid` in `package.json` for the countries the reference library does not cover; the two coexist without conflict.

If you are mid-migration and find a behavioural difference your tests did not catch, add a regression test against both libraries (per §7) before reverting. The pattern surfaces the underlying disagreement and feeds back into either a `nationid` fix or a documented divergence.
