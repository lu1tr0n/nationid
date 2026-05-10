---
"nationid": minor
---

v0.5.0 — Passport family + BR_CNPJ alphanumeric rollout + audit fixes.

### 🚨 Critical: BR_CNPJ alphanumeric (effective 2026-07-01)

Receita Federal IN RFB 2.229/2024 changes CNPJ from 14 digits to alphanumeric `[A-Z0-9]{12}\d{2}`. **All existing valid CNPJs continue to validate** — the new algorithm is byte-identical to the legacy one when input is all digits (char value = `c.charCodeAt(0) - 48`, which equals the digit value for `'0'..'9'`). Letters `'A'..'Z'` map to `17..42` for the mod-11 weighted sum.

```ts
// Pre-existing v0.1+ behavior (unchanged):
validate("BR_CNPJ", "11.222.333/0001-81"); // true

// New alphanumeric form (post-2026-07-01):
validate("BR_CNPJ", "12ABC34501DE35"); // true
```

### 🛂 Passport family — 21 new countries + ICAO 9303 algorithm

Adds `<CC>_PASAPORTE` for the 21 countries that were missing one (Colombia already shipped in v0.1):

`SV, MX, BR, PE, AR, CL, DO, GT, HN, CR, ES, US, BO, EC, PY, NI, PA, UY, CA, PT, VE`

Plus a new universal MRZ algorithm primitive at `nationid/algorithms`:

```ts
import { mrzCheckDigit, validateMrzNumber, mrzCharValue, toMrzField9 } from "nationid/algorithms";

mrzCheckDigit("L898902C<");   // 3 — ICAO 9303 canonical specimen
validateMrzNumber("L898902C<3"); // true
toMrzField9("ABC123");        // "ABC123<<<"
```

Confidence tiers per country (verified by official issuer source):
- **High** (2): ES, CA — issuer-published format
- **Moderate** (5): MX, BR, DO, US, PT — community-confirmed
- **Low** (15): rest — lenient regex, no first-party publication

### MX_NSS — IMSS Social Security (new)

`MX_NSS` validates the 11-digit IMSS affiliation number using ISO/IEC 7812-1 mod-10 (Luhn) check digit, identical to the algorithm used for credit cards and `CA_SIN`. `confidence: "high"`.

```ts
validate("MX_NSS", "12345678903"); // true / false
```

### Audit fixes

Driven by the v0.4 coverage audit (`nationid-research/coverage-audit-2026-05-10.md`):

- **NI_CEDULA**: trailing DV letter regex tightened to `[ABCDEFGHJKLMNPQRSTUVWXY]` (excludes I/O/Z per CSE Nicaragua to avoid confusion with 1/0/2)
- **EC_CEDULA**: confirmed and documented that province `30` (Galápagos) is accepted; added boundary tests
- **PA_RUC, PT_CC, VE_RIF**: held at current confidence with documented rationale (issuers do not publish full algorithm)

### Quality

- 5,556 tests passing (+506 from v0.4.0)
- Lint clean (202 files), typecheck clean, build clean
- Cross-validation: ICAO 9303 verified against 4 independent sources (ICAO spec, idcheck.dev, TrustDocHub, planetcalc) using 4 worked vectors
- BR_CNPJ backwards-compat property verified by structural proof + explicit test that every legacy fixture still validates
- Bundle: full registry now 10.9 KB gzip (was 9.67 KB v0.4) — well under 30 KB budget
- 22 passport specs + MX_NSS = 23 new entries in catalog × 3 locales = 69 hand-curated metadata strings (Spanish + Portuguese reviewed for orthography)

### Migration

No breaking changes. v0.4.0 consumers keep working. The 22 passport specs are additive.

For Marcly and similar SaaS already wrapping `COUNTRY_SPECS`: extending coverage to the new passports + MX_NSS is a one-line change per country in the wrapper's map.

### Coverage summary post-v0.5

- **22 countries × 81 document codes** (was 58 in v0.4)
- 5 new high/moderate-confidence checksum specs (BR_CNPJ alphanum, MX_NSS, ES_PASAPORTE, CA_PASAPORTE, plus existing ICAO algorithm)
- 16 new format-only specs (passport for low-confidence countries)
