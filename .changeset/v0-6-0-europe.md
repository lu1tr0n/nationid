---
"nationid": minor
---

v0.6.0 — Europe expansion: 12 new countries, 36 new document codes.

### New countries

🇬🇧 United Kingdom · 🇫🇷 France · 🇩🇪 Germany · 🇮🇹 Italy · 🇳🇱 Netherlands · 🇧🇪 Belgium · 🇨🇭 Switzerland · 🇵🇱 Poland · 🇸🇪 Sweden · 🇳🇴 Norway · 🇩🇰 Denmark · 🇫🇮 Finland

### High-confidence specs (most are checksum-verified)

| Country | Specs |
|---------|-------|
| GB | `GB_VAT` (mod-97), `GB_NHS` (mod-11), `GB_UTR`, `GB_NINO` |
| FR | `FR_NIR` (mod-97 with Corsica branch), `FR_SIREN`/`FR_SIRET` (Luhn + La Poste exception), `FR_TVA` |
| DE | `DE_STEUER_ID` (ISO/IEC 7064 MOD 11,10), `DE_USTID` (mod-11), `DE_STEUERNUMMER` (format-only) |
| IT | `IT_CF` (16-char alphanumeric with homocodia handling), `IT_PIVA` (Luhn) |
| NL | `NL_BSN` (eleven-test), `NL_BTW` (BSN or ISO 7064 MOD 97-10) |
| BE | `BE_NRN` (mod-97 with century branch + DOB sanity), `BE_BTW` (mod-97) |
| CH | `CH_AHV` (EAN-13), `CH_UID` (mod-11), `CH_MWST` |
| PL | `PL_PESEL` (mod-10 + DOB sanity), `PL_NIP` (mod-11), `PL_REGON` (mod-11 9 + 14-digit) |
| SE | `SE_PERSONNUMMER` (Luhn + samordningsnummer), `SE_ORGNR` (Luhn), `SE_VAT` |
| NO | `NO_FNR`/`NO_DNR` (dual mod-11), `NO_ORGNR` (mod-11), `NO_MVA` |
| DK | `DK_CPR` (format + DOB plausibility, modulus check abolido 2007 — `cprMod11Legacy()` helper opt-in), `DK_CVR` (mod-11), `DK_VAT` |
| FI | `FI_HETU` (mod-31 with 2023 century separators), `FI_YTUNNUS` (mod-11), `FI_VAT` |

### Subpath imports

```ts
import { validate } from "nationid/gb"; validate("VAT", "GB123456789");
import { validate } from "nationid/fr"; validate("SIREN", "732829320");
import { validate } from "nationid/de"; validate("STEUER_ID", "47036892816");
import { validate } from "nationid/it"; validate("CF", "RSSMRA85T10A562S");
// ...same pattern for /nl, /be, /ch, /pl, /se, /no, /dk, /fi
```

### Catalog metadata

All 36 new specs ship with full localized metadata (`displayName` + `longName` + `description` × 3 locales = 108 hand-written entries) — `listDocuments("DE", "es")`, `getDocumentInfo("PL_PESEL", "en")`, etc. work out of the box. Spanish + Portuguese strings reviewed for orthography (tildes, ñ, ç, ã, ø, å).

### Quality

- **6,377 tests passing** (+468 from v0.5.0)
- Lint clean (262 files), typecheck clean, build clean (DTS for all entry points)
- Cross-validation: PT_NIF agrees with `validator.js isTaxID('pt-PT')`; CA_SIN matches Luhn `isIdentityCard('en-CA')`; FR/DE/IT/NL/PL specs validated against `python-stdnum` reference algorithms
- Bundle: full registry now 16.46 KB gzip (was 10.9 KB v0.5, budget 45 KB)
- Per-country bundles all under 4 KB

### Bugs caught against research file

While implementing, agents flagged 1 incorrect synthetic in research:
- **FR_NIR**: research example `1 85 02 75 116 003 87` did not satisfy mod-97 (real clé is `09`). Library follows the algorithm and ships re-derived synthetic fixtures.

Plus 4 deliberate algorithmic refinements:
- FR_NIR sex-digit set extended to `[12378]` (covers INSEE temp-assignment codes 7/8)
- FR_SIRET adds the documented La Poste exception (digit-sum mod 5 for SIREN `356000000`)
- BE_NRN adds DOB plausibility check beyond mod-97
- IT_CF tolerates Agenzia delle Entrate's letter substitutions (`L,M,N,P,Q,R,S,T,U,V` mapping for digits 0–9) used to disambiguate homocodia

### Migration

No breaking changes. v0.5.0 consumers keep working. The 12 new countries + 36 new specs are additive — `listSupportedCodes()` returns 36 more codes.

### Coverage summary post-v0.6

- **34 countries × ~120 document codes** (was 22 × 81 in v0.5)
- 30+ high-confidence checksum specs added (mod-11, mod-97, Luhn, EAN-13, ISO/IEC 7064)
- Solid foundation for KYC across LATAM + Europe + North America

### Roadmap

- **v0.7** — Asia: IN, CN, JP, KR, SG, HK, TW + AU, NZ, ZA, IL
- **v0.8** — `@nationid/react` companion + additional i18n locales
- **v1.0** — API stability
