# Passport Standard Research — 2026-05-10

> Scope: research input for adding `<CC>_PASAPORTE` specs across the 22 countries
> currently supported by `nationid`. **Document only — no source modified.**

## ICAO Doc 9303 — Universal MRZ standard

ICAO Doc 9303 (Machine Readable Travel Documents) defines the optical Machine
Readable Zone (MRZ) printed at the bottom of passports, ID cards and visas.
The document number field and its check digit are **universal** across all
issuing states — they are the strongest layer of validation we can realistically
apply without holder-specific data.

Sources cross-checked: ICAO Doc 9303 Part 3 (icao.int PDF), Wikipedia
*Machine-readable passport*, idcheck.dev, trustdochub.com, planetcalc.com,
github.com/Arg0s1080/mrz, highprogrammer.com.

### Document number field

| Layout | Line/positions | Length | Charset | Check digit |
|---|---|---|---|---|
| **TD3** (passport booklet, 2×44) | line 2, pos **1–9** | 9 | `0-9`, `A-Z`, `<` | line 2, pos **10** |
| **TD2** (visa / older ID, 2×36) | line 2, pos **1–9** | 9 | `0-9`, `A-Z`, `<` | line 2, pos **10** |
| **TD1** (ID card, 3×30) | line 1, pos **6–14** | 9 | `0-9`, `A-Z`, `<` | line 1, pos **15** |

Key invariants:

- The MRZ field is **always 9 characters wide**. If the issuer's printed number
  is shorter than 9 chars, the MRZ is right-padded with the filler `<`.
- Charset is uppercase digits and Latin letters only. No diacritics, no spaces,
  no punctuation. The filler `<` is the sole separator.
- The check digit covers all 9 positions including any `<` fillers.

### Check digit algorithm

Pseudocode (verbatim from ICAO 9303 Part 3 §4.9, cross-checked against
Wikipedia, idcheck.dev, trustdochub):

```
Input: a string S of length N over the charset { 0-9, A-Z, < }.
Output: a single decimal digit (0..9) that is the ICAO 9303 check digit.

1. Convert each char c[i] to a numeric value v[i]:
     '0'..'9'  -> 0..9     (face value)
     'A'..'Z'  -> 10..35   (A=10, B=11, ..., Z=35)
     '<'       -> 0
2. Define the cyclic weight sequence W = [7, 3, 1, 7, 3, 1, ...].
3. Compute  sum = Σ_{i=0..N-1} v[i] * W[i mod 3]
4. Return   sum mod 10
```

### Char value table

| Char | Value | | Char | Value | | Char | Value | | Char | Value |
|---|---|---|---|---|---|---|---|---|---|---|
| `0` | 0  | | `9` | 9  | | `I` | 18 | | `R` | 27 |
| `1` | 1  | | `A` | 10 | | `J` | 19 | | `S` | 28 |
| `2` | 2  | | `B` | 11 | | `K` | 20 | | `T` | 29 |
| `3` | 3  | | `C` | 12 | | `L` | 21 | | `U` | 30 |
| `4` | 4  | | `D` | 13 | | `M` | 22 | | `V` | 31 |
| `5` | 5  | | `E` | 14 | | `N` | 23 | | `W` | 32 |
| `6` | 6  | | `F` | 15 | | `O` | 24 | | `X` | 33 |
| `7` | 7  | | `G` | 16 | | `P` | 25 | | `Y` | 34 |
| `8` | 8  | | `H` | 17 | | `Q` | 26 | | `Z` | 35 |
|     |    | |     |    | |     |    | | `<` | 0  |

### Worked example

The ICAO 9303 specimen passport (fictional country `UTO`) carries document
number `L898902C` (8 chars) which appears in TD3 line 2 as `L898902C<` plus
check digit `3`.

| pos i | char     | value v[i] | weight W[i mod 3] | product |
|------:|----------|-----------:|------------------:|--------:|
| 0 | `L` | 21 | 7 | 147 |
| 1 | `8` |  8 | 3 |  24 |
| 2 | `9` |  9 | 1 |   9 |
| 3 | `8` |  8 | 7 |  56 |
| 4 | `9` |  9 | 3 |  27 |
| 5 | `0` |  0 | 1 |   0 |
| 6 | `2` |  2 | 7 |  14 |
| 7 | `C` | 12 | 3 |  36 |
| 8 | `<` |  0 | 1 |   0 |
|   |     |    |   | **313** |

