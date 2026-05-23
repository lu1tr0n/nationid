# v1.1 Functional Audit — Developer Experience

## Score: 8/10

`nationid@1.1.0` delivers a confidently designed, TypeScript-first DX that is unusually polished for a v1.x library in this niche. The four-call core (`validate / parse / format / normalize` in `src/index.ts:187-228`) is small enough to memorize after one read of the README, the discriminated `ParseResult` is exemplary (`src/core/types.ts:234-246`), and the v1.0 generic narrowing on `parse<C>` and `getSpec<C>` (`src/index.ts:156-164`, `src/index.ts:257-259`) materially improves the autocomplete story versus v0.x. The DX still trails state-of-the-art on three axes that keep it out of the 9/10 band: the README leaves the consumer responsible for assembling the "happy path" (no boilerplate-free hook, no copy-pasteable Zod schema in the README itself), error discoverability still requires reading prose to learn that `nationid/i18n` exists, and the v1.1 country catalog additions (`flagEmoji`, `listCountries`) are buried below the Coverage table where a first-time reader is unlikely to find them. Frictions are predominantly papercuts, not blockers — but they are the difference between "this is good" and "this is the obvious choice."

## What works well

- **Headline quick-start is 6 lines and works.** `README.md:48-65` shows `validate("SV_DUI", "04567890-3")` returning `true`, `format("SV_DUI", "045678903")` returning `"04567890-3"`, and a `parse(...)` round-trip with `.normalized`, `.formatted`, `.confidence`. A developer reading those 18 lines knows the four core verbs, sees that the API is symmetric across them, and learns that input formatting is tolerated — all without scrolling.
- **`ParseResult` is a textbook discriminated union.** `src/core/types.ts:234-246` makes `r.ok` the discriminator and gates `r.normalized / r.formatted / r.confidence` on the `true` branch and `r.reason` on the `false` branch. The README example at `README.md:71-73` lists every `reason.kind` literal in a single inline comment so the consumer knows the closed set without having to read `core/types.ts`.
- **Generic narrowing on `parse` and `getSpec` lands cleanly.** `src/index.ts:257-259` plus `src/core/types.ts:234-246` (defaulted `C extends DocumentTypeCode = DocumentTypeCode`) means `const r = parse("MX_CURP", x)` types `r.code` as the literal `"MX_CURP"`, so `switch (r.code)` does not surface the 124-member union. The default type parameter keeps `ParseResult` as a non-breaking change for existing variable-typed references — this is the right call.
- **`extractDOB / extractSex / extractRegion` constrain their first argument by feature support.** `src/extract/index.ts:38-55` derives `CodesSupporting<K>` from the `SUPPORT_TABLE` literal so the public signature at `src/extract/index.ts:105-115` rejects `extractDOB("CL_RUT", x)` at compile time. The runtime support matrix and the type contract cannot drift out of sync — this is a meaningful DX upgrade in v1.0.
- **`hash` is async and uses SubtleCrypto.** Re-exported from `src/pii/index.ts:22` and used in `nationid_example/src/examples/HashStorageExample.tsx:24-37`. The fact that it works unchanged in Node 20+, browsers, and edge runtimes lifts a giant integration burden off the consumer — they don't have to bring their own crypto lib for any of the three platforms.
- **Per-locale i18n subpath is <200B.** `package.json:240-254` declares `./i18n/es`, `./i18n/en`, `./i18n/pt` as standalone exports and `package.json:367-371` size-caps the locale at 1KB. `src/i18n/locales/en.ts:9-15` is just a frozen object literal. A consumer wiring up a Spanish-only signup form imports a string table and pays nothing for the other two locales.
- **Confidence flag is surfaced everywhere.** It appears in the README narrative (`README.md:184-192`), on `ParseResult` (`src/core/types.ts:241`), and on `DocumentInfo` from the catalog (`src/catalog/types.ts:50`). A KYC integrator can decide tier policy from a single typed field — they don't have to maintain their own out-of-band trust table.
- **`as const satisfies CountryDocumentBundle` preserves literal types in bundles.** `src/countries/sv/index.ts:83-89` is a worked example: `svBundle.defaultPersonal` types as `"SV_DUI"`, not `DocumentTypeCode`. Consumers building a country selector see the narrowest possible type when they grab the default.
- **`flagEmoji` works for codes outside the 34 supported countries.** `src/catalog/countries.ts:112-121` accepts any 2-letter ISO 3166-1 alpha-2 and computes the Regional Indicator pair arithmetically. A consumer who already has a country picker but doesn't have flag emojis can reach for `flagEmoji("JP")` and get `"🇯🇵"` even though `JP` is not yet a `CountryCode`. That is unusual generosity for a typed lib.
- **`countryName` falls back to the ISO code on runtimes without ICU.** `src/catalog/countries.ts:161-164` returns `code.toUpperCase()` when `Intl.DisplayNames` returns `undefined`. A consumer running on a stripped Node-Alpine image gets `"MX"` instead of an exception — graceful degradation, not a crash.
- **`exports."./*": null` denies undocumented subpaths.** `package.json:261` plus the explicit map keys make the public surface unforgeable: a consumer cannot accidentally couple to `nationid/core/normalize` and break next minor. The MIGRATION note at `MIGRATION.md` §0.2 is clear about it.
- **`sideEffects: false` is declared.** `package.json:40` lets bundlers treeshake the root `BUNDLES` array (`src/index.ts:72-110`) when only a single country subpath is imported.
- **`mask` is symmetric with `hash` and `lastN`.** Post-v1.0, all three throw on unknown code (`src/pii/index.ts:60-62`). The MIGRATION note at §0.1 explains the rationale. From a DX standpoint, three primitives that behave the same way are easier to reason about than two that throw and one that silently degrades.
- **`getErrorMessage` accepts an unsupported locale and falls back cleanly.** `src/i18n/index.ts:78-83` resolves to `DEFAULT_LOCALE` instead of throwing or returning `undefined`. The consumer can pass `navigator.language.slice(0,2) as Locale` without a guard and the function does the right thing.

