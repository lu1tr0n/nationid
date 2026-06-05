# Singapore (SG)

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|-----------|
| `SG_NRIC` | personal | 9 | weighted mod-11 (check letter) | high |
| `SG_FIN` | personal | 9 | weighted mod-11 (check letter) | high |
| `SG_UEN` | tax | 9 or 10 | weighted check letter (3 categories) | high |

All three specs ship under the tree-shakable subpath `nationid/sg`.

> Source-of-truth note: while implementing v2.2 we hand-recomputed every worked
> example. Three vectors in the research draft had arithmetic slips and were
> corrected here against the canonical algorithm (and cross-checked by the
> oracle-agreement property tests): `S9876543C` (not `…B`), `F9999999M` (not
> `…X`), and Business UEN `53000001J` (not `…D`). The algorithm constants
> themselves were unaffected.

---

## `SG_NRIC` — National Registration Identity Card number

### Overview

9-character identity number issued to Singapore citizens and permanent
residents.

- **Issuer**: Immigration & Checkpoints Authority (ICA), Ministry of Home
  Affairs — <https://www.ica.gov.sg/>
- **Statute**: National Registration Act 1965 (2020 Rev. Ed.), §6 (registration)
  and §8 (identity card issuance)
- **Composition**: prefix letter + 7 digits + check letter
  - prefix `S` — holder born before 2000-01-01
  - prefix `T` — holder born on/after 2000-01-01
- **Visual format**: `S1234567D` (9 contiguous characters, no separators)

### Algorithm

Weighted mod-11 producing a check **letter** (not a digit):

```
weights = (2, 7, 6, 5, 4, 3, 2)          # over the 7 body digits
offset  = (prefix == 'T') ? 4 : 0
R       = (Σ digit[i] * weights[i] + offset) mod 11
check   = "JZIHGFEDCBA"[R]
```

Worked example — `S1234567D`: weighted sum `106`, offset `0`,
`R = 106 mod 11 = 7`, `"JZIHGFEDCBA"[7] = D`. ✓

### Confidence

`high`. Four independent code implementations
(`samliew/singapore-nric`, `Jqnxyz/nric-tools-js`, `IonBazan/NRIC`) and SAP
KBA #2572734 agree on the weights, offset, and the literal 11-character table;
the statute is citable at `sso.agc.gov.sg`. ICA does not publish a standalone
algorithm document, but the convergence is overwhelming and the scheme has been
stable for 40+ years.

### Sources

- Statute: National Registration Act 1965 —
  <https://sso.agc.gov.sg/Act/NRA1965> ✓ live 2026-05-24
- ICA homepage: <https://www.ica.gov.sg/> ✓ live 2026-05-24
- ICA "Reside, Study and Work" section: <https://www.ica.gov.sg/reside> ✓ live 2026-05-24
- SAP KBA #2572734 "Singapore NRIC/FIN Validation" (clearest written spec):
  <https://userapps.support.sap.com/sap/support/knowledge/en/2572734> ✓ live 2026-05-24

### Synthetic test vectors

```
valid (check letter passes):
  - S1234567D
  - T0123456G
  - T1234567J   (same digits as S1234567 but T-offset → J)

invalid (checksum):
  - S1234567A   (correct check is D)
  - T1234567D   (T-offset gives J, not D)

invalid (routes elsewhere / shape):
  - F1234567N   (valid FIN, not an NRIC)
  - S123456D    (6 digits, too short)
```

### Open questions

- None material. ICA does not publish a standalone algorithm PDF, but the
  algorithm is reproduced identically across PHP, JS/TS, and the SAP HCM
  module; treat SAP KBA #2572734 as the clearest written reference.

---

## `SG_FIN` — Foreign Identification Number

### Overview

9-character identity number issued to foreigners holding long-term passes in
Singapore. ICA (long-term passes) and MOM (work passes) share a single FIN
number space — the prefix letter does **not** distinguish the issuer.

- **Issuer**: ICA and MOM — <https://www.ica.gov.sg/>,
  <https://www.mom.gov.sg/passes-and-permits>
- **Statute**: National Registration Act 1965 §5
- **Composition**: prefix letter + 7 digits + check letter
  - prefix `F` — issued before 2000-01-01
  - prefix `G` — issued 2000-01-01 … 2021-12-31
  - prefix `M` — issued on/after 2022-01-01 (M-series reform)
- **Visual format**: `M5012345J` (9 contiguous characters, no separators)

### Algorithm

Same weighted mod-11 family as NRIC, with prefix-specific offset and table:

