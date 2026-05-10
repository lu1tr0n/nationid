# Norway (NO)

Document specs implemented in v0.6.

## NO_FNR — Fødselsnummer

- Issuer: Skatteetaten.
- Source: <https://www.skatteetaten.no/>
- Format: 11 digits.
- Composition: 6 DDMMYY + 3 individnummer + 2 check digits.
- Check digits:
  - DV1: weights `[3, 7, 6, 1, 8, 9, 4, 5, 2]` over digits 1-9.
  - DV2: weights `[5, 4, 3, 2, 7, 6, 5, 4, 3, 2]` over digits 1-10.
  - Both: `dv = 11 - (sum mod 11)`; if 11 → 0; if 10 → invalid number.
- Confidence: **high**.

## NO_DNR — D-nummer (foreign residents)

- Same algorithm as FNR but with day + 40 (range 41-71).
- Confidence: **high**.

## NO_ORGNR — Organisasjonsnummer

- Issuer: Brønnøysundregistrene.
- Format: 9 digits (`XXX XXX XXX`).
- Check digit: weights `[3, 2, 7, 6, 5, 4, 3, 2]` mod-11.
- Confidence: **high**.

## NO_MVA — VAT

- Format: `NO` + 9-digit orgnr + `MVA` (14 chars).
- Validation: orgnr mod-11 + MVA suffix.
- Confidence: **high**.

## Cross-validation

- `validator.js` — `isIdentityCard('nb-NO')` covers FNR.
- `norwegian-national-id-number` (npm) — alternative reference for FNR/DNR.