## What surprises / friction points

### Friction 1 — Error-message discoverability is buried

The biggest single DX gap is that a developer who reads the Quick Start (`README.md:48-65`) sees `parse(...)` return a failure result with `reason.kind`, but the README never tells them what to do with it until line 105 — section "DX helpers — extract / pii / i18n / catalog" — at which point the `getErrorMessage` example shows up four sub-sections in. A first-time consumer who hits a validation failure in the first 90 seconds will almost certainly hand-write a `switch (r.reason.kind)` block with hard-coded English strings, never learning that `nationid/i18n` exists.

Reinforcing this: the `parse()` JSDoc at `src/index.ts:230-259` does mention `nationid/i18n.getErrorMessage` in the prose, but the `@example` block (`src/index.ts:248-255`) only shows `console.log(r.reason.kind)` — it stops one line short of demonstrating the localized message. Hover types in an IDE will see "use this for error messages" but no code example.

**Severity:** medium

### Friction 2 — `parse().reason` vs `parse().error` — confusing in the JSDoc

The implementation lands on `reason` (`src/core/types.ts:245`), and the README uses `r.reason.kind` (`README.md:72`). But the JSDoc on `parse()` itself contradicts the implementation: `src/index.ts:230` says "*Detailed parse with a discriminated `ParseResult`. Never throws on input errors; instead returns `{ ok: false, error: { kind, ... } }`*". The property is called `error` in the prose, then `reason` in the runtime type and the README. A developer who reads the JSDoc first and tries `r.error.kind` will get a TypeScript error and have to retype.

A second small instance: `src/index.ts:244-245` similarly says "*returns `{ ok: false, error }`*" while the actual return type discriminator is `reason`.

**Severity:** medium (zero runtime cost, real "wait, what?" cost on first hit)

### Friction 3 — `validate()` throws on unknown code, but the throw is invisible from the Quick Start

`validate(code, input)` (`src/index.ts:187-189`) delegates to `getSpec(code)` (`src/index.ts:156-164`), which throws `Error(\`nationid: no spec registered for "${code}"\`)` when the code is not registered. The README at `README.md:50-54` shows only successful calls, and the JSDoc at `src/index.ts:176` mentions `@throws {Error}` only for the `code` not being registered (good), but it explicitly says "Never throws on malformed input."

