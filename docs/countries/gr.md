# Greece (GR)

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|-----------|
| `GR_VAT` | tax | 11 (`EL` + 9 digits) | iterative weighted mod-11, collapses 10 → 0 | high |

Ships under the tree-shakable subpath `nationid/gr` and under the EU-wide
aggregator `nationid/vat`.

Also registered under the alias code `GR_AFM` (native abbreviation —
*Αριθμός Φορολογικού Μητρώου*) for i18n labelling.

---

## `GR_VAT` — Α.Φ.Μ. / Αριθμός Φορολογικού Μητρώου (Tax Registry Number)

### Overview

Greek tax registry number issued by the Independent Authority for
Public Revenue (AADE). The same number serves as both the natural-person
ΑΦΜ and the VAT registration for businesses. For VIES (cross-border
VAT validation) the country prefix is **`EL`**, not `GR` — this is a
historical EU-VAT carve-out under VAT Directive 2006/112/EC, art. 215.

The library accepts `GR`, `EL`, or bare 9-digit input and **normalises
to the canonical `EL` form** for output.

- **Issuer**: Ανεξάρτητη Αρχή Δημοσίων Εσόδων / Independent Authority
  for Public Revenue (AADE) — <https://www.aade.gr/>
- **Statute**: `Νόμος 2859/2000` (VAT Code, Κώδικας ΦΠΑ); ΑΦΜ check-digit
  algorithm in Υπουργική Απόφαση 1027411/842/ΔΜ/26.2.1998.
- **Composition**: `EL` prefix + 8 body digits + 1 check digit (9 total).
- **Visual format**: `EL 094259216` (space after `EL`).

### Algorithm

Iterative weighted mod-11 over the 8 body digits, with the result
collapsed via `mod 11 mod 10` so that the value 10 maps to 0.

```
s = 0
for i in 0..7:
    s = s * 2 + int(body[i])
check_digit = (s * 2) mod 11 mod 10
```

Worked example for canonical anchor `EL094259216` (body `09425921`,
check `6`):

- `s = 0`. d=0: 0. d=9: 9. d=4: 22. d=2: 46. d=5: 97. d=9: 203.
  d=2: 408. d=1: 817.
- `(817 × 2) mod 11 = 1634 mod 11 = 6`. `6 mod 10 = 6`. ✓

Confidence: **high**. AADE publishes the algorithm in Υπουργική
Απόφαση 1027411/842/ΔΜ/26.2.1998; python-stdnum reproduces.

### Sources

- AADE — Independent Authority for Public Revenue (issuer root):
  <https://www.aade.gr/> ✓ live 2026-05-24
- VIES portal (cross-validation, EU-wide):
  <https://ec.europa.eu/taxation_customs/vies/> ✓ live 2026-05-24
- Statute (binding authority): Νόμος 2859/2000 (VAT Code);
  Υπουργική Απόφαση 1027411/842/ΔΜ/26.2.1998 (check-digit algorithm)
- VAT Directive 2006/112/EC art. 215 (EL-prefix carve-out)
- Cross-validated against `python-stdnum` (`stdnum.gr.vat`)

### Synthetic test vectors

```
valid (iterative mod-11 check passes):
  - EL094259216    (canonical anchor — VERIFICATION §GR)
  - EL911323229
  - EL850616505
  - EL844206040
  - EL927415481
  - EL833037221

valid (alternative prefixes normalise to EL on input):
  - GR094259216    → normalises to EL094259216
  - 094259216      → normalises to EL094259216 (bare 9 digits)

invalid (check digit wrong):
  - EL094259217    (should be 6)
  - EL094259210    (should be 6)

invalid (format):
  - EL12345678     (too short — 8 digits, need 9)
  - ELABCDEFGHI    (non-digit body)
```

### Recent reforms

- **1999** — 8-digit legacy ΑΦΜs left-padded with a leading `0` to 9
  digits; the resulting 9-digit form has been canonical since.
- **2017** — AADE established as an independent authority (Νόμος
  4389/2016), successor to the General Secretariat of Public Revenue
  (ΓΓΔΕ). Format unchanged.

### Open questions

- None. AADE publishes the algorithm; python-stdnum agrees byte-for-byte.

---

## Notes for consumers

- **`EL` vs `GR` prefix is the #1 historical EU-VAT bug.** ISO 3166
  defines `GR` for Greece; the VAT Directive carves out `EL` for VAT
  identification numbers. The library accepts both on input and
  normalises to `EL` on output. **Always emit the `EL`-prefixed form on
  invoices for EU cross-border transactions.**
- The same number (ΑΦΜ) serves both natural-person tax and VAT
  identification. v1.7 ships only the `tax` scope; a `personal` scope
  alias can re-use the spec in a future release without a separate
  validator.
- `GR_VAT` is **offline structural validation only**. For active-status
  verification, query VIES at
  <https://ec.europa.eu/taxation_customs/vies/> (prefix `EL`).
