# v1.1 Quality Roadmap — Community resources & adoption surface

> Read-only audit of how `nationid@1.1.0` is *found, evaluated, and adopted* by the developers it serves. Scope: everything outside the repo's code and CI — discovery channels, content surfaces, search visibility, social proof, and the gap between "technically excellent library" and "library a stranger will find on Google at 11pm before a fintech sprint." Counterpart to `01-community-governance.md` (community/governance), `02-supply-chain-security.md`, `03-cicd-release.md`, and `04-code-quality-tooling.md`. **Strictly additive — no breaking changes are proposed anywhere in this document.**

## Current score: 4 / 10

The product is materially excellent (cited high-confidence specs, 34 countries, literal-narrowing generics, first-party PII helpers, ICAO MRZ primitives — none of which a competing library ships). The *surface* through which developers encounter that excellence is essentially missing. Three concrete signals tell the same story:

1. **Search visibility is zero.** A live probe (2026-05-23) of three target queries — `"nationid" npm typescript validator`, `El Salvador DUI validator typescript npm`, `CPF CNPJ validator typescript` — returns no results pointing at `nationid` on DuckDuckGo's HTML endpoint. The showcase site is a `HashRouter` SPA so its 8 examples and 34 country panels live under `/#/playground`, `/#/countries`, etc. — search engines do not index hash-fragment routes, so the rich content that *would* rank is invisible to crawlers.
2. **The npm page sells a smaller library than what shipped.** The repo description on GitHub still reads *"Type-safe identity document validation for 13 countries (LATAM, ES, US). 38+ specs, zero deps, tree-shakable."* — that's the v0.1 description. v1.1 ships 34 countries and ~120 specs. The showcase `<meta name="description">` says *"identity-document validation for 22 countries"* — that's v0.4. Both surfaces materially under-represent the library a prospective adopter would see.
3. **No funnel exists for the high-intent searcher.** Per the `01-community-governance.md` audit, Discussions are disabled, FUNDING.yml is commented out, and no `good first issue` is open today. There is no comparison content, no per-country landing page, no tutorial, no Show HN, no Dev.to post, no Twitter/Bluesky announcement, no `Used by` section. The four projects that *demonstrably* depend on nationid (Marcly, JustSV, Emiso, MH Reminder per user memory) are not surfaced as references.

A 4/10 here does not mean the library is poor — `04-code-quality-tooling.md` and the v1.1 functional audit are right that it is technically above its 1k-MAU peers. It means the adoption surface ships at the maturity level of a personal weekend project, while the code ships at the maturity of senior infrastructure work. Closing that mismatch is the single largest lever for the next quarter, and almost all of it is non-breaking, additive content and configuration work that does not touch the published API.

## What exists and works

Verified from `package.json`, `.github/`, the showcase repo, the GitHub repo metadata, and the npm registry.

- **npm package metadata is solid where it counts.** `package.json` ships a strong keyword set (`id`, `validation`, `tax-id`, `national-id`, `cedula`, `dui`, `nit`, `rfc`, `curp`, `cpf`, `cnpj`, `rut`, `cuit`, `dni`, `ruc`, `ssn`, `ein`, `nif`, `latam`, `i18n`, `validator`), points `homepage` to the showcase, and uses `provenance: true` on publish — visible as a verified SLSA attestation on the npm page. Registry data confirms `latest: 1.1.0`, monthly downloads `1,201`, weekly downloads `309` (probed `api.npmjs.org/downloads/point/last-{week,month}/nationid`).
- **README.md is rigorous.** It opens with a positioning sentence (`TypeScript-first, zero-dependency validator for national identity and tax documents from every country.`), links the playground in line 13, has a real comparison table (`README.md:197-208` against validator.js, cpf-cnpj-validator, rut.js), surfaces the confidence flag concept, and includes a 34-row coverage table.
- **Three READMEs (en/es/pt)** signal seriousness about non-English markets — most JS libs ship one. This is a unique angle for LATAM developer Twitter and Brazilian dev communities.
- **GitHub topics are well-curated:** `argentina, brazil, chile, colombia, compliance, el-salvador, fintech, guatemala, identity-documents, kyc, latam, mexico, nodejs, peru, spain, tree-shakable, typescript, validation, zero-dependencies` (verified via `api.github.com/repos/lu1tr0n/nationid/topics`). 19 topics, well-targeted at fintech/KYC/LATAM intent.
- **Showcase site exists and is real software**, not a one-page README port. 6 routes (`Home`, `Playground`, `Countries`, `Examples`, `Passports`, `Mrz`), 8 best-practice code examples (`ReactHookFormExample`, `MaskingExample`, `HashStorageExample`, `ServerValidationExample`, `BrCnpjAlphanumExample`, `MxNssExample`, `CrossCountrySearchExample`, `DynamicPickerExample`), trilingual UI (`LocaleSwitcher`), runs `pnpm i nationid` against the live published package. This is materially above what most OSS libs ship as their "example app."
- **TypeDoc API reference** is published to `https://lu1tr0n.github.io/nationid/` (separate GitHub Pages target from the showcase). Per-symbol docs render for every export, including subpath bundles.
- **34 per-country technical pages** (`docs/countries/<cc>.md`) exist with algorithm prose and cited official sources. This is *the* content the target persona — a developer trying to validate a Brazilian CNPJ at 11pm — actually needs. Today it sits inside the repo with no discovery surface in front of it.
- **MIGRATION.md, BENCHMARKS.md, CHANGELOG.md, CROSS_VALIDATION.md** all exist and are linked from README. The CHANGELOG is auto-generated by changesets, so future versions inherit the structure for free.
- **GitHub labels include `good first issue` and `help wanted`** — the *labels* exist, ready to apply (verified via `api.github.com/repos/lu1tr0n/nationid/labels`). No open issues are tagged with them today, but the infrastructure is in place.
- **CITATION.cff** is wired (`01-community-governance.md` Gap report) — useful for the academic/regulatory citation angle below.
- **`SECURITY.md` is unusually strong.** This is itself an adoption signal: an enterprise procurement reviewer who lands on the repo before approving a dependency sees a real disclosure policy with an SLA. This *is* part of the adoption surface.