That's a real ergonomic question for a consumer wiring up a generic form: `validate(userSelectedCode, value)` with `userSelectedCode: string` will either compile-error (if they keep the union) or runtime-throw (if they cast to `DocumentTypeCode`). The README does not call this out. The recommended pattern — gate on `listSupportedCodes().includes(code)` first — has to be inferred from the `@throws` JSDoc and `MIGRATION.md` §0.1 commentary on `mask`.

A consumer who picks `parse()` instead expects `{ ok: false }` to cover *every* failure mode and only learns the throws-on-unknown-code path the hard way.

**Severity:** medium

### Friction 4 — v1.1 country catalog hidden below 80-row table

`flagEmoji`, `listCountries`, `getCountryInfo`, and `countryName` are the highlight features of v1.1. They appear in the README at `README.md:131-138`, right inside the "DX helpers" section — but immediately *below* a fully expanded `extract / pii / i18n / catalog` walkthrough that already includes a `listDocuments` example. A reader who skims by jumping from the Quick Start to the Coverage table at `README.md:142-180` would miss the country catalog entirely. There is no "What's new in v1.1" section paralleling the v1.0 callout at `README.md:25-30`.

The features are also not represented in the comparison table (`README.md:196-207`) — which is a missed opportunity, because `validator.js` does not ship flag emojis or `Intl.DisplayNames`-backed country names either, and that delta is the entire reason a consumer would adopt the catalog subpath.

**Severity:** medium

### Friction 5 — No example showing `flagEmoji` / `listCountries` / `getCountryInfo`

The eight examples at `/mnt/e/projects_ideas/nationid_example/src/examples/` ship a hand-rolled `COUNTRY_META` table in `@/lib/countries.ts` (referenced from `nationid_example/src/examples/ReactHookFormExample.tsx:13` and `nationid_example/src/examples/DynamicPickerExample.tsx:9`) to provide flag + name per country. This duplicates exactly what `nationid/catalog`'s new v1.1 functions provide for free. From a discovery standpoint this is a flashing red light: the *library's own showcase* does not consume the v1.1 catalog, so a consumer copying the showcase code will keep hand-maintaining a country table.

Note that the `BR_CNPJ_ALPHANUM_SOURCE` and `MX_NSS_SOURCE` examples (`nationid_example/src/examples/BrCnpjAlphanumExample.tsx:143-166`, `nationid_example/src/examples/MxNssExample.tsx:151-167`) embed inline source snippets that *do* show the right API patterns — but the React components mix in `COUNTRY_META[code].flag` calls that should now be `flagEmoji(code)`.

**Severity:** medium-high (the showcase is the most-clicked surface — playground link is line 13 of the README, above install)

### Friction 6 — `validate(code, input)` shape lies a little about the runtime

The JSDoc at `src/index.ts:166-186` and the Quick Start at `README.md:48-65` both present `validate` as the obvious entry point. But the inline implementation `return getSpec(code).validate(input)` (`src/index.ts:188`) is one call deep, and the spec's `validate` is the one that handles regex + check digit. A consumer might assume `validate()` is the "cheap" path and `parse()` is the "rich" path — actually they do the same regex-and-checksum work and differ only in return shape. A note in the JSDoc saying "no performance difference vs `parse()`, pick on return shape" would head off needless micro-optimization branches in consumer code.

**Severity:** low

### Friction 7 — `format()` silently returns input unchanged on bad input

`src/index.ts:212-228` documents the soft fallback ("If `input` is not a valid number for `code`, returns `input` unchanged"). This is an intentional design choice — defensible because render-path code must never throw — but a consumer who writes `<input value={format(code, raw)} />` and the user types two characters will see those two characters unchanged. The component renders cleanly, but the lack of any signal that formatting was a no-op can mask real bugs (typo in `code`, wrong field bound, etc.).

A second-tier `format()` returning `{ ok: boolean, value: string }` is overkill, but a one-line note in the README ("`format` is best-effort; use `parse().formatted` if you need to know whether formatting actually ran") would close the loop.

**Severity:** low

### Friction 8 — `listSupportedCountries()` returns insertion order, not sorted

