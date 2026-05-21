# v1.0 audit — TypeScript inference quality

Audit date: 2026-05-20. Codebase: `nationid@0.6.0`. Method: read-only static
analysis + `tsc --noEmit` (passes with zero errors under `strict + noUncheckedIndexedAccess
+ noPropertyAccessFromIndexSignature + exactOptionalPropertyTypes`).

## Score: 5/10 (current state)

Headline: the type *system* is sound — strictness is maxed out, `tsc` is clean,
`any` is absent. But the public *call sites* deliver only a fraction of the
inference value the underlying types could give. Autocomplete works for the
first argument of `validate/format/parse/normalize`, then dies. Nothing narrows
the result, nothing narrows by country, and ~161 leftover `as` casts in country
modules are a smell that will leak into d.ts files and erode user trust at
"Go to type definition" time.

For a v1.0 marketed as "TypeScript-first", this is the single highest-impact
polish area before tagging.

---

## Findings

### Where inference WORKS WELL

- **`DocumentTypeCode` is a clean literal union** (`src/core/types.ts:54-208`).
  All 124 codes are string literals; no `string` fallback anywhere. Hovering
  the type in an IDE shows the full enumeration. This is the foundation that
  everything else builds on.
- **`CountryCode` is also a literal union** (`src/core/types.ts:9-46`), 34
  countries. Same quality.
- **`ParseResult` is a discriminated union on `ok`** (`src/core/types.ts:228-240`).
  After `if (result.ok)` the consumer gets `normalized/formatted/confidence`;
  on `else` they get `reason: ParseError`. This is the textbook pattern and it
  works in the IDE.
- **`ParseError` itself is a discriminated union on `kind`**
  (`src/core/types.ts:242-247`). `switch (reason.kind)` narrows correctly.
- **`Locale` union + `LocaleBundle` `Record<KnownKind, string>`**
  (`src/i18n/index.ts:24-43`): autocomplete on locale arg works, errors object
  is fully typed.
- **Per-country `SPECS` object uses `as const` + `keyof typeof SPECS`**
  (e.g. `src/countries/mx/index.ts:17-31`, `src/countries/sv/index.ts:14-20`,
  `src/countries/co/index.ts:18-28`). Country-scoped `MXDocumentType` is a
  proper literal union derived from the registry — same code can't go out of
  sync.
- **Algorithm primitives are pure & well-typed** (`src/algorithms/mod11.ts`,
  `src/algorithms/luhn.ts`). Inputs `string` + `ReadonlyArray<number>`, return
  `number` / `boolean`. No surprises.

### Where inference is WEAK or BROKEN

#### 1. `validate(code, input)` does not narrow the return by code

- File: `src/index.ts:150`
- Symbol: `validate(code: DocumentTypeCode, input: string): boolean`
- What the user sees: the second arg is just `string`, the return is just
  `boolean`. Nothing useful happens after picking `"MX_CURP"`.
- Reality check: for `validate`, `boolean` is genuinely all there is to say,
  so this one is mostly fine — but see the next item, which IS broken.
- Fix: none needed for `validate`; flagged here only so the next finding is
  in context.
- Effort: 0.

#### 2. `parse(code, input)` does not narrow `ParseResult["code"]` to the input code

- File: `src/index.ts:172`
- Symbol: `parse(code: DocumentTypeCode, input: string): ParseResult`
- What the user sees: `const r = parse("MX_CURP", input); r.code` has type
  `DocumentTypeCode` (the whole 124-member union), not `"MX_CURP"`. So in a
  switch on `r.code` after the call, none of the 123 other branches are
  unreachable. IDE offers all 124 in autocomplete inside the switch, which is
  noise.
- Proposed fix: parametrize.
  ```ts
  export function parse<C extends DocumentTypeCode>(
    code: C,
    input: string,
  ): ParseResult<C>;
  ```
  And refactor `ParseResult` to take the code as a type parameter:
  ```ts
  export type ParseResult<C extends DocumentTypeCode = DocumentTypeCode> =
    | { readonly ok: true; readonly code: C; readonly normalized: string;
        readonly formatted: string; readonly confidence: Confidence }
    | { readonly ok: false; readonly code: C; readonly reason: ParseError };
  ```
