# Third-party algorithm credits

`nationid` ships zero runtime dependencies. The check-digit algorithms it
implements, however, were informed by reading official sources cross-referenced
against the open-source projects listed below. We re-implement every algorithm
from scratch in TypeScript (algorithms are mathematics and are not copyrightable);
this file exists so authors of those projects are credited and so users can audit
where each algorithm came from.

For the per-document official source (issuer publication, royal decree, BOE,
RG, etc.), see the JSDoc header of each spec file under `src/countries/<cc>/`
and the `## References` section of each `docs/countries/<cc>.md` page.

---

## Reference projects

### `validator.js`

- npm: <https://www.npmjs.com/package/validator>
- License: MIT
- Used as cross-validation for: ES_DNI, ES_NIE, ES_NIF_PJ, AR_CUIT.

### `cpf-cnpj-validator`

- npm: <https://www.npmjs.com/package/cpf-cnpj-validator>
- License: MIT
- Used as cross-validation for: BR_CPF, BR_CNPJ.

### `@brazilian-utils/brazilian-utils`

- npm: <https://www.npmjs.com/package/@brazilian-utils/brazilian-utils>
- License: MIT
- Used as cross-validation for: BR_CPF, BR_CNPJ.

### `rut.js`

- npm: <https://www.npmjs.com/package/rut.js>
- License: MIT
- Used as cross-validation for: CL_RUT.

### `python-stdnum`

- Home: <https://arthurdejong.org/python-stdnum/>
- License: **LGPL-2.1-or-later**
- Algorithms in `python-stdnum` were read for cross-validation only. The Python
  source code is **NOT** copied, transpiled, or adapted into this MIT-licensed
  project. Mathematical algorithms (weight vectors, modulus, dispatch tables
  published by official issuers) are not copyrightable and were re-implemented
  in TypeScript from the same primary sources `python-stdnum` cites.
- Cross-validation for: BR, CL, CO, CR, DO, ES, GT, MX, PE, SV, US.

### `iso-7064` / `cdigit`

- npm: <https://www.npmjs.com/package/iso-7064>, <https://www.npmjs.com/package/cdigit>
- License: MIT
- Used as a reference for ISO 7064 mod-11-2 / mod-97-10 implementations
  (relevant to potential v0.3 European document additions). Not currently
  imported.

### `mrz`

- npm: <https://www.npmjs.com/package/mrz>
- License: MIT
- Out of scope for v0.1 (no MRZ documents shipped); listed for future
  reference if `nationid` adds passport MRZ parsing in v0.3+.

---

## Official issuer sources

Algorithms in this library were re-implemented from these primary sources.
The corresponding JSDoc header in each spec file links to the page consulted.

| Country | Issuer | Publication consulted |
|---------|--------|------------------------|
| 🇸🇻 SV | RNPN, DGII (Hacienda) | RNPN public DUI structure; DGII catálogo CAT-022 (DTE) |
| 🇲🇽 MX | RENAPO, SAT | RENAPO `Instructivo CURP`; SAT `Anexo 1-A` for RFC homoclave |
| 🇨🇴 CO | DIAN, Registraduría | DIAN Resolución 12761/2011 (NIT DV); Registraduría tarjeta CC |
| 🇧🇷 BR | Receita Federal | IN RFB sobre CPF; IN RFB sobre CNPJ |
| 🇵🇪 PE | RENIEC, SUNAT | RENIEC formato DNI; SUNAT documentación RUC |
| 🇦🇷 AR | ARCA (ex-AFIP) | RG AFIP 10/1997 (CUIT/CUIL DV) |
| 🇨🇱 CL | SII, Registro Civil | DFL 3/1969 (RUN); SII RUT |
| 🇩🇴 DO | JCE, DGII | JCE estructura cédula; DGII formato RNC |
| 🇬🇹 GT | RENAP, SAT | RENAP DPI; SAT NIT |
| 🇭🇳 HN | RNP, SAR | RNP DNI; SAR RTN |
| 🇨🇷 CR | TSE, Hacienda | TSE cédula física; Hacienda cédula jurídica |
| 🇪🇸 ES | DGP, AEAT | Real Decreto 1553/2005 (DNI letter); Orden INT/2058/2008 (NIE); AEAT instructions for NIF Persona Jurídica |
| 🇺🇸 US | SSA, IRS | SSA SSN randomization & invalid ranges; IRS Pub 1635 (EIN); IRS ITIN ranges |

---

## License compatibility

This project is MIT-licensed. The libraries above whose code we cross-checked
against are MIT-licensed, except `python-stdnum` (LGPL-2.1+). To preserve our
MIT license, no `python-stdnum` Python code was copied or adapted; its
algorithms were re-implemented from the same primary sources it cites.

If you believe an attribution is missing, please open an issue.
