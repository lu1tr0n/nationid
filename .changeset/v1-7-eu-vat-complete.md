---
"nationid": major
---

# v2.0.0 — EU-VAT complete: 17 new countries

Sixteen EU member states and one EEA participant ship their VAT validators
in a single batched release. Every spec carries a first-party citation
verified live and (where applicable) cross-validated against
`python-stdnum`.

## New specs (17)

| Code      | Country | Confidence | Algorithm |
|-----------|---------|------------|-----------|
| `IE_VAT`  | 🇮🇪 Ireland | high | mod-23 letter check (PPS family) |
| `AT_UID`  | 🇦🇹 Austria | high | Luhn-variant mod-10 (`ATU` prefix) |
| `LU_VAT`  | 🇱🇺 Luxembourg | high | `body6 mod 89` |
| `GR_VAT`  | 🇬🇷 Greece | high | iterative `s = s*2 + d`, mod 11 (VIES prefix `EL`) |
| `CZ_DIC`  | 🇨🇿 Czechia | high | weighted mod-11 (legal-entity 8-digit branch) |
| `HU_VAT`  | 🇭🇺 Hungary | high | weighted mod-10 `[9,7,3,1,9,7,3,1]` |
| `RO_VAT`  | 🇷🇴 Romania | high | pad-to-9 weighted mod-11 (variable 2–10 body) |
| `BG_VAT`  | 🇧🇬 Bulgaria | high | primary + fallback mod-11 (9-digit legal entity) |
| `HR_OIB`  | 🇭🇷 Croatia | high | ISO/IEC 7064 MOD 11,10 |
| `SK_VAT`  | 🇸🇰 Slovakia | high | 10-digit divisible by 11 |
| `SI_VAT`  | 🇸🇮 Slovenia | high | weighted mod-11 with `10→0` |
| `LT_VAT`  | 🇱🇹 Lithuania | high | primary + fallback mod-11 (9 or 12-digit) |
| `LV_VAT`  | 🇱🇻 Latvia | moderate | weighted mod-11 (legal entity); natural-person branch unconfirmed |
| `EE_VAT`  | 🇪🇪 Estonia | high | weighted mod-10 `[3,7,1,3,7,1,3,7,1]` |
| `MT_VAT`  | 🇲🇹 Malta | high | weighted mod-37 |
| `CY_VAT`  | 🇨🇾 Cyprus | high | positional translation table + mod-26 letter |
| `IS_VSK`  | 🇮🇸 Iceland | moderate | format-only (EEA, NOT in VIES) |

## New algorithm primitive

- `nationid/algorithms` now exports `mod11_10CheckDigit` and
  `mod11_10Valid` — ISO/IEC 7064 MOD 11,10 (length-generic). Used by
  `HR_OIB`, `DE_STEUER_ID`, `DE_USTID`. The implementation was hoisted
  out of the DE specs so multiple countries share one canonical helper.

## Scope narrowings (intentional, documented in v1.7-eu-vat-research/VERIFICATION.md)

- **`CZ_DIC`** — 8-digit legal-entity branch only. The 9-digit "special
  natural person" branch and the 10-digit RČ (rodné číslo) branch require
  a Czech date validator with the +50/+20 month offsets; both defer to
  a future release alongside `CZ_RC`.
- **`BG_VAT`** — 9-digit legal-entity branch only. The 10-digit sole-
  proprietor branch (EGN / PNF / other) depends on an EGN validator that
  doesn't exist yet; defer to a future release alongside `BG_EGN`.
- **GB Northern Ireland `XI` prefix** — out of scope for v2.0; ships in
  a follow-up release as a `GB_VAT` variant under the Windsor Framework.

## Greek `EL` / `GR` prefix handling

The #1 historical EU-VAT bug. Implementation accepts both `EL` and `GR`
prefixes on input, normalises to `EL` (the canonical VIES form), but
keeps the spec's `country: "GR"` field. The cross-vat test asserts this
contract.

## Governance

- 19 new domains added to the issuer allowlist in
  `tests/governance/confidence-citations.test.ts` (Austria's `gv.at` TLD
  was a P0 blocker — added a dedicated regex `/(?:^|\.)gv\.at$/i`).
- 14 new statute patterns: EU Directive 2006/112/EC, Council Regulation
  (EU) No 904/2010, plus per-country statute regexes (Sb./Z.z./Νόμος /
  Lög nr. / Zakon o / etc.).
- `web.archive.org` added as a supplementary citation domain — paired with
  statute citations for sites whose programmatic access is blocked
  (e.g. BG NRA self-signed TLS cert).

## URL audit (verified live 2026-05-24)

Every source URL in the 17 new spec JSDocs was live-checked with
`browser_fetch` (firefox133 TLS impersonation). Three broken URLs were
replaced with verified issuer-roots before publish (`bmf.gv.at/services/uid.html`
→ `bmf.gv.at`; `pfi.public.lu/.../identification-tva.html` →
`pfi.public.lu/fr.html`; `nra.bg` SSL cert → Wayback snapshot).

## Test surface

- 17 new test files (`tests/countries/{ie,at,lu,gr,cz,hu,ro,bg,hr,sk,si,lt,lv,ee,mt,cy,is}.test.ts`)
- 6 valid synthetic vectors per country (canonical anchor + 5 machine-generated, each independently validated) + 3+ negatives per spec
- Property-test arbitraries updated for all 17 codes
- All 17 canonical anchor vectors validated via smoke test against the dist build before commit

## Coverage delta

35 → 52 countries · ~125 → ~145 document codes · tarball ~3.0 MB
unpacked (+~120 KB).
