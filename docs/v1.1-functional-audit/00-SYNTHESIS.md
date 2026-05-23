# v1.1 Functional Audit — Synthesis

> Aggregated scorecard + cross-cutting themes + prioritized roadmap for `nationid@1.1.0`.
> 6 independent audit agents covering DX, functional coverage, docs, tests, competitive positioning, and robustness.

## Overall score: 8.03 / 10

`nationid@1.1.0` is a confidently designed, disciplined, TypeScript-first library that is **best-in-class on its declared scope** (LATAM + Western/Northern Europe, offline checksum validation, KYC-grade ergonomics) and shows unusual maturity for a library that has been public for two weeks: a discriminated-union public API, CI-enforced citation governance, 6,488 tests across 70 files, per-country tree-shakable subpaths at 3-5 KB gzipped, and a v1.1 catalog that collapses the `i18n-iso-countries` dependency for any consumer that already needs nationid. The dominant signal across all six audits is "the runtime is 9-class, the *surfacing* is 8-class": every gap that lost points is a documentation, discoverability, or scope-extension question — not a correctness or architectural defect. Today the library is the obvious choice for a TS team building KYC onboarding for LATAM + EU; in 4–6 weeks of focused work it can credibly claim the empty "global + TS-native OSS validator" quadrant.

## Per-dimension scorecard

