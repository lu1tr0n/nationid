# Slovenia (SI)

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|-----------|
| `SI_VAT` | tax | 8 | weighted mod-11 with `10→0` collapse | high |

The spec ships under the tree-shakable subpath `nationid/si`. `SI_VAT`
and `DDV` are accepted as aliases.

---

## `SI_VAT` — Identifikacijska številka za DDV

### Overview

8-digit VAT identification number issued by FURS (the Slovenian
Financial Administration) to every entity registered for DDV. The same
number space is shared with the Slovenian *davčna številka* (DŠ) used
for personal income tax — v1.7's `SI_VAT` covers both. A dedicated
`SI_DS` personal alias is a zero-cost v1.8 addition.

- **Issuer**: Finančna uprava Republike Slovenije (FURS) —
  <https://www.fu.gov.si/> ✓ live 2026-05-24
- **Statute**: Zakon o davku na dodano vrednost (ZDDV-1), Uradni list
  Republike Slovenije 117/06 (consolidated through subsequent
  amendments).
- **Composition**: `SI` + 8 digits, first digit `[1-9]` (non-zero).
- **Visual format**: `SI NNNNNNNN` (single space after `SI`)

### Algorithm

Weighted mod-11 over the first 7 body digits, with the canonical
"11 → 0" collapse for the maximum residue.

```
weights = [8, 7, 6, 5, 4, 3, 2]
s       = Σ weights[i] · body[i]        for i in 0..6
r       = s mod 11
check   = (11 - r) mod 10               # collapses r=1 → check=10 (impossible)
                                        # and r=0 → check=0
```

Edge handling: when `r == 1` the formula would require a check digit of
`10`, which cannot be encoded in a single decimal digit; `nationid`
rejects such bodies outright. python-stdnum's reference does the same.

Worked re-derivation of the canonical anchor `SI50223054`:

```
body7        = 5022305
sum          = 8·5+7·0+6·2+5·2+4·3+3·0+2·5
             = 40+0+12+10+12+0+10 = 84
84 mod 11    = 7
check        = (11 - 7) mod 10 = 4              ✓ matches trailing 4
```

Worked re-derivation of the VERIFICATION mid-table correction
(`SI98765434`, body `9876543`):

```
body7        = 9876543
sum          = 8·9+7·8+6·7+5·6+4·5+3·4+2·3
             = 72+56+42+30+20+12+6 = 238
238 mod 11   = 7
check        = (11 - 7) mod 10 = 4              ✓ matches trailing 4
```

(VERIFICATION.md's eu-vat-batch table contained an in-line arithmetic
correction for this row — initial table entry `check=8` was wrong; the
re-derivation above shows `check=4` is correct. The shipping test
fixture uses `SI98765434`, not `SI98765438`.)

### Sources

- FURS (issuer root): <https://www.fu.gov.si/> ✓ live 2026-05-24
- FURS DDV landing:
  <https://www.fu.gov.si/davki_in_druge_dajatve/podrocja/davek_na_dodano_vrednost_ddv/>
  ✓ live 2026-05-24
- Statute — ZDDV-1 full text on PISRS (Pravno-informacijski sistem
  Republike Slovenije): <https://pisrs.si/Pis.web/pregledPredpisa?id=ZAKO4701>
  ✓ live 2026-05-24
- VIES portal (EU cross-validation):
  <https://ec.europa.eu/taxation_customs/vies/> ✓ live 2026-05-24
- VAT Directive 2006/112/EC, art. 214:
  <https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32006L0112>
  ✓ live 2026-05-24
- Cross-validated against `python-stdnum.si.ddv`:
  <https://github.com/arthurdejong/python-stdnum/blob/master/stdnum/si/ddv.py>
  ✓ live 2026-05-24

(URL replacement made for this file: the research document used
`http://www.pisrs.si/Pis.web/pregledPredpisa?id=ZAKO4701` — the host
now serves only HTTPS and dropped the `www.` subdomain. Updated to the
canonical `https://pisrs.si/...` form.)

### Synthetic test vectors

```
valid (canonical anchor + arithmetically re-derived bodies, shipped in
tests/countries/si.test.ts):
  - SI50223054       (canonical anchor — VERIFICATION §SI)
  - SI60474416
  - SI73065153
  - SI64440541
  - SI15300160
  - SI34671978

valid (VERIFICATION worked-example correction):
  - SI98765434       (body 9876543, recomputed check = 4)

invalid (flipped check digit):
  - SI50223055       (Reason: invalid_checksum — correct check is 4)

invalid (body starts with 0):
  - SI00223054       (Reason: invalid_format — first body digit must be 1-9)

invalid (checksum recomputed for parse() error mapping):
  - SI50223050       (Reason: invalid_checksum)
```

### Recent reforms

- **2006-12-14** — ZDDV-1 published in Uradni list 117/06; replaces
  the original ZDDV from 1998. Algorithm and format are unchanged from
  the predecessor statute.
- **2007-01-01** — ZDDV-1 enters force. Slovenia had joined the EU in
  2004; ZDDV-1 codifies the post-2007 EU-harmonised VAT system.
- **No format changes since 2007.**

### Open questions

- **Shared number space with personal DŠ**. The same 8-digit identifier
  serves both legal-entity DDV and natural-person davčna številka. v1.7
  ships only the `tax` scope. When `SI_DS` lands in v1.8 it will be a
  pure alias — same `siSpec` re-exported under a personal-scope code —
  so there is no algorithm divergence to worry about.

---

## Notes for consumers

- `nationid` performs **offline** checksum validation only. Confirming
  that an `SI_VAT` is currently active requires a VIES live call (or
  the FURS "eDavki" service for domestic checks). See
  `examples/vies-check.ts` in the repository root.
- For natural-person callers in v1.7: the same number that validates
  here as `SI_VAT` will validate as `SI_DS` in v1.8 (the spec is the
  same algorithm and the same number space). If you need personal-tax
  context today, validate under `SI_VAT` and treat the result as
  scope-independent.
- The 8-digit form is shorter than most EU VAT IDs — set
  `VARCHAR(13)` minimum on persisted columns to cover the formatted
  `SI 12345678` representation with one space.