`src/index.ts:287-293` returns countries in `REGISTRY.values()` iteration order, which matches `BUNDLES` declaration order in `src/index.ts:72-110`. The result is `["SV", "MX", "CO", "BR", ...]` — El Salvador first, US fourteenth, UK twenty-third. A consumer who pipes this directly into a `<select>` ends up with a country dropdown that starts with El Salvador and ends with Finland, which most LATAM users would find confusing and most European users would find baffling.

The catalog's `listCountries(locale)` at `src/catalog/countries.ts:226-229` inherits the same order. The JSDoc at `src/catalog/countries.ts:204-208` does acknowledge this and points the consumer to `.toSorted((a, b) => a.name.localeCompare(b.name, "es"))`, which is correct guidance — but the JSDoc lives on the function, not on the README. A first-time consumer needs to find it in their IDE.

**Severity:** low

### Friction 9 — Subpath imports lack a "when to use" decision aid

The README at `README.md:90-103` shows `import { validate } from "nationid/sv"` and says "Single country, ~3-5KB gzipped." But it doesn't help the consumer answer the actual decision question: "If my app needs Brazil, Mexico, and Chile, do I do three subpath imports or one root import?" The size-limit table in `package.json:322-378` answers this implicitly (root is 45KB, three subpaths are ~9KB) but is not surfaced in the README. The BENCHMARKS.md sibling is referenced (`README.md:15`) but for runtime perf, not bundle decisions.

This matters because the per-country API surface is *not* identical to the root API: `src/countries/sv/index.ts:38-74` exposes `validate / format / normalize / parse` with `(code: SVDocumentType | ShortCode, input)` signatures — including `"DUI"` and `"NIT"` short codes that the root API does not accept. A consumer who starts with `nationid/sv` and migrates to root for multi-country support has to rewrite call sites to use the fully-qualified `"SV_DUI"` form.

**Severity:** low-medium

### Friction 10 — `Locale` types are duplicated across `i18n` and `catalog`

`src/i18n/index.ts:30` exports `type Locale = "es" | "en" | "pt"` and `src/catalog/types.ts:11` exports another `type Locale = "es" | "en" | "pt"`. They are structurally identical today, but they are *nominally distinct* types from TypeScript's perspective only if a consumer happens to import both — practically they are interchangeable, but a consumer who builds a `useLocale()` hook has to decide which `Locale` to import or re-declare their own. The showcase site does the latter (`nationid_example/src/examples/ReactHookFormExample.tsx:14` imports a custom `useLocale`).

Worse, `src/catalog/countries.ts:161` (the v1.1 `countryName`) accepts a `locale: string` parameter (`src/catalog/countries.ts:226` likewise), not `Locale`. The same module exports `Locale = "es" | "en" | "pt"` for `listDocuments` and a wider `string` for `countryName`. A consumer who reads the export list at `src/catalog/index.ts:24-25` and tries to use `Locale` consistently ends up with a type error on `listCountries`.

**Severity:** low

## First-30-seconds simulation

A developer lands on `README.md:1-46` — a single screen on a 1080p monitor. They see:

1. The tagline at line 5: "TypeScript-first, zero-dependency validator for national identity and tax documents from every country." Strong, specific, no fluff.
2. Five badges (npm, bundle, types, license, CI) at lines 7-11. Cheap social proof.
3. The live playground link at line 13. **Critical:** this is above the install instructions. A skim-reader who clicks immediately leaves the README and lands on the showcase — which uses the v1.1 features (`nationid_example/src/examples/...`) but not the v1.1 catalog API. Mixed signal.
4. The "Why" paragraph at lines 19-23 nails the differentiator in two sentences ("`validator.js` only validates 6 LATAM tax IDs"). This is excellent. The developer learns the value prop before the API.

They scroll past the v1.0 release notes (lines 25-32 — useful for existing v0.x users but pure friction for first-timers) and land on Install at line 34. `npm i nationid`. They paste the Quick Start at lines 48-65 into a scratch file. It compiles. `validate("SV_DUI", "04567890-3")` returns `true`. **Time-to-first-success: ~90 seconds.**

Now they try `validate("SV_DUI", "")`. It returns `false`. They want the reason. They scroll to lines 67-73 — yes, `parse()` with `r.reason.kind`. They try it. They get `"empty"`. They want a user-facing string. They scroll for "error message" — not in the Quick Start. They scroll past Tree-shakable subpaths (lines 90-103), then they find it at line 121: `getErrorMessage`. **Time-to-first-error-message-shown: ~5 minutes.**