- Effort: 1 hour (also have to touch every per-country `parse()` and the
  `DocumentSpec.parse` signature on `src/core/types.ts:276`).

#### 3. `getSpec(code)` returns the generic `DocumentSpec`, not the spec for that code

- File: `src/index.ts:132`
- Symbol: `getSpec(code: DocumentTypeCode): DocumentSpec`
- What the user sees: `getSpec("MX_CURP").code` has type `DocumentTypeCode`,
  not `"MX_CURP"`. `country` is `CountryCode`, not `"MX"`. `confidence` is the
  whole `Confidence` union, not the literal `"high"` that's actually shipping.
- Proposed fix: same generic trick.
  ```ts
  export function getSpec<C extends DocumentTypeCode>(code: C): DocumentSpec<C>;
  ```
  Make `DocumentSpec` generic over its code; let `code`, `country` (via a
  lookup), and ideally `confidence` flow through.
- Effort: 2-3 hours (interplay with the registry; the runtime map can stay
  `Map<DocumentTypeCode, DocumentSpec>` and the public signature widens at
  the boundary).

#### 4. `extractDOB / extractSex / extractRegion` accept any `DocumentTypeCode`

- File: `src/extract/index.ts:54-94`
- Symbols: `extractDOB`, `extractSex`, `extractRegion`
- What the user sees:
  ```ts
  extract.extractDOB("CL_RUT", input) // type-checks; returns null at runtime
  ```
  Autocomplete on the first arg shows all 124 codes, even though only
  `MX_CURP`/`MX_RFC_PF` support DOB. The function silently returns `null` for
  unsupported codes, so the type system says nothing about which codes are
  useful. This is the biggest UX miss in the audit — the `SUPPORT_TABLE`
  literally has the answer at compile time and the public surface throws it
  away.
- Proposed fix: derive a literal union per kind from `SUPPORT_TABLE` and use
  it on the argument:
  ```ts
  const SUPPORT_TABLE = {
    MX_CURP: ["dob", "sex", "region"],
    MX_RFC_PF: ["dob"],
    AR_CUIT: ["sex"],
    AR_CUIL: ["sex"],
    AR_CDI: ["sex"],
    GT_DPI: ["region"],
    PE_RUC: ["region"],
  } as const satisfies Partial<Record<DocumentTypeCode, ReadonlyArray<ExtractKind>>>;

  type CodesSupporting<K extends ExtractKind> = {
    [C in keyof typeof SUPPORT_TABLE]:
      K extends (typeof SUPPORT_TABLE)[C][number] ? C : never
  }[keyof typeof SUPPORT_TABLE];

  export function extractDOB(code: CodesSupporting<"dob">, input: string): DateOfBirth | null;
  ```
  Now `extractDOB("CL_RUT", ...)` is a compile error and autocomplete only
  shows `MX_CURP | MX_RFC_PF`. The runtime switch can stay identical.
- Effort: 1-2 hours (also flips `SUPPORT_TABLE` from `Set` to `as const` array
  so its types are visible).

#### 5. `pii.mask / hash / lastN` accept any `DocumentTypeCode` (same shape, less severe)

- Files: `src/pii/index.ts:43`, `src/pii/hash.ts:46`, `src/pii/last-n.ts:15`
- Symbols: `mask`, `hash`, `lastN`
- What the user sees: autocomplete is "all 124 codes", correctly — these
  functions DO work for all codes. So this is fine *unless* you go down the
  path of point 3 (generic `getSpec`), in which case `lastN("BR_CPF", input)`
  could return a `Brand<"BR_CPF_last4">` instead of `string`, but that's v2
  territory.
- Proposed fix: none for v1 beyond what naturally falls out of points 2-3
  (i.e. the `code` field of the parse-result inside hash/mask narrows).
- Effort: 0 for v1.

#### 6. `mxBundle.country` typed as `CountryCode`, not literally `"MX"`

- File: `src/countries/mx/index.ts:64-72` (and 32 other country files)
- Symbol: `mxBundle: CountryDocumentBundle`
- What the user sees: `mxBundle.country` is `CountryCode`, `mxBundle.defaultPersonal`
  is `DocumentTypeCode`. If you `import { mxBundle } from 'nationid/mx'` and
  destructure, you lose all country-specificity.
