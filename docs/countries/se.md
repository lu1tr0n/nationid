# Sweden (SE)

Document specs implemented in v0.6.

## SE_PERSONNUMMER — Personnummer

- Issuer: Skatteverket.
- Source: <https://www.skatteverket.se/>
- Format: 10 digits (`YYMMDD-NNNC`) or 12 digits (`YYYYMMDD-NNNC`).
  - `-` separator for under 100 years; `+` for over 100 years.
- Composition: 6/8 DOB digits + 3 individual (3rd encodes sex parity) + 1 check.
- Check digit: Luhn (ISO/IEC 7812-1) over the 10-digit form (drop century in
  the 12-digit form).
- Coordination numbers (samordningsnummer): same shape, day + 60 — accepted.
- Confidence: **high** (Skatteverket published algorithm; cross-referenced
  against the `personnummer` reference implementation).

## SE_ORGNR — Organisationsnummer

- Issuer: Bolagsverket.
- Source: <https://bolagsverket.se/>
- Format: 10 digits (`XXXXXX-XXXX`).
- Disambiguation: third digit must be `>= 2` (separates orgnr from
  personnummer, whose third digit is 0 or 1 because it is the second digit
  of the month).
- Check digit: standard Luhn over all 10 digits.
- Confidence: **high**.

## SE_VAT — VAT (Moms)

- Format: `SE` + 10-digit orgnr + `01` (14 chars).
- Validation: orgnr Luhn + `01` sequence + orgnr 3rd-digit rule.
- Confidence: **high**.

## Cross-validation

- `personnummer` (npm) — covers SE_PERSONNUMMER and acceptance of
  coordination numbers.
- `validator.js` — `isVAT('SE')` covers SE_VAT.
