# Austria (AT)

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|-----------|
| `AT_UID` | tax | 11 (`ATU` + 8 digits) | Luhn-variant mod-10 | high |

Ships under the tree-shakable subpath `nationid/at` and under the EU-wide
aggregator `nationid/vat`.

---

## `AT_UID` — Umsatzsteuer-Identifikationsnummer (VAT ID)

### Overview

Austrian VAT identification number issued by the Bundesministerium für
Finanzen (BMF) to every VAT-registered taxpayer. The literal `U` after
the `AT` country prefix is **part of the number**, not a country
designator — pure-numeric input `12345678` does not round-trip without
the explicit `U`.

- **Issuer**: Bundesministerium für Finanzen (BMF) — <https://www.bmf.gv.at/>
- **Citizen / business services portal**: USP — <https://www.usp.gv.at/>
- **Statute**: `UStG §28 Z 1` (Umsatzsteuergesetz 1994) — binding
  authority for the UID format and the issuance regime.
- **Composition**: `ATU` prefix + 8 digits (7 body digits + 1 check digit).
- **Visual format**: `ATU 1234 5678` (space-separated 4+4 grouping).

### Algorithm

Luhn-variant mod-10 over the 7 body digits (the 8th digit is the
check). The library uses the standard Luhn weighting with right-to-left
alternating ×1 / ×2 doubling and digit-sum folding for doubled values
greater than 9. The final check digit `c` satisfies:

```
sum = Σ (luhn-weighted body digits, positions 0..6)
c = (10 - (sum + 4) mod 10) mod 10
```

The constant `+ 4` is BMF's published offset (USt-Richtlinien 2000,
Rz 2581); it is equivalent to the often-quoted formula
`check = (6 - luhn_checksum(body7)) mod 10`.

```
luhn_sum(body7):
  total = 0
  for i in 0..6:
    d = int(body7[i])
    if i is odd:
        d = d * 2
        if d > 9: d -= 9
    total += d
  return total mod 10

check = (6 - luhn_sum(body7)) mod 10
```

Confidence: **high**. BMF publishes the algorithm in the
USt-Richtlinien 2000; python-stdnum reproduces it; multiple community
libraries (`validator.js isVAT('AT')`, `node-vat-validator`) agree.

### Sources

- BMF — Bundesministerium für Finanzen (issuer root):
  <https://www.bmf.gv.at/> ✓ live 2026-05-24
- USP — Unternehmensserviceportal (taxpayer services portal):
  <https://www.usp.gv.at/> ✓ live 2026-05-24
- VIES portal (cross-validation, EU-wide):
  <https://ec.europa.eu/taxation_customs/vies/> ✓ live 2026-05-24
- Statute (binding authority): UStG §28 Z 1 (Umsatzsteuergesetz 1994)
- Cross-validated against `python-stdnum` (`stdnum.at.uid`)

### Synthetic test vectors

```
valid (Luhn-variant check passes):
  - ATU13585627    (canonical anchor — VERIFICATION §AT)
  - ATU88929562
  - ATU94850297
  - ATU51623710
  - ATU87743755
  - ATU16921320

invalid (check digit wrong):
  - ATU13585628    (last digit should be 7)
  - ATU13585620    (last digit should be 7)

invalid (format):
  - AT12345678     (missing literal U after AT)
  - ATU1234567     (too short — 7 digits after U, need 8)
```

### Recent reforms

- No format change since the introduction of the UID in 1994 (post EU
  accession of Austria, EU VAT directive harmonisation).
- 2010 — Council Regulation (EU) No 904/2010 reaffirms the UID as the
  canonical identifier for cross-border invoicing; VIES exposure
  mandatory.

### Open questions

- None. BMF publishes the algorithm; python-stdnum and validator.js
  agree byte-for-byte.

---

## Notes for consumers

- The `U` after `AT` is mandatory. The library normalises `AT12345678`
  → `ATU12345678` and bare `12345678` → `ATU12345678`; consumer-facing
  display should always use the `ATU 1234 5678` grouping.
- `AT_UID` is **offline structural validation only**. For active-status
  verification, query VIES at
  <https://ec.europa.eu/taxation_customs/vies/> (prefix `AT`).
- Austria's `.gv.at` government TLD (rather than `.gov.at`) means
  `bmf.gv.at` and `usp.gv.at` required an explicit allowlist entry in
  the governance test (`ISSUER_TLD_SUFFIXES`). This is documented in
  `tests/governance/confidence-citations.test.ts` and the v1.7 release
  notes.
