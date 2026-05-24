---
"nationid": minor
---

# v2.1.0 — Asia phase 2: Japan

First country of Asia phase 2. Ships `nationid/jp` with two specs, both at
`confidence: "high"` and both cross-validated against `python-stdnum`.

## New specs (2)

| Code | Country | Confidence | Algorithm |
|------|---------|------------|-----------|
| `JP_MY_NUMBER` | 🇯🇵 Japan | high | weighted mod-11, 11-digit base, `r ≤ 1 → check 0` (MIC Ordinance 85/2014 §5) |
| `JP_CORPORATE_NUMBER` | 🇯🇵 Japan | high | weighted mod-9, leftmost check digit in `1..9` (NTA Corporate Number Ordinance §3) |

## Verification

- **Canonical anchors**: hand-computed per `docs/v1.2-asia-research/jp.md`,
  verified against `docs/v1.2-asia-research/VERIFICATION.md` §JP-1, §JP-2.
- **Gold-standard oracle**: `JP_CORPORATE_NUMBER` test suite includes
  `7000012050002`, the NTA's own corporate number, which is verifiable in
  the public registry at `https://www.houjin-bangou.nta.go.jp/`.
- **Oracle agreement**: each spec runs a 10k-sample property test against
  an inline port of `python-stdnum/stdnum/jp/in_.py` (My Number) and
  `python-stdnum/stdnum/jp/cn.py` (Corporate Number).
- **URL liveness**: every JSDoc source URL verified live via
  `browser_fetch` (firefox133 TLS impersonation) on 2026-05-24, with three
  pre-flight URL patches applied to `jp.md` per `URL_AUDIT.md`.

## Governance

- New TLD suffix `/(?:^|\.)go\.jp$/i` added — Japan uses `.go.jp` for
  government domains, not `.gov.jp`. Without this patch the governance
  test would reject every JP first-party citation.
- New statute patterns: `総務省令第\d+号` (MIC Ministerial Ordinance),
  `法人番号の指定等に関する省令` (Corporate Number Ordinance),
  `平成\d+年法律第\d+号` (Heisei-era statute citation).

## Coverage delta

52 → 53 countries · ~145 → ~147 document codes · tarball ~+10 KB.
