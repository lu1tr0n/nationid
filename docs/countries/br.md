# Brasil (BR)

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|-----------|
| `BR_CPF` | personal | 11 | double mod-11 | high |
| `BR_CNPJ` | tax | 14 | double mod-11 (alphanumeric-aware, IN RFB 2.229/2024) | high |
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

Tax registration for legal entities (businesses, NGOs, etc.). Issued by Receita Federal do Brasil. Two coexisting forms are accepted by the validator:

| Form | Issuance window | Body chars 1-12 | DV chars 13-14 | Mask |
|------|-----------------|-----------------|----------------|------|
| Legacy numeric | through 2026-06-30 | `\d{12}` | `\d{2}` | `00.000.000/0000-00` |
| Alphanumeric | from 2026-07-01 onward (IN RFB 2.229/2024) | `[A-Z0-9]{12}` | `\d{2}` | `**.***.***-****-DD` |

Every legacy numeric CNPJ remains valid forever — they are a strict subset of the alphanumeric form because `[A-Z0-9]` includes `[0-9]`.

- **Issuer**: Receita Federal — <https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/cadastros/cnpj>
- **Composition**: 12-char body (root + branch) + 2 numeric check digits
- **Confidence**: `high`

### Algorithm (alphanumeric-aware)

For each char `c` at position `i` in the body, the numeric value used in the weighted mod-11 sum is `value(c) = c.charCodeAt(0) - 48`. This expands to:

| Char range | Numeric value |
|------------|---------------|
| `'0'..'9'` | `0..9` |
| `'A'..'Z'` | `17..42` (`'A'`=65−48=17, …, `'Z'`=90−48=42) |

The weights and final mapping are unchanged from the legacy spec:

```
DV1: weights [5,4,3,2,9,8,7,6,5,4,3,2] over chars 1-12
     r = sum mod 11
     DV1 = 0       if r < 2
           11 - r  otherwise

DV2: weights [6,5,4,3,2,9,8,7,6,5,4,3,2] over chars 1-13 (incl. DV1)
     same rule
```

### Backwards compatibility

When the body is all digits, `value(c) = c.charCodeAt(0) - 48` reduces to the digit's numeric value. The weighted sum and resulting DVs are therefore byte-for-byte identical to the legacy algorithm — every CNPJ valid before this change stays valid after it. The library guarantees this via an explicit "every v0.4 fixture still validates" test in `tests/countries/br.test.ts`.

### Sources

- Receita Federal — Cadastro CNPJ: <https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/cadastros/cnpj>
- Instrução Normativa RFB nº 2.229/2024 (DOU 16-DEZ-2024) — habilita o CNPJ alfanumérico
- Nota Técnica "CNPJ Alfanumérico" v1.0 — Receita Federal
- Cross-validated against `cpf-cnpj-validator` for the digit-only branch
- Alphanumeric cross-validation deferred until a public reference implementation ships (`@brazilian-utils/brazilian-utils@2.3` does not yet support the new format)

### Recent reforms

- **2024-12-16** — IN RFB nº 2.229/2024 announces alphanumeric CNPJ.
- **2026-07-01** — Receita Federal begins issuing alphanumeric CNPJs to new registrations. Existing numeric CNPJs are not migrated.
- **`nationid` v0.5** — alphanumeric form supported; the regex, mask, normalization (uppercase + strip separators), and DV algorithm all handle the union of both forms.

### Open questions

- Confirm DV behaviour against the first batch of real alphanumeric CNPJs once Receita Federal begins publishing examples post-2026-07-01.
- Promote alphanumeric cross-validation from manual hand-traced fixtures to automated agreement with a third-party library once one ships v3 with alphanumeric support.

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

---

## `BR_PASAPORTE` — Passaporte

### Overview

Travel document issued by the Polícia Federal under the Ministério das
Relações Exteriores. Format is 2 uppercase letters + 6 digits (8 chars).
Common letter prefixes: `FA`..`FZ`, `GA`..

- **Issuer**: Polícia Federal — <https://www.gov.br/pf/pt-br>
- **Composition**: 2 letters + 6 digits
- **Visual format**: 8 contiguous chars

### Algorithm

None on the printed number. The MRZ field is the printed 8 chars right-padded
with one `<` filler; MRZ check digit lives in `algorithms/icao-9303.ts`.

### Confidence

`moderate` — consistent across KYC vendors; PF has not published a public
format spec.

### Sources

- Wikipedia, *Brazilian passport*: <https://en.wikipedia.org/wiki/Brazilian_passport>
- Polícia Federal: <https://www.gov.br/pf/pt-br>