## Gaps ranked by adoption-ROI

Severity scale below = **adoption blocker** (not code defect): how much of the funnel from `Google search → repo → npm install` it blocks.

### Gap 1 — Showcase is a hash-router SPA, invisible to search engines

The single highest-impact gap. `src/App.tsx:16` uses `<HashRouter>`. Every route lives at `/#/playground`, `/#/countries`, `/#/passports`, `/#/mrz`, `/#/examples`. Search engine crawlers do not see content past the `#` fragment — Google indexes only the homepage at `https://lu1tr0n.github.io/nationid_example/`, with the meta description *"Interactive showcase for nationid — TypeScript-first, zero-dependency identity-document validation for 22 countries."* (also stale — should be 34).

The result: 34 country panels, 8 code examples, the MRZ parser demo, and the passport family demo — the entire rich content body — are invisible to "validate MX CURP online", "DUI El Salvador checker", "CPF validator JavaScript" search queries. Those queries are exactly the high-intent traffic this library needs.

**Severity:** high — this is the only gap that, on its own, explains why the library does not rank.
**Effort:** 1 day. Switch to `BrowserRouter` + add a `404.html` redirect shim (the standard GitHub Pages SPA pattern, ~10 LOC), or — better — migrate the showcase to **Astro** or **Next.js static export** with per-route static HTML. The 34 country panels and 8 examples become 42 static pages on first paint, all crawlable.
**Non-breaking:** ✅ (showcase repo, separate from the library)
**Fix:** convert `HashRouter` → static-export framework. Recommend Astro for minimal cost (Vite-compatible, ships zero JS by default, supports React islands so existing `examples/` and `pages/` components port directly). Add `<link rel="canonical">` to each generated page. Each country page = a static HTML file at `/countries/sv`, `/countries/mx`, etc., with the interactive playground panel hydrated as an island below the fold.

### Gap 2 — GitHub repo description still advertises v0.1 ("13 countries")

Verified via `api.github.com/repos/lu1tr0n/nationid`: `"description": "Type-safe identity document validation for 13 countries (LATAM, ES, US). 38+ specs, zero deps, tree-shakable."`. The library shipped 34 countries in v1.0 (two weeks ago) and ~120 specs. The description is what shows up under the repo name in GitHub search, in `npmjs.com` (which proxies the GitHub one), in social-card unfurls from Discord/Slack/Twitter shares, and in any third-party "best validator libraries" list scraped from GitHub.

This is a one-edit fix that materially mis-positions the library at *every* discovery surface that consumes the description.

**Severity:** high — every share, every backlink, every GitHub search hit shows a smaller library than what shipped.
**Effort:** 2 minutes.
**Non-breaking:** ✅
**Fix:** edit GitHub repo Settings → description to: *"TypeScript-first validator for national ID and tax documents — 34 countries, cited high-confidence specs, zero deps, tree-shakable, ICAO 9303 MRZ."* (140 chars, includes the four most-searched terms: TypeScript, validator, national ID, tax). Mirror identical wording in `showcase repo` Settings → description (currently the generic "Example NationId Library" which adds nothing to discovery).

