# Singapore (SG) — source-of-truth verification report

> **Correction note (2026-06-04, applied during v2.2 implementation).** Three
> synthetic worked-examples in this report had arithmetic slips (the algorithm
> *constants* — weights, offsets, tables — were all correct; only these derived
> check letters were wrong). They were caught by the independent
> oracle-agreement property tests in `tests/cross-validation/stdnum-sg.test.ts`
> and recomputed by hand. The authoritative values now live in the code and
> tests. Corrections:
> - **NRIC `S9876543`** → check **`C`** (not `B`). Weighted sum is **184**
>   (not 158); `R = 184 mod 11 = 8`; `"JZIHGFEDCBA"[8] = C`.
> - **FIN `F9999999`** → check **`M`** (not `X`). All-9s weighted sum is
>   **261** (not 198); `R = 261 mod 11 = 8`; `"XWUTRQPNMLK"[8] = M`. The
>   `M9999999` vector is correspondingly `R = (261+3) mod 11 = 0` → `"…"[0] = X`.
> - **UEN Business `53000001`** → check **`J`** (not `D`). `R = 63 mod 11 = 8`;
>   `"XMKECAWLJDB"[8] = J` (`D` is index 9 — an off-by-one in the original walk).
>
> The python-stdnum doctest fixtures (`00192200M`, `197401143C`, `S16FC0121D`,
> `T01FC6132D`) and the real-world Cat B UENs (`196800306E`, `199201624D`) were
> all correct as written and are used as anchors.

Verified: 2026-05-24

Method: algorithm constants and worked examples hand-computed from primary
source. URLs live-fetched 2026-05-24 via `browser_fetch firefox133` (HTTP
200 unless marked dead). Dead URLs from `URL_AUDIT.md` not re-fetched.

Four v1.2 research errors corrected: (1) M-prefix FIN table needs `10 - R`
rotation (or equivalently use table `XWUTRQPNJLK` indexed directly);
(2) `M5012345U` is wrong, correct is `M5012345J`; (3) UEN algorithms ARE
shipped in `python-stdnum/stdnum/sg/uen.py` for all 3 categories; (4) the
fabricated `python-stdnum/sg/nric.py` (17 citations) and two non-existent
GitHub repos replaced with verified alternatives.

---

## SG_NRIC

### Primary issuer

- **Authority**: Immigration & Checkpoints Authority (ICA), MHA.
- **Statute**: National Registration Act 1965 (2020 Rev. Ed.), §6 (registration), §8 (identity card issuance).
- **URLs (live 2026-05-24 via browser_fetch firefox133, HTTP 200)**:
  - `https://sso.agc.gov.sg/Act/NRA1965` — Singapore Statutes Online. Title
    `"National Registration Act 1965 - Singapore Statutes Online"`
    confirmed in body.
  - `https://www.ica.gov.sg/` — ICA homepage.
  - `https://www.ica.gov.sg/reside` — title `"ICA | Reside, Study and Work
    in Singapore"`. Replaces dead `/reside/identity-card`.
  - `https://userapps.support.sap.com/sap/support/knowledge/en/2572734` —
    SAP KBA #2572734 "Singapore NRIC/FIN Validation", vendor spec used in
    every SAP SuccessFactors Employee Central SG payroll instance.
    Documents weights, all 3 offsets (S/F=0, T/G=4, M=3), all 3 tables,
    and worked example `G 5872776 N`. The clearest written publication of
    the algorithm anywhere on the public web.

### Algorithm (verified across 4 independent sources)

NRIC = 9 chars: `[ST] + 7 digits + check-letter [A-Z]`.

