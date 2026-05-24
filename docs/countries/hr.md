# Croatia (HR)

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|-----------|
| `HR_OIB` | both (personal + tax) | 11 | ISO/IEC 7064 MOD 11,10 | high |

The spec ships under the tree-shakable subpath `nationid/hr`. `OIB` and
`VAT` are accepted as aliases — they resolve to the same `oibSpec`
because the OIB is universal (see "Overview" below).

---

## `HR_OIB` — Osobni identifikacijski broj

### Overview

11-digit universal identification number issued by the Tax
Administration to every natural person, sole trader, and legal entity
that has any contact with the Croatian state. Replaced the JMBG
(Yugoslav-era unique master citizen number) for tax purposes in 2009.
The same OIB is used as a personal identifier AND as the legal-entity
tax ID — there is no separate VAT number space; VIES simply prefixes
the OIB with `HR`.

- **Issuer**: Ministarstvo financija, Porezna uprava (Ministry of
  Finance, Tax Administration) — <https://porezna-uprava.gov.hr/>
  ✓ live 2026-05-24 (the legacy <https://www.porezna-uprava.hr/> URL
  cited in the research document now 301-redirects to the
  `.gov.hr` host; both forms are equivalent.)
- **Statute**: Zakon o osobnom identifikacijskom broju, Narodne novine
  60/2008. The statute **explicitly cites ISO/IEC 7064** as the
  check-digit algorithm by name — one of the cleanest legislative
  citations in this batch.
- **Composition**: `HR` + 11 digits. No structural constraints on the
  individual digits beyond the check.
- **Visual format**: `HR NNNNNNNNNNN` (single space after `HR`)
- **Scope**: `both`. Same algorithm validates personal OIBs and
  legal-entity OIBs.

### Algorithm

ISO/IEC 7064 MOD 11,10 over the first 10 body digits (the 11th digit is
the check). The library exports the primitive as `mod11_10CheckDigit`
from `nationid/algorithms` — it was **hoisted from `de/ustid.ts` into
`src/algorithms/iso7064.ts`** as the first commit of v1.7 so HR_OIB
could consume it without duplicating logic. Both DE_USTID's 8-body and
HR_OIB's 10-body call the same length-generic helper; DE's existing
test suite remained green through the refactor.

```
p = 10
for d in body10:
  s = (p + d) mod 10
  if s == 0: s = 10
  p = (s · 2) mod 11
check = (11 - p) mod 10
```

Worked re-derivation of the canonical anchor `HR33392005961`:

```
body10 = 3339200596
step    d   s = (p+d)%10  (s=0→10)   p = (s·2) % 11
0       3   (10+3)%10 = 3              (3·2)%11 = 6
1       3   (6+3)%10  = 9              (9·2)%11 = 7
2       3   (7+3)%10  = 0 → 10         (10·2)%11 = 9
3       9   (9+9)%10  = 8              16 %11   = 5
4       2   (5+2)%10  = 7              14 %11   = 3
5       0   3                          6
6       0   6                          12 %11   = 1
7       5   6                          12 %11   = 1
8       9   (1+9)%10  = 0 → 10         20 %11   = 9
9       6   (9+6)%10  = 5              10 %11   = 10

check = (11 - 10) mod 10 = 1                  ✓ matches trailing 1
```

### Sources

- Porezna uprava (issuer root, redirects to `.gov.hr`):
  <https://www.porezna-uprava.hr/> → <https://porezna-uprava.gov.hr/>
  ✓ live 2026-05-24
- Statute — Zakon o osobnom identifikacijskom broju, Narodne novine
  60/2008, official gazette text:
  <https://narodne-novine.nn.hr/clanci/sluzbeni/2008_05_60_2059.html>
  ✓ live 2026-05-24
- ISO/IEC 7064:2003 — "Information technology — Security techniques —
  Check character systems" (the standard the statute cites by name).
- VIES portal (EU cross-validation):
  <https://ec.europa.eu/taxation_customs/vies/> ✓ live 2026-05-24
- VAT Directive 2006/112/EC, art. 214:
  <https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32006L0112>
  ✓ live 2026-05-24
- Cross-validated against `python-stdnum.hr.oib` (which itself delegates
  to `stdnum.iso7064.mod_11_10`):
  <https://github.com/arthurdejong/python-stdnum/blob/master/stdnum/hr/oib.py>
  ✓ live 2026-05-24
- Shared `mod11_10CheckDigit` helper in this library:
  `src/algorithms/iso7064.ts`

(URL replacement made for this file: the research document cited
`https://www.porezna-uprava.hr/HR_OIB/Documents/Zakon_o_OIB.pdf` which
returns 404 after Porezna uprava's 2024 site migration. The canonical
text now lives on `narodne-novine.nn.hr`, which is the Republic of
Croatia's official gazette and the more durable citation.)

### Synthetic test vectors

```
valid (canonical anchor + arithmetically re-derived bodies, shipped in
tests/countries/hr.test.ts):
  - HR33392005961       (canonical anchor — VERIFICATION §HR)
  - HR61842315249
  - HR45662720770
  - HR55982066989
  - HR11870506298
  - HR79469327360

normalize() tolerates separators + bare 11-digit input:
  - "hr 33392 005961"   → HR33392005961
  - "33392005961"       → HR33392005961

format() adds a single space after the prefix:
  - "HR33392005961"     → "HR 33392005961"

invalid (flipped check digit):
  - HR33392005962       (Reason: invalid_checksum — correct check is 1)

invalid (checksum recomputed for parse() error mapping):
  - HR33392005960       (Reason: invalid_checksum)
```

### Recent reforms

- **2008-05-23** — Zakon o OIB-u (NN 60/2008) published. Statute
  explicitly names ISO/IEC 7064 as the check algorithm.
- **2009-01-01** — OIB enters force as Croatia's universal
  identification number. Issuance to all natural and legal persons
  begins.
- **2013-07-01** — Croatia joins the EU; `HR` becomes a VIES member-state
  prefix. The OIB body is unchanged; VIES simply queries the same
  Porezna uprava register over the EU-VIES gateway.
- **No format changes since rollout.**

### Open questions

- None. The statute is unusually explicit (names the ISO standard),
  python-stdnum agrees byte-for-byte, and the canonical anchor reproduces
  from prose alone. Highest-confidence spec in the v1.7 EU-VAT batch.

---

## Notes for consumers

- The `HR_OIB` is a **personal identifier** for natural persons (NOT a
  pure tax-only identifier like `RO_VAT` or `BG_VAT`). When stored,
  transmitted, or logged for a natural person it is PII under the GDPR
  and the Croatian implementing act (Zakon o provedbi Opće uredbe o
  zaštiti podataka, NN 42/2018). The library exposes `mask` / `hash` /
  `lastN` under `nationid/pii` for safe display. See
  [`docs/PII_GUIDANCE.md`](../PII_GUIDANCE.md).
- For VAT-context use (EU B2B invoicing), the OIB is treated as the
  trader's VAT number prefixed with `HR`. VIES accepts it without
  reformatting. `nationid`'s offline validation does not prove the
  trader is currently VAT-active — that is what VIES is for.
- The `mod11_10CheckDigit` helper is exported from `nationid/algorithms`
  and is reusable for any other ISO/IEC 7064 MOD 11,10 consumer
  (DE USt-IdNr already shares it).