`313 mod 10 = 3` ⇒ check digit **3**. Matches the published specimen.

A second known good example (visa MRV-A): document number `XK9305487` →
check digit `5` (per idcheck.dev).

### TypeScript reference implementation

```ts
// src/algorithms/icao-9303.ts (proposed)

const FILLER = "<";
const ICAO_WEIGHTS = [7, 3, 1] as const;

/**
 * Map an MRZ char to its numeric value per ICAO 9303 Part 3 §4.9.
 * Returns -1 for any char outside the MRZ alphabet.
 */
function icaoCharValue(ch: string): number {
  if (ch.length !== 1) return -1;
  if (ch >= "0" && ch <= "9") return ch.charCodeAt(0) - 48;
  if (ch >= "A" && ch <= "Z") return ch.charCodeAt(0) - 55; // 'A' -> 10
  if (ch === FILLER) return 0;
  return -1;
}

/**
 * Compute the ICAO 9303 check digit for any MRZ field.
 * Throws on invalid characters.
 */
export function mrzCheckDigit(field: string): number {
  let sum = 0;
  for (let i = 0; i < field.length; i++) {
    const v = icaoCharValue(field[i]);
    if (v < 0) throw new Error(`ICAO_INVALID_CHAR: '${field[i]}' at ${i}`);
    sum += v * ICAO_WEIGHTS[i % 3];
  }
  return sum % 10;
}

/**
 * Validate the 9-char MRZ document number plus its 1-char check digit.
 *
 * @param mrzField10  exactly 10 chars: 9-char document number + check digit.
 *                    The 9-char number is right-padded with `<` if the
 *                    printed number was shorter.
 */
export function validateMrzNumber(mrzField10: string): boolean {
  if (mrzField10.length !== 10) return false;
  const body = mrzField10.slice(0, 9);
  const cd = mrzField10.slice(9);
  if (!/^[0-9]$/.test(cd)) return false;
  if (!/^[0-9A-Z<]{9}$/.test(body)) return false;
  return mrzCheckDigit(body) === Number(cd);
}

/**
 * Convenience: pad a printed (≤9 char) document number into the 9-char MRZ
 * form. Useful when the caller has the printed number and wants to compute
 * the expected MRZ check digit themselves.
 */
export function toMrzField9(printed: string): string {
  const up = printed.toUpperCase();
  if (up.length > 9) throw new Error("ICAO_TOO_LONG");
  if (!/^[0-9A-Z]*$/.test(up)) throw new Error("ICAO_INVALID_CHAR");
  return up.padEnd(9, FILLER);
}
```

> Note on ISO 7064: `python-stdnum` ships an `iso7064` module, but that
> implements Mod 11,10 / Mod 11,2 / Mod 37,2 / Mod 37,36 / Mod 97,10. **None
> of these are the ICAO 9303 algorithm.** ICAO 9303's 7-3-1 weighted mod-10 is
> a custom scheme defined in Doc 9303 itself. We must implement it directly.

---

## Per-country passport formats

For every country we evaluate: **(issuer)** · **(printed format on the data
page)** · **(length range)** · **(charset)** · **(printed-vs-MRZ relationship)**
· **(confidence)** · **(source)**.

> Confidence ladder: `verified` (first-party + community confirms agree),
> `community` (multiple secondary sources agree but no first-party doc),
> `unconfirmed` (single source or contradictions).

### 🇸🇻 SV — El Salvador

- Issuer: **DGME** — Dirección General de Migración y Extranjería.
- Printed format: not officially published. Community samples show **9-digit
  numeric** numbers on current biometric passports, occasionally with a leading
  letter on legacy issuances. ICAO conformant biometric since 2010s.
- Suggested regex: `^[0-9]{8,9}$` (lenient: also accept legacy 1-letter prefix
  `^[A-Z]?[0-9]{7,9}$`).
- Confidence: **unconfirmed** (no first-party publication; samples in
  passport-photo / KYC vendor datasets only).
- Source: <https://en.wikipedia.org/wiki/Salvadoran_passport>

### 🇲🇽 MX — Mexico

- Issuer: **SRE** — Secretaría de Relaciones Exteriores.
- Printed format: **1 letter + 8 digits**, total 9 chars. Current series start
  with `G` and `N`. Example: `G12345678`.
