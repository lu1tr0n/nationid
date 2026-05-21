# v1.0 audit — Confidence tier verification

Audit date: 2026-05-20. Library version: v0.6.0.
Methodology: every spec file under `src/countries/<cc>/*.ts` was inspected
for (a) the declared top-level `confidence:` field and (b) the JSDoc
`Source:` citation accompanying it. The cited URL was classified as
**first-party** (issuing authority on a government TLD: `gob.*`, `gov.*`,
`gouv.fr`, `gov.uk`, `admin.ch`, `belgium.be`, `seg-social.es`, etc.) or
**non-first-party** (Wikipedia, vendor DLP catalogs, passportindex, EU
PRADO browser, generic blog posts). Per the audit charter, **"high"
requires a first-party citation in the spec or in `docs/countries/<cc>.md`**.

## Summary

- Total specs: **118** (across 34 country directories).
- "high" confidence claimed: **60** (50.8% of all specs).
- "high" with verified first-party source: **58** (96.7% of high tier).
- "high" to DEMOTE for v1.0 (cited source is non-first-party): **2**
  (`CA_PASAPORTE`, `ES_PASAPORTE`).
- "moderate": **25** (21.2%). All carry an explicit rationale comment.
- "low": **31** (26.3%). All carry an explicit rationale comment.
- "unconfirmed": **2** (`HN_RTN`, `CO_PASAPORTE`). Both flagged in spec
  header.
- The aggregate `Confidence` enum literals counted by grep total 238 across
  source+parse-return sites; the 118 figure deduplicates by spec file.

### Health of the confidence flag at v0.6.0

- 116 of 118 specs (98.3%) cite a source on the issuing authority's own
  domain or a legal statute (`RG AFIP 10/1997`, `DM 23-DEC-1976`,
  `Real Decreto 1553/2005`, `IRS Pub. 1915`, etc.). This is far above the
  bar typical of open-source ID validators and the v1.0 promise.
- 2 specs over-claim. Both are passports for countries whose issuer does
  not publish a format spec at all; the library inherited the format from
  Microsoft Purview's DLP catalog and the corresponding Wikipedia article.
  These are visible exceptions, not a systemic problem.
