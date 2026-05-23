# v1.1 Functional Audit — Documentation

## Score: 8/10

`nationid` v1.1 ships a **very good** documentation set that is unusually consistent across three languages, has near-complete JSDoc on every public surface, and pairs every country's runtime spec with a markdown reference that cites first-party sources. The library reads like the work of someone who actually maintains documentation as part of the API contract — JSDoc has been written deliberately, the README leads with a one-line summary, and citations match the governance test's confidence tiers.

The 2-point deduction is for **specific, fixable accuracy bugs** that a careful reader will hit immediately: the English README still says "all 22 countries" three sections below the table that lists 34; the root `getSpec` JSDoc example prints a `confidence` value (`"structural"`) that does not exist in the `Confidence` type; the `nationid/i18n` JSDoc example calls `r.error` when the public type names that field `r.reason`; MIGRATION.md references "v0.1 covers numeric CNPJ" although v0.5 shipped CNPJ alphanumeric and v1.0 declared API stability; and the v1.1 country catalog has no dedicated "What's new" section in any locale even though it is the headline feature of the release. These are exactly the issues that erode trust because they appear in the first 200 lines of the canonical entry points.

## What works well

- **Three-language README parity is unusually high.** Structurally identical: same H2 ordering, same example sets, same Coverage / Confidence / Comparison / Roadmap sections. Only one numeric drift bug (see Critical §1).
- **Every public function has a complete JSDoc block** with `@param`, `@returns`, `@throws`, and a runnable `@example`. This is not common in TS libraries of this scope.
- **Per-country docs are structurally identical.** All 34 countries follow the `_template.md` pattern: Documents table, per-document Overview / Algorithm / Sources / Synthetic test vectors. New maintainers can copy the template literally.
- **Citation discipline matches the runtime confidence tier.** Spot-checked 5 specs: MX_CURP (high) cites RENAPO + DOF, BR_CPF (high) cites Receita Federal + Lei 4.862/1965, FR_NIR (high) cites INSEE + Décret 82-103, CO_CC (low) honestly says "no checksum published," GB_NINO (moderate) cites HMRC NIM39110 + validator.js as the secondary source. The governance test's premise is borne out in practice.
- **MIGRATION.md is comprehensive.** v0.x → v1.0 is laid out as four numbered breaking changes ordered by user impact; each has a Before/After code example and a Migration paragraph. The "What did NOT change" section is the right call for an API-stability release.
- **Algorithm primitives docs are exceptional.** `luhn.ts`, `mod11.ts`, `icao-9303.ts` each explain the math, cite the standard (ISO 7812-1, ICAO 9303 Part 3 §4.9), and ship runnable examples with the canonical specimen (`79927398713`, `L898902C<`).
- **`src/catalog/countries.ts` is a model of feature-introduction JSDoc.** Module-level block explains the three design tradeoffs (CLDR vs hand-maintained, pure-function flag emoji, BCP 47 vs `es/en/pt`); per-function blocks include cache notes, fallback behavior, and locale examples in Spanish, French, Chinese, Arabic.
- **Showcase examples are real integrations.** ReactHookFormExample wires Zod + RHF + `parse()` + `getErrorMessage` end-to-end with no shortcuts; ServerValidationExample shows the RFC-7807 error shape; HashStorageExample documents the per-tenant-salt pattern. These are the kind of examples that close real adoption.

## Issues found — by severity

### Critical (must fix before next minor)

1. **Stale "22 countries" claim in English README playground bullet (line 81).** While the coverage table lists 34 countries and the es/pt versions correctly say "los 34 países" / "os 34 países", the English README still says `for all 22 countries` immediately under the "## Live playground" heading. Mechanical fix.

2. **`getSpec` JSDoc example shows a confidence value that does not exist in the type.** `src/index.ts:153` example prints `dui.confidence; // "structural"`. The `Confidence` type in `src/core/types.ts:221` is `"high" | "moderate" | "low" | "unconfirmed"`. SV_DUI in fact reports `"moderate"`. This is an outright lie in the canonical JSDoc that the TypeDoc site will publish.

