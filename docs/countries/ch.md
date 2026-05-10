# Switzerland (CH)

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|------------|
| `CH_AHV` | personal | 13 | EAN-13 / GS1 mod-10 | high |
| `CH_UID` | tax | 12 (`CHE`+9d) | mod-11 weighted (5,4,3,2,7,6,5,4) | high |
| `CH_MWST` | tax | 16 (UID + suffix) | UID mod-11 + suffix presence | moderate |

## `CH_AHV`

### Overview

AHV-Nummer / Numéro AVS / Numero AVS — universal social security number
since the 2008 redesign. Always begins with `756`, the ISO 3166 numeric
code for Switzerland.

- Issuer: Zentrale Ausgleichsstelle (ZAS / CdC) — <https://www.zas.admin.ch/>
- Composition: `756` + 9 random digits + 1 check digit
- Visual format: `756.0000.0000.00`

### Algorithm

EAN-13 / GS1 mod-10:

```
weights  = [1, 3, 1, 3, ...]   # alternating, starting with 1
sum      = sum(weights[i] * digit[i])  for i in 0..11
expected = (10 - (sum mod 10)) mod 10
valid    = expected == digit[12]
```

### Sources

- Primary: Bundesamt für Statistik — AHV-Nummer Spezifikation 2008
- Secondary: `python-stdnum.ch.ssn`

### Synthetic test vectors

```
valid:
  - 7561234567897
  - 7569876543217
  - 7561000000016

invalid (format):
  - 7521234567897    (non-756 prefix — Sweden)
  - 756123456789     (12 digits)

invalid (checksum):
  - 7561234567890
```

### Recent reforms

None.

### Open questions

None.

---

## `CH_UID`

### Overview

Unternehmens-Identifikationsnummer / IDE / IDI — single business
identifier mandated by the 2010 UID Act. Replaces the previous patchwork
of cantonal commercial register numbers.

- Issuer: Bundesamt für Statistik (BFS) — <https://www.uid.admin.ch/>
- Composition: `CHE` + 8 base digits + 1 check digit
- Visual format: `CHE-123.456.789`

### Algorithm

```
weights  = [5, 4, 3, 2, 7, 6, 5, 4]
sum      = sum(weights[i] * digit[i])  for i in 0..7
r        = sum mod 11
if r == 1: invalid (UID never issued)
if r == 0: dv = 0
else:      dv = 11 - r
```

### Sources

- Primary: BFS — UID-Reglement, mit Anhang Berechnungsformel
- Secondary: `python-stdnum.ch.uid`, `validator.js isVAT('CH')`

### Synthetic test vectors

```
valid:
  - CHE123456788
  - CHE105654497
  - CHE100000012

invalid (format):
  - CHE12345678
  - USA123456788

invalid (checksum):
  - CHE123456780
  - CHE100000019
```

### Recent reforms

None since the 2010 introduction.

### Open questions

None.

---

## `CH_MWST`

### Overview

VAT registration suffix appended to a UID once the holder is registered
with the Eidgenössische Steuerverwaltung (ESTV). The suffix is one of
`MWST`, `TVA`, or `IVA` — the language reflects the canton of registration
but all three are equivalent.

- Issuer: ESTV / AFC — <https://www.estv.admin.ch/>
- Composition: `CHE` + 9 digits + (`MWST` | `TVA` | `IVA`)
- Visual format: `CHE-123.456.789 MWST`

### Algorithm

Reuses the UID mod-11 check; the suffix carries no checksum of its own.

### Sources

- Primary: ESTV — MWST-Nummern format guidance
- Secondary: VIES interoperability notes

### Synthetic test vectors

```
valid:
  - CHE123456788MWST
  - CHE-123.456.788 TVA

invalid (format):
  - CHE123456788          (no suffix)
  - CHE123456788XXX       (unknown suffix)

invalid (checksum):
  - CHE123456780MWST
```

### Recent reforms

None.

### Open questions

ESTV does not publish a separate suffix-level checksum; existence checks
require querying the ESTV register or VIES.