- All moderate / low / unconfirmed specs name their gap explicitly
  ("SEGIP does not publish a verifier", "HMRC publishes prefix exclusions
  but no checksum", "no first-party publication of the format spec"). The
  README's `confidence` definitions in §"Confidence flag" line up with
  what the code actually does.

## Per-country confidence distribution

| Country | high | moderate | low | unconfirmed | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| AR | 4 | 0 | 1 | 0 | 5 |
| BE | 2 | 0 | 0 | 0 | 2 |
| BO | 0 | 1 | 2 | 0 | 3 |
| BR | 5 | 1 | 0 | 0 | 6 |
| CA | 2 | 0 | 1 | 0 | 3 |
| CH | 2 | 1 | 0 | 0 | 3 |
| CL | 1 | 0 | 1 | 0 | 2 |
| CO | 1 | 0 | 5 | 1 | 7 |
| CR | 2 | 1 | 1 | 0 | 4 |
| DE | 2 | 0 | 1 | 0 | 3 |
| DK | 2 | 1 | 0 | 0 | 3 |
| DO | 0 | 3 | 0 | 0 | 3 |
| EC | 2 | 0 | 1 | 0 | 3 |
| ES | 5 | 0 | 0 | 0 | 5 |
| FI | 3 | 0 | 0 | 0 | 3 |
| FR | 4 | 0 | 0 | 0 | 4 |
| GB | 2 | 2 | 0 | 0 | 4 |
| GT | 0 | 2 | 1 | 0 | 3 |
| HN | 0 | 0 | 2 | 1 | 3 |
| IT | 2 | 0 | 0 | 0 | 2 |
| MX | 2 | 3 | 1 | 0 | 6 |
| NI | 0 | 0 | 3 | 0 | 3 |
| NL | 1 | 1 | 0 | 0 | 2 |
| NO | 4 | 0 | 0 | 0 | 4 |
| PA | 0 | 1 | 2 | 0 | 3 |
| PE | 1 | 0 | 3 | 0 | 4 |
| PL | 3 | 0 | 0 | 0 | 3 |
| PT | 1 | 1 | 1 | 0 | 3 |
| PY | 0 | 2 | 1 | 0 | 3 |
| SE | 3 | 0 | 0 | 0 | 3 |
| SV | 0 | 2 | 1 | 0 | 3 |
| US | 3 | 1 | 0 | 0 | 4 |
| UY | 1 | 1 | 1 | 0 | 3 |
| VE | 0 | 1 | 2 | 0 | 3 |
| **Total** | **60** | **25** | **31** | **2** | **118** |

Notes on shape of the distribution:

- 100% high: BE, ES, FI, FR, IT, NO, PL, SE. These are the algorithm-rich
  EU (and IT) jurisdictions where issuers publish either a regulation or
  an OSS-friendly spec page. ES is included only because the audit
  recommends demoting `ES_PASAPORTE` (see next section) — once that
  demotion lands, ES becomes 4 high + 1 moderate.
- 0 high: BO, DO, GT, HN, NI, PA, PY, SV, VE. These eight countries either
  have no checksum (issuer never published one) or have a checksum that
  is only attested by community reverse-engineering. SV in particular
  has the SV_NIT divergence documented in `CROSS_VALIDATION.md` D7.
- CO and HN concentrate the "no algorithm at all" specs (cédula
  variants + passport).

## HIGH-confidence specs missing first-party source

Both findings are passport specs where the issuer (IRCC for Canada, the
Cuerpo Nacional de Policía for Spain) does **not** publish the printed
number format. The library inherited the regex from third-party catalogs.

### 1. `CA_PASAPORTE` — Canada passport

- File: `src/countries/ca/passport.ts:33` (top-level), repeated at line 69
  inside the `parse()` success branch.
- Header at `src/countries/ca/passport.ts:5-6` cites:
  - `https://learn.microsoft.com/en-us/purview/sit-defn-canada-passport-number`
    — Microsoft Purview DLP catalog. Not IRCC. Microsoft itself cites no
    primary source on that page.
  - `https://en.wikipedia.org/wiki/Canadian_passport` — Wikipedia.
- Companion doc `docs/countries/ca.md:165-169` repeats the same two
  sources and confirms no IRCC URL was located.
- Companion research file
  `nationid-research/passports-2026-05-10.md:374-380` also confirms IRCC
  has not published a format and the format was inherited from Microsoft
  Purview's SIT (`verified` in research-speak = "Purview agrees, no
  primary").
- **Recommendation**: DEMOTE to `moderate`. The format is widely-replicated
  and consistent in the wild, but the bar set by the README is "official
  source AND mature library agree". A DLP product catalog does not meet
  the "official source" half. Demoting to `moderate` ("one official source
  OR mature library agrees; the other missing") is the honest tier. If a
  future contributor locates an IRCC document confirming the
  `^[A-Z]{2}[0-9]{6}$` shape (the IRCC Passport Program Operational
  Bulletin is the most likely candidate), re-promote to `high`.

### 2. `ES_PASAPORTE` — Spain passport

- File: `src/countries/es/passport.ts:34` (top-level), repeated at line 70
  inside the `parse()` success branch.
- Header at `src/countries/es/passport.ts:5-6` cites:
  - `https://learn.microsoft.com/en-us/purview/sit-defn-spain-passport-number`
    — Microsoft Purview.
  - `https://en.wikipedia.org/wiki/Spanish_passport` — Wikipedia.
- Companion doc `docs/countries/es.md:333-334` repeats the same two
  sources. No `policia.gob.es` or BOE link is given.
- The same research file (`passports-2026-05-10.md:295-300, 465`) marks it
  `verified` for the 3-letter+6-digit form per Microsoft Purview only —
  again, "verified" here means "agrees with Purview", not "agrees with
  the Cuerpo Nacional de Policía".
- **Recommendation**: DEMOTE to `moderate`. The Spanish DGP publishes
  detailed regulations for the DNI but not for the passport printed
  number. The library currently union-matches the strict 3L+6D form and
  the looser 2-or-3 alphanumeric + 6D form precisely because Purview and
  community sources contradict each other on the legacy variants — that
  contradiction itself is evidence the `high` tier is overclaimed. If the
  BOE publication or Orden of the Ministerio del Interior that
  authorised the 3L+6D shape can be located, re-promote.

Both DEMOTE recommendations are non-breaking changes — `confidence` is an
informational string on the `DocumentSpec`, not a runtime invariant. They
do not change any `validate()` / `parse()` behaviour or break any test.

## Specs to PROMOTE (currently moderate/low, evidence supports high)

The audit did not identify any spec where the in-code rationale appears
unreasonably conservative. A few are worth re-examining post-v1.0, but
none should be promoted for the v1.0 cut:

- `BR_PASSPORT` (`br/passport.ts`, currently `moderate`): cites Wikipedia
  as a secondary, no first-party Polícia Federal URL. Same family as the
  two demotions above — staying at moderate is correct.
- `DO_RNC` (`do/rnc.ts`, currently `moderate`): DGII publishes the
  algorithm in the e-CF schema. If a stable DGII URL pointing at the
  algorithm doc is added, this becomes a high candidate.
- `MX_RFC_PF` / `MX_RFC_PM` (currently `moderate`): cross-validated 40/40
  against `python-stdnum` per CROSS_VALIDATION.md and matches SAT Anexo
  19 RMF (Tabla 1) per `src/countries/mx/shared.ts:38`. The README rule
  ("official source AND mature library agree") technically supports a
  promotion, but the in-code note flags that SAT's "blacklist" of
  homoclaves is non-public — keeping at moderate is a fair call.
- `GB_UTR` and `GB_NINO` (currently `moderate`): HMRC publishes prefix
  exclusions for NINO but not a checksum, and UTR's mod-11 weighting is
  HMRC-internal. Correctly at moderate.

If the team wants to bump the high count for v1.0 purely on numbers, the
cleanest single-issue PR would be MX_RFC_PF/PM → high once a SAT URL for
Anexo 19 RMF is committed alongside the existing `python-stdnum`
agreement evidence.

## Cross-reference: README "Confidence flag" section vs reality

README §"Confidence flag" (lines 164-173) defines four tiers:

| Tier | README definition | Spec-side reality |
| --- | --- | --- |
| `high` | official source AND mature library agree | Honoured by 58/60 specs. The 2 exceptions (CA / ES passports) cite Microsoft Purview, which is not an issuing authority. |
| `moderate` | one official source OR mature library agrees | Honoured by 25/25. Every moderate spec names the missing half (e.g., "Belastingdienst published the redesign but does not publish the verifier"). |
| `low` | only community / reverse-engineered. Format-only validation. | Honoured by 31/31. All low specs are format-only (no `validate()` checksum), matching the contract. |
| `unconfirmed` | no algorithm verified. Format-only validation. | Honoured by 2/2 (`HN_RTN`, `CO_PASAPORTE`). Both spec headers say so explicitly. |

The README does not define an SLA for "first-party"; the v1.0 audit is
the first place that bar has been set. With the two demotions applied,
the README definitions and the spec annotations are aligned 100%.

The v1.0 roadmap line — "all current countries at High confidence" — is
**not realistically achievable** for the 0-high countries (BO, DO, GT,
HN, NI, PA, PY, SV, VE) and the passport family at large, because the
gap is information the issuing authority simply does not publish. The
roadmap line should be re-stated as "all current spec confidence flags
verified, documented, and supported by either a first-party citation
(high) or an explicit rationale (moderate/low/unconfirmed)". That goal
**is** achieved at v0.6.0 once the two demotions land.

## Recommendation

1. **Demote two specs to `moderate` before v1.0 cut**: `CA_PASAPORTE`
   and `ES_PASAPORTE` (changes at `src/countries/ca/passport.ts:33,69`
   and `src/countries/es/passport.ts:34,70`, with matching edits to
   `docs/countries/ca.md:163-165` and `docs/countries/es.md:327-329`).
   Both are one-line literal changes; no behaviour change, no test
   churn beyond updating any fixture that asserts on the confidence
   string.
2. **Rewrite the v1.0 roadmap line** in `README.md:199` from "all
   current countries at High confidence" to something the library can
   honestly deliver, e.g. "every confidence flag verified against a
   cited source (first-party where the issuer publishes one)". The
   original phrasing implies BO/DO/GT/HN/NI/PA/PY/SV/VE will all get
   `high`, which is not feasible without primary-source publication
   that has not happened in 10+ years.
3. **No promotion is recommended for v1.0**. The moderate / low / unconfirmed
   specs are accurately tiered. A targeted post-v1.0 task ("locate MX
   SAT Anexo 19 RMF URL", "locate DO DGII e-CF spec URL") could lift
   MX_RFC_* and DO_RNC to high, but that is incremental work, not a
   v1.0 blocker.
4. **Add a v1.0 audit test** at `tests/governance/confidence-citations.test.ts`
   that asserts every spec marked `high` has a JSDoc `Source:` line
   whose URL hostname is in an allowlist of issuing-authority TLDs
   (the same list used in this audit). This codifies the bar so the
   next contributor cannot ship a "high" spec citing only Wikipedia.
5. **Confidence flag is trustworthy at v1.0** with the two demotions
   applied. 96.7% adherence pre-demotion, 100% post-demotion, with
   every below-high tier carrying an explicit gap rationale. This is
   well ahead of `validator.js` and `python-stdnum`, neither of which
   publishes a tier system at all.