3. **`nationid/i18n` JSDoc example refers to `r.error`, but `ParseResult.ok=false` carries `r.reason`.** `src/i18n/index.ts:129` shows `getErrorMessage(r.error, "es", "DUI")`. The README correctly uses `result.reason.kind`; the discriminated union in `core/types.ts:245` is `reason: ParseError`. Anyone copying this example into a TS-strict project gets a compile error on their first try.

4. **MIGRATION.md still says "v0.1.0" / "v0.1" everywhere outside §0.** Lines 124, 136, 258, 360, 408, 431, 531 all say "v0.1.0 release gate", "v0.1.0 release", "v0.1 covers numeric CNPJ", etc. v0.5 shipped CNPJ alphanumeric, v0.6 shipped 12 European countries, v1.0 declared API stability. The library migration recipes (§1-§9) read like they were frozen in time at the v0.1 → public release, which contradicts the §0 v1.0 framing six lines above.

5. **`typedoc.json` `projectDocuments` lists only 13 of 34 country docs.** It includes the original v0.1 set (sv, mx, co, br, pe, ar, cl, do, gt, hn, cr, es, us) and never grew to include UY/VE/PA/EC/BO/PY/NI/CA/PT (v0.4) nor the 12 European countries (v0.6). The TypeDoc site at `https://lu1tr0n.github.io/nationid/` is missing 21 country reference pages even though they exist on disk and are linked from the READMEs.

### Important (medium-term fix)

6. **No "What's new in v1.1" section in any README.** v1.0 has a 4-bullet section; v1.1 ships the country catalog (4 new public functions: `getCountryInfo`, `listCountries`, `countryName`, `flagEmoji`) as the headline feature and gets only a parenthetical "(v1.1)" comment inside the DX helpers code block. Readers arriving from "what changed in v1.1?" search land on the "What's new in v1.0" section and assume the catalog is also v1.0.

7. **English README's confidence-flag bullet does not match es/pt.** Lines 187 (en) vs 186 (es) vs 187 (pt): English says only "official source AND mature library agree." The Spanish and Portuguese versions add "(en v1.0, además requiere cita first-party verificada por CI)" / "(na v1.0, também exige cita first-party verificada pelo CI)." The CI-citation guarantee is a v1.0 selling point — it should appear in the English version too. Either remove the parenthetical from es/pt or add it to en.

8. **`docs/CROSS_VALIDATION.md` link is referenced ~13 times but not co-located with the rest of the docs guide.** README has no link to it; only MIGRATION.md references it. A first-time reader of the README has no idea that 30+ pages of cross-validated divergence documentation exist. Add a one-line link under "Confidence flag" or in the Comparison table footer.

9. **Playground coverage bullet says "6 best-practice code examples" but the directory has 8.** `BrCnpjAlphanumExample`, `CrossCountrySearchExample`, `DynamicPickerExample`, `HashStorageExample`, `MaskingExample`, `MxNssExample`, `ReactHookFormExample`, `ServerValidationExample`. All three locales agree on "6" — they have drifted together since v0.3.

10. **`docs/countries/co.md` lists `CO_CC` confidence as "low" but `src/countries/co/cc.ts:40` says `confidence: "low"` AND the README coverage table omits the (v0.X) version annotation present for v0.4+ countries.** The runtime/doc agree but the README does not annotate v0.1 launch countries with the same shipping-wave marker it uses for v0.4 / v0.6, which is asymmetric and hides the fact that the v0.1 set existed first. Minor consistency nit.

11. **`format()` JSDoc says "If `input` is not a valid number for `code`, returns `input` unchanged" but `mask()` JSDoc says it throws on unknown code (v1.0 change).** The asymmetry is intentional and documented in MIGRATION §0.1 — but the root `format()` JSDoc (`src/index.ts:212-225`) does not call out this contract. It should match the §0.1 symmetry framing: "unknown `code` throws; unparseable `input` returns unchanged."