```
weights = (2, 7, 6, 5, 4, 3, 2)
offset  = (prefix == 'G') ? 4 : (prefix == 'M') ? 3 : 0
R       = (Σ digit[i] * weights[i] + offset) mod 11
table   = (prefix == 'M') ? "XWUTRQPNJLK" : "XWUTRQPNMLK"
check   = table[R]
```

The M-table differs from the F/G table only at `R = 8` (`J` instead of `M`).

Worked example — `M5012345J`: weighted sum `60`, offset `3`,
`R = 63 mod 11 = 8`, `"XWUTRQPNJLK"[8] = J`. ✓

Cross-check against the SAP KBA's own worked example `G5872776N`: weighted sum
`179`, offset `4`, `R = 183 mod 11 = 7`, `"XWUTRQPNMLK"[7] = N`. ✓

### Confidence

`high` for all three prefixes. F/G are corroborated by four independent sources
(samliew, Jqnxyz, IonBazan, SAP). M is corroborated by three (samliew,
IonBazan, SAP), all encoding the same M-table and `+3` offset and all validating
`M5012345J`.

### Sources

- Statute: National Registration Act 1965 —
  <https://sso.agc.gov.sg/Act/NRA1965> ✓ live 2026-05-24
- ICA homepage: <https://www.ica.gov.sg/> ✓ live 2026-05-24
- MOM passes & permits: <https://www.mom.gov.sg/passes-and-permits> ✓ live 2026-05-24
- SAP KBA #2572734 (covers all FIN prefixes incl. the M-table):
  <https://userapps.support.sap.com/sap/support/knowledge/en/2572734> ✓ live 2026-05-24

### Synthetic test vectors

```
valid (check letter passes):
  - F1234567N
  - G1122334L
  - G5872776N   (SAP KBA worked example)
  - M5012345J   (critical M-series vector)

invalid (checksum):
  - F1234567A   (correct check is N)
  - M5012345N   (M-table at R=8 is J; F/G table would give M)

invalid (shape):
  - H1234567N   (H is not a valid FIN prefix)
  - m5012345J   (lowercase prefix — uppercased by normalize() to a valid FIN)
```

### Open questions

- ICA's 2021-12 media release announcing the M-series is no longer reachable at
  its original URL and has no Wayback snapshot. The strongest M-prefix citation
  (SAP note 3111689) is behind a customer login. The JSDoc and this page point
  readers to the public SAP KBA #2572734 plus the cross-implementation proof
  (samliew + IonBazan) instead of a primary ICA announcement.

---

## `SG_UEN` — Unique Entity Number

### Overview

Singapore's standard identifier for registered entities. Three category
formats, each with its own check letter, dispatched by shape.

- **Issuer**: ACRA (companies/businesses) and other agencies (MAS, MCCY, …) for
  "Other Entity" UENs, coordinated by the UEN Steering Committee
  (ACRA + IRAS + MOM) — <https://www.acra.gov.sg/>, <https://www.bizfile.gov.sg/>
- **Statute**: Unique Entity Number Act 2008 (Act 21 of 2008); UEN Regulations
  2008
- **Composition** (3 categories):
  - **A — Business (ROB)**: `\d{8}[A-Z]` (8 digits + check letter)
  - **B — Local Company (ROC)**: `\d{9}[A-Z]` (4-digit year + 5-digit sequence
    + check letter)
  - **C — Other Entity**: `[RST]\d{2}[A-Z]{2}\d{4}[A-Z]` (era letter + 2-digit
    year + 2-letter entity-type code + 4-digit sequence + check letter)

### Algorithm

All constants are taken verbatim from `python-stdnum/stdnum/sg/uen.py` (the
de-facto open-source oracle).

**Category A — Business**

```
weights = (10, 4, 9, 3, 8, 2, 7, 1)
R       = (Σ digit[i] * weights[i]) mod 11
check   = "XMKECAWLJDB"[R]
```

Worked example — `00192200M`: sum `56`, `R = 1`, `"XMKECAWLJDB"[1] = M`. ✓

**Category B — Local Company**

```
weights = (10, 8, 6, 4, 9, 7, 5, 3, 1)
R       = (Σ digit[i] * weights[i]) mod 11
check   = "ZKCMDNERGWH"[R]
plus:   parseInt(uen[0:4]) <= currentYear     # year sanity, no lower bound
```

The year check mirrors python-stdnum exactly: it rejects only years greater
than the current year. It deliberately does **not** reject years < 1900, for
parity with the oracle. `currentYear` is injectable via an optional `Clock`
parameter (`validateUen(input, now)`) so the behaviour is testable at a fixed
date; the public `uenSpec.validate` uses the system clock.