They look for "react-hook-form" in the README. No hits. They click the playground link, find `ReactHookFormExample.tsx`, and adapt it. **Time-to-first-form: ~15 minutes**, dominated by the round trip through the playground site.

The delight moments are: (a) the `confidence` field in `parse()` results — they didn't know they wanted that until they saw it; (b) hover types in their IDE showing `r.code` narrowed to `"SV_DUI"` instead of the union; (c) `mask("BR_CPF", "12345678901")` returning `"***.***.**9-01"` with separators preserved. All three are unique to nationid in this competitive set.

The stuck moments are: (a) finding `getErrorMessage`; (b) realizing `validate()` *throws* on unknown codes; (c) not knowing whether to use `nationid/br` or `nationid` for their multi-country form.

## Comparison vs first-contact with `validator.js` / `cpf-cnpj-validator`

**vs `validator.js`:** nationid wins decisively on TypeScript inference (`validator.js` ships `string => boolean` for everything; `.isTaxID(value, locale)` has no narrowing of `locale`), on `parse()` returning structured data (validator.js has no equivalent — you call `isXxx`, get a boolean, and re-run formatting separately), and on the i18n story (validator.js has no error-message helper at all). validator.js wins on README brevity — it lists every validator in a single table — and on time-to-first-validate (`validator.isEmail("x@y.com")` is one identifier shorter than `validate("X_X", "value")`). For a consumer doing pan-LATAM ID validation, nationid is the obvious choice; for a consumer doing a generic email/URL/UUID lib search, validator.js still has the edge purely on surface familiarity.

**vs `cpf-cnpj-validator`:** nationid wins on everything except Brazil-specific test fixtures (`@brazilian-utils/brazilian-utils` is the gold standard for those). `cpf-cnpj-validator`'s API is `cpf.isValid(value)` — fine, but it has zero TypeScript narrowing, no `parse()`, no `confidence` field, no per-locale errors, no mask. Once you cross into the second country, `cpf-cnpj-validator` is over. nationid's `mask("BR_CPF", "12345678901")` returning `"***.***.**9-01"` (i.e., `src/pii/index.ts:56-72` keeping separators) is a feature `cpf-cnpj-validator` does not have at all.

The one thing both competitors win on: **error tolerance from the consumer's perspective.** `cpf.isValid("not a cpf")` returns `false`, full stop, no exceptions. `nationid.validate("BR_CPF", "not a cpf")` also returns `false` — but `nationid.validate("not_a_code" as any, "x")` throws. The unknown-code throw is correct per the JSDoc, but it makes nationid feel slightly less "I can throw any string at it" than the older single-purpose libs.

## Recommendations (priority order)

1. **Add `getErrorMessage` to the README Quick Start** — *what*: append four lines to the `parse()` example block (`README.md:67-73`) showing the localized message round-trip. *Why*: closes the time-to-first-error-message-shown gap from ~5 min to ~30 seconds. *Effort*: 5 minutes. *Suggested copy*:

   ```ts
   import { getErrorMessage } from "nationid/i18n";

   const r = parse("SV_DUI", "12");
   if (!r.ok) {
     // "El DUI es demasiado corto."
     showError(getErrorMessage(r.reason, "es", "DUI"));
   }
   ```

2. **Fix the `error` vs `reason` JSDoc inconsistency on `parse()`** — *what*: edit `src/index.ts:230-259` to say "`{ ok: false, reason: { kind, ... } }`" everywhere (it currently says `error` in the prose at lines 232 and 244). *Why*: a developer reading the JSDoc and trying `r.error.kind` will get a TS error that costs them 30 seconds and a confidence hit. *Effort*: 2 minutes, no code change.

3. **Add a "What's new in v1.1" section to the README** — *what*: mirror the v1.0 callout (`README.md:25-32`) with a 4-bullet v1.1 section listing `flagEmoji`, `listCountries`, `getCountryInfo`, `countryName`, with one inline example. Place above the "Install" section. *Why*: v1.1 is fresh, the headline new features are *invisible* to a current-day README skimmer. *Effort*: 15 minutes.

