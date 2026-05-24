# Iceland (IS)

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|-----------|
| `IS_VSK` | tax | 5 or 6 digits | none (no checksum published) | moderate |

Ships under the tree-shakable subpath `nationid/is` and under the
EU-wide aggregator `nationid/vat` (as an EEA bonus — Iceland is **not**
in EU VIES, see below).

---

## `IS_VSK` — Virðisaukaskattsnúmer (VAT Registration Number)

### Overview

Icelandic VAT registration number issued by Skatturinn (Iceland
Revenue and Customs, formerly Ríkisskattstjóri / RSK). VSK
(*Virðisaukaskattur*) is the Icelandic acronym for Value Added Tax;
the number itself is a short sequential allocation rather than an
algorithmically-checked identifier. Iceland is in the European
Economic Area (EEA) and applies a VAT regime closely modelled on the
EU VAT Directive, but is **not** an EU member state and is **not** a
participant in the EU VAT Information Exchange System (VIES). The
`IS` prefix is therefore an internal convention of this library and
external KYC tools, **not** a VIES country code.

- **Issuer**: Skatturinn (Iceland Revenue and Customs) —
  <https://www.skatturinn.is/> ✓ live 2026-05-24 (pre-audit)
- **Statute**: `Lög nr. 50/1988 um virðisaukaskatt` — the Icelandic
  VAT Act, binding authority published in the Althingi gazette.
- **Composition**: 5 or 6 digits. No country prefix in the canonical
  form; the bare digit string is the official representation. Some
  invoice templates informally prepend `IS` for symmetry with EU VAT
  numbers, and the library accepts that input shape on normalize.
- **Visual format**: `123456` (single block — no grouping, no
  separators).

### Algorithm

**Format-only.** Skatturinn does not publish a check-digit algorithm
for VSK because there isn't one — the number is allocated
sequentially. The validator therefore enforces only:

```
raw = stripNonDigits(input)
raw matches /^\d{5,6}$/
```

`python-stdnum` performs the same length + digits check via its
`stdnum/is_/vsk.py` module (the trailing underscore in the directory
name is a Python keyword workaround — `is` is reserved — and has no
bearing on `nationid`'s use of `is` as the ISO 3166-1 alpha-2
country directory).

Confidence: **moderate**. There is no algorithm to fail, so `high`
defensibility (which the governance test specifically gates on
checksum-bearing specs with first-party algorithm citations) is not
applicable. The spec header at `src/countries/is/vsk.ts` discloses
this explicitly: format-only validation, no checksum, EEA-not-VIES.

### Sources

- Skatturinn (issuer root):
  <https://www.skatturinn.is/> ✓ live 2026-05-24 (pre-audit)
- Skatturinn — VSK (business / self-employed section):
  <https://www.skatturinn.is/atvinnurekstur/virdisaukaskattur/> ✓ live 2026-05-24
- Skatturinn — English landing for companies:
  <https://www.skatturinn.is/english/companies/> ✓ live 2026-05-24
- Statute (binding authority) on Althingi — consolidated text of
  `Lög nr. 50/1988 um virðisaukaskatt`:
  <https://www.althingi.is/lagas/nuna/1988050.html> ✓ live 2026-05-24
- Cross-validated against `python-stdnum` (`stdnum.is_.vsk`):
  <https://github.com/arthurdejong/python-stdnum/blob/master/stdnum/is_/vsk.py> ✓ live 2026-05-24
- VIES: **not applicable** — Iceland is EEA but not a VIES
  participant. Cross-border VAT verification queries against `IS`
  return `MS_NOT_SUPPORTED`.

### Synthetic test vectors

```
valid (5 or 6 digits — all such inputs pass format-only):
  - 12345
  - 123456
  - 54321
  - 999999
  - 11111
  - 100000

invalid (too short):
  - 1234        (4 digits — `too_short`)

invalid (too long):
  - 1234567     (7 digits — `too_long`)
  - IS0062199   (7 digits after IS-strip — `too_long`)

invalid (non-digits, no digits at all):
  - ABCDE       (`invalid_format`)
```

Behavioural notes (verified in the shipping test suite):

- `normalize("VSK", "123 456") === "123456"` — separators stripped.
- `normalize("VSK", "12345A") === "12345"` — non-digit suffix
  stripped before length check; the result `12345` then validates as
  5 digits. This is a deliberate consequence of using `stripNonDigits`
  rather than rejecting on alphanumeric input.
- `parse("VSK", "123456").confidence === "moderate"` on success —
  the moderate tier is propagated from the spec into the parse result.

### Recent reforms

- **2010** — Skatturinn formed from the merger of Ríkisskattstjóri
  (RSK) and other revenue functions; the VSK numbering scheme is
  inherited unchanged from RSK's 1988 issuance regime.
- **Lög nr. 50/1988** has been amended many times since enactment,
  but the VAT number format has not changed: still 5 or 6 sequential
  digits without an embedded checksum.

### Open questions

- Whether to ship the Icelandic *kennitala* (10-digit personal +
  business identifier with a published ISO/IEC 7064-style check digit)
  in a future release. Kennitala is the higher-utility Icelandic
  document for KYC purposes; it belongs in the v1.8 personal-ID batch
  rather than the VAT batch. VSK ships in v1.7 for completeness of the
  EU/EEA VAT surface.

---

## Notes for consumers

- `IS_VSK` is **format-only**. A passing `validate("IS_VSK", x)`
  result asserts only that `x` *looks like* a VSK — 5 or 6 digits.
  It does **not** assert that the number was issued, is active, or
  matches a real taxpayer. Downstream KYC flows that need stronger
  guarantees must contact Skatturinn directly; there is no VIES-style
  cross-border lookup for `IS`.
- Iceland is **EEA but not in EU VIES**. Do not pass an `IS` VAT
  number to the VIES SOAP/REST endpoint — it will return
  `MS_NOT_SUPPORTED`. The `examples/vies-check.ts` recipe in this
  repository explicitly excludes `IS`.
- The `is_` directory name in `python-stdnum` is a Python keyword
  workaround (`is` is reserved in Python). `nationid` uses the plain
  ISO 3166-1 alpha-2 directory `is` at `src/countries/is/`; the
  rename is purely a host-language artefact and not a fork or
  divergence from upstream.
- For higher-confidence Icelandic identifier validation, use the
  future `IS_KENNITALA` spec when it ships in v1.8 — kennitala
  carries a published mod-11 check digit and is the canonical
  identifier for both natural and legal persons in Iceland.
