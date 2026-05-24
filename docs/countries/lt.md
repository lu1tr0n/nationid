# Lithuania (LT)

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|-----------|
| `LT_VAT` | tax | 9 or 12 | weighted mod-11 primary + fallback (cycled weights) | high |

The spec ships under the tree-shakable subpath `nationid/lt`. `LT_VAT`
and `PVM` are accepted as aliases.

---

## `LT_VAT` — Pridėtinės vertės mokesčio (PVM) mokėtojo kodas

### Overview

VAT identification number issued by VMI (the Lithuanian State Tax
Inspectorate). Two co-existing forms:

- **9-digit** — legal-entity VAT registration. Position 7 (index 6) is
  a **structural marker** fixed at `1`.
- **12-digit** — temporary registration for non-resident traders and
  natural persons (e.g., sole proprietors registered for cross-border
  e-commerce). Position 10 (index 9) is the structural marker `1`.

In both forms the marker `1` is a structural constraint, **not a
checksum** — violations report as `invalid_format`, not
`invalid_checksum`.

- **Issuer**: Valstybinė mokesčių inspekcija prie Lietuvos Respublikos
  finansų ministerijos (VMI) — <https://www.vmi.lt/> ✓ live 2026-05-24
- **Statute**: Lietuvos Respublikos pridėtinės vertės mokesčio
  įstatymas, 2002 m. kovo 5 d. Nr. IX-751, art. 71 (PVM mokėtojo kodas).
- **Composition**:
  - `LT` + 9 digits where digit 7 (1-indexed) = `1`, or
  - `LT` + 12 digits where digit 11 (1-indexed) = `1`.
- **Visual format**: `LT NNNNNNNNN` or `LT NNNNNNNNNNNN` (single space
  after `LT`)

### Algorithm

Weighted mod-11 with a two-pass fallback over cycled weights `1..9`.

For the body (excluding the trailing check digit) of length `n`:

```
primary_weights[i]  = ((i + 1 - 1) mod 9) + 1     # = 1,2,3,4,5,6,7,8,9,1,2,3,...
fallback_weights[i] = ((i + 3 - 1) mod 9) + 1     # = 3,4,5,6,7,8,9,1,2,3,4,5,...

r = (Σ primary_weights[i] · body[i]) mod 11
if r == 10:
  r = (Σ fallback_weights[i] · body[i]) mod 11
  if r == 10:
    r = 0
check = r
```

The implementation uses a single helper `weightedSumMod11Cycle(body,
startWeight)` parameterised on the starting weight — `startWeight=1`
for the primary pass and `startWeight=3` for the fallback.

Worked re-derivation of the canonical anchor `LT100001110`:

```
body excl. check = 10000111
weights (cycle 1..9)   = [1, 2, 3, 4, 5, 6, 7, 8]
sum                    = 1·1+2·0+3·0+4·0+5·0+6·1+7·1+8·1
                       = 1+0+0+0+0+6+7+8 = 22
22 mod 11              = 0
check                  = 0                        ✓ matches trailing 0

Structural constraint:
position 7 (1-indexed) = position 6 (0-indexed) of body = digit '1' ✓
```

Worked re-derivation of `LT119511515` (body `11951151`, from the
research document):

```
body excl. check = 11951151
weights (cycle 1..9)  = [1, 2, 3, 4, 5, 6, 7, 8]
sum                   = 1·1+2·1+3·9+4·5+5·1+6·1+7·5+8·1
                      = 1+2+27+20+5+6+35+8 = 104
104 mod 11            = 5
check                 = 5                         ✓ matches trailing 5
```

### Sources

- VMI (issuer root): <https://www.vmi.lt/> ✓ live 2026-05-24
- Statute — PVM įstatymas full text on e-Seimas:
  <https://e-seimas.lrs.lt/portal/legalAct/lt/TAD/TAIS.163167>
  ✓ live 2026-05-24
- VIES portal (EU cross-validation):
  <https://ec.europa.eu/taxation_customs/vies/> ✓ live 2026-05-24
- VAT Directive 2006/112/EC, art. 214:
  <https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32006L0112>
  ✓ live 2026-05-24
- Cross-validated against `python-stdnum.lt.pvm`:
  <https://github.com/arthurdejong/python-stdnum/blob/master/stdnum/lt/pvm.py>
  ✓ live 2026-05-24

(URL replacement made for this file: the research document cited
`https://www.vmi.lt/evmi/pvm-moketojo-kodo-suteikimas` — this path
returns 200 but its content moved between sections through 2025-Q4.
The durable canonical citation is the statute on `e-seimas.lrs.lt`,
which is the parliamentary legal-information system; that URL is
content-stable.)

### Synthetic test vectors

```
valid (canonical anchor + arithmetically re-derived bodies, shipped in
tests/countries/lt.test.ts):
  - LT100001110        (canonical anchor — VERIFICATION §LT)
  - LT130201152
  - LT720659164
  - LT827367110
  - LT707567138
  - LT932865124

valid (12-digit non-resident / natural-person form):
  - LT100001919017     (12-digit form, pos 10 = '1' structural marker)
  - LT100004801610

invalid (9-digit body position 7 not '1' — structural marker fails):
  - LT123456789        (pos 7 = '8' — Reason: invalid_format)

invalid (flipped check digit):
  - LT100001111        (Reason: invalid_checksum — correct check is 0)

invalid (checksum recomputed for parse() error mapping):
  - LT100001119        (Reason: invalid_checksum)
```

### Recent reforms

- **2002-03-05** — PVM įstatymas Nr. IX-751 published; art. 71 defines
  the PVM mokėtojo kodas, including the cycled-weights algorithm.
- **2004-05-01** — Lithuania joins the EU; `LT` becomes a VIES
  member-state prefix on day one.
- **2015-01-01** — Lithuania adopts the euro; format unchanged.
- **No format changes since 2004.**

### Open questions

- **9-digit vs 12-digit dispatch**. The library accepts either form on
  input and dispatches to the same `weightedSumMod11Cycle` helper —
  there is no algorithm divergence between the two lengths, only a
  different structural marker position (digit 7 in the 9-form, digit 10
  in the 12-form). The check-digit derivation is identical because the
  weight cycle is length-agnostic.
- **`vmi.lt` TLD**. Lithuanian government agencies do not consistently
  use a `.gov.lt` subdomain — the State Tax Inspectorate sits directly
  on `vmi.lt`. The library's governance test adds `vmi.lt` to
  `ISSUER_ALLOWLIST_DOMAINS` (alongside `anaf.ro`, `nra.bg`, and the
  other non-`gov.<cc>` issuers in this batch).

---

## Notes for consumers

- `nationid` performs **offline** checksum validation only. Confirming
  that an `LT_VAT` is currently active requires a VIES live call (or
  the VMI "Mokesčių mokėtojų registras" service for domestic checks).
  See `examples/vies-check.ts` in the repository root.
- The 12-digit form often appears in cross-border e-commerce
  registrations (LT is a popular EU OSS / IOSS jurisdiction). If your
  integration only supports 9-digit VAT IDs upstream of `nationid`,
  widen the column to at least `VARCHAR(15)` to hold the formatted
  `LT NNNNNNNNNNNN` representation.
- The structural marker at position 7 (9-form) or position 10 (12-form)
  is **not** a checksum — `parse()` returns `invalid_format` (not
  `invalid_checksum`) when it is wrong, so error-handling code that
  branches on `reason.kind` should expect both kinds for malformed LT
  inputs.
