# Brasil (BR)

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|-----------|
| `BR_CPF` | personal | 11 | double mod-11 | high |
| `BR_CNPJ` | tax | 14 | double mod-11 | high |

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