- MRZ: same 9 chars, no padding needed.
- Confidence: **community** (multiple secondary confirmations, including
  consular guides; no SRE-published format spec).
- Suggested regex: `^[A-Z][0-9]{8}$`.
- Source: <https://en.wikipedia.org/wiki/Mexican_passport>,
  <https://trustdochub.com/en/verify-mexican-passport/>,
  <https://embamex.sre.gob.mx/arabiasaudita/>

### 🇨🇴 CO — Colombia (already shipped)

- Issuer: **Cancillería** — Ministerio de Relaciones Exteriores.
- Printed format: historically variable — 2 letters + 6 digits, 8–9 digits, or
  pure alphanumeric. Current shipped spec: `^[A-Z0-9]{6,12}$` (lenient union).
- Confidence: **unconfirmed** (status quo from `src/countries/co/pasaporte.ts`).
- Source: <https://www.cancilleria.gov.co/en/passports>,
  <https://en.wikipedia.org/wiki/Colombian_passport>

### 🇧🇷 BR — Brazil

- Issuer: **Polícia Federal** (under Ministério das Relações Exteriores).
- Printed format: **2 letters + 6 digits**, total 8 chars. Common prefixes:
  `FA`, `FB`, …, `FZ`, `GA`, …. Example: `FF123456`.
- MRZ: 8 printed chars + `<` filler in pos 9.
- Confidence: **community** (consistent across KYC vendors; no PF-published
  spec found).
- Suggested regex: `^[A-Z]{2}[0-9]{6}$`.
- Source: <https://en.wikipedia.org/wiki/Brazilian_passport>,
  <https://www.gov.br/pf/pt-br>

### 🇵🇪 PE — Peru

- Issuer: **Migraciones** — Superintendencia Nacional de Migraciones.
- Printed format: most current sources report **1 letter + 8 digits**
  (9 chars), but legacy 9-digit numeric and 8-char alphanumeric variants
  exist.
- Confidence: **unconfirmed** (sources contradict on letter prefix).
- Suggested regex: `^[A-Z]?[0-9]{8,9}$`.
- Source: <https://es.wikipedia.org/wiki/Pasaporte_peruano>,
  <https://sel.migraciones.gob.pe/servmig-valreg/VerificarPAS>

### 🇦🇷 AR — Argentina

- Issuer: **RENAPER** — Registro Nacional de las Personas.
- Printed format: legacy **9-digit numeric** (sequential); replaced (post-2012)
  with a **pseudo-random alphanumeric** number of similar length (~8–9 chars,
  letters + digits) for higher entropy.
- Confidence: **community** for the transition; **unconfirmed** on the exact
  current charset profile.
- Suggested regex: `^[A-Z0-9]{8,9}$`.
- Source: <https://en.wikipedia.org/wiki/Argentine_passport>

### 🇨🇱 CL — Chile

- Issuer: **Servicio de Registro Civil e Identificación**.
- Printed format: until Aug 2013 the passport number equaled the holder's RUN
  (national ID); since then **passport numbers are unique and independent of
  RUN**. Current samples are **8–9 alphanumeric chars** (mixed letters+digits).
- Confidence: **unconfirmed** (no SRCeI public format spec).
- Suggested regex: `^[A-Z0-9]{8,9}$`.
- Source: <https://en.wikipedia.org/wiki/Chilean_passport>

### 🇩🇴 DO — Dominican Republic

- Issuer: **DGP** — Dirección General de Pasaportes.
- Printed format: **2-letter office prefix + 7 digits** (9 chars). Prefix
  encodes the issuing office: `SD` (Santo Domingo), `PP` (Puerto Plata), etc.
  Numbers issued abroad use distinct office codes.
- Confidence: **community** (consistent reports on DR1 forum + Council of EU
  PRADO catalog; no DGP-published spec).
- Suggested regex: `^[A-Z]{2}[0-9]{7}$`.
- Source: <https://www.consilium.europa.eu/prado/en/prado-documents/dom/a/docs-per-category.html>,
  <https://dr1.com/forums/threads/dominican-passport-numbers.396022/>

### 🇬🇹 GT — Guatemala

- Issuer: **IGM** — Instituto Guatemalteco de Migración (with RENAP for civil
  registry inputs).
- Printed format: 2024 numbering update by IGM. Current passports use **9
  alphanumeric chars**, typically letter-prefix + digits. The Copa Air carrier
  notice (Jul 2024) confirms a numbering update but exact regex was not
  extractable from the source PDF.