| Dimension | Score | Standout | Biggest gap |
|---|---:|---|---|
| Developer Experience | 8/10 | Discriminated `ParseResult` + literal-narrowing generics on `parse<C>` / `getSpec<C>`; `flagEmoji` works for any ISO alpha-2 even outside the 34 supported | Error-message discoverability: `getErrorMessage` is buried four sub-sections below `parse()` in the README; v1.1 catalog features hidden under an 80-row table |
| Functional coverage | 7.5/10 | 34 countries with checksum-verified validators including SV/GT/HN/DO/CR (only OSS lib to ship these); MX/AR `extract` + ICAO 9303 primitives | 11 shipped EU codes (`NO_FNR`, `SE_PERSONNUMMER`, `DK_CPR`, `FI_HETU`, `PL_PESEL`, `FR_NIR`, `BE_NRN`, `IT_CF`, plus `SV_NIT`, `HN_DNI`, `NI_CEDULA`) encode DOB/sex but `extract*` returns `null`; zero Asia/Africa/Middle East; no `detect()` helper |
| Documentation | 8/10 | Three-language README parity is high; per-country docs follow an identical template; governance test premise borne out — every `high` spec cites first-party issuer | 4 specific accuracy bugs in canonical entry points (README "22 countries" stale, `getSpec` JSDoc shows `"structural"` confidence value that doesn't exist, `nationid/i18n` example uses `r.error` instead of `r.reason`, MIGRATION.md still says "v0.1"); no "What's new in v1.1" section anywhere |
| Test posture | 9/10 | Governance test (`confidence-citations.test.ts`) is a novel "tests-that-police-rules-about-rules" precedent; synthetic-but-checksum-correct fixtures; 10 numbered property invariants P1–P10; oracle (python-stdnum) cross-validation with documented divergences | Mutation testing acknowledged as backlog but not wired; `pnpm test:coverage` defined in vitest config but never run in CI; cross-validation lanes silently skip without a "lane ran" assertion |
| Competitive positioning | 8/10 | Unique moats: cited-confidence + CI governance, per-country 3-5 KB gzip subpath bundles, literal-narrowing TS inference, first-party PII helpers, CLDR-backed catalog, ICAO 9303 primitives — no JS competitor combines these | Traction at idea stage (~1k monthly downloads vs validator.js 97.5M); zero Asia/Africa coverage while python-stdnum ships IN/CN/JP/KR/SG/ZA/IL etc.; no framework adapters (cpf-cnpj-validator ships 5: joi/yup/zod/class-validator/Angular) |
| Robustness & edge cases | 8/10 | Every regex anchored + bounded — zero ReDoS exposure across ~120 patterns; `Intl.DisplayNames` falls back to alpha-2 on missing ICU; clock-injection regression for MX RFC 2056 boundary; SubtleCrypto capability check guards `hash` | `validate/parse/normalize/format` throw `TypeError` on `null`/`undefined` from JS callers (contradicts "never throws" promise); `Intl.DisplayNames` throws `RangeError` on adversarial locale strings, no try/catch; `flagEmoji("12")` returns valid-looking Unicode garbage; NFD-encoded `Ñ` collapses to `N` silently |

**Weighting** (per audit charter): functional 25%, DX 20%, robustness 15%, docs 15%, tests 15%, competitive 10%. Weighted mean = 0.25×7.5 + 0.20×8 + 0.15×8 + 0.15×8 + 0.15×9 + 0.10×8 = **8.025**. Reported as **8.03 / 10**. We are not rounding up; the audits independently land in a tight band and the half-point spread is real.

## Strengths preserved across audits

Themes that multiple agents called out as standouts, grouped by what they prove:

- **The discriminated-union `ParseResult` is textbook.** Flagged by DX (agent #1, "exemplary") and competitive (agent #5, "no JS competitor returns a discriminated union"). `parse("MX_CURP", x).code` narrowing to the literal `"MX_CURP"` is the single ergonomic feature that consistently delights first-time consumers in the simulation walks.
- **Citation governance enforced by CI is a real moat.** Flagged by docs (agent #3, "governance test premise holds in practice across 5 spot-checked specs"), tests (agent #4, "standout file in the repo"), and competitive (agent #5, "hard to copy because it requires N years of citations stored in code, not docs"). Three independent reviewers landed on the same identification.
- **Per-country tree-shakable subpaths at 3-5 KB gzipped.** Flagged by DX, competitive, and robustness as the foundation for Edge / Worker positioning. validator.js ships 824 KB total; nationid's `nationid/sv` is roughly 1/15th the size for a single-country validation task.
- **PII primitives baked in as first-class API.** Flagged by functional (`mask` + `hash` + `lastN` are LGPD/GDPR table-stakes) and competitive (no JS competitor ships them in one package). The fact that `hash` is SubtleCrypto-based and works unchanged across Node 20+, browsers, and Edge runtimes is a giant integration burden lifted off consumers.
- **Honest confidence-tier system with public demotions.** Flagged by functional (118 specs, 116 cited) and competitive (validator.js has zero audit trail). The two passport demotions in v1.0 prove the rubric is exercised, not decorative.
- **Test names read like a specification.** Flagged by tests (`describe("MX — RFC Persona Física") → describe("validate") → it("rejects forbidden 4-letter prefixes")`) and docs (Spanish/Portuguese assertion strings pin user-facing messages by string equality, catching orthography regressions). The maintainability story is solid for a project this young.
- **Property suite is genuinely instrumented, not theatrical.** 10 numbered invariants P1–P10 mapped 1:1 to documented promises; every property iterates `listSupportedCodes()` so new countries inherit ~7 tests for free. Flagged by tests and robustness.

## Cross-cutting themes (issues flagged by 2+ agents)

### Theme 1 — v1.1 catalog features are invisible

Flagged by DX (#1, "Friction 4" — flagEmoji/listCountries/getCountryInfo buried below an 80-row table), docs (#3, "No 'What's new in v1.1' section in any README"), and competitive (#5, the CLDR-backed catalog should be in the comparison table to widen the moat vs validator.js). The v1.0 callout pattern (`README.md:25-32`) is not mirrored for v1.1. The headline feature of the release exists in code, passes its 25 new tests, is unique in the JS ecosystem — and a first-time reader will simply not see it. Consensus: **add a "What's new in v1.1" section to all three READMEs, write three rows into the comparison table, and dogfood the catalog in the showcase site so users copying the example code start with the v1.1 API as their mental model.** Why it matters: this is currently a *self-inflicted invisibility* on the most strategic feature in the release.

### Theme 2 — Error-message discoverability and the `error`/`reason` inconsistency

Flagged by DX (#1, "Friction 1" — time-to-first-error-message-shown is ~5 minutes when it should be 30 seconds), docs (#3, critical item: `nationid/i18n` JSDoc example shows `r.error` while the public type carries `r.reason`), and indirectly by robustness (#6, the README promise "never throws on input errors" is in tension with how consumers learn about `getErrorMessage`). The `parse()` JSDoc itself says "{ ok: false, error: { kind } }" while the runtime type is `reason: ParseError`. Consensus: **append four lines to the Quick Start showing the `getErrorMessage(r.reason, locale, displayName)` round-trip, sweep the `error → reason` typos in `src/index.ts:230-260` and `src/i18n/index.ts:129`.** Cost: 10 minutes. Trust-cost of NOT fixing: a first-day developer's first compile error.

### Theme 3 — Asia / Africa / Middle East = 0 countries

Flagged by functional (#2, Gap 2 — IN/CN/JP/KR/SG/IL/ZA all have published algorithms and combined addressable population 3+ billion) and competitive (#5, the single biggest moat dent against python-stdnum). Both agents called this the "single biggest delta to claim global scope." The roadmap (`README.md:218`) names "Asia (IN, CN, JP, KR, SG, HK, TW + AU, NZ, ZA, IL)" for v1.1+, but v1.1 shipped without it. Consensus: **declare and ship Asia phase 1 (IN + JP + SG + KR + TW) in v1.2** — these five have the cleanest published algorithms and shortest road-to-correctness. India is the highest individual ROI: Aadhaar (Verhoeff), PAN, GSTIN, EPIC, VID are the five python-stdnum ships. Competitive (#5) also notes the README tagline "every country" is provably false until this lands.

### Theme 4 — The `extract` gap is wider than the catalog implies

Flagged by functional (#2, Gap 1 — 5 codes supported, 11+ shipped codes encode lift-able data) and competitive (#5, FR_NIR is the easiest closable gap among the 10 head-to-head codes; python-stdnum has it and nationid doesn't). The shipped extract surface is MX × 2, AR × 3, GT × 1, PE × 1. Missing: every Nordic personnummer, FR_NIR (encodes DOB + sex + département), IT_CF (encodes DOB + sex + birth-comune), PL_PESEL, BE_NRN, plus SV_NIT, HN_DNI, NI_CEDULA in LATAM. Most are 1 day of work each because the spec files already document the encoding. Consensus: **ship `extract` for the 8 EU codes that encode DOB + sex in v1.2** — turns the EU bundle from "validator" into "validator + autofill," which is what KYC consumers actually want.

### Theme 5 — Documentation parity drift

Flagged by docs (#3, "EN says 22 countries, ES/PT say 34"; "EN missing CI-citation parenthetical that ES/PT have"; "ES/PT missing v0.4/v0.6 wave annotations that EN has") and DX (#1, "v1.1 catalog hidden below 80-row table in all three READMEs"). Three-language README parity is unusually high *structurally* but is drifting on factual content. Consensus: **30-minute mechanical sweep** to normalize the four known divergences. Trust signal: multilingual maintenance is a stated value; visible drift erodes it.

### Theme 6 — JS-caller robustness contradicts the "never throws" promise

Flagged by robustness (#6, finding H2 — `parse("BR_CPF", null)` throws `TypeError: Cannot read properties of null (reading 'trim')`) and indirectly by DX (#1, "Friction 3" — `validate()` throws on unknown code, but the throw is invisible from the Quick Start). The README markets the library for "JavaScript and TypeScript"; the public-function preludes assume `typeof input === "string"` because the TS contract says so. The JSDoc on `parse()` says "Never throws on input errors" — but only the TS user is protected. Consensus: **prepend `if (typeof input !== "string") return { ok: false, code, reason: { kind: "empty" } }` to each public entry**. 2 hours including symmetric guards in per-country `parse()`.

### Theme 7 — Coverage thresholds armed but not fired in CI

Flagged by tests (#4, Gap 2 — `vitest.config.ts` sets thresholds 90/85/90 but `.github/workflows/ci.yml` runs `pnpm test`, not `pnpm test:coverage`). Cross-references competitive (#5, supply-chain hygiene is otherwise unusually mature for a v1.1 library — SHA-pinned actions, CodeQL, OSSF Scorecard). The threshold provides false confidence today: a PR could add a country without a country test file and ship green. **30-minute fix: add `pnpm test:coverage` to the ubuntu/Node 22 lane and wire Codecov.**

## Critical findings (must-fix)

Severity tier: would surprise a careful consumer in the first session.

1. **(docs C1) `getSpec` JSDoc example prints `"structural"` confidence** at `src/index.ts:153`. That value does not exist in the `Confidence` type. TypeDoc publishes this lie. Fix: change to `"moderate"` (SV_DUI's actual value). 1 minute.
2. **(docs C3 / DX Friction 1) `nationid/i18n` JSDoc example calls `r.error`** at `src/i18n/index.ts:129`. The discriminated union carries `r.reason`. A consumer copying the canonical example into a TS-strict project gets a compile error on the first try. Fix: rename in the example. 2 minutes.
3. **(docs C2) README.md:81 says "all 22 countries"** under "Live playground" while ES/PT correctly say 34 and the coverage table lists 34. Fix: 22 → 34. 30 seconds.
4. **(docs C4) MIGRATION.md §1–§9 still says "v0.1.0 release gate"** at lines 124, 136, 258, 360, 408, 431, 531. Library is at v1.1. Fix: sed replace plus a careful re-read. 1–2 hours.
5. **(docs C5) `typedoc.json` `projectDocuments` lists only 13 of 34 country docs.** TypeDoc site is missing 21 reference pages that exist on disk and are linked from the READMEs. Fix: add 21 paths. 5 minutes.
6. **(robustness H2) `parse/validate/normalize/format` throw on `null`/`undefined`.** Contradicts the documented "never throws on input errors" contract. JS callers from non-strict codebases hit this in production. Fix: prepend `typeof input !== "string"` guard. 2 hours including per-country symmetric guards.
7. **(robustness H1) `Intl.DisplayNames` throws `RangeError` on adversarial locale strings.** Public surface forwards arbitrary `string` to the constructor with no try/catch. A Next.js route handler doing `getCountryInfo("MX", req.query.locale)` panics on `?locale=;rm -rf;`. Fix: wrap in try/catch with `DEFAULT_LOCALE` fallback. 30 minutes.
8. **(robustness H3) `flagEmoji("12")` returns valid-looking Unicode garbage** (regional indicator digits 1 + 2). Shape check is `length === 2`, contract says "any ISO 3166-1 alpha-2." Fix: tighten guard to `/^[A-Za-z]{2}$/`. 10 minutes.

These eight issues are independent and trivially parallelizable. **Total fix cost: under 5 hours.** They are exactly the surface a first-time consumer hits in the first hour.

## Prioritized roadmap toward 9+/10

Each item: **What** (concrete), **Why** (which audit, score lift), **Effort**, **Target version**. Ordered by impact × inverse-effort within each tier.

### v1.2 (quick wins, ship in 1–2 weeks)

1. **README + JSDoc accuracy sweep** — fix all 5 critical doc issues above plus the "6 best-practice examples" / "actually 8" drift. *What:* edit `README.md:81`, `src/index.ts:153`, `src/i18n/index.ts:129`, `MIGRATION.md` global v0.1 → v1.x, `typedoc.json` projectDocuments. *Why:* docs (#3) critical, DX (#1) priority 2. *Effort:* small (2 hours). *Lift:* docs 8 → 9, DX 8 → 8.5.

2. **"What's new in v1.1" section in all three READMEs** with one inline example per new catalog function (`getCountryInfo`, `listCountries`, `countryName`, `flagEmoji`). *What:* mirror the v1.0 callout at `README.md:25-32` for v1.1. *Why:* DX (#1) priority 3, docs (#3) priority 2, competitive (#5) — Theme 1 consensus across three agents. *Effort:* small (1 hour). *Lift:* DX +0.5, docs +0.5.

3. **`getErrorMessage` in the Quick Start** — append the localized-error round-trip to `README.md:67-73` (4 lines of code). *What:* show `getErrorMessage(r.reason, "es", "DUI")` after the `parse()` example. *Why:* DX (#1) priority 1, Theme 2 consensus. *Effort:* small (10 min). *Lift:* DX +0.5.

4. **Robustness H1+H2+H3 patch** — three independent fixes: null guard at public entries, try/catch on `Intl.DisplayNames`, shape check on `flagEmoji`. *What:* see "Critical findings" #6, #7, #8 above. *Why:* robustness (#6) Critical/High. *Effort:* medium (3–4 hours including tests). *Lift:* robustness 8 → 9.

5. **`pnpm test:coverage` in CI + Codecov badge** — *What:* add one step to `.github/workflows/ci.yml` on the ubuntu/Node 22 lane. Thresholds 90/85/90 are already armed in `vitest.config.ts`. *Why:* tests (#4) priority 1, Theme 7. *Effort:* small (30 min). *Lift:* tests +0.3.

6. **Dogfood the v1.1 catalog in the showcase site** — replace the hand-rolled `COUNTRY_META` table in `nationid_example/src/lib/countries.ts` with `getCountryInfo(code, locale)` from `nationid/catalog`. *What:* one PR against `nationid_example`. *Why:* DX (#1) priority 4 — the showcase is the most-clicked surface. *Effort:* medium (1–2 hours). *Lift:* DX +0.5.

7. **EU `extract` for the 8 codes that encode DOB + sex** — `NO_FNR`, `NO_DNR`, `SE_PERSONNUMMER`, `DK_CPR`, `FI_HETU`, `PL_PESEL`, `FR_NIR`, `BE_NRN`. *What:* extend `SUPPORT_TABLE` in `src/extract/index.ts`; one extractor per code (each is ~30 LOC, spec files already document the encoding). *Why:* functional (#2) priority 1 ("biggest functional ROI in the library"), competitive (#5) — Theme 4 consensus. *Effort:* large (5–7 days). *Lift:* functional 7.5 → 8.5.

8. **`detect(input: string, hint?: CountryCode): readonly DocumentTypeCode[]`** — closes the "is this a CPF or a CNPJ?" gap. Length pre-filter, `rawRegex` test, `validate()` confirm, tie-break on country hint. *What:* one new file `src/detect/index.ts` + subpath export. *Why:* functional (#2) priority 2 — "single helper users would most often write themselves." *Effort:* medium (2 days). *Lift:* functional +0.5.

9. **Framework adapters: `nationid/zod` first, then `nationid/valibot` and `nationid/yup`** — *What:* `nationid("BR_CPF")` returns a `z.ZodEffects<string>`. ~50 LOC per adapter. *Why:* competitive (#5) priority 1 — closes the single largest gap to cpf-cnpj-validator's 5-adapter shipping. *Effort:* medium (1–2 days for all three). *Lift:* competitive 8 → 8.5.

### v1.3 (medium-term, ~1 month)

1. **Asia phase 1: IN + JP + SG + KR + TW** — Aadhaar (Verhoeff), PAN, GSTIN, EPIC, VID for India; My Number + Corporate Number for Japan; NRIC/FIN + UEN for Singapore; RRN + BRN for Korea; UBN for Taiwan. *What:* mirror python-stdnum's coverage list exactly per Theme 3 consensus. *Why:* functional (#2) priority 5, competitive (#5) priority 2 — Theme 3. *Effort:* large (3–4 weeks at the historical v0.4 → v0.6 cadence). *Lift:* functional +1 (full point), competitive +0.5.

2. **`IT_CF` extractor** with codice-catastale lookup (~8K rows shipped via dynamic import). *What:* `src/extract/it/cf.ts` + lazy JSON. *Why:* functional (#2) priority 3 — Italy becomes parity with Mexico for KYC. *Effort:* medium (3 days). *Lift:* functional +0.2.

3. **TD3 MRZ parser** `parseMrzTd3(line1, line2): MrzData | null`. *What:* new helper on top of existing `mrzCheckDigit` primitive. *Why:* functional (#2) priority 4. *Effort:* medium (2 days). *Lift:* functional +0.2.

4. **`i18n` add `fr / de / it / nl / pl`** error templates. *What:* 5 strings × 5 locales = 25 entries. *Why:* functional (#2) priority 6, competitive (#5) — EU consumers shouldn't own translation. *Effort:* small (1 day with native review). *Lift:* DX +0.2.

5. **Stryker mutation testing** on country files lacking external cross-validation (SV, BO, EC, PY, NI, PA, UY, VE, CA, GB, FR, DE, IT, NL, BE, CH, PL, SE, NO, DK, FI, PT — 22 files). *What:* `@stryker-mutator/core` + nightly scheduled lane. Target: ≥80% mutation score per file. *Why:* tests (#4) priority 3 — these are exactly the files where Stryker delivers the most value. *Effort:* medium (1–2 days setup + ongoing). *Lift:* tests 9 → 9.5.

6. **Benchmarks + correctness page** — pin in code: SV DUI (no competitor validates), CL RUT (rut.js stale 18 months), MX CURP (validator.js skips), ES CIF (validator.js regex-only), BR CNPJ alfanumérico. *Why:* competitive (#5) priority 3 — content marketing asset for SEO. *Effort:* small (1 day). *Lift:* competitive +0.3.

7. **`generate(code, opts?)` primitive** per spec for test fixtures. *Why:* competitive (#5) priority 4 — cpf-cnpj-validator ships this. *Effort:* medium (1 file per spec). *Lift:* DX +0.2.

8. **Consolidated `docs/CROSS_VALIDATION.md § Divergences` ledger** — table of every "nationid disagrees with X because Y" with file:line. *Why:* tests (#4) priority 8. *Effort:* small (2 hours). *Lift:* docs +0.2.

### v1.x / v2.0 (strategic)

1. **`@nationid/react` companion** — `<DocumentInput country code locale onValidatedSubmit />`. Roadmap (`README.md:218`) already lists this. Closes the time-to-first-form gap (currently ~15 minutes via the showcase site). DX (#1) — "for 10/10 the gap to close."
2. **Asia phase 2: CN + IL + ZA + AU + NZ + ID + TH + VN + MY** — completes python-stdnum parity outside Africa. Functional (#2) priority 9.
3. **Driver license phase 1: UK (DVLA), DE, IT, NL, BE format-only** — unlocks ride-share onboarding. Functional (#2) priority 8.
4. **Live registry connectors as opt-in subpath** — `nationid/online/vies`, `nationid/online/sunat`. Keep core offline; layer paid I/O as optional. Closes the Stripe Identity-comparison footnote.
5. **Bun + browser matrix lane in CI** — tests (#4) priority 5. Catches non-Node runtime regressions before `@nationid/react` ships.

## What NOT to do (anti-patterns spotted)

- **Don't add live registry lookup to the core.** VIES / SUNAT / SAT-FIEL integration is a real consumer need, but baking it into `nationid` violates the zero-dependency, offline, sub-5KB-per-country design constraint that is the library's competitive moat. If shipped, keep it strictly behind an opt-in subpath (`nationid/online/*`) with explicit network I/O documentation. Competitive (#5) frames this correctly: "nationid's value is catch the 95% of typos for free so you only pay the API for the 5% that pass."

- **Don't accept the "CL RUT 9th-digit region" hypothesis.** The audit prompt mentioned this; functional (#2) explicitly debunks it. CL RUT carries no regional digit — the 9th position IS the check digit. Likewise the BR_CPF "state-of-issuance 9th digit" is obsolete post-2018 per RFB practice. **Library is correct to skip both; don't add fictitious extractors.**

- **Don't reverse the algorithm-primitive throw contract.** Robustness (#6, M6) flags that `mod11WeightedSum` / `mrzCheckDigit` / `luhnCheckDigit` throw on programmer-bug input. This is the right behavior for low-level primitives exposed via `nationid/algorithms` — what's missing is documentation, not behavior. Adding `safeMod11` variants doubles the surface and signals indecision. Document the throw contract instead.

- **Don't over-engineer `format()` into a discriminated return.** DX (#1, Friction 7) considered this and rejected it; the soft-fallback ("returns input unchanged on bad input") is correct for render-path code that must never throw. A one-line README note ("`format` is best-effort; use `parse(...).formatted` if you need to know whether formatting actually ran") closes the gap without adding API surface.

- **Don't pre-normalize Unicode digits without an opt-out.** Robustness (#6, M5) suggests canonicalizing Arabic-Indic / Devanagari / fullwidth digits to ASCII before stripping. Be careful: silently translating user input changes downstream lookups for users who store the canonical form. Ship it behind an explicit `normalize(code, input, { unicodeDigits: "ascii" })` opt-in, not as a silent default.

- **Don't drop the "every country" tagline if Asia is in v1.2.** Competitive (#5) recommends dropping it until Asia ships. If Asia phase 1 lands in v1.2 (the roadmap commitment), the tagline becomes defensible immediately — the cheaper path is shipping the countries, not editing the tagline twice. Edit the tagline only if Asia slips.

## Bottom line for the maintainer

`nationid@1.1.0` is the work of someone who treats documentation, citations, and tests as part of the API contract — and it shows. You are sitting on the best LATAM ID validator in the JS ecosystem, with unique moats (CI-enforced citation governance, tree-shakable subpaths, discriminated-union API, PII primitives) that competitors structurally cannot copy without rewriting from scratch. The headline gap is not a quality problem; it is a **surfacing-and-scope** problem — your v1.1 features are invisible, your error-message helper is buried, and 60% of the world's population lives in countries you don't yet ship. The single highest-leverage move is to **batch the 5-hour critical-fix sweep (docs accuracy + robustness H1/H2/H3 + Quick Start error-message + What's-new section + showcase dogfood) into v1.1.1 this week**, then commit publicly to "Asia phase 1 + EU `extract` extension + zod adapter" as v1.2 and ship it inside 30 days. That sequence — quick-credibility patch, then a single high-signal release — converts the audit's 8.03 into a defensible 9+ and earns nationid the empty "global, TS-native, OSS" quadrant that no library currently occupies. The long game is `@nationid/react` and a `nationid/online/*` opt-in for live registry lookup; both can wait for v1.4–v2.0 because they extend an already-strong position rather than fix a weakness.

## Audit metadata

- Audit date: 2026-05-22
- Library version: nationid@1.1.0 (published 2026-05-22)
- Agents: 6 parallel (DX, functional, docs, tests, competitive, robustness) + 1 synthesizer
- Total report words: ~18,500
- Reports under `docs/v1.1-functional-audit/0[1-6]-*.md`
- Weighted score: functional 25% × 7.5 + DX 20% × 8 + robustness 15% × 8 + docs 15% × 8 + tests 15% × 9 + competitive 10% × 8 = **8.025**
