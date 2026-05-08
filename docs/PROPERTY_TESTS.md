# Property-based test report

Property-based test suite added 2026-05-08 under `tests/property/`. The suite
exercises 10 universal invariants (P1-P10) across every `DocumentTypeCode`
registered at runtime. See `tests/property/_arbitraries.ts` for the shared
generators and the global seed (`PROPERTY_TEST_SEED = 0x6e6164_6964`).

| Property | File | Trials × specs |
|----------|------|----------------|
| P1 normalize idempotent | `normalize.test.ts` | 100 × 34 |
| P2 parse/validate consistent | `parse-validate-consistency.test.ts` | 100 × 34 |
| P3 success-branch invariants | `parse-success-invariants.test.ts` | 100 × 34 |
| P4 typed parse error reasons | `parse-validate-consistency.test.ts` | 100 × 34 |
| P5 format round-trip stable | `format-stability.test.ts` | 100 × 34 |
| P6 normalize after format | `normalize.test.ts` | 100 × 34 |
| P7 whitespace resilience | `whitespace-resilience.test.ts` | 100 × 34 |
| P8 invalid implies !parse.ok | `parse-validate-consistency.test.ts` | 100 × 34 |
| P9 registry self-consistency | `registry-self-consistency.test.ts` | finite |
| P10 mask/format alignment | `mask-format-alignment.test.ts` | 100 × 34 |

Total invariant evaluations per CI run: ~32,300.

---

## Failing properties — open findings

### F-PROP-001 — `CO_CC` mask diverges from formatter output (P10)

| Field | Value |
|-------|-------|
| Spec | `CO_CC` (`src/countries/co/cc.ts`) |
| Property | P10 — mask substitution alignment |
| File | `tests/property/mask-format-alignment.test.ts` |
| fast-check seed | `1633970532` (vitest-injected) AND fixed `PROPERTY_TEST_SEED = 0x6e6164_6964` (`tests/property/_arbitraries.ts`) |
| fast-check path | `0:0:0:0:0:0:0:0:0:0` |
| Shrunk counter-example | `"0000000000"` |
| Reproduces in code | `getSpec("CO_CC").format("0000000000") === "0.000.000.000"` (≠ input) |
| Verified against code review | Independently — manual scan with 500 random mask substitutions yields 500/500 mismatches whenever the substituted string is non-empty and 6-10 digits. |

**Plain-English explanation.**

The `CO_CC` spec advertises the storage form via `mask: "0000000000"` (ten
digits, no separators) but its `format()` always inserts thousands separators
(`"5555555555" → "5.555.555.555"`). Property P10 asserts that, when a
mask-substituted string validates, the formatter must be the identity on it
(otherwise the mask is misleading consumers about the canonical display
shape). The mask string and the formatter are not aligned.

Two equally-defensible fixes; both are out-of-scope for this property-test
agent and triaged to the orchestrator:

1. **Update the `mask`** to reflect the formatted display form, e.g.
   `"0.000.000.000"`, and let UI consumers strip separators to derive the
   storage form (the convention already used by `CL_RUT`, `BR_CPF`, `SV_DUI`).
2. **Update `format()`** to be the identity on already-normalized 10-digit
   storage form and only insert separators when the user supplied a
   non-canonical string. This contradicts the spec's documented behaviour
   in the source comments ("Display often uses thousands separators … but
   storage is digits-only") so option 1 is more consistent with the rest of
   the registry.

The corresponding ADR should also revisit `CO_TI` (mask `"00000000000"`,
formatter is identity — consistent) and `CO_CE` / `CO_PASAPORTE` (mask is
identity-formatted — consistent) to confirm CO_CC is the only outlier.

**Reproduction.** From the repo root:

```sh
pnpm test --run tests/property/mask-format-alignment.test.ts
```

The failure shrinks deterministically to `["0000000000"]` because every
mask-substituted CO_CC input of length 6-10 triggers the divergence.

---

## Notes on generator design

`tests/property/_arbitraries.ts` reuses every applicable cross-validation
generator from `tests/cross-validation/_helpers.ts` (P5 BR_CPF / BR_CNPJ /
PE_RUC / PE_DNI / DO_CEDULA / DO_RNC / GT_NIT / CR_CEDULA_FISICA / CR_CEDULA_JURIDICA
/ ES_DNI / ES_NIE / ES_NIF_PJ / US_SSN / US_ITIN / US_EIN / MX_CURP / MX_RFC_PF /
MX_RFC_PM / AR_CUIT / CL_RUT / CO_NIT). New generators added locally for the
remaining 13 codes that had no cross-validation helper:

| Code | Generator | Approach |
|------|-----------|----------|
| `SV_DUI` | `generateValidSvDuis` | 8 random digits + computed mod-10 DV |
| `SV_NIT` | `generateValidSvNits` | 13 random digits + computed mod-11 DV (weights 14..2) |
| `AR_DNI` | `generateValidArDnis` | 7-8 random digits, no checksum |
| `AR_CUIL` | `generateValidArCuils` | ANSES prefixes {20,23,24,27} + computed CUIT-style DV (skips dv=10) |
| `CO_CC` | `generateValidCoCcs` | 6-10 random digits |
| `CO_CE` | `generateValidCoCes` | 6-8 random digits |
| `CO_TI` | `generateValidCoTis` | 10-11 random digits |
| `CO_PASAPORTE` | `generateValidCoPasaportes` | 6-12 alphanumeric |
| `GT_DPI` | `generateValidGtDpis` | 8-digit body with mod-11 DV (skips dv=10) + 4 trailing |
| `HN_DNI` | `generateValidHnDnis` | dept 01-18 + 2 muni + year 1900-2099 + 5 correlativo |
| `HN_RTN` | `generateValidHnRtns` | 14 random digits, rejecting all-same |
| `CR_DIMEX` | `generateValidCrDimexes` | 11-12 random digits |
| `PE_CE` | `generateValidPeCes` | 9-12 random digits |

All generators are deterministic given a fixed seed; the seed is derived from
a unique `PROP_<CODE>` label so every code gets an independent stream. No
cross-validation helper RNG seed was reused, keeping the existing 3,314-test
baseline byte-for-byte stable.

## Reproducibility

The fixed seed `PROPERTY_TEST_SEED = 0x6e6164_6964` is passed to every
`fc.assert(...)` invocation. Bumping it is the recommended way to rotate the
input space (e.g. before a v0.2 audit pass).
