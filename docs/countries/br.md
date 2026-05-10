# Brasil (BR)

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|-----------|
| `BR_CPF` | personal | 11 | double mod-11 | high |
| `BR_CNPJ` | tax | 14 | double mod-11 | high |
| `BR_CNH` | personal | 11 | double mod-11 (CONTRAN) | high |
| `BR_TITULO_ELEITOR` | personal | 12 | double mod-11 (TSE) | high |
| `BR_PIS` | both | 11 | single mod-11 (Caixa) | high |

## `BR_CPF` — Cadastro de Pessoas Físicas

### Overview

Personal taxpayer registration for natural persons. Issued by Receita Federal do Brasil.

- **Issuer**: Receita Federal — <https://www.gov.br/receitafederal/pt-br/servicos/cadastro/cpf>
- **Composition**: 9 sequential digits + 2 check digits
- **Visual format**: `000.000.000-00`

### Algorithm

Two mod-11 check digits computed sequentially.

```
DV1: weights [10, 9, 8, 7, 6, 5, 4, 3, 2] over digits 1-9
     r1 = (sum * 10) mod 11
     DV1 = 0  if r1 == 10 or r1 == 11
            r1 otherwise

DV2: weights [11, 10, 9, 8, 7, 6, 5, 4, 3, 2] over digits 1-10 (incl. DV1)
     same rule for DV2
```

All-same-digit sequences (`111.111.111-11`, etc.) are rejected by convention.

### Sources

- Receita Federal: <https://www.gov.br/receitafederal/pt-br/servicos/cadastro/cpf>
- Cross-validated against `cpf-cnpj-validator` (npm)
- Legal basis: Lei 4.862/1965 + Receita Federal normativa

### Recent reforms

- No format changes since 1965. Only the issuance and online lookup processes have evolved.

---

## `BR_CNPJ` — Cadastro Nacional da Pessoa Jurídica

### Overview

Tax registration for legal entities (businesses, NGOs, etc.). Issued by Receita Federal do Brasil.

- **Issuer**: Receita Federal — <https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/cadastros/cnpj>
- **Composition**: 8 root digits + 4 branch digits + 2 check digits
- **Visual format**: `00.000.000/0000-00`

### Algorithm

Two mod-11 check digits.

```
DV1: weights [5,4,3,2,9,8,7,6,5,4,3,2] over chars 1-12
     r = sum mod 11
     DV1 = 0    if r < 2
           11 - r otherwise

DV2: weights [6,5,4,3,2,9,8,7,6,5,4,3,2] over chars 1-13 (incl. DV1)
     same rule
```

### Sources

- Receita Federal: <https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/cadastros/cnpj>
- IN RFB nº 2.229/2024 (DOU 16-DEZ-2024)
- Cross-validated against `cpf-cnpj-validator` (npm)

### Recent reforms

- **2024-12** — IN RFB nº 2.229/2024 announced **alphanumeric CNPJ** for new registrations starting **2026-07-01**. Format keeps 14 chars with letters allowed in positions 1-12; check digits remain numeric. The check-digit algorithm operates on ASCII-code-derived numeric values, preserving the existing math.
- The current `nationid` v0.1 implementation supports the numeric format. Alphanumeric support is tracked in **ADR-001** for v0.2.

### Open questions

- Validate the alphanumeric algorithm against the first batch of real alphanumeric CNPJs once Receita Federal begins issuing them in July 2026.

---

## `BR_CNH` — Carteira Nacional de Habilitação

### Overview

Driver's license issued by DETRAN estaduais under federal CONTRAN rules. Increasingly accepted as a backup ID alongside `BR_CPF` for KYC, rideshare onboarding, car rental, and fleet management.

- **Issuer**: DENATRAN / DETRAN estaduais — <https://www.gov.br/transportes/pt-br/assuntos/transito/cnh>
- **Composition**: 9 sequential digits + 2 mod-11 check digits
- **Visual format**: `123456789-00`

### Algorithm

Two mod-11 check digits with a "DSC" offset between them.

```
DV1: weights [9, 8, 7, 6, 5, 4, 3, 2, 1] over digits 1-9
     r = sum mod 11
     if r >= 10:
         DV1 = 0
         DSC = 2
     else:
         DV1 = r
         DSC = 0

DV2: weights [1, 2, 3, 4, 5, 6, 7, 8, 9] over digits 1-9
     r = (sum - DSC) mod 11   (positive remainder)
     DV2 = 0 if r >= 10 else r
```