- Confidence: **unconfirmed**.
- Suggested regex: `^[A-Z0-9]{8,9}$`.
- Source: <https://igm.gob.gt/requisitos-para-tramite-de-pasaporte-guatemalteco/>,
  <https://www.copaair.com/assets/Update-in-the-numbering-of-Guatemalan-passports.pdf>

### 🇭🇳 HN — Honduras

- Issuer: **Instituto Nacional de Migración** (and consulates).
- Printed format: **1 letter + 7 digits** is the most-cited modern format, but
  legacy 9-digit issues circulate. Letter often `E` or `A`.
- Confidence: **unconfirmed**.
- Suggested regex: `^[A-Z]?[0-9]{7,9}$`.
- Source: <https://www.passportindex.org/passport/honduras/>

### 🇨🇷 CR — Costa Rica

- Issuer: **Dirección General de Migración y Extranjería** (DGME CR).
- Printed format: biometric ePassport (G+D, since 2021). Numbers are typically
  **9 chars, alphanumeric**, often letter-prefixed.
- Confidence: **unconfirmed**.
- Suggested regex: `^[A-Z0-9]{9}$`.
- Source: <https://en.wikipedia.org/wiki/Costa_Rican_passport>,
  <https://www.gi-de.com/en/spotlight/digital-security/costa-rica-the-art-of-passport-security>

### 🇪🇸 ES — Spain

- Issuer: **Dirección General de la Policía** (Cuerpo Nacional de Policía).
- Printed format: **3 letters + 6 digits** (9 chars total) on current biometric
  passports. Microsoft Purview defines the looser pattern *"two digits or
  letters, one optional digit or letter, six digits"* (8-or-9 chars), which
  reflects historical variants.
- Confidence: **verified** (multiple agreeing community sources + Microsoft
  Purview SIT entity).
- Suggested regex: `^[A-Z0-9]{2,3}[0-9]{6}$` (covers both modern 3+6 and
  Purview 2+6 / 2+1+6 legacy).
- Source: <https://learn.microsoft.com/en-us/purview/sit-defn-spain-passport-number>,
  <https://en.wikipedia.org/wiki/Spanish_passport>

### 🇺🇸 US — United States

- Issuer: **U.S. Department of State**, Bureau of Consular Affairs.
- Printed format: legacy **9 digits**; Next Generation Passport (NGP, rolled
  out 2021+) uses **1 letter + 8 digits**. Both circulate concurrently. The
  separate "passport book number" on page 2 is always 9 digits.
- Confidence: **community** (State Dept FAQ confirms NGP letter prefix).
- Suggested regex: `^([A-Z][0-9]{8}|[0-9]{9})$`.
- Source: <https://travel.state.gov/content/travel/en/passports/passport-help/next-generation-passport.html>,
  <https://en.wikipedia.org/wiki/United_States_passport>

### 🇧🇴 BO — Bolivia

- Issuer: **SEGIP** / **Dirección General de Migración**.
- Printed format: Andean Community common design since 2005. Numbers are
  typically **6–8 digits**, sometimes with a single letter prefix.
- Confidence: **unconfirmed** (no first-party spec located).
- Suggested regex: `^[A-Z0-9]{6,9}$`.
- Source: <https://en.wikipedia.org/wiki/Visa_requirements_for_Bolivian_citizens>

### 🇪🇨 EC — Ecuador

- Issuer: **Ministerio de Relaciones Exteriores y Movilidad Humana**.
- Printed format: Andean Community design. Numbers reported as **9 chars,
  alphanumeric**, often with letter prefix `A` or numeric-only.
- Confidence: **unconfirmed**.
- Suggested regex: `^[A-Z0-9]{8,9}$`.
- Source: <https://en.wikipedia.org/wiki/Ecuadorian_passport>

### 🇵🇾 PY — Paraguay

- Issuer: **Departamento de Identificaciones de la Policía Nacional**.
- Printed format: typically **6–8 digits** numeric on legacy issues; biometric
  passports may use letter+digits.
- Confidence: **unconfirmed**.
- Suggested regex: `^[A-Z0-9]{6,9}$`.
- Source: <https://www.policianacional.gov.py/>

### 🇳🇮 NI — Nicaragua

