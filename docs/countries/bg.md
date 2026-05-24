# Bulgaria (BG)

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|-----------|
| `BG_VAT` | tax | 9 (legal entity only in v1.7) | weighted mod-11 primary + fallback | high |

The spec ships under the tree-shakable subpath `nationid/bg`.

**Scope narrowing — v1.7 ships 9-digit legal-entity form only.** The
10-digit branch (sole proprietor with embedded EGN / PNF / synthetic
"other" number) is deferred to v1.8 alongside `BG_EGN`. See
[VERIFICATION §BG-1](../v1.7-eu-vat-research/VERIFICATION.md) and
"Open questions" below for the rationale.

---

## `BG_VAT` — Идентификационен номер по ДДС

### Overview

9-digit VAT identification number issued to every legal entity registered
for value-added tax in Bulgaria. The same numeric body coincides with
the entity's BULSTAT / EIK (unified identification code) maintained by
the Registry Agency, but `nationid` validates it through the NRA's
ЗДДС-defined check-digit algorithm rather than the BULSTAT register
lookup.

- **Issuer**: Национална агенция за приходите (NRA / NAP, National
  Revenue Agency) — <https://nra.bg/>
  ⚠️ NRA's TLS chain blocks programmatic CLI checks (self-signed
  intermediate exposed to non-browser UAs); browser-accessible.
  Wayback snapshot supplements: <https://web.archive.org/web/20241229140934/https://nra.bg/>
  ✓ live 2026-05-24
- **Statute**: Закон за данък върху добавената стойност (ЗДДС), чл. 94,
  обнародван ДВ бр. 63/2006 (consolidated text in subsequent amendments).
- **Composition**: `BG` + 9 digits.
- **Visual format**: `BG NNNNNNNNN` (single space after `BG`)

### Algorithm

Weighted mod-11 with a two-pass fallback. Apply primary weights
`[1, 2, 3, 4, 5, 6, 7, 8]` to the 8 body digits and reduce mod 11. If
the result equals 10, retry with fallback weights
`[3, 4, 5, 6, 7, 8, 9, 10]` and reduce mod 11 again. If *that* result
is also 10, the check digit is `0`; otherwise it equals the (latest)
result.

```
body8 = digits[0..7]
declared = digit[8]

r = (Σ primary_weights[i] · body8[i]) mod 11      for i in 0..7
if r == 10:
  r = (Σ fallback_weights[i] · body8[i]) mod 11   for i in 0..7
  if r == 10:
    r = 0
check = r
```

Worked re-derivation of the canonical anchor `BG100000001`:

```
body8         = 10000000
primary sum   = 1·1+2·0+3·0+4·0+5·0+6·0+7·0+8·0 = 1
1 mod 11      = 1                                ✓ matches trailing 1
```

A second worked example (`BG175074752`, from the research doc) where
the primary path also resolves without fallback:

```
body8         = 17507475
primary sum   = 1·1+2·7+3·5+4·0+5·7+6·4+7·7+8·5
              = 1+14+15+0+35+24+49+40 = 178
178 mod 11    = 2                                ✓ matches trailing 2
```

### Sources

- NRA (issuer root, browser-only TLS): <https://nra.bg/> ⚠️ SSL blocks
  programmatic; Wayback supplements:
  <https://web.archive.org/web/20241229140934/https://nra.bg/>
  ✓ live 2026-05-24
- Statute — ЗДДС full text via official gazette (the
  state-newspaper `lex.bg` mirror is intermittently blocked):
  consolidated text accessible via `nra.bg` legal section in browser.
  Canonical statute citation: **ЗДДС чл. 94, обн. ДВ бр. 63/2006**.
- VIES portal (EU cross-validation):
  <https://ec.europa.eu/taxation_customs/vies/> ✓ live 2026-05-24
- VAT Directive 2006/112/EC, art. 214:
  <https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32006L0112>
  ✓ live 2026-05-24