Worked examples — `197401143C` (sum `167`, `R = 2`, `C`),
`196800306E` (DBS Bank, sum `171`, `R = 6`, `E`),
`199201624D` (Singtel, sum `191`, `R = 4`, `D`). ✓

**Category C — Other Entity**

```
alphabet = "ABCDEFGHJKLMNPQRSTUVWX0123456789"   # 32 chars, no I or O
weights  = (4, 3, 5, 3, 10, 2, 2, 5, 7)
R        = (Σ alphabet.index(char[i]) * weights[i] − 5) mod 11
check    = alphabet[R]
plus:    entity-type code (chars 3–4) must be in the 38-code whitelist
```

Worked example — `S16FC0121D`: weighted sum `679`, `(679 − 5) mod 11 = 3`,
`alphabet[3] = D`. ✓

**Entity-type whitelist (Category C, 38 codes)** — verbatim from
`OTHER_UEN_ENTITY_TYPES` in python-stdnum master (snapshot 2026-05-24):

```
CC CD CH CL CM CP CS CX DP FB FC FM FN GA GB GS HS LL LP MB
MC MD MH MM MQ NB NR PA PB PF RF RP SM SS TC TU VH XL
```

### Confidence

`high` for all three categories. python-stdnum is a mature, maintained module
with explicit algorithms for every category plus the entity-type whitelist; its
four doctest fixtures (`00192200M`, `197401143C`, `S16FC0121D`, `T01FC6132D`)
all hand-verify, and the real-world Cat B UENs `196800306E` (DBS Bank) and
`199201624D` (Singtel) validate under the Cat B algorithm.

### Sources

- Statute: Unique Entity Number Act 2008 —
  <https://sso.agc.gov.sg/Act/UENA2008> ✓ live 2026-05-24
- ACRA homepage: <https://www.acra.gov.sg/> ✓ live 2026-05-24
- ACRA business-structure taxonomy:
  <https://www.acra.gov.sg/register/business/choosing-business-structure/> ✓ live 2026-05-24
- IRAS homepage: <https://www.iras.gov.sg/> ✓ live 2026-05-24
- ACRA BizFile+ (UEN search/registration): <https://www.bizfile.gov.sg/> ✓ live 2026-05-24
- OECD CRS Singapore-TIN PDF (format reference):
  <https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/singapore-tin.pdf> ✓ live 2026-05-24
- `python-stdnum/stdnum/sg/uen.py` (algorithm oracle, LGPL 2.1+):
  <https://github.com/arthurdejong/python-stdnum/blob/master/stdnum/sg/uen.py>

### Synthetic test vectors

```
valid Category A (Business):
  - 00192200M   (stdnum doctest)
  - 52912345B

valid Category B (Local Company):
  - 197401143C  (stdnum doctest)
  - 196800306E  (DBS Bank, real)
  - 199201624D  (Singtel, real)

valid Category C (Other Entity):
  - S16FC0121D  (stdnum doctest)
  - T01FC6132D  (stdnum doctest)
  - T08LL0001K

invalid (checksum):
  - 00192200A   (correct check is M)
  - 197401143A  (correct check is C)
  - S16FC0121A  (correct check is D)

invalid (shape / whitelist):
  - T08ZZ0001K  (ZZ not in the entity-type whitelist)
  - U08LL0001K  (first char not in [RST])
  - 1968030E    (8 chars — fits no category)
```

### Open questions

- ACRA does not officially publish the check-digit algorithms. The
  python-stdnum implementation appears to be derived empirically (its source
  references the OECD CRS PDF). The four doctest fixtures and the two real-world
  Cat B UENs are the strongest available proof.
- The entity-type whitelist is snapshotted from python-stdnum master at the
  v2.2 release date and should be re-verified annually against the source plus
  the BizFile+ UEN-search dropdown.

---

## Notes for consumers

- `SG_NRIC` and `SG_FIN` are PII under Singapore's Personal Data Protection Act
  2012. The library exposes `mask` / `hash` / `lastN` under `nationid/pii` for
  safe display. See [`docs/PII_GUIDANCE.md`](../PII_GUIDANCE.md).
- `normalize()` uppercases and strips whitespace, hyphens, and slashes, so
  `s1234567d` and `m5012345J` both normalize to valid documents.
- All three NRIC/FIN/UEN authoritative URLs are on `*.gov.sg` hosts, so the
  governance citation test passes without a host-allowlist patch.