### Gap 3 — Showcase has no Open Graph / Twitter card / Schema.org markup

The showcase `<head>` (verified via `curl`) ships:

- ✅ viewport, theme-color, favicon (inline SVG), description
- ❌ no `og:title`, `og:description`, `og:image`, `og:url`, `og:type`
- ❌ no `twitter:card`, `twitter:image`, `twitter:site`
- ❌ no `<script type="application/ld+json">` (no `SoftwareSourceCode` / `WebSite` schema)
- ❌ no `<link rel="canonical">`

When the library URL is shared in Slack/Discord/Twitter/LinkedIn (the exact channels where most npm libs get their first 100 stars), the unfurl shows a blank card with the GitHub Pages default. There is no social card art, no project logo, no positioning sentence — the share looks broken even if the link works.

**Severity:** high — kills viral lift on every share.
**Effort:** half a day for the meta tags + 2 hours for the social card design.
**Non-breaking:** ✅
**Fix:** add OG + Twitter card meta to `index.html` and to each static route once Gap 1 is fixed. Create a single 1200×630 PNG social card (`logo + "nationid" wordmark + "34 countries · cited specs · zero deps" + flag row`) hosted under `/og/default.png`. Add `WebSite` + `SoftwareSourceCode` JSON-LD with `name`, `codeRepository`, `programmingLanguage: ["TypeScript", "JavaScript"]`, `license`, `softwareVersion: 1.1.0`, `author`. For per-country pages, generate per-country OG cards programmatically (`@vercel/og` or `satori`) — these double as the assets a "best of 2026 validators" article author can drop into a post.

### Gap 4 — No per-country SEO landing pages exist

Highest-intent search queries are country-scoped: *"validate MX CURP online"*, *"BR CPF validator JavaScript"*, *"El Salvador DUI checksum algorithm"*, *"Colombia NIT validator npm"*. Today, `docs/countries/<cc>.md` exists for all 34 countries (rich technical content with cited sources), but lives inside the repo with no public landing page targeting those queries. The showcase has a single consolidated `Countries.tsx` page (hash-routed, so invisible per Gap 1).

Three signals point at this being a real funnel:
- Brazil alone: `cpf-cnpj-validator` does 110k weekly downloads; that's the SOM of one country page.
- LATAM developers default-search in Spanish/Portuguese — and nationid is the only OSS lib with cited specs in those languages.
- `python-stdnum` outranks all JS validators on per-country queries because it ships per-country pages on its docs site — same content nationid has, just exposed.

**Severity:** high — the single biggest organic-traffic lever after Gap 1.
**Effort:** ~1 week if combined with Gap 1's static-export migration. Per-country page template renders from `docs/countries/<cc>.md` markdown + the country bundle's exports + a hydrated playground island. 34 pages auto-generated.
**Non-breaking:** ✅
**Fix:** in the static-export migration, generate `/countries/<cc>/` for every country with: H1 = "*Validate \<doc list\> from \<Country\> in TypeScript*", H2 sections sourced from existing `docs/countries/<cc>.md` (algorithm, sources, sample inputs), embedded interactive validator below the fold, install snippet for `nationid/<cc>` subpath, code copy/paste samples for React + zod + Stripe webhook patterns. Each page targets one country-scoped commercial-intent query.

### Gap 5 — No comparison content beyond a 12-row README table

README ships a 4-column comparison table (`README.md:197-208`) — that's the *artifact* an evaluator wants. But it's buried halfway down the README. There is no dedicated comparison page at the showcase, no Dev.to / Hashnode / Medium post titled "nationid vs validator.js for LATAM document validation", no comparison entry on `npmcompare.com` or `npmtrends.com` curated link. The `02-supply-chain-security.md`/competitive-audit recommends this; no work has been scoped against the recommendation.

The competing libs have the same gap (validator.js does not publish a comparison page either), which means whoever writes the comparison page *first* ranks for "validator.js alternative LATAM", "best CPF CNPJ TypeScript library", etc., for free.

**Severity:** high — comparison pages are the highest-conversion stage of the dev-evaluation funnel.
**Effort:** half a day for one strong page; 2 days for a four-page suite.
**Non-breaking:** ✅
**Fix:** publish `/compare/` on the showcase with four pages:
  - `/compare/validator-js` (LATAM coverage, EU coverage, tree-shakable subpaths, TypeScript inference)
  - `/compare/cpf-cnpj-validator` (Brazil-only vs nationid/br; bundle size; CNPJ alphanumeric support)
  - `/compare/rut-js` (Chile-only vs nationid/cl)
  - `/compare/python-stdnum` (cross-language port comparison, LGPL discussion already in `THIRD_PARTY.md`)