- Cross-validated against `python-stdnum.bg.vat`:
  <https://github.com/arthurdejong/python-stdnum/blob/master/stdnum/bg/vat.py>
  ✓ live 2026-05-24

(URL replacements made for this file: replaced the `lex.bg/laws/ldoc/...`
deep-link cited in older community write-ups with the canonical statute
citation `ЗДДС чл. 94, обн. ДВ бр. 63/2006` — `lex.bg` returns 403 to
non-browser UAs and is not re-publishable as a hard link. The `nra.bg`
root is verified via Wayback because the agency's TLS chain rejects
non-browser clients.)

### Synthetic test vectors

```
valid (legal-entity 9-digit, primary mod-11 path; shipped in
tests/countries/bg.test.ts):
  - BG100000001        (canonical anchor — VERIFICATION §BG)
  - BG177279873
  - BG114425763
  - BG604070571
  - BG788837196
  - BG607522220

invalid (10-digit sole-proprietor form deferred to v1.8):
  - BG1234567890       (Reason: too_long / invalid_format)

invalid (flipped check digit):
  - BG100000002        (Reason: invalid_checksum — correct check is 1)

invalid (checksum recomputed for parse() error mapping):
  - BG100000003        (Reason: invalid_checksum)
```

### Recent reforms

- **2007-01-01** — Bulgaria joins the EU; `BG` becomes a VIES member-state
  code on day one. Numbering range and algorithm unchanged from the
  domestic ЕИК / БУЛСТАТ form.
- **2008** — Migration to the unified BULSTAT/EIK register completes;
  the same numeric body now serves NRA, the Registry Agency, and
  Statistics. `nationid` validates through the NRA algorithm only —
  Registry Agency lookups are out of scope.
- **No format changes since accession.**

### Open questions

- **10-digit branch (sole proprietor)**. python-stdnum implements three
  fallbacks: EGN (Bulgarian personal number) → PNF (foreigner ID) →
  synthetic "other" with its own weighted check. v1.7 ships **none** of
  these; the EGN validator with its YYMMDD date checks and the +20/+40
  month offsets for pre-1900/post-2000 years belongs in the v1.8
  personal-ID batch alongside `BG_EGN`. Real Bulgarian sole-trader VAT
  numbers DO use this form, so this is a known coverage gap, not a
  defect — `validate("BG_VAT", "BG1234567890")` returns `false` by
  design.
- **`nra.bg` TLS chain**. The agency's certificate exposes a self-signed
  intermediate to non-browser UAs (curl, undici, Node native fetch).
  Browsers accept it via Bulgarian state-CA pre-loaded trust. Citation
  policy: link the issuer root, mark `⚠️ SSL blocks programmatic`, and
  supplement with a Wayback snapshot for any CI URL-health audit.

---

## Notes for consumers

- `nationid` performs **offline** checksum validation only. Confirming
  that a `BG_VAT` is currently active requires a VIES live call (or
  the NRA "Справки и услуги" service for domestic checks). See
  `examples/vies-check.ts` in the repository root.
- The 10-digit sole-proprietor form is **not** a `BG_VAT` in v1.7. If
  you handle Bulgarian sole traders, plan to upgrade to v1.8 when
  `BG_EGN` lands and the 10-digit fallback branches turn on. Until
  then, integrators commonly accept both forms with a permissive regex
  upstream of `nationid` and re-validate only the 9-digit subset.
- The numeric body of `BG_VAT` coincides with the entity's BULSTAT/EIK,
  which under Bulgarian law is **public** (Registry Agency publishes
  it). It is not PII in the same sense as EGN — but the 10-digit
  sole-trader form, when it ships in v1.8, WILL embed PII (EGN/PNF) and
  must be handled through `nationid/pii` masking. See
  [`docs/PII_GUIDANCE.md`](../PII_GUIDANCE.md).