12. **README es/pt list European countries WITHOUT the `*(v0.6)*` shipping-wave annotation that English README uses.** Compare README.md line 168 (`🇬🇧 United Kingdom *(v0.6)*`) to README.es.md line 167 (`🇬🇧 Reino Unido | NINO, NHS Number`). The annotation is useful for readers tracking what shipped when; either drop it from English or add it to es/pt.

### Nit (polish)

13. **CHANGELOG.md uses inconsistent versioning emoji in the v0.5 section** (🚨, 🛂) but no others. Either commit to emoji highlights everywhere or drop them.

14. **MIGRATION.md §5.3 cites "Examples in v0.1: certain CR DIMEX shapes, some HN DNI subtypes."** Those specs are now v1.0; the v0.1 framing reads like ancient history. Update to "Examples today:" or drop the version anchor.

15. **`SUPPORTED_LOCALES` `@example` in `src/i18n/index.ts:36-41` uses `as never` cast** which models a workaround that real code should not need. A cleaner example would use a `type guard` or a literal subset. Minor pedagogy issue.

16. **The "Roadmap" section repeats the wave-by-wave list that is also encoded in CHANGELOG.md.** It would help readers if the README roadmap pointed at the CHANGELOG for past waves and reserved its own bullets for the future (v1.1, v1.2, …). Today every release rewrites the same 7 bullets.

17. **`docs/countries/mx.md` "Open questions" section is the only file with an open ADR-pending discussion.** Either remove the ADR placeholder language ("Confirm whether downstream consumers prefer strict `X`-only") or open an ADR. Leaving it in the canonical doc reads like a TODO.

18. **`CONTRIBUTING.md` references `docs/CONTRIBUTING.md` (line 11) but a "Detailed contributor guide" file is not visible in the listing.** Confirm whether the file was renamed or merged into the top-level CONTRIBUTING.md and remove the dead link if so.

## Per-document scorecard

| Document | Score | Notes |
|---|---:|---|
| README.md (en) | 7/10 | Strong structure, runnable examples, accurate coverage table — but the "22 countries" bug, missing v1.1 highlight, and missing confidence-flag parity with es/pt drag it down |
| README.es.md | 8/10 | Best of the three — has the CI citation parenthetical, says "34 países" everywhere, idiomatic Spanish ("Probá") signals deliberate localization beyond translation. Same v1.1-highlight gap as the others |
| README.pt.md | 8/10 | Mirror of es; uses BR-PT idiom ("CPF/CNPJ" framing in the lead). Same v1.1-highlight gap |
| MIGRATION.md | 7/10 | §0 (v0.x → v1.0) is excellent. §1-§9 is a stale time capsule that still says "v0.1.0 release gate." Critical needs a global v0.1 → v1.x sweep |
| JSDoc — root API (`src/index.ts`) | 7/10 | All 7 functions documented with examples, but `getSpec` confidence example is wrong and `format()` does not mirror the §0.1 symmetry note |
| JSDoc — subpaths (extract / pii / i18n / catalog) | 8/10 | Excellent design notes at module level; the `r.error` typo in i18n is a critical fix. `src/catalog/countries.ts` is a 10/10 reference |
| JSDoc — country specs (5 sampled) | 9/10 | MX_CURP, BR_CPF, FR_NIR, GB_NINO, CO_CC all have Issuer/Source/Legal basis/Algorithm/Confidence sections that match runtime spec values. Citations align with the governance test |
| Showcase examples (3 sampled) | 9/10 | ReactHookFormExample, ServerValidationExample, HashStorageExample all are full-stack realistic. The numeric drift (README says 6, repo has 8) needs a sync |
| CHANGELOG | 8/10 | Detailed, conventional-commits style, but emoji usage is inconsistent and the v0.6 roadmap bullets ("v0.7 Asia, v0.8 React") have since been reshuffled into v1.1+ in the README. Either backfill the CHANGELOG or annotate |