4. **Rewrite the showcase site to consume the v1.1 catalog** — *what*: replace the hand-rolled `COUNTRY_META` table in `@/lib/countries.ts` with `getCountryInfo(code, locale)` from `nationid/catalog`. The eight examples at `nationid_example/src/examples/` then dogfood the new API. *Why*: the showcase is the most-clicked surface — every minute a consumer spends on the playground is a minute reinforcing the v1.0 API mental model and ignoring v1.1. *Effort*: 1-2 hours including PR.

5. **Document the "subpath vs root" decision tree** — *what*: add a 4-row table or 3-bullet decision aid below `README.md:103` showing: 1 country = subpath, 2-3 countries = subpath each, 4+ countries OR dynamic country selection = root. Reference the actual size-limit numbers from `package.json:322-378`. *Why*: this is currently a hidden decision; consumers either over-import (root for one country) or under-import (subpath for many) and learn the right pattern from bundle-size complaints in production. *Effort*: 20 minutes.

6. **Document the unknown-code throw on `validate / parse / format / normalize`** — *what*: add a single line to the README ("All root functions throw `Error` if `code` is not registered. The `DocumentTypeCode` union enforces this at compile time; runtime-typed `code` strings should be validated against `listSupportedCodes()` first.") below the `parse()` example. *Why*: the JSDoc says it but the README does not. The mental model "parse never throws" is half-true. *Effort*: 5 minutes.

7. **Add the v1.1 catalog row to the comparison table** — *what*: add three rows to `README.md:196-207`: "Country names (CLDR-backed)", "Flag emojis", "Locales out-of-box". Mark ✅ for nationid, ❌ for all three competitors. *Why*: the comparison table is where consumers decide. v1.1 widens the moat versus validator.js but the table doesn't reflect it. *Effort*: 10 minutes.

8. **Sort or document the `listSupportedCountries()` ordering choice** — *what*: either (a) default-sort the result of `listSupportedCountries()` and `listCountries(locale)` alphabetically by localized name, exposing the current insertion order as an opt-in `{ order: "insertion" }` option, or (b) prominently document the ordering at the top of both function JSDocs and add a copy-paste sort recipe. *Why*: the current insertion order surfaces El Salvador first, which is a charming Easter egg for the author and a confusing UX choice for consumers. *Effort*: 1 hour (option a, with API design + a deprecation cycle) or 15 minutes (option b).

9. **Unify `Locale` across `nationid/i18n` and `nationid/catalog`** — *what*: re-export the `Locale` type from a single canonical location (probably `src/core/types.ts`) and have both subpaths import it. Additionally, decide whether `countryName(code, locale)` and `listCountries(locale)` should accept `string` (current — supports any BCP 47 tag) or `Locale` (consistent with `getErrorMessage`). The current asymmetry is real. *Why*: small but real cognitive load — and the asymmetry will be load-bearing once `@nationid/react` lands and the React companion has to import a `Locale` type from somewhere. *Effort*: 30 minutes if you keep `string` for country APIs (most likely the right answer since `Intl.DisplayNames` accepts any BCP 47 tag) plus a documentation pass; 1-2 hours if you narrow the country APIs to `Locale`.

10. **One-sentence note that `format()` is best-effort** — *what*: add to the `format()` JSDoc (`src/index.ts:212-225`) "Returns `input` unchanged when `input` does not match the spec's regex. Use `parse(...).formatted` to distinguish 'no-op' from 'formatted'." *Why*: today the soft fallback is documented but the implication ("use parse if you care") is not spelled out. *Effort*: 2 minutes.

---

**For 9/10 the gap to close:** the three medium-severity frictions (error-message discoverability, `reason` vs `error` JSDoc inconsistency, v1.1 catalog burial in the README). All three are documentation/copy-paste fixes — none touch the runtime. The library's runtime DX is already 9-class; only the surfacing is 8.

**For 10/10 the gap to close:** an `@nationid/react` companion with a `<DocumentInput country code locale onValidatedSubmit />` hook would close the last mile on time-to-first-form. The roadmap (`README.md:218`) already lists this for v1.1+. Until that ships, the library is in the "very good for a primitive lib, not yet best-in-class for a framework" tier — which is honest and appropriate.