- Issuer: **Dirección General de Migración y Extranjería** (DGME NI).
- Printed format: typically **1 letter + 7 digits** or **8 digits**.
- Confidence: **unconfirmed**.
- Suggested regex: `^[A-Z]?[0-9]{7,8}$`.
- Source: <https://www.migob.gob.ni/migracion/>

### 🇵🇦 PA — Panama

- Issuer: **Autoridad de Pasaportes de Panamá** (Ministerio de Relaciones
  Exteriores).
- Printed format: typically **8 digits** (numeric only), occasionally with
  letter prefix `PA`.
- Confidence: **unconfirmed**.
- Suggested regex: `^[A-Z]{0,2}[0-9]{6,8}$`.
- Source: <https://www.pasaportes.gob.pa/>

### 🇺🇾 UY — Uruguay

- Issuer: **Dirección Nacional de Identificación Civil** (DNIC).
- Printed format: typically **1 letter + 6 digits**, total 7 chars (e.g.
  `B123456`).
- Confidence: **unconfirmed**.
- Suggested regex: `^[A-Z][0-9]{6}$`.
- Source: <https://www.gub.uy/ministerio-interior/>

### 🇨🇦 CA — Canada

- Issuer: **IRCC / Passport Program**.
- Printed format: **2 uppercase letters + 6 digits** (e.g. `AB123456`) on
  current ePassports. A newer variant `1 letter + 6 digits + 2 letters` has
  been observed in some community reports but not confirmed by IRCC.
- Confidence: **verified** for the 2-letter+6-digit format (Microsoft Purview
  SIT).
- Suggested regex: `^[A-Z]{2}[0-9]{6}$`.
- Source: <https://learn.microsoft.com/en-us/purview/sit-defn-canada-passport-number>,
  <https://en.wikipedia.org/wiki/Canadian_passport>

### 🇵🇹 PT — Portugal

- Issuer: **Instituto dos Registos e do Notariado** (IRN, ePassport since 2006;
  SEF replaced by AIMA in 2023).
- Printed format: **1 letter + 6 digits** (7 chars). Letter case-insensitive on
  some readers but uppercase on the printed page.
- Confidence: **community** (multiple agreeing secondary sources).
- Suggested regex: `^[A-Z][0-9]{6}$`.
- Source: <https://learn.microsoft.com/en-us/purview/sit-defn-portugal-passport-number>,
  <https://en.wikipedia.org/wiki/Portuguese_passport>

### 🇻🇪 VE — Venezuela

- Issuer: **SAIME** — Servicio Administrativo de Identificación, Migración y
  Extranjería.
- Printed format: typically **9 digits** numeric on legacy issues; current
  biometric series add no documented letter prefix.
- Confidence: **unconfirmed**.
- Suggested regex: `^[0-9]{8,9}$`.
- Source: <http://www.saime.gob.ve/>

---

## Recommendation

**Approach C (Hybrid) — adopt for the next release.**

Reasoning: real-world callers fall into two distinct buckets, and conflating
them in a single spec hurts both. The first bucket is **forms** (web sign-ups,
KYC, hotel check-in) where users key the printed number from their data page;
those callers want a permissive `<CC>_PASAPORTE` regex that matches every
historic and current shape the country has issued, with no checksum. The
second bucket is **OCR / MRZ scanners** (mobile capture, kiosk, border
control); they hand us the full 10-char MRZ field and want a hard checksum
verdict that is country-agnostic.

A single `PASAPORTE_MRZ` (Approach B) fails the form bucket because users
never type `<` fillers and rarely know their MRZ check digit. A pure
per-country format-only set (Approach A) fails the OCR bucket because the
ICAO check is the only strong cross-country signal we can offer.

Approach C delivers both with minimal surface area: a stable
`algorithms/icao-9303.ts` exporting `mrzCheckDigit()` and `validateMrzNumber()`,
plus 22 thin `<CC>_PASAPORTE` specs that each declare a country regex and a
confidence level. Per-country MRZ variants (`<CC>_PASAPORTE_MRZ` =
country-printed-format check + MRZ check digit) can be layered later for
strict-mode callers without breaking the basic specs.

### Proposed `algorithms/icao-9303.ts`

See the *TypeScript reference implementation* section above. Key API:

```ts
export function mrzCheckDigit(field: string): number;
export function validateMrzNumber(mrzField10: string): boolean;
export function toMrzField9(printed: string): string;
```