## Multi-language parity check

| Section | EN | ES | PT | Drift? |
|---|---|---|---|---|
| H1 / one-line summary | "every country" | "cualquier país" | "qualquer país" | aligned |
| "What's new" | v1.0, 4 bullets | v1.0, 4 bullets | v1.0, 4 bullets | aligned content; **all three missing v1.1 section** |
| Install | Node 20+ | Node 20+ | Node 20+ | aligned |
| Quick start examples | SV/BR/CL/ES + SV_NIT | SV/BR/CL/ES + SV_NIT | BR/PT/MX + BR_CNPJ | EN+ES use same SV-led examples; PT swaps to BR — intentional localization |
| Live playground bullet 1 | **"all 22 countries"** | "los 34 países" | "os 34 países" | **EN stale** |
| Live playground bullet 5 | "6 best-practice" | "6 ejemplos production-ready" | "6 exemplos prontos para produção" | **All three stale (actual count: 8)** |
| Subpath imports section | aligned | aligned | aligned | aligned |
| DX helpers section | catalog mentions "(v1.1)" | catalog mentions "(v1.1)" | catalog mentions "(v1.1)" | aligned |
| Coverage table | 34 rows, v0.4/v0.6 annotations | 34 rows, **no v0.4/v0.6 annotations** | 34 rows, **no v0.4/v0.6 annotations** | EN has wave markers, es/pt drop them |
| Confidence flag — `high` row | brief | adds "(en v1.0…)" | adds "(na v1.0…)" | **es/pt richer than en** |
| Comparison table | aligned | aligned | aligned | aligned |
| Roadmap | aligned | aligned | aligned | aligned |
| License | aligned | aligned | aligned | aligned |

Two drift directions: English missing the v1.0 CI-citation phrasing in the confidence section, and Spanish/Portuguese missing the v0.4/v0.6 shipping-wave annotations in the coverage table. Either both should be normalized in both directions, or one canonical version (preferably English) should become the source of truth and the translations should auto-sync.

## Sample JSDoc audit (5 country specs)

For each spec: confidence value at runtime (file:line), the Source/Issuer JSDoc line, and whether the citation tier matches the governance promise that `high` requires a first-party issuer URL or legal statute.

| Spec | Runtime confidence | Source citations in JSDoc | Tier match? |
|---|---|---|---|
| `MX_CURP` (`src/countries/mx/curp.ts:24`) | `"high"` (line ~89 in spec object — declared as `confidence: "high"` in the JSDoc header at line 24) | Issuer: RENAPO; Source: https://www.gob.mx/curp; Legal basis: Acuerdo SEGOB DOF 18-OCT-2014; Ley General de Población | ✅ first-party issuer URL (gob.mx) + legal statute |
| `BR_CPF` (`src/countries/br/cpf.ts:39`) | `"high"` | Issuer: Receita Federal do Brasil; Source: https://www.gov.br/receitafederal; Legal basis: Lei 4.862/1965; IN RFB sobre CPF | ✅ first-party issuer URL (gov.br) + legal basis |
| `FR_NIR` (`src/countries/fr/nir.ts:27`) | `"high"` | Issuer: INSEE; Source: https://www.insee.fr/fr/information/1400939; Legal basis: Décret n°82-103 du 22 janvier 1982 | ✅ first-party issuer URL (insee.fr) + décret citation |
| `GB_NINO` (`src/countries/gb/nino.ts:49`) | `"moderate"` | Issuer: HMRC/DWP; Source: https://www.gov.uk/national-insurance-number; Reference: HMRC NIM39110 | ✅ moderate is appropriate — HMRC publishes prefix exclusions but no checksum; citation correctly acknowledges this. Validator.js named as secondary source |
| `CO_CC` (`src/countries/co/cc.ts:40`) | `"low"` | Issuer: Registraduría Nacional; Source: https://www.registraduria.gov.co/; Legal basis: Decreto 1260/1970 | ✅ low is appropriate — Registraduría has never published a check digit. Honest, format-only declaration |