All-same-digit sequences (`11111111111`, etc.) are rejected by convention.

### Sources

- DENATRAN / CONTRAN: <https://www.gov.br/transportes/pt-br/assuntos/transito/cnh>
- Resolução CONTRAN nº 192/2006; Ofício DENATRAN nº 51/2008
- Cross-validated against `@brazilian-utils/brazilian-utils@2.x` (`isValidCnh`)

---

## `BR_TITULO_ELEITOR` — Título de Eleitor

### Overview

Voter registration issued by Tribunal Superior Eleitoral (TSE) and the Tribunais Regionais Eleitorais. Required for many government services, eSocial payroll integration, and increasingly for bank account opening.

- **Issuer**: TSE / TREs — <https://www.tse.jus.br/eleitor/titulo-de-eleitor>
- **Composition**: 8 sequential digits + 2-digit UF code + 2 mod-11 check digits
- **Visual format**: `1234 5678 01 91` (group spacing 4-4-2-2)

### UF code table

| Code | UF | Code | UF | Code | UF | Code | UF |
|------|----|----|----|------|----|------|----|
| 01 | SP | 08 | PE | 15 | PI | 22 | AM |
| 02 | MG | 09 | SC | 16 | RN | 23 | RO |
| 03 | RJ | 10 | GO | 17 | AL | 24 | AC |
| 04 | RS | 11 | MA | 18 | MT | 25 | AP |
| 05 | BA | 12 | PB | 19 | MS | 26 | RR |
| 06 | PR | 13 | PA | 20 | DF (legacy) | 27 | TO |
| 07 | CE | 14 | ES | 21 | SE | 28 | Exterior / ZZ |

### Algorithm

```
DV1: weights [2, 3, 4, 5, 6, 7, 8, 9] over digits 1-8 (sequential body)
     r = sum mod 11
     if r == 10:
         DV1 = 0
     else if r == 0 and UF in {01 (SP), 02 (MG)}:
         DV1 = 1
     else:
         DV1 = r

DV2: weights [7, 8, 9] over UF1, UF2, DV1
     r = sum mod 11
     same SP/MG override rule
```

The UF code MUST be in `01..28`; values outside this range are unallocated by TSE and are rejected at validation. All-same-digit sequences are also rejected.

### Sources

- TSE: <https://www.tse.jus.br/eleitor/titulo-de-eleitor>
- Resolução TSE nº 21.538/2003 art. 11 + Anexo I
- Cross-validated against `@brazilian-utils/brazilian-utils@2.x` (`isValidVoterId`)

---

## `BR_PIS` — PIS / PASEP / NIT / NIS

### Overview

A single 11-digit social-security number used across four programs:

| Alias | Used by | Operator |
|-------|---------|----------|
| **PIS** | Private-sector workers | Caixa Econômica Federal |
| **PASEP** | Public-sector workers | Banco do Brasil |
| **NIT** | INSS contributors | INSS |
| **NIS** | Bolsa Família / CadÚnico beneficiaries | Ministério da Cidadania |

A natural person has one number across all four programs. The library ships a single spec `BR_PIS` with the high-confidence Caixa algorithm; consumers needing the other names should use the same validator.

- **Issuer**: Caixa Econômica Federal (PIS), Banco do Brasil (PASEP), INSS (NIT), Ministério da Cidadania (NIS) — <https://www.caixa.gov.br/cadastros/pis/>
- **Composition**: 10 body digits + 1 mod-11 check digit
- **Visual format**: `123.45678.91-9`
- **Scope**: `both` — identifies a natural person AND is used as a tax-tracking ID for payroll withholding (FGTS, INSS, eSocial S-1200).

### Algorithm

```
DV: weights [3, 2, 9, 8, 7, 6, 5, 4, 3, 2] over digits 1-10
    r = sum mod 11
    DV = 0       if r < 2
         11 - r  otherwise
```

All-same-digit sequences are rejected by convention.

### Sources

- Caixa Econômica Federal: <https://www.caixa.gov.br/cadastros/pis/>
- Lei nº 7.998/1990 (Programa de Integração Social — PIS / PASEP)
- eSocial Manual de Orientação (MOS) S-1.x — leiaute para `nisTrab`
- Cross-validated against `@brazilian-utils/brazilian-utils@2.x` (`isValidPis`)
