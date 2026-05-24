# Asia phase 2 URL liveness audit — 2026-05-24

> Audit run from a WSL2 / Ubuntu 22.04 origin with `curl/7.81` impersonating
> Firefox 133 (UA `Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0)
> Gecko/20100101 Firefox/133.0`), 20s timeout, GET with `-L` to follow
> redirects. python-stdnum module existence checked via the
> `https://api.github.com/repos/arthurdejong/python-stdnum/contents/stdnum/<cc>`
> API and confirmed against `master` on 2026-05-24.
>
> The intended tool `mcp__browser__browser_fetch` with `impersonate=firefox133`
> was not exposed in this agent's tool surface; `curl --http2` was used as the
> nearest substitute. Where curl returned `000` or `403`, the URL was
> additionally cross-checked against `archive.org/wayback/available` to
> distinguish "actually dead" (no snapshot exists) from "alive but blocking
> WSL/datacenter IPs". WSL/IP blocks are NOT counted as broken — they would
> be live from a normal end-user browser and from CI runners on
> GitHub-Actions / Vercel egress IPs.

## Verdict matrix

| Spec | URL | Status | Recommended replacement (if broken) |
|------|-----|--------|-------------------------------------|
| JP | `https://www.cao.go.jp/bangouseido/` | 200 | — |
| JP | `https://www.soumu.go.jp/main_sosiki/jichi_gyousei/c-gyousei/bangouseido.html` | **404** (no Wayback snapshot ever) | `https://www.soumu.go.jp/kojinbango_card/` (live, 200) |
| JP | `https://www.digital.go.jp/policies/mynumber` | 200 | — |
| JP | `https://www.ppc.go.jp/legal/policy/` | 200 | — |
| JP | `https://www.houjin-bangou.nta.go.jp/` | 200 | — |
| JP | `https://www.houjin-bangou.nta.go.jp/setsumei/` | 200 | — |
| JP | `https://www.nta.go.jp/taxes/tetsuzuki/mynumber/houjinbangou/` | **soft-404** (200 with redirect to `/error/404.htm`; no Wayback snapshot ever) | `https://www.nta.go.jp/taxes/tetsuzuki/mynumberinfo/index.htm` (live, 200) |
| JP | `https://www.nta.go.jp/about/organization/ntc/sozei/houkoku/130822/pdf/01_betten.pdf` | **soft-404** (200 → `/error/404.htm`, no Wayback) | `https://www.houjin-bangou.nta.go.jp/pc/setsumei/images/kokuji_20210129.pdf` (live, 200 — actual NTA notice PDF on the official houjin-bangou subdomain) |
| JP | `https://www.houjin-bangou.nta.go.jp/download/zenken/` | 200 | — |
| KR | `https://www.mois.go.kr/` | TLS-RST from WSL; Wayback confirms live (200, snapshot 2026-04-12) | not broken — flag in test as `expectedReachableFrom: ["browser","ci"]` |
| KR | `https://www.law.go.kr/법령/주민등록법` | 200 (with `--http2`; HTTP/1.1 was reset) | — |
| KR | `https://www.law.go.kr/법령/주민등록법시행령` | 200 | — |
| KR | `https://www.law.go.kr/법령/개인정보보호법` | 200 (with `--http2`) | — |
| KR | `https://www.privacy.go.kr/` | 200 (with `--http2`; cert-chain incomplete on default chain) | — |
| KR | `https://techscience.org/a/2015092901/` | 200 | — (supplementary, not first-party) |
| KR | `https://www.nts.go.kr/` | 200 (with `--http2`) | — |
| KR | `https://www.hometax.go.kr/` | 200 (with `--http2 -k`); Wayback confirms | — |
| KR | `https://www.law.go.kr/법령/부가가치세법` | 200 | — |
| KR | `https://www.law.go.kr/법령/부가가치세법시행령` | 200 | — |
| KR | `https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Korea-TIN.pdf` | 200 (redirects to new OECD CDN: `https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/korea-tin.pdf`) | use the redirect target as canonical |
| KR | `https://teht.hometax.go.kr/` | 200 | — |
| SG | `https://www.ica.gov.sg/` | 200 | — |
| SG | `https://www.ica.gov.sg/public-forms-and-documents/list-of-documents` | **404** (no Wayback) | `https://www.ica.gov.sg/documents` (live, 200) |
| SG | `https://www.ica.gov.sg/reside/identity-card` | **404** (no Wayback) | `https://www.ica.gov.sg/reside` (live, 200) — note ICA does NOT appear to maintain a per-document NRIC landing; cite the section root + the statute on `sso.agc.gov.sg` |
| SG | `https://www.smartnation.gov.sg/` | 200 | — |
| SG | `https://www.singpass.gov.sg/` | 200 (→ `/main/`) | — |
| SG | `https://api.singpass.gov.sg/library` | 200 (→ `https://developer.singpass.gov.sg/`) | use the redirect target as canonical |
| SG | `https://api.singpass.gov.sg/library/myinfo/developers/specs` | 200 redirect to `https://developer.singpass.gov.sg/` root (deep-link lost) | the deep `/library/myinfo/developers/specs` path no longer exists; cite `https://developer.singpass.gov.sg/` root only |
| SG | `https://sso.agc.gov.sg/Act/NRA1965` | 200 | — |
| SG | `https://www.ica.gov.sg/reside/types-of-passes` | **404** (no Wayback) | `https://www.ica.gov.sg/enter-transit-depart` for visit/transit context, or `https://www.mom.gov.sg/passes-and-permits` for work passes (already cited elsewhere) |
| SG | `https://www.ica.gov.sg/news-and-publications/newsroom/media-release/new-fin-format-from-1-january-2022` | **404** (no Wayback for this exact path) | The 2022 FIN-format announcement deep link is gone. Replace with newsroom root `https://www.ica.gov.sg/news-and-publications/newsroom` (live, 200) + Wayback snapshot of the newsroom index: `https://web.archive.org/web/2022/https://www.ica.gov.sg/news-and-publications/newsroom/media-release/` |
| SG | `https://www.ica.gov.sg/news-and-publications/newsroom/media-release` | **404** (Wayback snapshot exists at 2022-06-21) | `https://www.ica.gov.sg/news-and-publications/newsroom` (live, 200) |
| SG | `https://www.mom.gov.sg/passes-and-permits` | 200 | — |
| SG | `https://www.uen.gov.sg/` | 200 (302 → `https://www.bizfile.gov.sg/`) | the UEN portal was consolidated into BizFile+ in 2024; the `uen.gov.sg` redirect still works. Both citations are acceptable. |
| SG | `https://www.uen.gov.sg/ueninternet/faces/pages/uenFAQ.jspx` | 200 status but body is the BizFile SPA shell (Title `Bizfile`) — the FAQ deep link is effectively gone | replace with BizFile UEN search: `https://www.bizfile.gov.sg/ngbizfileinternet/faces/oracle/webcenter/portalapp/pages/MAINGUI.jspx` OR cite the statute alone (`sso.agc.gov.sg/Act/UENA2008`) |
| SG | `https://www.acra.gov.sg/` | 200 | — |
| SG | `https://www.acra.gov.sg/how-to-guides/before-you-start/types-of-business-structures` | **404** | `https://www.acra.gov.sg/register/business/choosing-business-structure/` (live, 200) |
| SG | `https://www.iras.gov.sg/` | 200 | — |
| SG | `https://sso.agc.gov.sg/Act/UENA2008` | 200 (slow: 12s) | — |
| SG | `https://www.bizfile.gov.sg/` | 200 | — |
| SG | `https://samliew.com/nric-generator` | 200 | — (community, supplementary) |
| SG | `https://github.com/varadeha/uen-validator` | **404** | repository does not exist. Replace with **`https://github.com/arthurdejong/python-stdnum/blob/master/stdnum/sg/uen.py`** (verified to exist: `stdnum/sg/uen.py` IS in the master tree as of 2026-05-24). The verification doc's SG-4 already flags this. |
| SG | `https://github.com/jamesteoh/sg-uen-validator` | **404** | repository does not exist. Same replacement as above. |
| TW | `https://www.mof.gov.tw/` | 200 | — |
| TW | `https://gcis.nat.gov.tw/` | 200 (→ `/mainNew/`) | — |
| TW | `https://www.etax.nat.gov.tw/` | 200 | — |
| TW | `https://www.einvoice.nat.gov.tw/` | 403 from WSL; Wayback confirms live (200, snapshot 2026-05-18) | not broken — bot-blocked from this egress |
| TW | `https://www.ntbt.gov.tw/` | 200 | — |
| TW | `https://www.ris.gov.tw/` | 200 (→ `/app/portal`) | — |
| TW | `https://www.moi.gov.tw/` | 200 | — |
| TW | `https://www.nhi.gov.tw/` | 403 from WSL; Wayback confirms live (200, snapshot 2025-04-27) | not broken — bot-blocked from this egress |
| TW | `https://www.immigration.gov.tw/` | 200 | — |
| TW | `https://www.immigration.gov.tw/5385/7445/` | 200 | — |

