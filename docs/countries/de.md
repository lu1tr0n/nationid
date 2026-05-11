# Germany (DE)

Reference for `nationid` v0.6 DE document validators.

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|------------|
| `DE_STEUER_ID` | personal/tax | 11 | ISO/IEC 7064 MOD 11,10 | high |
| `DE_STEUERNUMMER` | tax | 10-13 | none (state-specific) | low |
| `DE_USTID` | tax | 11 (`DE` + 9) | ISO/IEC 7064 MOD 11,10 | high |

## `DE_STEUER_ID`

### Overview

Persönliche Identifikationsnummer (IdNr). Lifelong personal tax ID, assigned at birth or first registration, valid until death + 20 years (§ 139b AO).

- Issuer: Bundeszentralamt für Steuern, https://www.bzst.de/
- Legal basis: § 139b Abgabenordnung
- Visual format: `47 036 892 816` (2-3-3-3 grouping)

### Algorithm

```
# Structural (§ 139b AO):
#   Within first 10 digits: exactly one digit repeats 2 or 3 times,
#   all other digits are unique.
#   First digit is non-zero.

# ISO/IEC 7064 MOD 11,10 check digit on the 10-digit body:
check = 10
for d in body:
    p = (d + check) mod 10
    if p == 0: p = 10
    check = (p * 2) mod 11
dv = (11 - check) mod 10
```

### Sources

- Bundeszentralamt für Steuern
- `validator.js isTaxID('de-DE')`, `python-stdnum.de.idnr`

### Synthetic test vectors

```
valid:
  - 47036892816
  - 81872495633
  - 26954371827

invalid (checksum):
  - 47036892810
  - 12345678901

invalid (structural):
  - 12345678905   # no repeated digit in first 10
  - 11223456787   # two distinct repeating digits
  - 01234567890   # leading zero
```

## `DE_STEUERNUMMER`

### Overview

State-issued tax number (per Bundesland). Format varies by Land. The 13-digit "Bundeseinheitliche Steuernummer" is the federal-wide canonical form derived from the Land number plus the 4-digit Finanzamt code.

- Issuer: 16 Bundesländer Finanzämter
- Reference: BMF Schreiben 2008-12-19, ELSTER documentation

### Algorithm

State-specific. We do **not** verify a check digit. Format-only validation: 10-13 digits with optional `/` separators.

### Sources

- ELSTER configuration files (per Land)

### Synthetic test vectors

```
valid (format-only):
  - 1234567890
  - 123/456/78901
  - 12345678901
  - 1234567890123

invalid (length / charset):
  - 12345
  - 12345678901234
  - ABCDEFGHIJ
```

### Recent reforms

The federal 13-digit Bundeseinheitliche Steuernummer continues to roll out across Länder. We accept up to 13 digits to remain forward-compatible.

## `DE_USTID`

### Overview

Umsatzsteuer-Identifikationsnummer. Intra-EU VAT identifier issued by the Bundeszentralamt für Steuern.

- Issuer: BZSt, https://evatr.bff-online.de/
- Visual format: `DE 123 456 788`

### Algorithm

ISO/IEC 7064 MOD 11,10 over the first 8 body digits; the 9th body digit is the check digit. Same primitive as `DE_STEUER_ID`.

### Sources

- BZSt eVATR
- `validator.js isVAT('de-DE')`, `python-stdnum.de.vat`

### Synthetic test vectors

```
valid:
  - DE123456788
  - DE136695976

invalid (checksum):
  - DE123456789
  - DE000000000

invalid (format):
  - DE023456788   # leading zero in body
  - FR123456788   # wrong country
```

### Open questions

- Promote `DE_STEUERNUMMER` to `moderate` confidence by adding per-Land regex/check-digit when ELSTER publishes a consolidated spec.
