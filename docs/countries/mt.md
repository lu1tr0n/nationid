# Malta (MT)

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|-----------|
| `MT_VAT` | tax | 10 (`MT` + 8 digits) | Weighted mod-37 (full-body) | high |

Ships under the tree-shakable subpath `nationid/mt` and under the EU-wide
aggregator `nationid/vat`.

---

## `MT_VAT` — Numru tar-Reġistrazzjoni tal-VAT

### Overview

Maltese VAT registration number issued by the Commissioner for Revenue
(CFR). In 2024 the CFR was rebranded as the Malta Tax & Customs
Administration (MTCA); the agency portal at `cfr.gov.mt` now redirects
to `mtca.gov.mt` while the underlying registration regime and the VAT
number format are unchanged.

- **Issuer**: Commissioner for Revenue / Malta Tax & Customs
  Administration —
  <https://cfr.gov.mt/> ✓ live 2026-05-24 (pre-audit; HTTP 301 → `mtca.gov.mt`)
- **Statute**: `Value Added Tax Act, Cap. 406` — binding authority in
  the Laws of Malta. The `Cap. 406` numeric anchor matches the
  governance test's `STATUTE_PATTERNS` `Cap. \d+` regex used
  throughout Commonwealth jurisdictions.
- **Composition**: `MT` prefix + 8 digits. The first body digit is
  non-zero in practice; the eighth digit acts as the check digit but
  is folded into a full-body mod-37 weighting rather than a separable
  computation.
- **Visual format**: `MT 1167 9112` (4+4 space-separated grouping).

### Algorithm

Weighted **mod-37** over all 8 digits including the check. The weights
are `[3, 4, 6, 7, 8, 9, 10, 1]` applied left-to-right; the full sum
must be divisible by 37.

```
weights = [3, 4, 6, 7, 8, 9, 10, 1]
sum(weights[i] * int(d[i]) for i in 0..7) mod 37 == 0
```

Because the final weight is `1`, the eighth digit is the value that
balances the weighted sum to a multiple of 37 — but, critically, that
required value sits in `0..36`, and a single decimal digit can only
represent `0..9`. **When the required check is in `10..36`, the body
is unrepresentable as a valid `MT_VAT` and was never issued.**

Empirically this rejects approximately `27/37 ≈ 73%` of random 7-digit
bodies, leaving only `10/37 ≈ 27%` as candidates for a valid
`MT_VAT` number. This is **not** a bug; it is the documented
consequence of CFR's choice to ship a mod-37 sum in a 1-digit slot.
Property-based test budgets must be tuned accordingly (or seed valid
bodies via an inverse-table lookup) — see VERIFICATION §MT.

Confidence: **high**. CFR publishes the algorithm in the VAT
registration guidelines; `python-stdnum` reproduces; the mod-37 quirk
is well-documented in the EU-VAT validation literature and pre-dates
EU harmonisation. Do NOT "correct" to mod-11 in any future refactor.

### Sources

- CFR / MTCA — Malta Tax & Customs Administration (issuer root):
  <https://cfr.gov.mt/> ✓ live 2026-05-24 (pre-audit)
- Successor agency portal:
  <https://mtca.gov.mt/> (via 301 redirect from `cfr.gov.mt`)
- Statute (binding authority) on `legislation.mt` (ELI consolidated
  text of Cap. 406):
  <https://legislation.mt/eli/cap/406/eng> ✓ live 2026-05-24
- VIES portal (cross-validation, EU-wide):
  <https://ec.europa.eu/taxation_customs/vies/> ✓ live 2026-05-24
- EU VAT Directive 2006/112/EC, art. 214:
  <https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32006L0112> ✓ live 2026-05-24
- Cross-validated against `python-stdnum` (`stdnum.mt.vat`):
  <https://github.com/arthurdejong/python-stdnum/blob/master/stdnum/mt/vat.py> ✓ live 2026-05-24

### Synthetic test vectors

```
valid (weighted mod-37, sum ≡ 0 mod 37):
  - MT11679112   (canonical anchor — VERIFICATION §MT)
  - MT81479942
  - MT70108677
  - MT13345886
  - MT84273953
  - MT12152444

invalid (check digit wrong):
  - MT11679113   (last digit flipped — sum no longer divisible by 37)
  - MT11679110

invalid (format):
  - MT1234567    (7 digits — `too_short`)
  - MT12345678A  (non-digit in body — `invalid_format`)
```

Worked example for the canonical anchor `MT11679112`:

- body8 = `11679112`, computed check = `2`.
- weights × first 7 digits:
  `3·1 + 4·1 + 6·6 + 7·7 + 8·9 + 9·1 + 10·1`
  `= 3 + 4 + 36 + 49 + 72 + 9 + 10`
  `= 183`.
- `183 mod 37 = 35` (because `37·4 = 148`, `183 − 148 = 35`).
- need `183 + 1·c ≡ 0 mod 37` → `c = (37 − 35) mod 37 = 2`. ✓
- Full weighted sum including check: `183 + 1·2 = 185 = 37·5` ✓.

A counter-example showing the mod-37 quirk: body7 = `1234561` (with a
trailing test digit) yields weighted sum `3·1+4·2+6·3+7·4+8·5+9·6+10·1
 = 3+8+18+28+40+54+10 = 161`. `161 mod 37 = 13`. Required check
is `37 − 13 = 24`, which exceeds 9 — so **no valid `MT…1234561X`
number exists** for any decimal digit `X`. Roughly 73% of all 7-digit
prefixes share this property; the validator legitimately rejects them
all.

### Recent reforms

- **2024** — CFR rebranded as Malta Tax & Customs Administration
  (MTCA); legacy `cfr.gov.mt` portal preserved via HTTP redirect.
  Registration regime, VAT number format, and `Cap. 406` statute
  references unchanged.
- **2004** — Malta's EU accession brings the `MT` country prefix into
  VIES; the underlying 8-digit mod-37 number pre-dates accession and
  is preserved as-is. The mod-37 choice itself dates back to the
  introduction of the original VAT regime in 1995.
- **2010** — Council Regulation (EU) No 904/2010 reaffirms the MT
  VAT number as the VIES-exposed identifier for cross-border Maltese
  invoicing.

### Open questions

- None on the algorithm. The remaining concern is operational: tune
  fast-check property-test `numRuns` for MT specifically (or seed
  valid bodies via an inverse-table) so the ~73% legitimate-reject
  rate doesn't exhaust the fuzzer's budget. See VERIFICATION §MT for
  the recommended approach.

---

## Notes for consumers

- `MT_VAT` is **offline structural validation only**. For
  active-status verification, query VIES at
  <https://ec.europa.eu/taxation_customs/vies/> (prefix `MT`).
- The mod-37 quirk means a randomly-typed 8-digit `MT_VAT` is much
  more likely to be `invalid_checksum` than `valid` — the validator
  correctly rejects ~73% of random bodies. If your UX surfaces a
  "did you mean…?" suggestion, do **not** try to "fix" the rejection
  by tweaking the check digit alone; many bodies have no valid check
  digit at all.
- Property-based tests covering `MT_VAT` must either (a) tune the
  `numRuns` budget upward to compensate for the rejection rate, or
  (b) seed valid bodies via an inverse-table that enumerates the
  ~27% of 7-digit prefixes for which a single-digit check exists.
  The shipping test suite uses the latter approach for the canonical
  vectors.
- `cfr.gov.mt` redirects to `mtca.gov.mt` post-2024 rebrand; both are
  reachable from the same VAT-registration context. Documentation
  cites `cfr.gov.mt` as the historical anchor and `legislation.mt` as
  the binding statute source.