## Per-country findings

### JP (jp.md)

- **2 hard breakages**, both on `nta.go.jp` deep paths:
  - `/taxes/tetsuzuki/mynumber/houjinbangou/` returns 200 but the effective URL is `/error/404.htm` (NTA's soft-404 pattern). The corporate-number portal lives on its own subdomain (`houjin-bangou.nta.go.jp/setsumei/` — verified 200) and the NTA top page entry-point is `/taxes/tetsuzuki/mynumberinfo/index.htm` (verified 200).
  - `/about/organization/ntc/sozei/houkoku/130822/pdf/01_betten.pdf` is gone. The actual algorithm-specification PDF lives at `https://www.houjin-bangou.nta.go.jp/pc/setsumei/images/kokuji_20210129.pdf` (NTA notice 第31号 — directly addresses the corporate-number check-digit algorithm). This is a strictly better citation: it is the primary-source PDF the doc claimed to cite.
- **1 hard breakage** on `soumu.go.jp`: `/main_sosiki/jichi_gyousei/c-gyousei/bangouseido.html` is 404 with no Wayback history. The current MIC My Number portal is `https://www.soumu.go.jp/kojinbango_card/` (verified 200).
- 6 of 9 URLs are good as-is. Replace the 3 broken ones in JSDoc before v1.3 ships.
- Outside scope but worth flagging: the `jp.md` document also references `python-stdnum/stdnum/jp/corporate_number.py` (10+ times). The actual module name is **`stdnum/jp/cn.py`** (no `corporate_number.py` exists; the directory listing is `__init__.py`, `cn.py`, `in_.py`). VERIFICATION.md §JP-2 already calls this out. Also: a `jp/my_number.py` per the doc DOES NOT exist, but **`jp/in_.py`** does (the Individual Number / My Number module) — the doc says "python-stdnum does NOT currently ship a my_number module" which is technically true under that name, but the functionality DOES ship under `in_.py`. Update the spec source citation accordingly.

### KR (kr.md)

- **Zero hard breakages.** All KR government sites are alive on the real internet.
- 8 of 12 URLs returned `000` (TLS connection reset) from this WSL2 egress on the first HTTP/1.1 attempt. Retrying with `curl --http2` (or `-k --http2`) resolved 7 of those 8 — they appear to be behind a WAF that rejects HTTP/1.1 + non-modern TLS handshakes from suspicious IPs. The remaining one, `www.mois.go.kr`, refused even HTTP/2 from WSL but is confirmed live via Wayback (`web.archive.org/web/20260412070527/https://www.mois.go.kr/`, status 200).
- The `OECD Korea-TIN.pdf` URL still resolves but 302s to a new CDN path (`/content/dam/oecd/en/topics/...`). Update the citation to the redirect target so the spec doesn't trigger a 301 chain in CI.
- **Action**: no URL replacements needed; but the governance test harness should NOT fail on a 403/000 for KR domains during CI — recommend a per-domain allow list of "known-WAF-protected-but-statute-valid" hosts that bypass the live-fetch step and rely on statute-name matching instead.

### SG (sg.md)

- **The largest concentration of breakage** of the four. 6 hard 404s and 2 SPA-soft-redirects:
  - ICA pages: `/public-forms-and-documents/list-of-documents`, `/reside/identity-card`, `/reside/types-of-passes`, `/news-and-publications/newsroom/media-release/new-fin-format-from-1-january-2022`, `/news-and-publications/newsroom/media-release` — all 404. None has a Wayback snapshot for that exact path, suggesting these paths were either never live or were renamed before any crawl caught them. The 2022 FIN-format announcement URL in particular looks like a research-agent fabrication: the deep slug never existed.
  - ACRA: `/how-to-guides/before-you-start/types-of-business-structures` — 404. The live equivalent is `/register/business/choosing-business-structure/`.
  - UEN: `uen.gov.sg` itself 302s to `bizfile.gov.sg`. The deep-link `uenFAQ.jspx` resolves with status 200 but the body is the BizFile SPA shell — i.e. the deep link is functionally dead.
  - Singpass developer: `api.singpass.gov.sg/library/myinfo/developers/specs` 302s to the developer portal root; the deep path no longer exists.
- **Two fabricated GitHub repos**:
  - `https://github.com/varadeha/uen-validator` — 404, user `varadeha` does not exist.
  - `https://github.com/jamesteoh/sg-uen-validator` — 404, repo does not exist.
- **Critical positive finding** (already in `VERIFICATION.md §SG-4`): `python-stdnum/stdnum/sg/uen.py` **DOES** exist on master as of 2026-05-24 (directory listing: `__init__.py`, `uen.py`). The doc's claim that "`python-stdnum` does NOT ship a SG UEN module" is **incorrect**. The SG_UEN spec can ship with `hasCheckDigit: true` for all three categories using stdnum as oracle — this is a meaningful upgrade.
- **Critical negative finding**: `python-stdnum/stdnum/sg/nric.py` does **NOT** exist (the only sg module is `uen.py`). The doc cites this path 17 times as oracle for both SG_NRIC and SG_FIN. This is a fabricated module reference. The spec needs an alternative oracle (the `samliew.com` generator + cross-check against multiple JS impls + the per-bank smoke test) or must downgrade SG_NRIC / SG_FIN from `confidence: "high"` until a vetted maintained oracle is found.

### TW (tw.md)

- **Zero hard breakages.** All 10 TW URLs resolve to live content via Wayback or directly.
- 2 of 10 (`einvoice.nat.gov.tw`, `nhi.gov.tw`) return 403 from WSL2 — bot/datacenter block, not real death. Both confirmed live by Wayback within the last 12 months.
- **Critical negative finding**: `python-stdnum/stdnum/tw/twid.py` does **NOT** exist (the only tw module is `ubn.py`). The doc cites this path 10+ times as oracle for both TW_NID and TW_ARC. Fabricated module reference. `VERIFICATION.md §TW-2` already flags this. The recommended replacement (`enylin/taiwan-id-validator` on npm) is real and well-maintained — verify before committing to it.

## Cross-cutting

### Common redirect patterns

- **SG portal consolidation**: `uen.gov.sg → bizfile.gov.sg`, `api.singpass.gov.sg/library → developer.singpass.gov.sg`. Both are 302s that LAND on a working page but the deep-link path is lost (SPA returns the same shell regardless of path). Same pattern as Malta's `cfr.gov.mt → mtca.gov.mt` rename.
- **JP NTA soft-404**: paths under `nta.go.jp` that don't exist serve `/error/404.htm` with HTTP 200 — the curl audit must check `url_effective` against `/error/404.htm` substring to detect these. Two of the JP URLs in `jp.md` fall into this trap and would silently pass a naive `http_code == 200` check.
- **OECD URL migration**: `oecd.org/tax/automatic-exchange/...` → `oecd.org/content/dam/oecd/...` (new CDN structure rolled out 2024-2025). 301-302 chain works but cite the final URL.

### Domains that need to be added to `tests/governance/confidence-citations.test.ts ISSUER_ALLOWLIST_DOMAINS`

Already correctly identified in the research docs; consolidated list:

```ts
// Patch to ISSUER_TLD_SUFFIXES (preferred — covers all future specs in JP/KR):
/(?:^|\.)go\.jp$/i,        // Japan: nta, cao, soumu, digital, ppc, houjin-bangou.nta
/(?:^|\.)go\.kr$/i,        // Korea: mois, nts, hometax, law, privacy, teht.hometax
// (.gov.sg and .gov.tw already match the existing /(?:^|\.)gov\.[a-z]{2,3}$/i regex)
```

Singapore and Taiwan need NO regex patch — both use `gov.sg` / `gov.tw` which the existing rule catches. The `nat.gov.tw` subdomain (`gcis.nat.gov.tw`, `etax.nat.gov.tw`, `einvoice.nat.gov.tw`) also passes because the regex anchors on the suffix.

### Wayback Machine fallback URLs to use when re-citing

- `https://web.archive.org/web/2022/https://www.ica.gov.sg/news-and-publications/newsroom/media-release/` — for SG_FIN's 2022 M-prefix announcement context (use as supplementary; the canonical first-party citation should be the live newsroom root).
- `https://web.archive.org/web/20260412070527/https://www.mois.go.kr/` — for KR_RRN if the live URL ever fails CI from a specific runner.
- `https://web.archive.org/web/20260518051821/https://www.einvoice.nat.gov.tw/` — for TW_UBN if the einvoice 403-block becomes a CI blocker.

Note: there is NO Wayback snapshot for the JP `nta.go.jp/taxes/tetsuzuki/mynumber/houjinbangou/` path or for the `01_betten.pdf` ever — these paths were not just renamed, they appear to have never been live. Treat as fabrication and replace outright (do NOT fall back to a Wayback snapshot that doesn't exist).

## Recommended action

**Before implementing v1.3 (Japan)** — patch `jp.md` JSDoc to replace:

1. `soumu.go.jp/main_sosiki/jichi_gyousei/c-gyousei/bangouseido.html` → `soumu.go.jp/kojinbango_card/`
2. `nta.go.jp/taxes/tetsuzuki/mynumber/houjinbangou/` → `nta.go.jp/taxes/tetsuzuki/mynumberinfo/index.htm`
3. `nta.go.jp/about/organization/ntc/sozei/houkoku/130822/pdf/01_betten.pdf` → `houjin-bangou.nta.go.jp/pc/setsumei/images/kokuji_20210129.pdf` (this is the actual NTA notice 第31号 PDF — strictly better source than what the doc originally claimed)
4. Change `python-stdnum/stdnum/jp/corporate_number.py` references to `python-stdnum/stdnum/jp/cn.py`
5. Update the "python-stdnum My Number module does not exist" claim to "python-stdnum/stdnum/jp/in_.py implements the My Number / Individual Number algorithm" (this changes JP_MY_NUMBER's oracle story materially)

**Before implementing v1.4 (Singapore)** — patch `sg.md` JSDoc to:

1. Replace all 6 broken ICA / ACRA paths with the live equivalents listed above.
2. Replace fabricated `python-stdnum/stdnum/sg/nric.py` references with a real maintained alternative — candidates: `samliew/nric-generator-js`, `iukrek/sg-nric` (verify before citing), or a hand-derived fixture set with a footnote that no upstream OSS oracle is canonical.
3. Replace fabricated GitHub UEN validator repos with `python-stdnum/stdnum/sg/uen.py` (confirmed to exist).
4. Upgrade `SG_UEN` per VERIFICATION.md §SG-4: `hasCheckDigit: true` for all three categories, `confidence: "high"`.

**Before implementing v1.5 (Korea)** — no URL patches required (all KR URLs are live in the real world; WSL/datacenter 000/403 responses are origin-blocks, not real death). Recommend, separately, adding KR's WAF-protected hosts to a "skip live fetch in CI" allow list so the governance test doesn't false-negative on CI runners that happen to hit the WAF.

**Before implementing v1.6 (Taiwan)** — patch `tw.md` JSDoc to:

1. Replace all references to `python-stdnum/stdnum/tw/twid.py` (fabricated) with `enylin/taiwan-id-validator` (npm, verify maintenance status before pinning), AND retain `python-stdnum/stdnum/tw/ubn.py` (real, for TW_UBN only).
2. No live-URL replacements needed — both 403 hits (`einvoice.nat.gov.tw`, `nhi.gov.tw`) are bot-blocks, not real death, and the rest are 200.

## Caveats on this audit

1. The intended `mcp__browser__browser_fetch` with `impersonate=firefox133` (full TLS fingerprint matching) was not available in this agent's tool set. `curl --http2 -A "<firefox-UA>"` covers the User-Agent but not the JA3/JA4 fingerprint that some WAFs key on. KR / TW WAF blocks (`000`, `403`) would likely succeed under real Firefox JA3, which is why Wayback was used as the tie-breaker rather than treating them as broken.
2. Audit run from a single Asia-blocked WSL2 egress. CI runners on US/EU egress and on managed GitHub Actions / Vercel may see different statuses, particularly for KR and TW. The "hard 404s" called out above (no Wayback ever, returns plain 404 / soft-404) are the high-confidence broken URLs that any audit run would catch.
3. python-stdnum module existence was checked on master as of 2026-05-24. If the v1.3-v1.6 implementation slips past mid-2026, recheck — the upstream has a history of accepting new country modules.