- Proposed fix: `satisfies` instead of explicit annotation:
  ```ts
  export const mxBundle = {
    country: "MX",
    personal: [curpSpec, claveElectorSpec, nssSpec, passportSpec],
    tax: [rfcPfSpec, rfcPmSpec],
    defaultPersonal: "MX_CURP",
    defaultTax: "MX_RFC_PF",
  } as const satisfies CountryDocumentBundle;
  ```
  Now `mxBundle.country` is the literal `"MX"` AND the structural contract is
  still enforced. The `BUNDLES` array in `src/index.ts:72` already widens via
  `ReadonlyArray<CountryDocumentBundle>`, so registration still works.
- Effort: 1 line per country × 34 countries = ~1 hour. High impact for
  consumers who import per-country.

#### 7. `getErrorMessage` casts `error` to `{ kind: string }`

- File: `src/i18n/index.ts:112`
- Symbol: `getErrorMessage(error: ParseError, …)`
- What the user sees: a defensive cast `(error as { kind: string }).kind`
  used to guard against "future kinds added in core/types.ts". The intent is
  good (forward-compat) but the cast is unnecessary because `ParseError`
  already constrains `kind` to a `string`-typed union. The cast is just
  asking TS to forget what it knows.
- Proposed fix:
  ```ts
  const kind = error.kind; // already `KnownKind` = ParseError["kind"]
  const template = isKnownKind(kind) ? bundle.errors[kind] : GENERIC_FALLBACK[lang];
  ```
  `isKnownKind` keeps narrowing the type guard but you don't need to lie about
  the type to TS.
- Effort: 1 line.

#### 8. `pii.mask` uses `ReturnType<typeof getSpec>` instead of `DocumentSpec`

