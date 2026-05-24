# Estonia (EE)

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|-----------|
| `EE_VAT` | tax | 11 (`EE` + 9 digits) | Weighted mod-10 (full-body) | high |

Ships under the tree-shakable subpath `nationid/ee` and under the EU-wide
aggregator `nationid/vat`.

---

## `EE_VAT` — Käibemaksukohustuslase number (KMKR)

### Overview

Estonian VAT registration number issued by Maksu- ja Tolliamet
(MTA, the Estonian Tax and Customs Board). KMKR
(*Käibemaksukohustuslase Registreerimisnumber*) is the native term;
the library exports the code as `EE_VAT` for symmetry with the v1.7
EU-VAT batch, with `KMKR` available as an alias in i18n labels and
the registry-by-name lookup.

- **Issuer**: Maksu- ja Tolliamet (MTA / Estonian Tax and Customs
  Board) — <https://www.emta.ee/> ✓ live 2026-05-24
- **Statute**: `Käibemaksuseadus (RT I 2003, 82, 554) §20` — binding
  authority published in Riigi Teataja, the official state gazette.
- **Composition**: `EE` prefix + 9 digits. The ninth digit is the check
  digit; the first eight are the body.
- **Visual format**: `EE 123456789` (single 9-digit block after the
  country prefix).

### Algorithm

Weighted mod-10 over **all 9 digits including the check**. Weights
cycle through `[3, 7, 1]` and are applied left-to-right:

```
weights = [3, 7, 1, 3, 7, 1, 3, 7, 1]
sum(weights[i] * int(d[i]) for i in 0..8) mod 10 == 0
```

Equivalently, given the 8-digit body, the check digit is the value `c`
in `0..9` such that `weighted_sum_of_8 + c ≡ 0 mod 10` (because the
final weight is `1`).

The algorithm is published by MTA in its taxpayer-registration
guidance and reproduced verbatim in `python-stdnum`. Confidence:
**high**.

### Sources

- MTA — Maksu- ja Tolliamet (issuer root):
  <https://www.emta.ee/> ✓ live 2026-05-24 (pre-audit)
- MTA — Käibemaks (VAT section, business-client):
  <https://www.emta.ee/ariklient/maksud-ja-tasumine/kaibemaks> ✓ live 2026-05-24
- Statute (binding authority) on Riigi Teataja, the official state
  gazette: <https://www.riigiteataja.ee/akt/KMS> ✓ live 2026-05-24
  (consolidated text of the Käibemaksuseadus)
- VIES portal (cross-validation, EU-wide):
  <https://ec.europa.eu/taxation_customs/vies/> ✓ live 2026-05-24
- EU VAT Directive 2006/112/EC, art. 214:
  <https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32006L0112> ✓ live 2026-05-24
- Cross-validated against `python-stdnum` (`stdnum.ee.kmkr`):
  <https://github.com/arthurdejong/python-stdnum/blob/master/stdnum/ee/kmkr.py> ✓ live 2026-05-24

### Synthetic test vectors

```
valid (weighted mod-10, sum ≡ 0 mod 10):
  - EE100594102   (canonical anchor — VERIFICATION §EE)
  - EE107952365
  - EE413734170
  - EE752491679
  - EE275280529
  - EE946353523

invalid (check digit wrong):
  - EE100594103   (last digit should be 2)
  - EE100594101
  - EE100594100   (used in test suite as the dedicated invalid_checksum case)

invalid (format):
  - EE12345678    (8 digits — `too_short`)
  - EE12345678A   (non-digit in body — `invalid_format`)
```

Worked example for the canonical anchor `EE100594102`:

- body8 = `10059410`, check = `2`.
- weights × digits (positions 0..7):
  `3·1 + 7·0 + 1·0 + 3·5 + 7·9 + 1·4 + 3·1 + 7·0`
  `= 3 + 0 + 0 + 15 + 63 + 4 + 3 + 0`
  `= 88`.
- need `88 + 1·c ≡ 0 mod 10` → `c = 2`. ✓
- Full weighted sum including check: `88 + 1·2 = 90`. `90 mod 10 = 0` ✓.

Also note: `normalize("VAT", "100594102")` returns `"EE100594102"` —
the library accepts the bare 9-digit body and prepends the `EE` prefix
(matches `python-stdnum`'s `compact()` semantics).

### Recent reforms

- No format change since Estonia's EU accession in 2004. KMKR has had
  the same 9-digit weighted-mod-10 shape since the 2003 enactment of
  `Käibemaksuseadus (RT I 2003, 82, 554)`.
- **2014** — e-Residency programme launches; non-resident e-Residents
  who register for VAT receive standard KMKR numbers in the same
  9-digit space (no separate prefix or sub-range).
- **2010** — Council Regulation (EU) No 904/2010 reaffirms KMKR as
  the VIES-exposed identifier for cross-border Estonian invoicing.

### Open questions

- None. MTA publishes the algorithm; python-stdnum and the canonical
  anchor `EE100594102` reproduce byte-for-byte.

---

## Notes for consumers

- `EE_VAT` is **offline structural validation only**. For active-status
  verification, query VIES at
  <https://ec.europa.eu/taxation_customs/vies/> (prefix `EE`).
- The Estonian *isikukood* (personal identification code, 11 digits
  with embedded date-of-birth) is **not** a VAT number. It ships as a
  separate code (`EE_IK`) in the personal-ID batch, not as part of
  `EE_VAT`. Do not pass an isikukood to `validate("EE_VAT", …)` and
  expect a meaningful result.
- Estonia's `.ee` ccTLD includes the gov-suffixed `emta.ee` — the
  Tax Board's portal — which is required in the governance test's
  `ISSUER_ALLOWLIST_DOMAINS` list because `.ee` itself is not a
  gov-suffix. This is documented in
  `tests/governance/confidence-citations.test.ts` and the v1.7 release
  notes.
- The library accepts bare 9-digit input and normalises it to the
  `EE` -prefixed form — matching `python-stdnum`'s behaviour. Display
  should always use the `EE 123456789` grouping.
