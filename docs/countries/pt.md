# Portugal (PT)

> Reference for `nationid` consumers and contributors.

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|-----------|
| `PT_NIF` | tax (singular + coletiva) | 9 digits | mod-11 weighted | high |
| `PT_CC` | personal | 12 chars (8 digits + 1 digit + 2 letters + 1 digit) | not enforced (format only) | low |

> **NIF / NIPC unification** — In Portugal the NIF (Número de Identificação Fiscal, naturales) and the NIPC (Número de Identificação de Pessoa Coletiva, jurídicas) share the same 9-digit number space and the same algorithm. The first digit identifies the holder type. The library accepts both `NIF` and `NIPC` as aliases.

---

## `PT_NIF` — Número de Identificação Fiscal

### Overview

Tax identifier issued by the Autoridade Tributária e Aduaneira (AT). Used for naturales (singulares) and jurídicas (coletivas). The first digit is the holder-type discriminator.

- **Issuer**: AT (Autoridade Tributária e Aduaneira) — <https://info.portaldasfinancas.gov.pt/>
- **Legal basis**: Decreto-Lei 463/79, de 30 de novembro
- **Composition**: 9 digits, no separator
- **Visual format**: `123456789`

### Holder-type prefix table

| First digit(s) | Holder type |
|---|---|
| `1`, `2`, `3` | pessoa singular residente |
| `45` | pessoa singular não-residente |
| `5` | pessoa coletiva (empresa) |
| `6` | administração pública |
| `70`, `74`, `75` | herança indivisa, regime de bens, ATM provisório |
| `71` | não-residentes coletivos sujeitos a retenção na fonte |
| `72` | fundos de investimento |
| `77` | atribuição oficiosa de NIF |
| `79` | regime excecional Expo 98 |
| `8` | empresário em nome individual (legacy) |
| `90`, `91` | condomínios, sociedades irregulares, herança indivisa |
| `98` | não-residente sem estabelecimento estável |
| `99` | sociedade civil sem personalidade jurídica |

The library exposes this as a helper:

```ts
import { nifHolderType } from "nationid/pt";
nifHolderType("503504564"); // "coletiva"
nifHolderType("123456789"); // "singular_residente"
```

### Algorithm

```
weights = [9, 8, 7, 6, 5, 4, 3, 2]   // applied LTR over digits 1..8
sum = sum(digit_i * weights_i for i in 0..7)
r = sum mod 11
DV = 0           if r ∈ {0, 1}
DV = 11 - r      otherwise
```

### Sources

- AT — Portal das Finanças, NIF section. Accessed 2026-05-10.
- Decreto-Lei 463/79.
- `validator.js` `isTaxID('pt-PT')` (cross-check). Algorithm parity verified.
- `python-stdnum` `stdnum.pt.nif` (cross-check).

### Synthetic test vectors

Body sums computed manually with weights `[9,8,7,6,5,4,3,2]`.

```
valid:
  - 123456789  (prefix 1, sum=156, r=2,  DV=9)
  - 211111112  (prefix 2, sum=53,  r=9,  DV=2)
  - 300000006  (prefix 3, sum=27,  r=5,  DV=6)
  - 455555559  (prefix 45, sum=211, r=2, DV=9 — singular não-residente)
  - 503504564  (prefix 5, sum=139, r=7,  DV=4 — AT itself)
  - 500000000  (prefix 5, sum=45,  r=1,  DV=0 — r==1 rule)
  - 600000001  (prefix 6, sum=54,  r=10, DV=1)
  - 699999995  (prefix 6, sum=369, r=6,  DV=5)
  - 800000005  (prefix 8, sum=72,  r=6,  DV=5)
  - 980000009  (prefix 9, sum=145, r=2,  DV=9)

invalid (format):
  - "" (empty)
  - 12345678   (8 digits)
  - 1234567890 (10 digits)
  - 12345678A  (letter)
  - 000000000  (no holder-type assigned to leading 0)

invalid (checksum):
  - 123456780
  - 123456788
  - 503504560
  - 211111110
```

### Recent reforms

None affecting the format or algorithm in the last 24 months.

### Open questions

None. The algorithm is documented by AT and matches multiple mature library implementations.

---

## `PT_CC` — Cartão de Cidadão

### Overview

Personal identification card issued by the Instituto dos Registos e do Notariado (IRN). Replaces the legacy Bilhete de Identidade for Portuguese citizens.

- **Issuer**: IRN — <https://www.cartaodecidadao.pt/>
- **Legal basis**: Decreto-Lei 83/2000
- **Composition**: 8-digit Número de Identificação Civil (NIC) + 1-digit NIC check + 2-letter version (e.g. `ZZ`, `AA`) + 1-digit document check
- **Visual format**: `12345678 9 ZZ 4`

### Algorithm

The full 12-character document checksum is reportedly an ISO/IEC 7064 MOD 11-2 over the 11 leading characters with letters mapped `A=10..Z=35`, but the IRN does **not** publish a machine-validatable spec, and open-source implementations diverge in detail. The library validates **format only** (regex + charset) and explicitly flags this as low-confidence so callers can choose to layer their own checksum or fall back to the IRN web service.

### Sources

- IRN — Cartão de Cidadão portal. Accessed 2026-05-10.
- Decreto-Lei 83/2000.

### Synthetic test vectors

```
valid (format-only):
  - 12345678 9 ZZ 4
  - 00000000 0 AA 0
  - 99999999 9 ZZ 9

invalid (format):
  - "" (empty)
  - 12345678ZZ4    (11 chars — missing the 9th NIC digit)
  - 1234567890ZZ4  (13 chars)
  - 1234567899Z4   (1 letter instead of 2)
  - 123456789ZZA   (letter at the document-DV position)
```

### Open questions

- Promotion to moderate/high confidence requires a contributor with current Portuguese-issued cards to confirm the exact checksum mapping (specifically the version-letter handling and any field normalisation done before MOD 11-2).

### Recent reforms

- The CC has gone through several version letters (`ZZ`, `AA`, `BC`, etc.) without changing the structural layout.