The governance test premise holds in practice: every `high` spec has a first-party issuer-TLD URL AND a legal statute; every `moderate`/`low` spec honestly acknowledges the gap. This is rare for an OSS validator library; most ship "high" everywhere with no audit trail.

## Recommendations (priority order)

1. **Sweep the four accuracy bugs in 30 minutes.** README.md:81 (22 → 34); `src/index.ts:153` (`"structural"` → `"moderate"`); `src/i18n/index.ts:129` (`r.error` → `r.reason`); MIGRATION.md global v0.1.0 → v1.x update. Effort: 30 min. These are the only items a careful reader will hit in the first 200 lines.

2. **Add a "What's new in v1.1" section to all three READMEs.** The country catalog (4 public functions, `Intl.DisplayNames` design tradeoff, 25 new tests per CHANGELOG.md:65) is the headline feature of the v1.1 release and deserves the same 4-bullet treatment v1.0 received. Effort: 1 hour total across three locales.

3. **Update `typedoc.json` `projectDocuments` to include all 34 country docs.** The published TypeDoc site is currently missing 21 country reference pages. Add UY/VE/PA/EC/BO/PY/NI/CA/PT (v0.4) and GB/FR/DE/IT/NL/BE/CH/PL/SE/NO/DK/FI (v0.6). Effort: 5 minutes (mechanical).

4. **Normalize the multi-language confidence-flag wording.** Either add "(in v1.0, also requires a first-party citation verified in CI)" to the English `high` bullet, or remove the parenthetical from es/pt. Effort: 5 minutes. Recommend ADD to English — the CI-citation guarantee is a selling point worth surfacing to the largest-audience README.

5. **Sync the showcase example count from 6 → 8 (or audit which two examples are showcase-vs-internal).** All three READMEs say "6 best-practice code examples"; the directory has 8. Either remove two from the showcase or update the count. Effort: 10 minutes.

6. **Backfill v0.4 / v0.6 shipping-wave annotations to README.es.md and README.pt.md coverage tables, or remove them from README.md.** The asymmetry is the kind of detail that erodes trust in the multilingual claim. Effort: 15 minutes for normalization in either direction.

7. **Add a single sentence under "Confidence flag" linking to `docs/CROSS_VALIDATION.md`.** 13 cross-references exist from MIGRATION.md but the README has zero. The cross-validation document is a competitive moat — it should be discoverable from the canonical entry point. Effort: 5 minutes.

8. **Document the `format()` "unknown code throws / bad input returns unchanged" contract** in the root JSDoc. This is the asymmetric pair from MIGRATION §0.1 (mask now matches hash/lastN at the throw level) and should be visible without reading the migration guide. Effort: 10 minutes.

9. **Refresh the MIGRATION.md §1-§9 library-comparison recipes against v1.x.** §5.3 says "Examples in v0.1: certain CR DIMEX shapes"; §4.3 says "nationid v0.1 covers numeric CNPJ only" (false since v0.5); §8 FAQ "What if my MX RFC fixtures fail" references the v0.1.0 SAT homoclave bug fix as if it just shipped. The library-migration content remains structurally valuable but its temporal anchors are stale. Effort: 1-2 hours for a careful sweep with the CHANGELOG open.

10. **Open a follow-up ADR for the `MX_CURP` `Ñ` policy question.** `docs/countries/mx.md` "Open questions" leaves the policy in suspense; either commit to accepting both `Ñ` and `X` (current runtime behavior) or open `docs/adr/N-curp-n-tilde-policy.md` referencing the question. Effort: 30 minutes for an ADR.

Total fix-it-all effort: under 6 hours including the cross-validation refresh. Without recommendation 9 (which is a content rewrite, not a fix), the critical+important sweep is roughly **2 hours of mechanical edits** to bring this from 8/10 to 9.5/10.