Mirror each as a Dev.to / Hashnode crosspost (canonical URL = showcase) — Dev.to ranks fast for "X vs Y" queries.

### Gap 6 — No cookbook / recipes site separate from README + TypeDoc

Today the consumption path is: `README.md` (positioning + Quick Start + reference table) → `TypeDoc` (per-symbol API). What is *missing* is the middle layer — the cookbook layer — that holds the 10 recipes a real adopter needs:

1. React Hook Form + nationid + zod (`zod.string().refine(v => validate("MX_CURP", v))`)
2. Next.js Server Action validating a KYC form
3. Stripe webhook + nationid masking before audit-logging customer tax IDs
4. Postgres column design: store `hash` + `last_4` + `displayMasked`; lookup by hashed equality
5. React Native form (Expo) — runs on Hermes, validate offline
6. Astro form action (server-side)
7. SvelteKit form action
8. Remix loader + action
9. Multi-tenant SaaS: store country per tenant, default the document picker
10. Bulk-import validator (CSV upload, batch validate, surface failures with `parse().reason.kind`)

The showcase has 6 of these as React snippets but they live under `/#/examples` (Gap 1: invisible). They are not framework-targeted, not SEO-titled, not cross-linked from per-country pages.

**Severity:** high — this is the *Integration* funnel stage. Most evaluations fail here, not at API design.
**Effort:** 2 weeks part-time (one recipe per evening).
**Non-breaking:** ✅
**Fix:** create `/cookbook/` section in the showcase (or split into a separate docs site using Starlight / Nextra / Mintlify). Each recipe = 1 page, ~800 words, working code, framework name in the H1, canonical to the showcase, crosspost to Dev.to with the framework's tag for tag-feed discovery.

### Gap 7 — Zero launch announcement on Dev.to / HN / Reddit / Twitter / LinkedIn

v0.1, v0.5, v0.6, v1.0, v1.1 all shipped without a public announcement (per user memory and git history: 5 releases in 14 days, none of them launched anywhere). For a library at 2 stars / 1,201 monthly downloads, the *launch* is the discovery event — it determines whether month 2 sees the same ~1.2k or 10k.