- File: `src/pii/index.ts:46`
- What the user sees: not a bug, but a smell — uses an indirect type to avoid
  re-importing `DocumentSpec`. If `getSpec` becomes generic (finding #3), this
  becomes `DocumentSpec<DocumentTypeCode>` which is fine, but the indirection
  obscures intent.
- Proposed fix: `let spec: DocumentSpec;` with an explicit import.
- Effort: 1 line.

#### 9. `validate()` and friends don't widen `code` to accept const-narrowed args

- File: all per-country `src/countries/*/index.ts` (e.g. `src/countries/de/index.ts:32`)
- What the user sees: `validate("DE_STEUER_ID" as const, x)` is fine, but
  `const c = "DE_STEUER_ID"; validate(c, x)` widens `c` to `string` (because
  of `const c =`) and fails to type-check. The current signature requires
  `c: DEDocumentType | ShortCode`. Acceptable, just worth documenting.
- Proposed fix: nothing structural — call out in README that `validate` wants
  a literal or use `as const`.
- Effort: 0 (docs only).

### Type-level antipatterns found

#### Unsafe `as` assertions in country modules (CRITICAL)

161 occurrences of `as CountryCode | as DocumentTypeCode | as
CountryDocumentBundle | as DocumentSpec` across the country tree
(`grep "as CountryCode\|as DocumentTypeCode\|as CountryDocumentBundle\|as
DocumentSpec" -r src/`).

These are leftover scaffolding from the v0.5/v0.6 "orchestrator integration"
multi-agent workflow. The TODO comments admit it:

```ts
// src/countries/ar/passport.ts:22
const CODE = "AR_PASAPORTE" as DocumentTypeCode;

// src/countries/de/index.ts:64
// TODO(v0.6-integration): orchestrator extends `DocumentTypeCode`.
defaultPersonal: "DE_STEUER_ID" as DocumentTypeCode,
```

The string `"AR_PASAPORTE"` is ALREADY in the union since v0.5; the cast is
dead. Removing it changes nothing for `tsc` but:
- removes ~161 instances of a known-dangerous keyword (`as`) from the codebase
- restores literal-type inference (`const CODE = "AR_PASAPORTE"` will be
  `"AR_PASAPORTE"`, not the union)
- closes the door on a real bug — if someone later renames a code in
  `core/types.ts`, these casts will silently keep stale strings alive

Examples to delete (sample, not exhaustive):
- `src/countries/ar/passport.ts:22`
- `src/countries/be/index.ts:49-53`
- `src/countries/be/btw.ts:29,31`
- `src/countries/be/nrn.ts:32,34`
- `src/countries/ca/index.ts:60,65,66`
- `src/countries/ca/sin.ts:44-45`
- `src/countries/ca/bn.ts:31-32`
- `src/countries/ch/index.ts:52,55,56`
- `src/countries/ch/{ahv,uid,mwst}.ts:25-35 area`
- `src/countries/de/index.ts:56,64,65`
- `src/countries/de/{steuer-id,ustid}.ts:25-36 area`
- `src/countries/dk/{cpr,cvr}.ts:24-43 area`
- Same pattern across `bo`, `br`, `cl`, `cr`, `ec`, `es`, `fi`, `fr`, `gb`,
  `gt`, `hn`, `it`, `ni`, `nl`, `no`, `pa`, `pe`, `pl`, `pt`, `py`, `se`,
  `sv`, `us`, `uy`, `ve`.

Recommended cleanup: a single PR that drops every `as CountryCode | as
DocumentTypeCode | as CountryDocumentBundle | as DocumentSpec | as
DocumentSpec["country"] | as CountryDocumentBundle["country"] | as
CountryDocumentBundle["defaultPersonal"] | as CountryDocumentBundle["defaultTax"]`,
deletes the matching TODO comments, and re-runs `pnpm verify`. If anything
fails after the deletion, it was already wrong.

Effort: 1 hour, mostly mechanical (sed + verify).

#### Unnecessary double cast `as unknown as number[]`

6 occurrences:
- `src/countries/dk/cpr.ts:120`
- `src/countries/dk/cvr.ts:85`
- `src/countries/fi/ytunnus.ts:89`
- `src/countries/no/fnr.ts:116,121`
- `src/countries/no/orgnr.ts:89`

All look like `mod11WeightedSum(digits, W as unknown as number[])` where
`W = [4,3,2,…] as const`. But `mod11WeightedSum` accepts
`ReadonlyArray<number>` (`src/algorithms/mod11.ts:25`), so the readonly tuple
from `as const` is assignable directly. The double cast is pure noise and
weakens variance.

Effort: 6 single-line deletions. 10 minutes.

#### `(error as { kind: string }).kind` defensive cast

- `src/i18n/index.ts:112` — already covered in finding #7.

#### No use of `satisfies` for catalog data

- `src/catalog/data/common.ts:18` declares `catalogCommon: Record<DocumentTypeCode, CommonEntry>`.
  This means every value is widened to `CommonEntry`; the literal `purpose`
  and `knownAs` array become their general types, and consumers reading
  `catalogCommon.MX_CURP.purpose` see `DocumentPurpose`, not `"identity"`.
  Same story for `src/catalog/data/{en,es,pt}.ts`.
- Proposed fix:
  ```ts
  export const catalogCommon = {
    SV_DUI: { purpose: "identity", knownAs: ["DUI"] },
    …
  } as const satisfies Record<DocumentTypeCode, CommonEntry>;
  ```
- Effort: 1 line per file × 4 files. Improves IDE feedback for anyone
  consuming the catalog programmatically.

#### Use of `any`, `Function`, `Object`, broad `Record<string, unknown>`

None in `src/`. Confirmed by grep. Clean.

#### `noPropertyAccessFromIndexSignature` workarounds

None found. The catalog uses `Record<DocumentTypeCode, …>` which is a
mapped object, not an index signature, so property access is direct. Good.

---

### Sample IDE experience

A real 20-line scratch script using the public API, annotated with what
autocomplete/hover would show today (validated against the type sources read
above):

```ts
import { validate, parse, getSpec, listSupportedCodes } from "nationid";
import * as extract from "nationid/extract";
import * as pii from "nationid/pii";
import { mxBundle, validate as validateMx } from "nationid/mx";
import { getErrorMessage } from "nationid/i18n";

// 1. Top-level validate — first arg is a clean literal union.
const ok = validate("MX_CURP", "GOMC850315HDFRRR07");
//                  ^ autocomplete OK — shows 124 codes, narrows on type
//        ^ ok: boolean — fine

// 2. parse() — discriminated union narrows, BUT code stays widened.
const r = parse("MX_CURP", "GOMC850315HDFRRR07");
if (r.ok) {
  r.normalized;        // string — OK
  r.confidence;        // Confidence — should be "high" (lost — see finding #3)
  r.code;              // DocumentTypeCode — should be "MX_CURP" (finding #2)
} else {
  switch (r.reason.kind) {  // narrows correctly — OK
    case "too_short": break;
    case "invalid_checksum": break;
    // exhaustive check works
  }
}

// 3. getSpec — types collapse to general union (finding #3).
const spec = getSpec("BR_CPF");
spec.country;          // CountryCode — should be "BR"
spec.code;             // DocumentTypeCode — should be "BR_CPF"
spec.hasCheckDigit;    // boolean — should be `true` (literal lost)

// 4. listSupportedCodes — array of full union, good.
const codes = listSupportedCodes(); // ReadonlyArray<DocumentTypeCode> — OK

// 5. extract — biggest weakness (finding #4).
const dob = extract.extractDOB("CL_RUT", "12345678-9");
//                              ^ autocomplete shows ALL 124 codes
//                              ^ should show only "MX_CURP" | "MX_RFC_PF"
//                              ^ returns null at runtime, no compile error

// 6. pii.mask — works fine.
const masked = pii.mask("BR_CNPJ", "12345678000190"); // string — OK

// 7. Per-country subpath — best DX in the library.
validateMx("CURP", "GOMC850315HDFRRR07");
//          ^ autocomplete OK — shows "MX_CURP" | "MX_RFC_PF" | ... | "CURP" | "RFC_PF" | ...
mxBundle.country;         // CountryCode — should be "MX" literal (finding #6)
mxBundle.defaultPersonal; // DocumentTypeCode — should be "MX_CURP" literal

// 8. i18n — clean.
getErrorMessage({ kind: "too_short" }, "es", "DUI");
//              ^ autocomplete shows the 5 kinds — OK
//                                       ^ "es" | "en" | "pt" — OK
```

Summary of the scratch: **8 of 12 hover points underdeliver compared to what
the type system already knows**. None are bugs that prevent shipping, all are
fixable, all reduce the "wow, TypeScript-first" feeling on first use.

---

## Recommendation

For a v1.0 that markets itself as TypeScript-first, you need one focused PR
sprint. In priority order:

1. **Delete the 161 + 6 unnecessary `as` casts** in `src/countries/**` and
   `src/i18n/index.ts:112`. Pure cleanup, no risk, restores literal inference
   in country files. ~1 hour. Score: 5 → 6.5.

2. **Switch every `xxBundle: CountryDocumentBundle = { … }` to
   `as const satisfies CountryDocumentBundle`** (finding #6). One line per
   country, 34 countries, ~1 hour. Per-country imports become literally typed.
   Score: 6.5 → 7.5.

3. **Constrain `extract.extractDOB/Sex/Region` argument unions via mapped
   types over `SUPPORT_TABLE`** (finding #4). The single highest-impact change
   for "wow autocomplete". 1-2 hours. Score: 7.5 → 8.5.

4. **Make `parse` and `getSpec` generic on the code** (findings #2-3). Touches
   `DocumentSpec` and `ParseResult` shapes, but additive (the default type
   param keeps the current signature working). 2-3 hours. Score: 8.5 → 9.5.

5. **Switch catalog data files to `as const satisfies …`** (catalog
   antipattern). ~30 min. Score: 9.5 → 10.

Minimum bar for v1.0: items 1-3 (~4 hours of work). Items 4-5 are nice-to-haves
that can land in v1.1 without breaking anyone, since making a function
*more* generic is backward-compatible at the type level.

Do NOT ship v1.0 with the 161 `as` casts intact. They will appear in the
generated `dist/**.d.ts` and any user reading the source via "Go to type
definition" will see TODO comments referring to a multi-agent integration
workflow that has nothing to do with using the library.