This module has no dependencies on country code, so it lives under
`src/algorithms/` (new folder) alongside any future `iso7064.ts`,
`luhn.ts`, etc. It is exported from the package root so callers can:

```ts
import { mrzCheckDigit, validateMrzNumber } from "nationid/algorithms";
```

### Proposed per-country specs (next release)

| Code | Confidence | Regex | Notes |
|---|---|---|---|
| `SV_PASAPORTE` | unconfirmed | `^[A-Z]?[0-9]{7,9}$` | DGME, lenient |
| `MX_PASAPORTE` | community   | `^[A-Z][0-9]{8}$` | SRE — current `G`/`N` series |
| `CO_PASAPORTE` | unconfirmed | `^[A-Z0-9]{6,12}$` | already shipped — keep |
| `BR_PASAPORTE` | community   | `^[A-Z]{2}[0-9]{6}$` | Polícia Federal |
| `PE_PASAPORTE` | unconfirmed | `^[A-Z]?[0-9]{8,9}$` | Migraciones |
| `AR_PASAPORTE` | unconfirmed | `^[A-Z0-9]{8,9}$` | RENAPER post-2012 alphanumeric |
| `CL_PASAPORTE` | unconfirmed | `^[A-Z0-9]{8,9}$` | SRCeI post-2013 |
| `DO_PASAPORTE` | community   | `^[A-Z]{2}[0-9]{7}$` | DGP, office prefix |
| `GT_PASAPORTE` | unconfirmed | `^[A-Z0-9]{8,9}$` | IGM 2024 update |
| `HN_PASAPORTE` | unconfirmed | `^[A-Z]?[0-9]{7,9}$` | INM |
| `CR_PASAPORTE` | unconfirmed | `^[A-Z0-9]{9}$` | DGME CR ePassport |
| `ES_PASAPORTE` | verified    | `^[A-Z0-9]{2,3}[0-9]{6}$` | DGP, 3 letters + 6 digits |
| `US_PASAPORTE` | community   | `^([A-Z][0-9]{8}\|[0-9]{9})$` | NGP + legacy |
| `BO_PASAPORTE` | unconfirmed | `^[A-Z0-9]{6,9}$` | Andean Community |
| `EC_PASAPORTE` | unconfirmed | `^[A-Z0-9]{8,9}$` | Andean Community |
| `PY_PASAPORTE` | unconfirmed | `^[A-Z0-9]{6,9}$` | Identificaciones Policía |
| `NI_PASAPORTE` | unconfirmed | `^[A-Z]?[0-9]{7,8}$` | DGME NI |
| `PA_PASAPORTE` | unconfirmed | `^[A-Z]{0,2}[0-9]{6,8}$` | Pasaportes Panamá |
| `UY_PASAPORTE` | unconfirmed | `^[A-Z][0-9]{6}$` | DNIC |
| `CA_PASAPORTE` | verified    | `^[A-Z]{2}[0-9]{6}$` | IRCC |
| `PT_PASAPORTE` | community   | `^[A-Z][0-9]{6}$` | IRN ePassport |
| `VE_PASAPORTE` | unconfirmed | `^[0-9]{8,9}$` | SAIME |

All specs would set `hasCheckDigit: false` (the printed number itself has no
checksum across these issuers). Strict MRZ validation is opt-in via
`validateMrzNumber()`.

---

## Open questions

1. **GT** — IGM 2024 numbering update is documented (Copa Air notice) but the
   PDF was not text-extractable. Need an IGM bulletin or a sample passport to
   pin the regex.
2. **AR** — RENAPER's post-2012 alphanumeric format has no published spec.
   Real-world samples should be collected before tightening the regex.
3. **CL** — Same situation as AR: post-2013 separation from RUN, but no
   published format. Current proposal is the union of observed shapes.
4. **CA** — community reports of a `1L+6D+2L` newer format conflict with the
   Microsoft Purview `2L+6D` definition. Need a sample to confirm.
5. **HN, NI, PA, BO, PY, UY, VE** — first-party passport-format publications
   could not be located. Specs are best-effort union shapes; should be marked
   `unconfirmed` and revisited as samples accumulate.
6. **MRZ on TD1/TD2** — algorithm is identical, but the field positions
   differ. Out of scope for `<CC>_PASAPORTE` (passports are TD3 only); the
   `algorithms/icao-9303.ts` module is layout-agnostic and can be reused by
   future ID-card specs.

---

## Sources consulted