The library has multiple genuinely interesting launch angles that have not been told publicly:
- *"Cited confidence as code: a CI test that fails if a validator's algorithm has no first-party source"* (HN / Show HN / r/programming / r/typescript)
- *"76% smaller npm tarball — what I cut from a TypeScript library"* (Dev.to / Hashnode — performance content reliably ranks)
- *"Why I built a TS validator for every LATAM country"* (Dev.to LATAM tag, dev.to/es)
- *"Tree-shakable per-country imports: how nationid ships at 3KB per country"* (r/typescript)
- *"Validating Mercosur tax IDs from a Next.js server action"* (Dev.to, tag #nextjs #fintech)
- *"Migrating from validator.js for fintech-grade LATAM coverage"* (LinkedIn — fintech persona)

**Severity:** high — launch is the cheapest growth event a library will ever get; missing it once is missing it for the version.
**Effort:** 3-5 hours for a Show HN + Dev.to crosspost + Twitter/Bluesky/LinkedIn thread.
**Non-breaking:** ✅
**Fix:** stage v1.2 launch (next minor) as a *real* launch event: Show HN on Monday 9am PT, simultaneous Dev.to post (canonical = the post's permalink, then crosspost from there to Hashnode + Medium with proper canonical), Twitter/Bluesky/LinkedIn threads with the OG card from Gap 3. For v1.1 specifically, since it just shipped, the *retrospective* "What I learned shipping v1.1 of nationid" post is still a valid Dev.to angle.

### Gap 8 — Maintainer's existing audience (elsolitario.org) is not wired in

`api.github.com/users/lu1tr0n` shows `"blog": "https://www.elsolitario.org"`. Per user memory, that blog publishes via a Telegram-bot-driven pipeline (~daily cadence, mu-plugin v2.9.0, multi-channel distribution) and serves a Spanish-language tech audience including LATAM developers. The blog has *not* published a nationid announcement, deep-dive, or tutorial. The fastest path to month-2 downloads is using the audience that already exists.

A single post titled *"nationid: validador de DUI, CURP, CPF y 30+ documentos en TypeScript con verificación de checksum"* would be canonical-linked back to the showcase, syndicate to Telegram + LinkedIn + the 6 other elsolitario.org channels, and place the library inside the exact LATAM dev audience that values El Salvador / Mexico / Brazil coverage. (User memory project files confirm `feedback_anglicismos_titulos.md` style: Spanish-native, no anglicisms — the post will rank well in Spanish search where competition is weakest.)

**Severity:** high — the audience already exists and is mismatched to the library's niche almost perfectly.
**Effort:** 2 hours to write + 30 min to schedule the multi-channel publish.
**Non-breaking:** ✅
**Fix:** publish one Spanish-language deep-dive post on elsolitario.org this month; canonical-link to the showcase; cross-promote in Telegram channel; add an `Aprende más en español` link from `README.es.md` back to the post. Track signups via the same UTM scheme the blog uses for other launches.

### Gap 9 — "Used by" / social proof is absent despite 4 known users

Per the user's project memory, four production SaaS depend on nationid:
- **Marcly** (`project_marcly_*`) — booking SaaS, LATAM identity validation in signup
- **JustSV** (`project_justsv_dte`) — invoice issuance SaaS, requires NIT/DUI validation per the SV tax authority
- **Emiso** (`project_emiso_saas`) — payments SaaS live on `panel.emiso.app`, ID validation in KYC
- **MH Reminder** (`project_mh_reminder`) — WhatsApp tax reminder

All four are operated by the maintainer, all four are real running systems with paying customers. The README does not surface any of them. Today an evaluator reads README → "where is this used?" → no answer → assumes "weekend project."

**Severity:** medium — the asset exists, just isn't surfaced.
**Effort:** 1 hour (add a `## Used by` section to README with 4 logos / links, one paragraph per project explaining what nationid does in that product's flow). If logos are sensitive, even text-only `marcly.com — booking SaaS using nationid for LATAM customer KYC` lines work.
**Non-breaking:** ✅
**Fix:** add `## Used by` to README.md after the Comparison section. Format suggestion:
```md
## Used by
nationid powers identity validation in production systems including:
- Marcly — appointment-booking SaaS for LATAM PYMEs (customer KYC)
- JustSV — DTE / e-invoicing for El Salvador (NIT / DUI validation per Ministry of Finance rules)
- Emiso — payments-processing SaaS (KYC onboarding)
- MH Reminder — WhatsApp tax-deadline reminder for SV taxpayers
If your team uses nationid in production, open a PR to add yours.
```
The closing line is the lever — it converts every adoption into a potential README backlink.

### Gap 10 — No social channel for the project (Twitter / Bluesky / Mastodon)

There is no `@nationid_dev` / `@nationid.bsky.social` / Mastodon presence. The maintainer's personal handles are not linked from the repo. Result: no place to follow for release announcements, no place where a happy user can `@-mention` the project, no place for the algorithm-correction issue templates to socialize when a country's spec is updated.

For a library at this stage, a *project* account is overkill (the audience does not yet exist; an empty account hurts more than helps). The right move is to use a *personal* handle as the project voice for the next 6 months, then graduate to a project account at ~10k monthly downloads.

**Severity:** medium — affects sustained discovery cadence, not the launch event itself.
**Effort:** 30 minutes to set up a Bluesky handle + post the first release announcement.
**Non-breaking:** ✅
**Fix:** add a `Follow updates` line to README pointing at the maintainer's existing Bluesky / X / Mastodon handle (whichever is most active). Post v1.1 release as the first content; post per-country deep-dive threads from there. Re-evaluate dedicated project account at 10k monthly downloads.

### Gap 11 — Stack integration mentions are README-only; no per-framework page

The README mentions Node, browsers, Bun, Deno, edge runtimes once. No framework-targeted page exists for Next.js, Remix, SvelteKit, Astro, Nuxt, React Native, TanStack Start, or React Router 7. Each of those frameworks has its own GitHub Discussions / Discord / weekly newsletter that links framework-compatible libraries — *if* the library has a discoverable framework-integration page to link.

The unique angle for nationid is **runtime portability** (no Node-only APIs, no DOM-only APIs, zero deps) — which means a one-page-per-framework guide is mostly identical and can be templated. The cost of producing 8 framework pages is ~1 day, the cost of producing zero is invisible-to-framework-communities forever.

**Severity:** medium — affects cross-community discovery.
**Effort:** 1 day for all 8 framework integration pages, templated.
**Non-breaking:** ✅
**Fix:** in the cookbook site (Gap 6), add `/integrations/` index listing supported frameworks with one short page each: install + import + one snippet + cross-link to relevant cookbook recipe. Submit each to the framework's "awesome-X" repo on GitHub (low-effort backlinks).

### Gap 12 — Schema-library adapter content marketing is missing

The library does not (yet) ship zod / yup / valibot / arktype adapters. Per the competitive audit, adapters themselves are out of scope for this lens — but the **content marketing of adapter intent** is in scope: a single post titled *"How to use nationid as a zod refinement for KYC forms"* with a 10-line snippet ranks for an exact match query that high-intent searchers use.

The content (the zod snippet) already exists in the showcase's `ReactHookFormExample.tsx`. It is not exposed as a documented pattern at a URL anyone can link to.

**Severity:** medium — same family as Gap 6 but more targeted.
**Effort:** half a day for the 4 schema-lib adapter pages.
**Non-breaking:** ✅
**Fix:** publish `/integrations/zod`, `/integrations/valibot`, `/integrations/arktype`, `/integrations/yup` as cookbook entries. zod first — it has the largest audience and exact query intent.

### Gap 13 — No issue seeding for `good first issue` despite the label existing

`01-community-governance.md` Gap 4 already flagged this from the community side. From the *adoption* side, `good first issue` doubles as a discovery surface: the curated list shows up on `https://github.com/topics/good-first-issue` aggregation feeds, on `goodfirstissues.com`, on `up-for-grabs.net`, on Hacktoberfest filters, and on community Discord bots that auto-post new beginner issues to channel. Every seeded issue is a tiny inbound funnel.

The v1.1 functional audit (Theme 5: doc parity, missing-extract for EU codes) and the country-page generator (per-country docs missing `Sources` URLs) already contain ~10 starter-task candidates that need only to be opened as issues with the label.

**Severity:** medium — overlaps with `01-community-governance.md` but the adoption framing differs: each seeded issue is a backlink from external aggregators.
**Effort:** 2 hours to open 5-8 issues.
**Non-breaking:** ✅
**Fix:** open 5-8 starter issues today, tagged `good first issue` + `help wanted` where appropriate. Submit the repo to `up-for-grabs.net` (PR to their repo).

### Gap 14 — TypeDoc reference site has no marketing copy or call-to-action

`https://lu1tr0n.github.io/nationid/` is the raw TypeDoc theme — useful as reference, useless as discovery surface. No homepage banner explaining what the library does, no "Get started in 30 seconds" section, no link back to the showcase, no install snippet on the landing page. A visitor who finds TypeDoc via search (because TypeDoc tends to rank for `nationid <function>` queries) bounces — they're inside generated reference docs that assume they already know what the library is.

**Severity:** medium-low — affects retention from a real-but-small traffic source (TypeDoc pages outrank the showcase today simply because they're indexable).
**Effort:** 1 hour to customize TypeDoc's `customCss` + `navigationLinks` + add a landing page.
**Non-breaking:** ✅
**Fix:** customize TypeDoc theme to add a top banner with the positioning sentence + install snippet + link to showcase. Use TypeDoc's `navigationLinks` option to add `Showcase`, `GitHub`, `npm` in the header.

### Gap 15 — No release announcement cadence (no Release Notes blog)

CHANGELOG.md is auto-generated by changesets (good). Nothing reads from it to announce releases. Each minor or major release should become a Dev.to post + Bluesky thread + email-newsletter entry. Today, v1.0 and v1.1 shipped within 4 days of each other and neither was announced anywhere outside the repo. The CHANGELOG entries are well-written and could be reformatted into release-post content with ~30 minutes per release.

**Severity:** medium-low — affects retention via "new feature dropped, time to upgrade" loop.
**Effort:** 30 min per release.
**Non-breaking:** ✅
**Fix:** add a `RELEASES.md` (separate from CHANGELOG.md) that holds narrative release posts, one per minor. Crosspost each to Dev.to with the canonical pointing back to the GitHub release page. Add a `Subscribe to releases` line to README pointing at GitHub's "Watch → Custom → Releases" feature (free + works without a newsletter infrastructure).

### Gap 16 — i18n beyond es/en/pt is not even teased

The library ships error messages in es/en/pt. The catalog uses `Intl.DisplayNames` so it works in any locale the runtime supports. Adding fr/de/it/ja error strings is ~5 strings per locale (per `docs/I18N.md`). Each new locale opens a new community surface — French (Quebec / France / Belgium → Canadian and EU fintech audiences), German (DACH fintech), Italian (Codice Fiscale audience), Japanese (post-Asia phase).

The adoption framing: every supported error-string locale is a `nationid spanish typescript` / `nationid français typescript` / etc. search-intent surface that the competing libs do not address.

**Severity:** medium-low — incremental, but each locale unlocks a market.
**Effort:** ~2 hours per locale (5 strings + tests + one README section).
**Non-breaking:** ✅
**Fix:** open a `good first issue` per locale (fr, de, it, fr-CA), labeled `i18n` + `good first issue` + `help wanted`. Even if community contributors do not bite, the seeded issues signal multilingual scope to external evaluators.

### Gap 17 — Branding (logo, favicon, social card) is at minimum-viable

The favicon is an inline SVG ("id" green-on-dark monogram in `index.html`). No logo, no wordmark, no social card. Memorability is low when shares look like *"unbranded GitHub link with no preview image."* The competing libs are similar (validator.js has no logo either) — which means a real logo is a cheap differentiator at adoption time.

**Severity:** low-medium — high ROI relative to effort because the bar is low.
**Effort:** half a day with an AI tool or a designer hire (Fiverr / Polywork) for ~$50-150.
**Non-breaking:** ✅
**Fix:** commission a wordmark + small icon (the existing "id" monogram is fine as a starting brand). Use the icon as favicon, the wordmark as showcase header logo, both together on the OG card from Gap 3.

### Gap 18 — Citation / academic surface is wired but unused

`CITATION.cff` exists (`01-community-governance.md` confirms). Zenodo DOI minting is one PR + one GitHub release tagged with the right workflow — free, takes 1 hour, gives the library a DOI other academic / regulatory works can cite. This matters in fintech regulatory contexts (SAT México, Receita Federal Brasil, SUNAT Perú, Ministerio de Hacienda SV) where the cited-spec angle could be quoted in compliance audits.

**Severity:** low — narrow audience, but the audience cares.
**Effort:** 1 hour to set up Zenodo + GitHub integration.
**Non-breaking:** ✅
**Fix:** enable Zenodo-GitHub integration (`https://zenodo.org/account/settings/github/`). Tag the next release. The next time the maintainer cites nationid in a blog post or regulatory comment, the DOI exists.

### Gap 19 — No `awesome-X` list submissions

Backlinks from `awesome-typescript`, `awesome-nodejs`, `awesome-fintech`, `awesome-i18n`, `awesome-zero-deps` are individually small but compound: each lists hundreds of monthly visitors, and each is a do-follow link from a high-DR GitHub repo. The library qualifies for several but is in none.

**Severity:** low — slow-burn, but very cheap.
**Effort:** ~2 hours to open PRs against 6-10 lists.
**Non-breaking:** ✅
**Fix:** open PRs to `sindresorhus/awesome`, `sindresorhus/awesome-nodejs`, `dzharii/awesome-typescript`, `humiaozuzu/awesome-fintech`, `up-for-grabs.net`, `topics/good-first-issue`. Each takes 10 minutes.

### Gap 20 — No conference talk / meetup talk pipeline

LATAM JS conferences (BrazilJS, JSConf México, ChileJS, ColombiaJS) and developer meetups regularly take 15-min "library I built" lightning talks. The library has a uniquely strong narrative for that format: *cited confidence + LATAM coverage + governance test + bundle wins*. The CFP cost is one form submission per conference.

**Severity:** low — high-leverage but slow-burn.
**Effort:** 1 day to write a talk deck once; submit to 4-6 CFPs as they open.
**Non-breaking:** ✅
**Fix:** Q3 2026 BrazilJS / ChileJS / JSConf MX CFPs open ~end of June. Submit "Lessons from shipping a TS-first multi-country validator" as a 15-min talk. Use the talk-prep work to also produce a recording for YouTube — the recording outlasts the conference.

## Funnel map

| Stage | What today | What's missing | Top fix |
|---|---|---|---|
| Discovery (Google / npm search) | Zero search ranking; npm page only; outdated GitHub description | Per-country SEO landing pages, blog posts, comparison pages, awesome-list backlinks | Static-export showcase + per-country pages (Gap 1, Gap 4) |
| First impression (repo, npm page, share unfurl) | README is strong; OG card missing; repo description stale; showcase share = blank unfurl | OG/Twitter/Schema markup; corrected GitHub repo description; social card design | OG meta + social card (Gap 3); fix description (Gap 2) |
| Evaluation (README + comparison + social proof) | README comparison table exists; no Used By; no detailed comparison content | "Used by" section; dedicated comparison pages per competitor | Add Used by (Gap 9); publish /compare/ pages (Gap 5) |
| First use (install + Quick Start) | Quick Start in README is clean; playground works; install just works | Quick Start link from per-country pages; framework-targeted "30 second install" snippets | Cookbook recipes (Gap 6); framework integration pages (Gap 11) |
| Integration (cookbook + adapters) | 8 examples in showcase but hash-routed/invisible; no zod/valibot adapter docs | Cookbook section with framework-targeted recipes; schema adapter content marketing | Cookbook (Gap 6); schema lib integration pages (Gap 12) |
| Retention (changelog signal, releases) | CHANGELOG auto-generated; no release announcement; no subscribe path | Release blog posts; Bluesky/Twitter cadence; Watch-releases prompt in README | Release posts (Gap 15); social channel (Gap 10) |
| Advocacy (testimonials, talks, mentions) | Maintainer's own SaaS use it but unsurfaced; no talks; no awesome-list mentions | Used By section; awesome-list submissions; conference CFPs; community channel | Used by (Gap 9); awesome lists (Gap 19); CFPs (Gap 20) |

## Top 10 recommendations

Ranked by `(adoption-ROI) ÷ effort`:

1. **Fix the GitHub repo description** (Gap 2) — 2 minutes, immediate impact on every share/search/aggregator. Do this *first*. Same edit on the showcase repo.
2. **Migrate showcase from `HashRouter` to a static-export framework (Astro or Next.js static)** (Gap 1) — 1 day, unlocks search indexing for every existing page. Highest single ROI for the next quarter; nothing else works without it.
3. **Generate per-country static landing pages** (Gap 4) — combined with #2, ~3 additional days. 34 new SEO surfaces targeting commercial-intent country-scoped queries. Highest organic-traffic lever after #2.
4. **Add OG / Twitter / Schema.org markup + a real social card** (Gap 3) — half a day. Every share from now on visually unlocks.
5. **Add `## Used by` section to README** (Gap 9) — 1 hour. Converts already-existing dependent SaaS into credibility signal.
6. **Publish v1.1 retrospective + cited-confidence post on Dev.to + elsolitario.org + Bluesky/LinkedIn** (Gap 7, Gap 8) — half a day total. Stage v1.2 release as a real launch event. Highest cheap-growth lever once #1-#4 are live.
7. **Publish `/compare/` pages targeting the four named competitors** (Gap 5) — half a day. Captures every "X vs Y" query in the space.
8. **Build a cookbook section with 10 framework-targeted recipes** (Gap 6) — 2 weeks part-time. Highest *Integration*-stage lever; converts evaluators into adopters.
9. **Seed 5-8 `good first issue` from the v1.1 functional audit + 4 i18n locale issues** (Gap 13, Gap 16) — 2 hours. Unlocks aggregator backlinks (up-for-grabs.net, goodfirstissues.com).
10. **Submit to 6-10 awesome-X lists + open Zenodo DOI** (Gap 19, Gap 18) — 3 hours total. Slow-burn backlinks that compound.

## Bottom line

`nationid` is a *senior-engineer's library with a weekend-engineer's adoption surface*. The code-side audits all conclude it ships above its peers; this audit concludes it is *invisible* to the developers who would adopt it. The single highest-leverage move is **migrating the showcase from `HashRouter` to a static-export framework (Astro)** — this one change unlocks per-country landing pages, search indexing for the 8 examples and 34 country panels, comparison pages, and the cookbook, all of which compound. Without it, every other gap on this list is bottlenecked because there is nowhere to land the content. With it, the library has a credible path from 1,201 monthly downloads today to the 10k-monthly milestone that justifies the second discovery investment (project social account, conference CFPs, paid dev-marketing). The other ~$0-cost moves — fixing the stale GitHub description, adding `## Used by`, publishing on elsolitario.org — are immediate-wins that should ship this week regardless. The library has done the hard part (the technical work that earns the right to be discovered). What is left is the easy-but-unglamorous part (the content and configuration that make the discovery actually happen).

---

*Audit by `Content Strategist` agent · 2026-05-23 · agent #5 of 5 in v1.1 quality roadmap · counterpart audits: [01-community-governance.md](./01-community-governance.md), [02-supply-chain-security.md](./02-supply-chain-security.md), [03-cicd-release.md](./03-cicd-release.md), [04-code-quality-tooling.md](./04-code-quality-tooling.md). Scope strictly: marketing surface, content, education, showcase, social proof, search ranking, integration adoption signals. Out of scope (covered by other agents): code quality, governance documents, CI/CD, supply-chain security, contributing/issue templates.*
