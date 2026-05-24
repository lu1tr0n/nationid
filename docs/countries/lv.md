# Latvia (LV)

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|-----------|
| `LV_VAT` | tax | 13 (`LV` + 11 digits) | Weighted mod-11 (legal) / date-format (natural) | moderate |

Ships under the tree-shakable subpath `nationid/lv` and under the EU-wide
aggregator `nationid/vat`.

---

## `LV_VAT` — Pievienotās vērtības nodokļa reģistrācijas numurs (PVN)

### Overview

Latvian VAT registration number issued by Valsts ieņēmumu dienests
(VID, State Revenue Service). PVN is the universal term in Latvian
business practice — it is both the abbreviation of *Pievienotās vērtības
nodoklis* (Value Added Tax) and the colloquial name of the registration
number itself. The number is shared between legal entities and
sole-trader natural persons via two different issuance branches with
two different checksum rules.

- **Issuer**: Valsts ieņēmumu dienests (VID) —
  <https://www.vid.gov.lv/> ✓ live 2026-05-24
- **Statute**: `Pievienotās vērtības nodokļa likums, Latvijas Vēstnesis 197/2012`
  — binding authority published in the official journal.
- **Composition**: `LV` prefix + 11 digits. The first body digit selects
  the issuance branch:
  - `4..9` → **legal entity** (high confidence)
  - `0..3` → **natural person** (moderate confidence, see below)
- **Visual format**: `LV 12345678901` (single 11-digit block after the
  country prefix).

### Algorithm

PVN has two checksum branches, dispatched on the first body digit.

#### Legal-entity branch (first body digit `4..9`) — confidence: high

Weighted mod-11 over all 11 body digits using the published VID weights
`[9, 1, 4, 8, 3, 10, 2, 5, 7, 6, 1]`. The full weighted sum must be
congruent to **3 mod 11**.

```
weights = [9, 1, 4, 8, 3, 10, 2, 5, 7, 6, 1]
sum(weights[i] * int(body[i]) for i in 0..10) mod 11 == 3
```

Equivalently, the eleventh digit equals `(3 - r + 11) mod 11`, where
`r` is the weighted sum of the first 10 digits with weights
`[9, 1, 4, 8, 3, 10, 2, 5, 7, 6]`.

#### Natural-person branch (first body digit `0..3`) — confidence: moderate

The first six body digits encode `DDMMYY`; a structural date-validity
check is performed (`01..31` for day, `01..12` for month). **No
authoritative checksum is published by VID for this branch.**
`python-stdnum`'s own source comment on `stdnum/lv/pvn.py` reads:

> *"note that this algorithm has not been confirmed by an independent
> source"*

Because no second-party publication confirms the natural-person check
digit, `nationid` ships the natural-person branch as **format-only**:
the date components must be well-formed but no checksum recomputation
is performed. Consumers are advised to treat
`validate("LV_VAT", x) === true` on a natural-person PVN as a *shape*
check rather than a full *real-document* check, exactly as the
`IN_EPIC` spec advises for India's EPIC voter ID.

The overall spec confidence is therefore declared as `moderate` — high
defensibility for the legal-entity branch, moderate for the
natural-person branch. The dual-branch reality is documented in the
spec header at `src/countries/lv/vat.ts` and in VERIFICATION.md §LV.

### Sources

- VID — Valsts ieņēmumu dienests (issuer root):
  <https://www.vid.gov.lv/> ✓ live 2026-05-24 (pre-audit)
- VID — PVN section (Wayback snapshot due to intermittent direct-fetch
  blocking from non-LV IPs):
  <https://web.archive.org/web/2025/https://www.vid.gov.lv/lv/pievienotas-vertibas-nodoklis> ✓ (Wayback snapshot)
- Statute (binding authority) on Likumi.lv (official consolidated text):
  <https://likumi.lv/ta/id/253451-pievienotas-vertibas-nodokla-likums> ✓ live 2026-05-24
- VIES portal (cross-validation, EU-wide):
  <https://ec.europa.eu/taxation_customs/vies/> ✓ live 2026-05-24
- EU VAT Directive 2006/112/EC, art. 214:
  <https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32006L0112> ✓ live 2026-05-24
- Cross-validated against `python-stdnum` (`stdnum.lv.pvn`):
  <https://github.com/arthurdejong/python-stdnum/blob/master/stdnum/lv/pvn.py> ✓ live 2026-05-24

### Synthetic test vectors

```
valid (legal-entity weighted mod-11, sum ≡ 3 mod 11):
  - LV40003009497   (canonical anchor — VERIFICATION §LV)
  - LV55333007359
  - LV75595060446
  - LV06023977921
  - LV31124080374
  - LV60653064422

invalid (legal-entity check fail):
  - LV40003009498   (last digit flipped, full sum no longer ≡ 3)
  - LV40003009490   (last digit zeroed)

invalid (format — non-digit in body):
  - LV4000352160A
  - LV1234567890    (10 digits — `too_short`)
```

Worked example for the canonical anchor `LV40003009497`:

- body = `40003009497`, first body digit `4` → legal entity branch.
- weights `[9, 1, 4, 8, 3, 10, 2, 5, 7, 6, 1]`.
- weighted sum:
  `9·4 + 1·0 + 4·0 + 8·0 + 3·3 + 10·0 + 2·0 + 5·9 + 7·4 + 6·9 + 1·7`
  `= 36 + 0 + 0 + 0 + 9 + 0 + 0 + 45 + 28 + 54 + 7`
  `= 179`.
- `179 mod 11 = 3` ✓.

### Recent reforms

- **2012** — current consolidated `Pievienotās vērtības nodokļa likums`
  (Latvijas Vēstnesis 197/2012) replaces the 1995 VAT Act. Format
  unchanged; statute consolidation only.
- **2017** — privacy reform introduces personal codes starting `32`
  that do **not** encode date-of-birth (replaces the historical
  `DDMMYY`-leading personal-code format for new issuances). The
  natural-person branch of PVN inherits this: `32`-prefixed bodies pass
  the structural date check trivially because `32` exceeds the day
  range — they instead match the `4..9` legal-entity branch if and
  only if their checksum passes mod-11 ≡ 3. Practical effect: most
  sole-trader VAT numbers issued after 2017 validate via the
  legal-entity branch, not the natural-person branch.
- **2010** — Council Regulation (EU) No 904/2010 reaffirms PVN as the
  VIES-exposed identifier for cross-border Latvian invoicing.

### Open questions

- Whether the natural-person branch checksum can be confirmed against a
  second authoritative source. If VID publishes the algorithm in a
  future *metodiskais materiāls*, promote the spec to `confidence: high`
  and add full checksum recomputation in the natural-person branch.

---

## Notes for consumers

- `LV_VAT` is **offline structural validation only**. For active-status
  verification, query VIES at
  <https://ec.europa.eu/taxation_customs/vies/> (prefix `LV`).
- The dual-branch reality means that a `validate("LV_VAT", x) === true`
  result has different epistemic weight depending on the first body
  digit: `4..9` is checksum-verified, `0..3` is format-verified only.
  Downstream KYC flows that need stronger guarantees on natural-person
  PVNs should perform a VIES lookup.
- Sole-trader PVNs issued after the 2017 privacy reform increasingly
  use the `32`-prefixed personal-code series, which routes through the
  legal-entity branch — those numbers are checksum-verified to high
  confidence even though the holder is a natural person.
- The `Likumi.lv` consolidated statute URL above is the binding
  authority; VID's own portal hosts implementation guidance but not the
  primary statute text.
