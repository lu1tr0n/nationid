# Canada (CA)

> Reference for `nationid` consumers and contributors.

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|-----------|
| `CA_SIN` | both (personal + tax / CRA) | 9 digits | Luhn (ISO/IEC 7812-1) | high |
| `CA_BN` | tax (business) | 9 digits, optional + 2-letter program + 4-digit reference | none enforced (format only) | low |

> **Bilingual official names** — Canada is officially bilingual. The library accepts the French acronym `NAS` (Numéro d'assurance sociale) as a synonym of the English `SIN`.

---

## `CA_SIN` — Social Insurance Number / Numéro d'assurance sociale

### Overview

Personal identifier issued by Service Canada (Employment and Social Development Canada). Serves both as the personal ID and as the tax identifier for natural persons in CRA filings (T1, T4, T4A, T5, T1135, etc.).

- **Issuer**: Service Canada — <https://www.canada.ca/en/employment-social-development/services/sin.html>
- **Composition**: 9 digits. The first digit historically denotes the region of registration:
  - `1`: Atlantic provinces (NB, NS, PE, NL)
  - `2`, `3`: Quebec
  - `4`, `5`: Ontario
  - `6`: Prairies, NWT, Nunavut
  - `7`: Pacific (BC, YT)
  - `8`: not currently in regular issuance
  - `9`: temporary residents (work / study permits)
- **Visual format**: `000-000-000`

### Algorithm

Standard Luhn (ISO/IEC 7812-1) over the 9 digits.

```
sum = 0
parity = 0
for i from rightmost to leftmost digit:
    if parity == 1:
        d = digit * 2; if d > 9, subtract 9
        sum += d
    else:
        sum += digit
    parity ^= 1
valid iff sum mod 10 == 0
```

### Sources

- Service Canada — "Social Insurance Number Code of Practice".
- Wikipedia — "Social Insurance Number" (cross-check on regional ranges and Luhn).
- npm `validator` (`isIdentityCard('en-CA')`), `sin-validator`, accessed 2026-05-10.

### Synthetic test vectors

```
valid:
  - 046-454-286  (well-known Service Canada test SIN; Atlantic-region prefix kept for documentation)
  - 123-456-782  (synthetic, body 12345678 + Luhn DV 2)
  - 200-000-008  (synthetic, body 20000000 + Luhn DV 8 — Quebec range)
  - 100-000-009  (synthetic, body 10000000 + Luhn DV 9 — Atlantic range)
  - 999-999-998  (synthetic, body 99999999 + Luhn DV 8 — temporary resident range)

invalid (format):
  - "" (empty)
  - 12345 (too short)
  - 1234567890 (too long)
  - 046-454-28A (non-digit)

invalid (checksum):
  - 046-454-280
  - 046-454-281
  - 999-999-990
```

### Temporary-resident detection

The `9XXXXXXXX` range belongs to non-permanent residents (work permits, study permits). The library exports a helper:

```ts
import { isTemporaryResidentSIN } from "nationid/ca";
isTemporaryResidentSIN("999-999-998"); // true
isTemporaryResidentSIN("123-456-782"); // false
```

### Open questions / divergences from research

- The pre-research note that "SINs starting with `0` are invalid" conflicts with the cited test SIN `046-454-286`, which begins with `0` and Luhn-validates. The library therefore does **not** reject the leading-`0` range; downstream callers that need to enforce the strict assignment ranges can layer their own check on top of `validate`.

### Recent reforms

None affecting the format or algorithm in the last 24 months.

---

## `CA_BN` — Business Number / Numéro d'entreprise

### Overview

Tax identifier for businesses, issued by the Canada Revenue Agency. Each business has one BN root (9 digits); each tax program account adds a 2-letter program identifier and a 4-digit reference (`123456789 RT0001`).

- **Issuer**: Canada Revenue Agency — <https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/registering-your-business/you-need-a-business-number-a-program-account.html>
- **Composition**: 9-digit root + optional space + 2-letter program code + 4-digit reference
- **Program codes**: `RT` (GST/HST), `RP` (Payroll), `RC` (Corporation income tax), `RM` (Importer/Exporter), `RR` (Registered charity), `RZ` (Information returns)
- **Visual format**: `123456789 RT0001`

### Algorithm

The library validates **format only**. The CRA does not publish an open algorithm for the BN root checksum that can be relied on programmatically; while the SIN-style Luhn is widely cited as the underlying check, official CRA tooling validates BNs against authoritative database lookups, not a public formula.

### Sources

- CRA — "Business Number".
- CRA — "Program account types".

### Synthetic test vectors

```
valid (format-only):
  - 123456789
  - 123456789 RT0001
  - 987654321 RP0002
  - 555555555 RC0001
  - 111222333 RM0001

invalid (format):
  - 12345678        (too short)
  - 1234567890      (10 digits, no program account)
  - 123456789AA0001 (unknown program code)
  - 123456789RT001  (3-digit reference)
```

### Recent reforms

None affecting the format.

### Open questions

- A future contributor with insider knowledge of CRA tooling may promote the BN to checksum-enforced moderate confidence; until then, format-only is the correct conservative default.