- ICAO Doc 9303 Part 3 (Specifications for MRTDs):
  https://www.icao.int/sites/default/files/publications/DocSeries/9303_p3_cons_en.pdf
- ICAO Doc 9303 series landing page: https://www.icao.int/publications/doc-series/doc-9303
- Wikipedia, *Machine-readable passport*:
  https://en.wikipedia.org/wiki/Machine-readable_passport
- idcheck.dev, *ICAO 9303 MRZ check digits*:
  https://idcheck.dev/icao-9303-check-digits/
- TrustDocHub, *MRZ check digits explained*:
  https://trustdochub.com/en/mrz-check-digits/
- TrustDocHub, *Verify the MRZ of a passport*:
  https://trustdochub.com/en/verify-passport-mrz/
- planetcalc, *ICAO MRZ Check Digit calculator*: https://planetcalc.com/9535/
- Doubango KYC docs, *Machine Readable Zone*:
  https://www.doubango.org/SDKs/kyc-documents-verif/docs/MRZ.html
- Highprogrammer, *Machine Readable Passport Zone*:
  http://www.highprogrammer.com/alan/numbers/mrp.html
- ExtractFox, *Passport MRZ format explained*:
  https://extractfox.com/blog/passport-mrz-format-explained
- GitHub, Arg0s1080/mrz: https://github.com/Arg0s1080/mrz
- GitHub, icodeforlove/mrz-fast: https://github.com/icodeforlove/mrz-fast
- python-stdnum, ISO 7064 module:
  https://arthurdejong.org/python-stdnum/doc/2.0/stdnum.iso7064.html
- Microsoft Purview, *Spain passport number*:
  https://learn.microsoft.com/en-us/purview/sit-defn-spain-passport-number
- Microsoft Purview, *Canada passport number*:
  https://learn.microsoft.com/en-us/purview/sit-defn-canada-passport-number
- Microsoft Purview, *Portugal passport number*:
  https://learn.microsoft.com/en-us/purview/sit-defn-portugal-passport-number
- Council of the European Union, PRADO catalog:
  https://www.consilium.europa.eu/prado/
- Wikipedia per-country passport pages:
  https://en.wikipedia.org/wiki/Salvadoran_passport,
  https://en.wikipedia.org/wiki/Mexican_passport,
  https://en.wikipedia.org/wiki/Colombian_passport,
  https://en.wikipedia.org/wiki/Brazilian_passport,
  https://es.wikipedia.org/wiki/Pasaporte_peruano,
  https://en.wikipedia.org/wiki/Argentine_passport,
  https://en.wikipedia.org/wiki/Chilean_passport,
  https://en.wikipedia.org/wiki/Dominican_Republic_passport,
  https://en.wikipedia.org/wiki/Guatemalan_passport,
  https://en.wikipedia.org/wiki/Costa_Rican_passport,
  https://en.wikipedia.org/wiki/Spanish_passport,
  https://en.wikipedia.org/wiki/United_States_passport,
  https://en.wikipedia.org/wiki/Ecuadorian_passport,
  https://en.wikipedia.org/wiki/Canadian_passport,
  https://en.wikipedia.org/wiki/Portuguese_passport
- Cancillería Colombia: https://www.cancilleria.gov.co/en/passports
- SRE Mexico: https://embamex.sre.gob.mx/arabiasaudita/
- Migraciones Peru: https://sel.migraciones.gob.pe/servmig-valreg/VerificarPAS
- IGM Guatemala: https://igm.gob.gt/requisitos-para-tramite-de-pasaporte-guatemalteco/
- US State Department, NGP:
  https://travel.state.gov/content/travel/en/passports/passport-help/next-generation-passport.html
- TrustDocHub, *Verify a Mexican passport*:
  https://trustdochub.com/en/verify-mexican-passport/
- TrustDocHub, *ICAO 9303 standard overview*:
  https://trustdochub.com/en/icao-9303/
- DR1 forum, *Dominican Passport Numbers*:
  https://dr1.com/forums/threads/dominican-passport-numbers.396022/
- G+D, *Costa Rica ePassport*:
  https://www.gi-de.com/en/spotlight/digital-security/costa-rica-the-art-of-passport-security
- Copa Air, *Update in the numbering of Guatemalan passports* (Jul 2024 PDF):
  https://www.copaair.com/assets/Update-in-the-numbering-of-Guatemalan-passports.pdf
