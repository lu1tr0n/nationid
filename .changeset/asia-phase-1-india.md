---
"nationid": minor
---

# v1.2.0 — Asia phase 1: India

First country added in the Asia push. Five new specs under a new
`nationid/in` tree-shakable subpath:

- **`IN_AADHAAR`** — 12-digit Aadhaar number issued by UIDAI. Verhoeff check
  digit (IS 4905:1968) + palindrome rejection per UIDAI numbering scheme.
  First digit constrained to `2–9`. Confidence: **high**.
- **`IN_PAN`** — Permanent Account Number, 10-char alphanumeric issued by
  the Income Tax Department. Entity-type whitelist enforced on the 4th
  character `{A,B,C,F,G,H,J,L,P,T}`; serial `0000` rejected.
  Confidence: **high** (format-only, no public check digit).
- **`IN_GSTIN`** — 15-char Goods and Services Tax Identification Number
  issued by GSTN. Embeds full PAN at positions 3–12 (re-validated),
  enforces state code 01-38 + 96/97/99, literal `Z` at position 14,
  Luhn mod-36 check digit. Confidence: **high**.
- **`IN_EPIC`** — 10-char Elector's Photo Identity Card, format only.
  Confidence: **low** (ECI doesn't publish a check-digit algorithm).
- **`IN_VID`** — 16-digit Virtual ID, revocable Aadhaar alias. Same
  Verhoeff scheme, first digit `1`. Confidence: **high**.

## New algorithm primitive

- `nationid/algorithms` now exports `verhoeffValid` and
  `verhoeffCheckDigit`. Canonical D₅ + permutation tables verbatim from
  Verhoeff 1969 / IS 4905:1968.

## Coverage

- 34 → **35 countries**. ~120 → **~125 specs**.
- Country catalog (`getCountryInfo("IN", "es")`) returns the localized name
  via `Intl.DisplayNames` and `🇮🇳` flag — no extra data needed.

## Tests

- 118 new tests across `tests/countries/in.test.ts` + property arbitraries
  + catalog parity. Full suite: 71 files / 6606 tests (was 70 / 6488).

## Roadmap

Asia phase 1 continues with JP, SG, KR, TW in upcoming minors. Research
docs are already committed under `docs/v1.2-asia-research/{jp,sg,kr,tw}.md`
with verified algorithms, citation tables, and test vectors — ready to
pick up.

## Migration

None required. Additive minor — every existing import keeps working.
