# Netherlands (NL)

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|------------|
| `NL_BSN` | personal/tax | 9 | mod-11 eleven-test (BPR) | high |
| `NL_BTW` | tax | 14 (`NL`+9d+`B`+2d) | mod-11 eleven-test OR ISO 7064 MOD 97-10 | moderate |

## `NL_BSN`

### Overview

Burgerservicenummer — universal personal/tax identifier issued by the
Rijksdienst voor Identiteitsgegevens (RvIG). Used for tax, social security,
healthcare, and any government interaction.

- Issuer: RvIG — <https://www.rvig.nl/burgerservicenummer>
- Composition: 9 digits, randomly assigned, leading zeroes preserved
- Visual format: 9 digits, no separators

### Algorithm

Eleven-test ("11-proef"):

```
weights  = [9, 8, 7, 6, 5, 4, 3, 2, -1]
sum      = sum(weights[i] * digit[i])  for i in 0..8
valid    = sum mod 11 == 0
```

8-digit inputs are left-padded with `0` per RvIG documentation.
`000000000` is rejected as an administrative placeholder.

### Sources

- Primary: RvIG — Burgerservicenummer specification (BPR)
- Secondary: `bsn-validator` (npm), `python-stdnum.nl.bsn`

### Synthetic test vectors

```
valid:
  - 123456782
  - 111222333
  - 010101019

invalid (format):
  - 12345678          (after pad → 012345678, fails check)
  - 1234567890

invalid (checksum):
  - 123456789
  - 111111111
```

### Recent reforms

None affecting the BSN algorithm. The 2020 BTW reform (below) is unrelated.

### Open questions

None.

---

## `NL_BTW`

### Overview

Omzetbelastingnummer / BTW-identificatienummer. The 9-digit core was
historically derived from the BSN/RSIN of the natural person or entity.
Since 2020, sole proprietors receive a randomized 9-digit BTW-id to
decouple their VAT number from their BSN.

- Issuer: Belastingdienst — <https://www.belastingdienst.nl/>
- Composition: `NL` + 9 digits + `B` + 2 digits sub-number
- Visual format: `NL123456789B01`

### Algorithm

Validate the 9-digit core against either:

1. **BSN eleven-test** (legacy / corporate): see `NL_BSN`
2. **ISO/IEC 7064 MOD 97-10** (post-2020 sole proprietor):
   `int(core) mod 97 == 1`

The `B##` sub-number selector has no checksum but must be a 2-digit value;
`B00` is rejected.

### Sources

- Primary: Belastingdienst — Wijziging btw-identificatienummer 2020
- Secondary: VIES interoperability notes, `python-stdnum.nl.btw`

### Synthetic test vectors

```
valid:
  - NL123456782B01    (BSN-style)
  - NL100000017B01    (MOD 97-10 only)

invalid (format):
  - NL12345678B01     (8-digit core)
  - NL000000000B01    (zero core)

invalid (checksum):
  - NL123456789B01
```

### Recent reforms

- 2020-01-01: BTW-id replaces BSN-derived BTW for sole proprietors. The
  ISO 7064 MOD 97-10 algorithm covers this segment.

### Open questions

- Belastingdienst publishes the change but not a normative algorithm
  document. Confidence is moderate; the orchestrator should cite the
  Belastingdienst PDF in `THIRD_PARTY.md` when deciding final confidence.
