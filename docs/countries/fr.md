# France (FR)

Reference for `nationid` v0.6 FR document validators.

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|------------|
| `FR_NIR` | personal/tax | 15 | mod-97 | high |
| `FR_SIREN` | tax | 9 | Luhn | high |
| `FR_SIRET` | tax | 14 | Luhn (La Poste exception: digit-sum mod 5) | high |
| `FR_TVA` | tax | 13 | mod-97 derivation from SIREN | high |

## `FR_NIR`

### Overview

Numéro d'Inscription au Répertoire / Sécurité Sociale. Lifelong personal ID encoding sex, birth date, and place of birth, issued by INSEE.

- Issuer: INSEE, https://www.insee.fr/fr/information/1400939
- Legal basis: Décret n°82-103 (1982-01-22)
- Visual format: `1 85 02 75 116 003 09` (sex year month dept commune ordre clé)

### Algorithm

```
body = first 13 chars
For Corsica: replace dept "2A" → "19", "2B" → "18" before mod
clé = 97 - (body as integer) mod 97
```

`number` is up to 13 decimal digits, exceeds Number.MAX_SAFE_INTEGER on some inputs, so the implementation streams `rem = (rem*10 + d) mod 97` to avoid BigInt.

### Sources

- INSEE official spec (1400939), https://www.insee.fr/fr/information/1400939
- `validator.js isIdentityCard('fr-FR')`, `python-stdnum.fr.nir`

### Synthetic test vectors

```
valid:
  - 185027511600309   # M, jan 1985, dept 75
  - 289091300302864   # F, sep 1989, dept 13
  - 195012A23456715   # M, Corsica 2A
  - 199102B56789056   # F, Corsica 2B

invalid (checksum):
  - 185027511600300

invalid (format):
  - 385027511600309   # bad sex digit
  - 185137511600309   # month 13
```

## `FR_SIREN`

### Overview

Système d'Identification du Répertoire des ENtreprises. 9-digit identifier of a French legal entity.

- Issuer: INSEE
- Visual format: `123 456 782`

### Algorithm

Standard Luhn (ISO/IEC 7812-1) over all 9 digits.

### Sources

- INSEE, https://www.insee.fr/fr/information/1956003
- `validator.js`, `python-stdnum.fr.siren`

### Synthetic test vectors

```
valid:
  - 552081317   # LVMH SIREN
  - 732829320
  - 123456782

invalid (checksum):
  - 552081316
  - 123456789
```

## `FR_SIRET`

### Overview

Système d'Identification du Répertoire des établissements. 14 digits = SIREN (9) + NIC (5). Identifies a specific establishment of a legal entity.

- Issuer: INSEE
- Visual format: `123 456 782 00010`

### Algorithm

Standard Luhn over all 14 digits, with one INSEE-published exception:

> **La Poste exception**: any SIRET starting with SIREN `356000000` is valid iff the sum of all 14 digits is divisible by 5. (La Poste's head office assigns establishment numbers that do not satisfy Luhn.)

### Sources

- INSEE
- `python-stdnum.fr.siret`, `frenchsiret`

### Synthetic test vectors

```
valid:
  - 12345678200010
  - 35600000010000   # La Poste, digit sum 15 ≡ 0 mod 5
  - 35600000000001   # La Poste, digit sum 15 ≡ 0 mod 5

invalid (checksum):
  - 12345678200013
  - 35600000000005   # La Poste, digit sum 19 ≢ 0 mod 5
```

## `FR_TVA`

### Overview

Numéro de TVA Intracommunautaire — VIES-registered VAT identifier.

- Issuer: DGFiP, https://www.impots.gouv.fr/professionnel/numero-tva-intracommunautaire
- Visual format: `FR 11 123456782` (FR + clé + SIREN)

### Algorithm

Numeric clé:
```
clé = (12 + 3 * (SIREN mod 97)) mod 97   # zero-padded to 2 digits
```
Alphabetic clé (rare, newer SIRENs only): not algorithmically derivable; format-only check, but the underlying SIREN must still pass Luhn.

### Sources

- DGFiP / VIES
- `validator.js isVAT('fr-FR')`, `python-stdnum.fr.vat`

### Synthetic test vectors

```
valid:
  - FR11123456782
  - FR03552081317   # LVMH

invalid (checksum):
  - FR99123456782
  - FR00552081317
```

### Recent reforms

None affecting format/algorithm in the last 24 months. VIES remains the runtime existence check.

### Open questions

- Document the alphabetic-clé derivation if DGFiP ever publishes it.
- Confirm whether the La Poste digit-sum-mod-5 exception applies to SIRETs other than the `356000000` head office.