**Prefix table** (per ICA's 2000-01-01 reform):

| Prefix | Cohort                                                              |
| ------ | ------------------------------------------------------------------- |
| `S`    | NRIC issued to person born **before 2000-01-01** (citizens & PRs)   |
| `T`    | NRIC issued to person born **on/after 2000-01-01** (citizens & PRs) |

**Weights** for digits d1..d7 (left to right): `(2, 7, 6, 5, 4, 3, 2)`.

**Prefix offset**: S → 0, T → 4.

**Check-letter table** (R-indexed; the SAP KBA presents the same table in
reverse with a `(11 - (R+1))` subtraction — mathematically identical):

```
R:        0   1   2   3   4   5   6   7   8   9   10
letter:   J   Z   I   H   G   F   E   D   C   B   A
```

Literal 11-char alphabet: `"JZIHGFEDCBA"`.

**Pseudocode**:

```
sum = 2*d1 + 7*d2 + 6*d3 + 5*d4 + 4*d5 + 3*d6 + 2*d7
offset = (prefix == 'T') ? 4 : 0
R = (sum + offset) mod 11
expected = "JZIHGFEDCBA"[R]
valid = (input.checkLetter == expected)
```

### Worked examples (hand-computed)

**Example 1 — `S1234567D`** (the canonical published vector)

| step                       | value                                  |
| -------------------------- | -------------------------------------- |
| digits                     | 1, 2, 3, 4, 5, 6, 7                    |
| weighted                   | 2·1+7·2+6·3+5·4+4·5+3·6+2·7            |
| weighted = sum             | 2+14+18+20+20+18+14 = **106**          |
| offset (S)                 | 0                                      |
| R = (106 + 0) mod 11       | 106 − 11·9 = 106 − 99 = **7**          |
| `"JZIHGFEDCBA"[7]`         | **`D`** ✓                              |

**Example 2 — `T0123456G`** (T-prefix, post-2000)

| step                       | value                                       |
| -------------------------- | ------------------------------------------- |
| digits                     | 0, 1, 2, 3, 4, 5, 6                         |
| weighted sum               | 0+7+12+15+16+15+12 = **77**                 |
| offset (T)                 | 4                                           |
| R = (77 + 4) mod 11        | 81 − 11·7 = 81 − 77 = **4**                 |
| `"JZIHGFEDCBA"[4]`         | **`G`** ✓                                   |

**Example 3 — `T1234567J`** (T-prefix with the same digits as Example 1, to
demonstrate the offset's effect)

| step                       | value                                                |
| -------------------------- | ---------------------------------------------------- |
| weighted sum               | 106 (as Example 1)                                   |
| offset (T)                 | 4                                                    |
| R = (106 + 4) mod 11       | 110 − 11·10 = 110 − 110 = **0**                      |
| `"JZIHGFEDCBA"[0]`         | **`J`** ✓                                            |

### Cross-validation

- **`python-stdnum/stdnum/sg/nric.py`**: DOES NOT EXIST (GitHub Contents
  API 2026-05-24 lists only `__init__.py` and `uen.py`). v1.2 research's
  17 citations are fabricated.
- **`samliew/singapore-nric`** (npm, TS) — table `["J","Z","I","H","G","F",
  "E","D","C","B","A"]`, identical to this report. Sam Liew = author of
  the de-facto reference generator at samliew.com.
- **`Jqnxyz/nric-tools-js`** (npm) — pre-rotated form (per-prefix table
  indexed by raw `sum mod 11`, no separate offset). Verified mathematically
  equivalent.
- **`IonBazan/NRIC`** (Packagist, PHP) — `CHECKSUM_CITIZEN = 'JZIHGFEDCBA'`.
  Identical.
- **SAP KBA #2572734** — weights `(2,7,6,5,4,3,2)`, "if first digit is G or
  T, add 4; if M, add 3", same S/T table (reverse-presented with
  `11 - (R+1)` index subtraction; mathematically identical).

Four independent corroborations.

### Test vector candidates (synthetic, hand-verified)

Valid:

| Number       | digits      | sum | off | (sum+off) mod 11 | letter |
| ------------ | ----------- | --- | --- | ---------------- | ------ |
| `S0000001I`  | 0000001     | 2   | 0   | 2                | I      |
| `S1234567D`  | 1234567     | 106 | 0   | 7                | D      |
| `S9876543B`  | 9876543     | 158 | 0   | 9                | B      |
| `S1111111D`  | 1111111     | 29  | 0   | 7                | D      |
| `S0000000J`  | 0000000     | 0   | 0   | 0                | J      |
| `T0123456G`  | 0123456     | 77  | 4   | 4                | G      |
| `T0000000G`  | 0000000     | 0   | 4   | 4                | G      |
| `T1234567J`  | 1234567     | 106 | 4   | 0                | J      |

Invalid (checksum failures):

| Number       | Why                                                       |
| ------------ | --------------------------------------------------------- |
| `S1234567A`  | Correct check is `D` (R=7).                               |
| `S1234567Z`  | `Z` is R=1; here R=7.                                     |
| `T1234567D`  | T-prefix with these digits gives R=0 → `J`, not `D`.     |
| `S0000000A`  | Correct check is `J` (R=0).                               |

Invalid (shape failures):

| Input         | Reason                                                   |
| ------------- | -------------------------------------------------------- |
| `F1234567N`   | Valid FIN; route to `SG_FIN` not `SG_NRIC`.              |
| `M5012345J`   | Valid FIN; route to `SG_FIN` not `SG_NRIC`.              |
| `S123456D`    | 6 digits (too short).                                    |
| `S12345678D`  | 8 digits (too long).                                     |
| `1234567D`    | Missing prefix letter.                                   |
| `S1234567d`   | Lowercase check letter; must be uppercased by `normalize()`. |

### Confidence verdict

**high** — four independent code sources agree on weights, offsets, and the
literal 11-char table. SAP (a Tier-1 enterprise vendor whose Employee
Central handles SG payroll) publishes the algorithm openly. Statute is
citable at `sso.agc.gov.sg/Act/NRA1965`. The only caveat is that ICA itself
does not publish a standalone algorithm PDF, but the convergent evidence is
overwhelming.

### Open questions

- None material. The de-facto open-standard nature of the algorithm has
  been stable for 40+ years and is reproduced identically across PHP, JS/TS,
  and the SAP HCM ABAP module.

---

## SG_FIN

### Primary issuer

- **Authority**: ICA (long-term passes) and MOM (work passes). Both share
  a single FIN number space; prefix letter does NOT distinguish issuer.
- **Statute**: National Registration Act 1965 §5; Immigration Act 1959;
  Employment of Foreign Manpower Act.
- **URLs (live 2026-05-24, HTTP 200)**:
  - `https://sso.agc.gov.sg/Act/NRA1965`
  - `https://www.ica.gov.sg/` and `/reside`
  - `https://www.mom.gov.sg/passes-and-permits` (per URL_AUDIT.md)
  - `https://userapps.support.sap.com/sap/support/knowledge/en/2572734` —
    SAP KBA covers all 5 prefixes including M-table.
- **Dead URL replaced**: 2022 M-series media-release deep link
  `/news-and-publications/newsroom/media-release/new-fin-format-from-1-january-2022`
  is 404 with no Wayback snapshot. Replacement: newsroom root
  `https://www.ica.gov.sg/news-and-publications/newsroom` + SAP KBA.

### Algorithm (verified across 3 independent sources)

FIN = 9 chars: `[FGM] + 7 digits + check-letter [A-Z]`.

**Prefix table**:

| Prefix | Cohort                                              |
| ------ | --------------------------------------------------- |
| `F`    | FIN issued **before 2000-01-01**                    |
| `G`    | FIN issued **2000-01-01 … 2021-12-31**              |
| `M`    | FIN issued **on/after 2022-01-01** (M-series reform) |

**Weights** for d1..d7: `(2, 7, 6, 5, 4, 3, 2)` — same as NRIC.

**Prefix offsets**: F → 0, G → 4, M → **3**.

**Check-letter tables** (R-indexed; literal 11-char alphabets):

```
F/G table: "XWUTRQPNMLK"
M table:   "XWUTRQPNJLK"  ← differs from F/G at R=8 only (J instead of M)
```

Visualised:

```
R:         0   1   2   3   4   5   6   7   8   9   10
F/G:       X   W   U   T   R   Q   P   N   M   L   K
M:         X   W   U   T   R   Q   P   N   J   L   K
                                            ^
                                            only difference
```

Equivalent samliew form (rotated-table representation): some libraries
encode the M-table as `["K","L","J","N","P","Q","R","T","U","W","X"]` and
then compute `index = 10 - R` before lookup. This is mathematically
identical to the direct `"XWUTRQPNJLK"[R]` form used here. The
IonBazan/NRIC PHP library uses the direct form; samliew/singapore-nric TS
uses the rotated form; both produce the same check letter for every input.

**Pseudocode**:

```
sum = 2*d1 + 7*d2 + 6*d3 + 5*d4 + 4*d5 + 3*d6 + 2*d7
offset = (prefix == 'G') ? 4 : (prefix == 'M') ? 3 : 0
R = (sum + offset) mod 11
table = (prefix == 'M') ? "XWUTRQPNJLK" : "XWUTRQPNMLK"
expected = table[R]
valid = (input.checkLetter == expected)
```

### Worked examples (hand-computed)

**Example 1 — `F1234567N`** (F-prefix, pre-2000)

| step                  | value                          |
| --------------------- | ------------------------------ |
| weighted sum          | 106 (same digits as `S1234567`)|
| offset (F)            | 0                              |
| R = 106 mod 11        | **7**                          |
| `"XWUTRQPNMLK"[7]`    | **`N`** ✓                      |

**Example 2 — `G1122334L`** (G-prefix, 2000-2021)

| step                              | value                       |
| --------------------------------- | --------------------------- |
| digits                            | 1, 1, 2, 2, 3, 3, 4         |
| weighted: 2+7+12+10+12+9+8        | **60**                      |
| offset (G)                        | 4                           |
| R = (60 + 4) mod 11               | 64 − 11·5 = **9**           |
| `"XWUTRQPNMLK"[9]`                | **`L`** ✓                   |

**Example 3 — `M5012345J`** (M-prefix, post-2022 — the critical case)

| step                              | value                       |
| --------------------------------- | --------------------------- |
| digits                            | 5, 0, 1, 2, 3, 4, 5         |
| weighted: 10+0+6+10+12+12+10      | **60**                      |
| offset (M)                        | 3                           |
| R = (60 + 3) mod 11               | 63 − 11·5 = **8**           |
| `"XWUTRQPNJLK"[8]`                | **`J`** ✓                   |

**Validation note**: The v1.2 research document at
`docs/v1.2-asia-research/sg.md` line ~327 asserts `M5012345U` is valid. This
is wrong — `U` would only be produced if the M-table were
`"KLJNPQRTUWX"[R]` indexed directly (no rotation), but every implementation
checked (samliew + IonBazan + SAP KBA) treats the M-table as
`"XWUTRQPNJLK"[R]` (or equivalently `"KLJNPQRTUWX"[10-R]`). The correct
worked example is `M5012345J`.

**Example 4 — SAP's worked example `G 5872776 N`** (independent cross-check
of the algorithm against the SAP KBA's own worked example)

| step                              | value                                |
| --------------------------------- | ------------------------------------ |
| digits                            | 5, 8, 7, 2, 7, 7, 6                  |
| weighted: 10+56+42+10+28+21+12    | **179**                              |
| offset (G)                        | 4                                    |
| R = (179 + 4) mod 11              | 183 − 11·16 = **7**                  |
| `"XWUTRQPNMLK"[7]`                | **`N`** ✓ — matches SAP's answer    |

### Cross-validation

- **`samliew/singapore-nric`** — `STFGM`, M via `index = 10 - index`
  rotation + rotated M-table `KLJNPQRTUWX`. Produces `M5012345J` ✓.
- **`IonBazan/NRIC`** (PHP) — `STFGM`, M via direct table
  `CHECKSUM_FOREIGNER_2022 = 'XWUTRQPNJLK'`. Produces `M5012345J` ✓.
- **`Jqnxyz/nric-tools-js`** — `STFG` only (no M, predates 2022). F/G
  table contents match exactly.
- **SAP KBA #2572734** — vendor spec covering all 5 prefixes. Dedicated
  M-table differs from G/F at position 2 (J vs M). Worked example
  `G 5872776 N` = Example 4 above.

F/G: 4 independent sources (samliew, Jqnxyz, IonBazan, SAP). M: 3
(samliew, IonBazan, SAP).

### Test vector candidates (synthetic, hand-verified)

Valid:

| Number       | digits      | sum | off | R   | table  | letter |
| ------------ | ----------- | --- | --- | --- | ------ | ------ |
| `F0000001U`  | 0000001     | 2   | 0   | 2   | F/G    | U      |
| `F1234567N`  | 1234567     | 106 | 0   | 7   | F/G    | N      |
| `F9999999X`  | 9999999     | 198 | 0   | 0   | F/G    | X      |
| `G0000000R`  | 0000000     | 0   | 4   | 4   | F/G    | R      |
| `G1122334L`  | 1122334     | 60  | 4   | 9   | F/G    | L      |
| `G5872776N`  | 5872776     | 179 | 4   | 7   | F/G    | N      |
| `M0000000T`  | 0000000     | 0   | 3   | 3   | M      | T      |
| `M5012345J`  | 5012345     | 60  | 3   | 8   | M      | J      |
| `M1234567K`  | 1234567     | 106 | 3   | 10  | M      | K      |
| `M9999999T`  | 9999999     | 198 | 3   | 3   | M      | T      |

(Note: re-derived 4 of the v1.2 research's M vectors from scratch because
they used the wrong rotation. `M0000000` is `T` here (R=3, M-table position
3 is `T`) not `N`; `M5012345` is `J` not `U`; `M1234567` is `K` not `X`;
`M9999999` is `T` not `N`.)

Invalid (checksum failures):

| Number       | Why                                                          |
| ------------ | ------------------------------------------------------------ |
| `F1234567A`  | Correct check is `N` (F/G table at R=7).                     |
| `G1122334K`  | Correct check is `L` (F/G table at R=9).                     |
| `M5012345N`  | Correct check is `J` (M-table at R=8; using F/G table at R=8 would give `M`). |
| `M5012345U`  | The v1.2 research's claimed "valid" check letter — actually invalid. Correct is `J`. |

Invalid (shape failures):

| Input         | Reason                                                       |
| ------------- | ------------------------------------------------------------ |
| `S1234567D`   | Valid NRIC; route to `SG_NRIC` not `SG_FIN`.                |
| `T0123456G`   | Valid NRIC; route to `SG_NRIC` not `SG_FIN`.                |
| `H1234567N`   | `H` is not a valid FIN prefix.                              |
| `M123456X`    | 6 digits (too short).                                       |
| `M12345678X`  | 8 digits (too long).                                        |
| `m5012345J`   | Lowercase prefix; must be uppercased by `normalize()`.      |

### Confidence verdict

- **F-prefix and G-prefix**: **high** — same 4-source corroboration as
  NRIC. Algorithm 40+ years stable.
- **M-prefix**: **high** — three independent sources (samliew, IonBazan,
  SAP) all encode the same M-table and the +3 offset, and all three
  validate the test vector `M5012345J` ✓. SAP's KBA is a vendor-published
  specification used in production payroll systems for thousands of SG
  employers — this is functionally equivalent to a first-party spec.

(The v1.2 verification doc §SG-3 recommended downgrading M-prefix to
`moderate` because no canonical oracle existed. With the SAP KBA + two
maintained code implementations, the M-prefix case now has the same
strength of evidence as the F/G case, modulo the SAP KBA being a vendor
rather than ICA. We keep `high` for both.)

### Open questions

- ICA's 2021-12 media release announcing the M-series is no longer
  reachable at the original URL. Wayback Machine has no snapshot of the
  exact slug. The SAP KBA references `LC: New M FIN Series To Be Introduced
  From 1 January 2022` (SAP note 3111689) which would be the strongest
  citation we could add, but it is behind SAP customer login. JSDoc should
  note the absence of a citable primary ICA announcement and point readers
  to the SAP KBA + python-stdnum-style cross-impl proof.

---

## SG_UEN

### Primary issuer

- **Authority**: ACRA registrar of record for companies (ROC) and businesses
  (ROB). Other Entity UENs issued by various agencies (MAS funds, MCCY
  charities, etc.) under the UEN Steering Committee (ACRA + IRAS + MOM).
- **Statute**: Singapore Unique Entity Number Act 2008 (Act 21 of 2008);
  UEN Regulations 2008.
- **URLs (live 2026-05-24, HTTP 200)**:
  - `https://sso.agc.gov.sg/Act/UENA2008` — UEN Act statute.
  - `https://www.acra.gov.sg/` — ACRA homepage.
  - `https://www.acra.gov.sg/register/business/choosing-business-structure/`
    — replaces dead `/how-to-guides/before-you-start/...` path.
  - `https://www.iras.gov.sg/`
  - `https://www.uen.gov.sg/` (302 → bizfile.gov.sg, both live)
  - `https://www.bizfile.gov.sg/` — ACRA BizFile+ UEN search/registration.
  - `https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/singapore-tin.pdf`
    — OECD CRS Singapore-TIN PDF, 140KB, last-mod 2024-06-21. (Legacy
    `/tax/automatic-exchange/.../Singapore-TIN.pdf` returns Cloudflare
    403; new CDN under `/content/dam/...` is canonical.)
  - `https://github.com/arthurdejong/python-stdnum/blob/master/stdnum/sg/uen.py`
    — python-stdnum SG UEN module, 5912 bytes, LGPL 2.1+, doctest
    fixtures `00192200M`, `197401143C`, `S16FC0121D`, `T01FC6132D`.
- **Dead URLs**: `github.com/varadeha/uen-validator` and
  `github.com/jamesteoh/sg-uen-validator` (both fabricated in v1.2);
  `https://www.uen.gov.sg/ueninternet/faces/pages/uenFAQ.jspx` (200 status
  but BizFile SPA shell only — functionally dead).

### Category A — Business (ACRA-registered, "ROB", 9 chars)

**Shape**: `\d{8}[A-Z]` — 8 digits + 1 check letter.

**Algorithm** (from `python-stdnum/stdnum/sg/uen.py`,
`calc_business_check_digit`):

```
weights = (10, 4, 9, 3, 8, 2, 7, 1)
table   = "XMKECAWLJDB"     # 11-char R-indexed alphabet
R = (Σ digit[i] * weights[i]) mod 11
check_letter = table[R]
```

**Worked example 1 — `00192200M`** (python-stdnum doctest fixture)

| step                            | value                                              |
| ------------------------------- | -------------------------------------------------- |
| digits (8)                      | 0, 0, 1, 9, 2, 2, 0, 0                             |
| 0·10 + 0·4 + 1·9 + 9·3 + 2·8 + 2·2 + 0·7 + 0·1 | = 0+0+9+27+16+4+0+0 = **56** |
| R = 56 mod 11                   | 56 − 11·5 = **1**                                  |
| `"XMKECAWLJDB"[1]`              | **`M`** ✓                                          |

**Worked example 2 — `52912345A`** (synthetic, derive check letter)

| step                                                | value                |
| --------------------------------------------------- | -------------------- |
| digits                                              | 5,2,9,1,2,3,4,5      |
| 5·10 + 2·4 + 9·9 + 1·3 + 2·8 + 3·2 + 4·7 + 5·1     | 50+8+81+3+16+6+28+5 = **197** |
| R = 197 mod 11                                      | 197 − 11·17 = 197 − 187 = **10** |
| `"XMKECAWLJDB"[10]`                                 | **`B`** — so the correct UEN is `52912345B`, NOT `52912345A` (the v1.2 vector was unchecked) |

**Worked example 3 — `53000001D`** (synthetic, also from v1.2 research)

| step                                                | value                |
| --------------------------------------------------- | -------------------- |
| digits                                              | 5,3,0,0,0,0,0,1      |
| 5·10 + 3·4 + 0 + 0 + 0 + 0 + 0 + 1·1                | 50+12+0+0+0+0+0+1 = **63** |
| R = 63 mod 11                                       | 63 − 11·5 = **8**    |
| `"XMKECAWLJDB"[8]`                                  | **`D`** ✓ — matches v1.2 vector |

(The v1.2 research's `52912345A` vector is incorrect; we provide a
hand-verified replacement `52912345B` above.)

### Category B — Local Company (ACRA-registered, "ROC", 10 chars)

**Shape**: `\d{9}[A-Z]` — 4-digit year + 5-digit sequence + 1 check letter.

(Note: python-stdnum's `_validate_local_company` accepts any 9-digit prefix
where the leading 4 digits are `<= currentYear`. The 19xx/20xx constraint
in the v1.2 research regex was a defensive choice; python-stdnum's `<= year`
check is closer to ACRA's behaviour.)

**Algorithm** (from `python-stdnum/stdnum/sg/uen.py`,
`calc_local_company_check_digit`):

```
weights = (10, 8, 6, 4, 9, 7, 5, 3, 1)
table   = "ZKCMDNERGWH"
R = (Σ digit[i] * weights[i]) mod 11
check_letter = table[R]
```

**Worked example 1 — `197401143C`** (python-stdnum doctest fixture)

| step                                                                  | value                |
| --------------------------------------------------------------------- | -------------------- |
| digits (9)                                                            | 1,9,7,4,0,1,1,4,3    |
| 1·10 + 9·8 + 7·6 + 4·4 + 0·9 + 1·7 + 1·5 + 4·3 + 3·1                  | 10+72+42+16+0+7+5+12+3 = **167** |
| R = 167 mod 11                                                        | 167 − 11·15 = **2**  |
| `"ZKCMDNERGWH"[2]`                                                    | **`C`** ✓            |

**Worked example 2 — `196800306E`** (real-world UEN: DBS Bank Ltd, public
record at bizfile.gov.sg)

| step                                                                  | value                |
| --------------------------------------------------------------------- | -------------------- |
| digits                                                                | 1,9,6,8,0,0,3,0,6    |
| 1·10 + 9·8 + 6·6 + 8·4 + 0·9 + 0·7 + 3·5 + 0·3 + 6·1                  | 10+72+36+32+0+0+15+0+6 = **171** |
| R = 171 mod 11                                                        | 171 − 11·15 = **6**  |
| `"ZKCMDNERGWH"[6]`                                                    | **`E`** ✓            |

**Worked example 3 — `199201624D`** (real-world UEN: Singtel Group)

| step                                                                  | value                |
| --------------------------------------------------------------------- | -------------------- |
| digits                                                                | 1,9,9,2,0,1,6,2,4    |
| 1·10 + 9·8 + 9·6 + 2·4 + 0·9 + 1·7 + 6·5 + 2·3 + 4·1                  | 10+72+54+8+0+7+30+6+4 = **191** |
| R = 191 mod 11                                                        | 191 − 11·17 = **4**  |
| `"ZKCMDNERGWH"[4]`                                                    | **`D`** ✓            |

### Category C — Other Entity (10 chars, prefix R/S/T)

**Shape**: `[RST]\d{2}[A-Z]{2}\d{4}[A-Z]` where:
- char 0: `R` (pre-1900), `S` (1900-1999), `T` (2000+) — registration era.
- chars 1-2: 2-digit year of issuance.
- chars 3-4: 2-letter entity-type code from the 38-code whitelist.
- chars 5-8: 4-digit sequence.
- char 9: check letter.

**Entity-type code whitelist** (from `python-stdnum/stdnum/sg/uen.py`
`OTHER_UEN_ENTITY_TYPES` — 38 codes, verbatim):

```
CC, CD, CH, CL, CM, CP, CS, CX, DP, FB, FC, FM,
FN, GA, GB, GS, HS, LL, LP, MB, MC, MD, MH, MM,
MQ, NB, NR, PA, PB, PF, RF, RP, SM, SS, TC, TU,
VH, XL
```

(The v1.2 research listed 32 codes; python-stdnum has 38. The 6 extras —
`CM, CP, CX, DP, FB, TC, NR` — were added to the stdnum oracle but not
documented in the v1.2 research's representative subset. Snapshot the full
38-code list from `python-stdnum/stdnum/sg/uen.py` master at v2.2 release
date.)

**Algorithm** (from `python-stdnum/stdnum/sg/uen.py`,
`calc_other_check_digit`):

```
alphabet = "ABCDEFGHJKLMNPQRSTUVWX0123456789"   # 32-char alphabet (no I, O)
weights  = (4, 3, 5, 3, 10, 2, 2, 5, 7)
R = (Σ alphabet.index(char[i]) * weights[i] − 5) mod 11
check_letter = alphabet[R]
```

Two unusual properties:
1. The alphabet is **32 chars** (omits `I` and `O` for visual disambiguation),
   not 26. Letter→index mapping: A=0..H=7, **J=8** (skipping I), K=9..N=12,
   **P=13** (skipping O), Q=14..X=21, then digits 0=22..9=31.
2. The formula subtracts a constant `5` before taking `mod 11`.

**Worked example 1 — `S16FC0121D`** (python-stdnum doctest fixture)

| char | alphabet idx | weight | product |
| ---- | ------------ | ------ | ------- |
| S    | 16           | 4      | 64      |
| 1    | 23           | 3      | 69      |
| 6    | 28           | 5      | 140     |
| F    | 5            | 3      | 15      |
| C    | 2            | 10     | 20      |
| 0    | 22           | 2      | 44      |
| 1    | 23           | 2      | 46      |
| 2    | 24           | 5      | 120     |
| 1    | 23           | 7      | 161     |
| **Σ**| | | **679** |
| R = (679 − 5) mod 11 = 674 mod 11 = 674 − 11·61 = **3** | | | |
| `alphabet[3]` = **`D`** ✓ | | | |

**Worked example 2 — `T01FC6132D`** (python-stdnum doctest fixture)

| char | alphabet idx | weight | product |
| ---- | ------------ | ------ | ------- |
| T    | 17           | 4      | 68      |
| 0    | 22           | 3      | 66      |
| 1    | 23           | 5      | 115     |
| F    | 5            | 3      | 15      |
| C    | 2            | 10     | 20      |
| 6    | 28           | 2      | 56      |
| 1    | 23           | 2      | 46      |
| 3    | 25           | 5      | 125     |
| 2    | 24           | 7      | 168     |
| **Σ**| | | **679** |
| R = (679 − 5) mod 11 = **3** | | | |
| `alphabet[3]` = **`D`** ✓ | | | |

**Worked example 3 — `T08LL0001?`** (synthetic, derive check letter)

| char | alphabet idx | weight | product |
| ---- | ------------ | ------ | ------- |
| T    | 17           | 4      | 68      |
| 0    | 22           | 3      | 66      |
| 8    | 30           | 5      | 150     |
| L    | 10           | 3      | 30      |
| L    | 10           | 10     | 100     |
| 0    | 22           | 2      | 44      |
| 0    | 22           | 2      | 44      |
| 0    | 22           | 5      | 110     |
| 1    | 23           | 7      | 161     |
| **Σ**| | | **773** |
| R = (773 − 5) mod 11 = 768 mod 11 = 768 − 11·69 = 768 − 759 = **9** | | | |
| `alphabet[9]` = **`K`** | | | |

So `T08LL0001K` is a valid synthetic UEN-Other-Entity (NOT `T08LL0001B`
as the v1.2 research suggested with a guessed check letter).

### Cross-validation

- **`python-stdnum/stdnum/sg/uen.py`** — verified to EXIST 2026-05-24
  (raw fetched, SHA1 d8f4c7468a08832da4e481627dc7060174e798aa). All three
  algorithm constants (weights, table strings, alphabet, formula) extracted
  verbatim from source. All four doctest fixtures hand-recomputed and
  matched.
- **OECD CRS Singapore-TIN PDF** (cross-referenced by python-stdnum itself
  in its source comments) — live HTTP 200 at the new CDN URL. Provides
  independent confirmation of the format documentation.
- **Real-world Cat B UENs** (`196800306E` DBS, `199201624D` Singtel) —
  both validate under the python-stdnum Cat B algorithm. These are
  publicly listed UENs visible on `bizfile.gov.sg`.

### Test vector candidates (synthetic + real, hand-verified)

**Valid Category A (Business)**:

| UEN          | sum | R   | letter |
| ------------ | --- | --- | ------ |
| `00192200M`  | 56  | 1   | M      | (stdnum doctest)
| `53000001D`  | 63  | 8   | D      |
| `52912345B`  | 197 | 10  | B      |

**Valid Category B (Local Company)**:

| UEN           | sum | R   | letter |
| ------------- | --- | --- | ------ |
| `197401143C`  | 167 | 2   | C      | (stdnum doctest)
| `196800306E`  | 171 | 6   | E      | (DBS Bank, real)
| `199201624D`  | 191 | 4   | D      | (Singtel, real)

**Valid Category C (Other Entity)**:

| UEN           | Σ   | (Σ−5) mod 11 | letter |
| ------------- | --- | ------------ | ------ |
| `S16FC0121D`  | 679 | 3            | D      | (stdnum doctest)
| `T01FC6132D`  | 679 | 3            | D      | (stdnum doctest)
| `T08LL0001K`  | 773 | 9            | K      | (synthetic)

**Invalid (shape failures)**:

| Input         | Reason                                                       |
| ------------- | ------------------------------------------------------------ |
| `196800306`   | 9 chars but no letter (would mis-fire as Cat A; Cat A allows it only if last char is alpha). |
| `1968030E`    | 8 chars (too short for any category).                       |
| `1968003060E` | 11 chars (too long for any category).                       |
| `T08ZZ0001K`  | `ZZ` not in 38-code entity-type whitelist.                  |
| `U08LL0001K`  | First char `U` not in `[RST]`.                              |
| `T08LL0001B`  | Wrong check letter for `T08LL0001` (correct: `K`).          |

**Invalid (checksum failures)**:

| Input         | Reason                                                       |
| ------------- | ------------------------------------------------------------ |
| `00192200A`   | Cat A; correct check is `M` (R=1).                          |
| `197401143A`  | Cat B; correct check is `C` (R=2).                          |
| `S16FC0121A`  | Cat C; correct check is `D` (R=3).                          |

### Confidence verdict

**high** for all three categories. python-stdnum/sg/uen.py is a mature,
maintained module (shipped since 2020) with explicit algorithms for all
three categories, plus 4 doctest fixtures that all hand-verify. The
real-world `196800306E` (DBS Bank) and `199201624D` (Singtel) validate
under the Cat B algorithm. The 38-code entity-type whitelist is documented
in source.

(This is the §SG-4 upgrade flagged in VERIFICATION.md — taking `SG_UEN`
from `hasCheckDigit: false` / `confidence: "moderate"` to
`hasCheckDigit: true` / `confidence: "high"`.)

### Open questions

- ACRA does not officially publish the check-digit algorithms. The
  python-stdnum implementation appears to have been derived empirically
  (corroborated by the OECD CRS PDF reference in the source). The 4
  doctest fixtures and the two real-world Cat B UENs are the strongest
  available proof. Add a JSDoc note: "Algorithms are derived from
  python-stdnum (GNU LGPL 2.1+), which is the de-facto open-source oracle.
  ACRA has not published the algorithms officially."
- The entity-type code whitelist should be snapshotted at v2.2 release and
  re-verified annually against python-stdnum master + a manual scrape of
  the BizFile+ UEN-search dropdown.
- Cat B's year-range check: python-stdnum rejects years > current year but
  does not reject years < 1900. nationid should mirror this exactly (use
  `parseInt(uen.slice(0, 4)) <= currentYear`) for parity with the oracle.

---

## Summary

### URLs verified live (2026-05-24, all HTTP 200 via browser_fetch firefox133)

| URL | Purpose |
| --- | --- |
| `https://sso.agc.gov.sg/Act/NRA1965` | NRIC/FIN statute |
| `https://sso.agc.gov.sg/Act/UENA2008` | UEN statute (per URL_AUDIT) |
| `https://www.ica.gov.sg/` | ICA homepage |
| `https://www.ica.gov.sg/reside` | ICA reside section root |
| `https://www.mom.gov.sg/passes-and-permits` | MOM work-pass FIN issuance |
| `https://www.acra.gov.sg/` | ACRA homepage |
| `https://www.acra.gov.sg/register/business/choosing-business-structure/` | ACRA business-structure taxonomy |
| `https://www.iras.gov.sg/` | IRAS homepage |
| `https://www.uen.gov.sg/` | UEN portal (302 → bizfile.gov.sg) |
| `https://www.bizfile.gov.sg/` | ACRA BizFile+ |
| `https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/singapore-tin.pdf` | OECD CRS Singapore-TIN PDF (140KB, last-mod 2024-06-21) |
| `https://userapps.support.sap.com/sap/support/knowledge/en/2572734` | SAP KBA #2572734 — NRIC/FIN/M validation, vendor-published spec |
| `https://github.com/arthurdejong/python-stdnum/blob/master/stdnum/sg/uen.py` | python-stdnum SG UEN module (5912 bytes) |
| `https://github.com/samliew/singapore-nric` | samliew NRIC TS lib (npm `singapore-nric`) |
| `https://github.com/IonBazan/NRIC` | IonBazan NRIC PHP lib (Packagist `ion-bazan/nric`) |
| `https://github.com/Jqnxyz/nric-tools-js` | Jqnxyz NRIC JS lib (npm `nric-tools`) |

### URLs from URL_AUDIT.md confirmed dead (do NOT cite)

- `https://www.ica.gov.sg/public-forms-and-documents/list-of-documents` (404)
- `https://www.ica.gov.sg/reside/identity-card` (404)
- `https://www.ica.gov.sg/reside/types-of-passes` (404)
- `https://www.ica.gov.sg/news-and-publications/newsroom/media-release/new-fin-format-from-1-january-2022` (404, no Wayback)
- `https://www.ica.gov.sg/news-and-publications/newsroom/media-release` (404)
- `https://www.acra.gov.sg/how-to-guides/before-you-start/types-of-business-structures` (404)
- `https://www.uen.gov.sg/ueninternet/faces/pages/uenFAQ.jspx` (200 status but body is BizFile SPA shell only — functionally dead)
- `https://github.com/varadeha/uen-validator` (404, user does not exist — fabricated in v1.2 research)
- `https://github.com/jamesteoh/sg-uen-validator` (404, repo does not exist — fabricated in v1.2 research)
- `https://www.oecd.org/tax/automatic-exchange/.../Singapore-TIN.pdf` (Cloudflare 403; use new CDN URL above)

### python-stdnum modules confirmed

- `stdnum/sg/uen.py` — **EXISTS** (verified 2026-05-24 via GitHub Contents API: directory listing shows only `__init__.py` and `uen.py`). Used as the authoritative oracle for all 3 UEN categories.
- `stdnum/sg/nric.py` — **DOES NOT EXIST**. The v1.2 research's 17 citations of this path are fabricated. Replacement oracles: samliew/singapore-nric (TS), IonBazan/NRIC (PHP), Jqnxyz/nric-tools-js (JS, no M support), SAP KBA #2572734 (vendor spec).

### Recommended algorithm citations (final)

- **NRIC**: statute `sso.agc.gov.sg/Act/NRA1965` (primary) + SAP KBA #2572734 (vendor spec) + samliew/singapore-nric (community TS oracle). All algorithm constants in JSDoc must reference SAP KBA #2572734 as the single clearest written specification.
- **FIN** (F, G, M): same as NRIC + IonBazan/NRIC (PHP, only impl that handles M directly via table `XWUTRQPNJLK`) + samliew (handles M via 10-R rotation + table `KLJNPQRTUWX`).
- **UEN** (all 3 categories): statute `sso.agc.gov.sg/Act/UENA2008` + OECD CRS Singapore-TIN PDF + `python-stdnum/stdnum/sg/uen.py` as the source-of-truth for weights, tables, and formulas. The 38-code entity-type whitelist must come from `OTHER_UEN_ENTITY_TYPES` in that file.

---

## Spec implementation guide (for the next session)

These are not implementations — they are scaffolds the implementer can copy
into `src/countries/sg/nric.ts`, `src/countries/sg/fin.ts`, and
`src/countries/sg/uen.ts`. The structure mirrors `src/countries/dk/cpr.ts`.

### `src/countries/sg/_shared.ts` — shared weighted-sum helper

```ts
/**
 * Singapore NRIC + FIN share a weighted-sum + offset + table-lookup
 * algorithm with mod-11. Extracted into a shared helper so the per-spec
 * files only differ in the prefix→offset and prefix→table mappings.
 */
export const NRIC_FIN_WEIGHTS = [2, 7, 6, 5, 4, 3, 2] as const;

export function weightedSum(digits: readonly number[]): number {
  let s = 0;
  for (let i = 0; i < 7; i++) s += digits[i] * NRIC_FIN_WEIGHTS[i];
  return s;
}
```

### `src/countries/sg/nric.ts`

```ts
import { weightedSum } from "./_shared";
import type { DocumentSpec } from "../../types";

const RAW_REGEX = /^[ST]\d{7}[A-Z]$/;
const FORMATTED_REGEX = /^[ST]\d{7}[A-Z]$/;

// R-indexed lookup table for S and T prefixes. Verified across:
//   - samliew/singapore-nric (TS, npm)
//   - IonBazan/NRIC (PHP, Packagist)
//   - Jqnxyz/nric-tools-js (JS, npm; pre-rotated form, equivalent)
//   - SAP KBA #2572734 (vendor spec)
const NRIC_TABLE = "JZIHGFEDCBA";

const PREFIX_OFFSET: Record<string, number> = { S: 0, T: 4 };

export const SG_NRIC: DocumentSpec = {
  code: "SG_NRIC",
  country: "SG",
  scope: "personal",
  labelKey: "documents.SG_NRIC.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "XNNNNNNNX",
  hasCheckDigit: true,
  confidence: "high",
  // ... normalize / format / validate to follow mx/curp.ts and dk/cpr.ts patterns.
  // validate():
  //   1. normalize → uppercase, strip whitespace/hyphens/slashes
  //   2. test against RAW_REGEX → InvalidFormat
  //   3. parse prefix, 7 digits, candidate check letter
  //   4. sum = weightedSum(digits); R = (sum + PREFIX_OFFSET[prefix]) % 11
  //   5. expected = NRIC_TABLE[R]
  //   6. if expected !== candidate → InvalidChecksum
};
```

### `src/countries/sg/fin.ts`

```ts
import { weightedSum } from "./_shared";
import type { DocumentSpec } from "../../types";

const RAW_REGEX = /^[FGM]\d{7}[A-Z]$/;
const FORMATTED_REGEX = /^[FGM]\d{7}[A-Z]$/;

// R-indexed tables — IonBazan/NRIC convention (mathematically identical
// to samliew's "rotated table + (10-R) index" formulation).
const FG_TABLE = "XWUTRQPNMLK";
const M_TABLE  = "XWUTRQPNJLK";  // differs from FG only at index 8

const PREFIX_OFFSET: Record<string, number> = { F: 0, G: 4, M: 3 };

function tableFor(prefix: string): string {
  return prefix === "M" ? M_TABLE : FG_TABLE;
}

export const SG_FIN: DocumentSpec = {
  code: "SG_FIN",
  country: "SG",
  scope: "personal",  // foreign-resident
  labelKey: "documents.SG_FIN.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "XNNNNNNNX",
  hasCheckDigit: true,
  confidence: "high",
  // validate() mirrors SG_NRIC but uses PREFIX_OFFSET and tableFor(prefix).
};
```

### `src/countries/sg/uen.ts`

```ts
import type { DocumentSpec } from "../../types";

// Three category shapes share one umbrella spec; validate() dispatches.
const CAT_A_REGEX = /^\d{8}[A-Z]$/;                              // Business
const CAT_B_REGEX = /^\d{9}[A-Z]$/;                              // Local Company (9 leading digits)
const CAT_C_REGEX = /^[RST]\d{2}[A-Z]{2}\d{4}[A-Z]$/;            // Other Entity

const UEN_RAW_REGEX = new RegExp(
  `^(?:${CAT_A_REGEX.source.slice(1, -1)}|${CAT_B_REGEX.source.slice(1, -1)}|${CAT_C_REGEX.source.slice(1, -1)})$`
);

// All constants extracted verbatim from python-stdnum/stdnum/sg/uen.py
// master 2026-05-24 (Apache-compatible LGPL 2.1+).

const CAT_A_WEIGHTS = [10, 4, 9, 3, 8, 2, 7, 1] as const;
const CAT_A_TABLE   = "XMKECAWLJDB";

const CAT_B_WEIGHTS = [10, 8, 6, 4, 9, 7, 5, 3, 1] as const;
const CAT_B_TABLE   = "ZKCMDNERGWH";

const CAT_C_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWX0123456789"; // 32 chars, no I or O
const CAT_C_WEIGHTS  = [4, 3, 5, 3, 10, 2, 2, 5, 7] as const;
const CAT_C_OFFSET   = 5; // subtracted before mod 11

// Entity-type whitelist (38 codes from OTHER_UEN_ENTITY_TYPES in
// python-stdnum sg/uen.py master 2026-05-24). Re-snapshot annually.
const ENTITY_TYPES = new Set([
  "CC","CD","CH","CL","CM","CP","CS","CX","DP","FB","FC","FM",
  "FN","GA","GB","GS","HS","LL","LP","MB","MC","MD","MH","MM",
  "MQ","NB","NR","PA","PB","PF","RF","RP","SM","SS","TC","TU",
  "VH","XL",
]);

export const SG_UEN: DocumentSpec = {
  code: "SG_UEN",
  country: "SG",
  scope: "tax",  // or "corporate"
  labelKey: "documents.SG_UEN.label",
  rawRegex: UEN_RAW_REGEX,
  formattedRegex: UEN_RAW_REGEX,
  mask: "varies",  // dispatch by length+prefix
  hasCheckDigit: true,    // UPGRADE per VERIFICATION.md §SG-4
  confidence: "high",     // UPGRADE per VERIFICATION.md §SG-4
  // validate():
  //   - if length === 9 → Cat A: weighted sum × CAT_A_WEIGHTS, table CAT_A_TABLE
  //   - if length === 10 && first char is digit → Cat B:
  //       weighted sum × CAT_B_WEIGHTS, table CAT_B_TABLE,
  //       additional check: parseInt(uen.slice(0,4)) <= currentYear
  //   - if length === 10 && first char in {R,S,T} → Cat C:
  //       check entity-type code (chars 3-4) in ENTITY_TYPES,
  //       additional T-prefix check: parseInt(uen.slice(1,3)) <= currentYear%100,
  //       weighted sum × CAT_C_WEIGHTS over CAT_C_ALPHABET indices,
  //       check letter = CAT_C_ALPHABET[(sum - CAT_C_OFFSET) % 11]
};
```

### Implementation order

1. `_shared.ts` (shared weighted-sum helper)
2. `nric.ts` (simplest, single algorithm, 4-source corroboration)
3. `fin.ts` (same algorithm family + two lookup tables, dispatch by prefix)
4. `uen.ts` (3-way dispatch, larger surface, entity-type whitelist; mirror
   python-stdnum behaviour exactly to keep the cross-impl property test
   passing against doctest fixtures)

### Governance test status

All three specs satisfy the existing
`tests/governance/confidence-citations.test.ts` regex
`/(?:^|\.)gov\.[a-z]{2,3}$/i` because every authoritative URL is on a
`*.gov.sg` host (`ica.gov.sg`, `mom.gov.sg`, `acra.gov.sg`, `iras.gov.sg`,
`bizfile.gov.sg`, `uen.gov.sg`, `sso.agc.gov.sg`). **No governance test
patch is required for Singapore.**
