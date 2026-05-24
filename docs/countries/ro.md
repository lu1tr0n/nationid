# Romania (RO)

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|-----------|
| `RO_VAT` | tax | 2-10 digits (variable body) | weighted mod-11 with `(10·s)` factor | high |

The spec ships under the tree-shakable subpath `nationid/ro`. `CUI`, `CIF`,
and `CF` are accepted as aliases — they all denote the same identifier
viewed from three different administrative angles (see "Recent reforms"
below).

---

## `RO_VAT` — Cod de Identificare Fiscală (CUI / CIF / CF)

### Overview

Variable-length 2-to-10-digit tax identifier issued to every legal entity
and VAT-registered economic operator in Romania. Sole proprietors who
are also VAT-registered usually appear under the same number space; the
13-digit personal CNP form is **out of scope for v1.7** and will ship in
v1.8 as `RO_CNP`.

- **Issuer**: Agenția Națională de Administrare Fiscală (ANAF), part of
  the Ministry of Public Finance — <https://www.anaf.ro/> ✓ live 2026-05-24
- **Statute**: Legea nr. 227/2015 privind Codul fiscal, art. 316
  (înregistrarea în scopuri de TVA); Ordonanța de Urgență nr. 116/2009
  defines the underlying CUI register at the ONRC.
- **Composition**: `RO` + 2 to 10 digits, first digit non-zero.
  VAT-registered entities prefix `RO`; the bare CUI exists for entities
  registered with ONRC but not VAT-active.
- **Visual format**: `RO NNNNNNNNNN` (single space after `RO`)

### Algorithm

Right-justify the body (excluding the trailing check digit) to 9 digits
by left-padding with zeros. Apply the fixed weight vector
`[7, 5, 3, 2, 1, 7, 5, 3, 2]`, multiply the weighted sum by 10, then
reduce mod 11 and mod 10 — the double reduction collapses the `10`
result into `0`.

```
body9 = padStart(body_excluding_check, 9, '0')
s     = Σ weights[i] · body9[i]            for i in 0..8
check = (10 · s) mod 11 mod 10
```

The `10·s` multiplier is the published Romanian quirk, not a typo or
mis-transcription — it appears verbatim in Ordonanța de Urgență
116/2009 anexa and is reproduced byte-for-byte by `python-stdnum`'s
`stdnum.ro.cui`.

Worked re-derivation of the canonical anchor `RO18547290`:

```
body excl. check = 1854729
padded to 9       = 001854729
sum               = 7·0+5·0+3·1+2·8+1·5+7·4+5·7+3·2+2·9
                  = 0+0+3+16+5+28+35+6+18 = 111
(10·111) mod 11   = 1110 mod 11 = 10
       mod 10     = 0                        ✓ matches trailing 0
```

### Sources

- ANAF (issuer root): <https://www.anaf.ro/> ✓ live 2026-05-24
- ANAF înregistrare fiscală overview:
  <https://www.anaf.ro/anaf/internet/ANAF/despre_anaf/strategii_anaf/proceduri_administrare/inregistrare_inreg_fiscala>
  ✓ live 2026-05-24
- Statute — Legea nr. 227/2015 (Codul fiscal), full text on
  legislatie.just.ro: <https://legislatie.just.ro/Public/DetaliiDocument/171282>
  ✓ live 2026-05-24
- VIES portal (EU cross-validation): <https://ec.europa.eu/taxation_customs/vies/>
  ✓ live 2026-05-24
- VAT Directive 2006/112/EC, art. 214 (obligation to maintain VAT
  register): <https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32006L0112>
  ✓ live 2026-05-24
- Cross-validated against `python-stdnum.ro.cf` (VAT-prefixed wrapper)
  and `python-stdnum.ro.cui`:
  <https://github.com/arthurdejong/python-stdnum/blob/master/stdnum/ro/cf.py>
  ✓ live 2026-05-24

(Note: the `static.anaf.ro/.../Codfiscal2015.pdf` link cited in some
older community write-ups was retired by ANAF; the canonical full text
is now hosted on `legislatie.just.ro` under document id 171282. No
Wayback snapshot retained — see "URL replacements made" in the release
notes.)

### Synthetic test vectors

```
valid (canonical anchors + arithmetically re-derived bodies, shipped in
tests/countries/ro.test.ts):
  - RO18547290        (canonical anchor — VERIFICATION §RO)
  - RO123453          (canonical anchor — 6-character short-body form)
  - RO390112472
  - RO3843700
  - RO992073
  - RO396             (3-character minimum body width supported)

invalid (leading zero in body):
  - RO0123456         (Reason: invalid_format — first body digit must be 1-9)

invalid (flipped check digit):
  - RO18547291        (Reason: invalid_checksum — correct check is 0)

invalid (checksum recomputed for parse() error mapping):
  - RO18547299        (Reason: invalid_checksum)
```

### Recent reforms

- **2015-09-08** — Codul fiscal codified into Legea 227/2015 (replaces
  previous Legea 571/2003). CUI numbering range and algorithm unchanged.
- **2009-12-22** — OUG 116/2009 unifies the CUI register at ONRC with
  ANAF's VAT register; the `RO` prefix becomes the single durable
  VIES-compliant form.
- **2007-01-01** — Romania joins the EU; the `RO` prefix becomes a
  VIES-recognised member-state code on day one.

### Open questions

- 13-digit CNP-as-VAT (sole proprietors). python-stdnum accepts it under
  `stdnum.ro.cf`. v1.7 rejects (body length 2..10 only). Defer to v1.8
  alongside `RO_CNP`.
- ANAF formularly publishes only OUG anexa pseudocode, not full
  reference implementation. Algorithm is cross-confirmed by python-stdnum
  + every community library surveyed (`validator.js isVAT('RO')`,
  `vat-validator-romania`).

---

## Notes for consumers

- `CUI`, `CIF`, and `CF` are **the same number** viewed through three
  registers:
  - **CUI** (Codul Unic de Înregistrare) is the ONRC view — the company
    register's primary identifier, issued at incorporation.
  - **CIF** (Codul de Identificare Fiscală) is the ANAF view — the tax
    authority's identifier for any taxpayer, including non-VAT entities.
  - **CF** is the VIES-prefixed (RO-prefixed) form used for EU
    cross-border VAT transactions.
  - The library exposes `validate("RO_VAT", x)` / `validate("CUI", x)` /
    `validate("CIF", x)` interchangeably — each returns the same boolean
    against the same `vatSpec`.
- `nationid` performs **offline** checksum validation only. Confirming
  that a `RO_VAT` is currently active and assigned to a specific trader
  requires a VIES live call (or the ANAF "Verificare contribuabil"
  service for domestic checks). See `examples/vies-check.ts` in the
  repository root.
- Short bodies (2-3 digits) are valid by statute but rare in modern
  issuance — they correspond to legacy entities from the early 1990s
  that never re-registered. Property-based fuzzing should not over-weight
  them.
