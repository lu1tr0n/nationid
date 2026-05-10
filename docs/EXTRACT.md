# `nationid/extract` — structured-data extraction

The `extract` sub-module surfaces the structured fields that some identity
documents *encode in their digits*: date of birth, sex, and administrative
region. It is **opt-in**: a separate import path so consumers who only need
validation pay no bundle cost.

```ts
import {
  extractDOB,
  extractRegion,
  extractSex,
  supports,
  type DateOfBirth,
  type ExtractKind,
  type Region,
  type Sex,
} from "nationid/extract";
```

## Design contract

1. Every extractor calls `parse(code, input)` first. If the input is invalid
   (empty, wrong shape, wrong checksum), the extractor returns `null`. No
   extractor sees an unverified body.
2. Calendar dates are returned as `{ year, month, day }`, not `Date`. This
   sidesteps JavaScript's timezone quirks: a CURP "born on YYMMDD" is a
   calendar day, not an instant.
3. `null` is returned for any (code, kind) pair the spec does not encode.
   Use `supports(code, kind)` to query the support matrix at runtime.
4. Year/month/day combinations that don't form a real Gregorian day (e.g.
   Feb 30) return `null` even when the underlying checksum passed.

## API

```ts
type ExtractKind = "dob" | "sex" | "region";

type DateOfBirth = {
  readonly year: number;   // 4-digit (1985, not 85)
  readonly month: number;  // 1..12
  readonly day: number;    // 1..31
};

type Sex = "M" | "F" | "X";

type Region = {
  readonly code: string;
  readonly kind: "state" | "province" | "department" | "municipality" | "tax_region";
};

function supports(code: DocumentTypeCode, kind: ExtractKind): boolean;
function extractDOB(code: DocumentTypeCode, input: string): DateOfBirth | null;
function extractSex(code: DocumentTypeCode, input: string): Sex | null;
function extractRegion(code: DocumentTypeCode, input: string): Region | null;
```

## Per-spec extraction matrix

| Code         | DOB | Sex | Region | Notes                                                                                          |
| ------------ | :-: | :-: | :----: | ---------------------------------------------------------------------------------------------- |
| `MX_CURP`    | yes | yes |  yes   | DOB century inferred from homoclave (digit → 1900s, letter → 2000s). Sex `H` → M, `M` → F. Region = entidad federativa (2-letter code), `kind: "state"`. |
| `MX_RFC_PF`  | yes |  -  |   -    | DOB at indices 4-9. Century inferred via "if YY > current 2-digit year, 1900s; else 2000s". Returns calendar date. |
| `AR_CUIT`    |  -  | yes |   -    | Prefix `20/23/24/25/26` → M; `27` → F; `30/33/34` → X (persona jurídica).                       |
| `AR_CUIL`    |  -  | yes |   -    | Same prefix mapping as CUIT.                                                                   |
| `AR_CDI`     |  -  | yes |   -    | CDI prefix `50` does not encode sex; extractor returns `null` even on valid input.             |
| `GT_DPI`     |  -  |  -  |  yes   | Departamento at indices 9-10 (`01..22`), `kind: "department"`.                                  |
| `PE_RUC`     |  -  |  -  |  yes   | Tipo de contribuyente: prefixes `10/15/16/17` → `"natural"`; `20` → `"juridica"`. `kind: "tax_region"`. |

Specs not listed in this table return `false` from `supports()` and `null` from
every extractor.

## Examples

### CURP — full extraction

```ts
import { extractDOB, extractSex, extractRegion } from "nationid/extract";

const curp = "GOMC050315HDFRRRA9";

extractDOB("MX_CURP", curp);    // { year: 2005, month: 3, day: 15 }
extractSex("MX_CURP", curp);    // "M"
extractRegion("MX_CURP", curp); // { code: "DF", kind: "state" }
```

### CUIT — sex from prefix

```ts
extractSex("AR_CUIT", "20123456784"); // "M"
extractSex("AR_CUIT", "27987654321"); // "F"
extractSex("AR_CUIT", "30123456784"); // "X" (persona jurídica)
```

### DPI — Guatemalan departamento

```ts
const dpi = "1234567890101";

extractRegion("GT_DPI", dpi); // { code: "01", kind: "department" } (Guatemala dept)
```

### RUC — tax region

```ts
extractRegion("PE_RUC", "10123456787"); // { code: "natural",  kind: "tax_region" }
extractRegion("PE_RUC", "20987654321"); // { code: "juridica", kind: "tax_region" }
```

## Common pitfalls

### Timezones

`DateOfBirth` is plain `{ year, month, day }`. Constructing a `Date`
incorrectly can shift the day:

```ts
// BAD — uses local TZ, may show 1984-12-31 for someone born 1985-01-01
new Date(1985, 0, 1);

// GOOD — UTC anchored, never shifts
const dob = extractDOB("MX_CURP", curp);
if (dob !== null) {
  new Date(Date.UTC(dob.year, dob.month - 1, dob.day));
}
```

### Century rollover (MX_CURP)

The homoclave-as-century rule is the documented RENAPO convention. A CURP with
digit homoclave (`0..9`) was historically issued for births in the 1900s; a
letter homoclave (`A..Z`) for births in the 2000s. We do *not* try to override
the rule with "current YY" heuristics — the homoclave is the authoritative
disambiguator.

### SAT genéricos (MX_RFC_PF)

`XAXX010101000` and `XEXX010101000` are SAT placeholder RFCs whose date bytes
form a calendar-valid `2001-01-01`. The extractor surfaces that date because
the bytes legitimately decode to it. If your application treats genéricos as
"no real DOB", filter them at the call site before extraction.

### CDI prefix 50

Argentine CDI is issued under prefix `50` only. That prefix is not part of the
documented M/F/X mapping (it identifies a non-natural-person record like a
succession or a minor without DNI), so `extractSex("AR_CDI", ...)` returns
`null` for every valid CDI. Use `supports("AR_CDI", "sex")` to detect the
declaration up-front.

### Calendar plausibility

A CURP can pass its checksum yet have an impossible date (`AAAA000230...`).
Extractors return `null` for those — better to surface absence than a wrong
February 30. Combined with the Gregorian round-trip, you can rely on a
non-null `DateOfBirth` being a real day.

## Migration

This module ships in v0.3 of `nationid`. v0.2 had no extraction surface, so no
breaking changes for existing consumers. Adding the dependency is purely
additive.

```bash
pnpm add nationid@^0.3
# or
npm install nationid@^0.3
```

## Cross-validation sources

- **MX_CURP** — RENAPO Acuerdo DOF 18-OCT-2014 + python-stdnum `stdnum.mx.curp`.
- **MX_RFC_PF** — SAT Anexo 19 + python-stdnum `stdnum.mx.rfc`.
- **AR_CUIT/CUIL/CDI** — AFIP/ARCA RG 10/1997 + RG 3995/2017 (CDI).
- **GT_DPI** — RENAP technical bulletins + community implementations.
- **PE_RUC** — SUNAT "Tipos de RUC" public page.
