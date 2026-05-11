# Finland (FI)

Document specs implemented in v0.6.

## FI_HETU — Henkilötunnus

- Issuer: DVV (Digital and Population Data Services Agency).
- Source: <https://dvv.fi/en/personal-identity-code>
- Format: 11 chars: `DDMMYY` + century separator + 3 individual + 1 check.
- Century separators (post-2023 reform):
  - `+` 1800s.
  - `-` 1900s (also `Y/X/W/V/U`).
  - `A` 2000s (also `B/C/D/E/F`).
- Check digit: `(int(DDMMYY || NNN) mod 31)` indexed into the alphabet
  `"0123456789ABCDEFHJKLMNPRSTUVWXY"` (skipping G, I, O, Q, Z).
- Confidence: **high**.

## FI_YTUNNUS — Y-tunnus (Business ID)

- Issuer: PRH / Verohallinto via the YTJ joint registry.
- Source: <https://www.ytj.fi/>
- Format: 8 digits (`1234567-8`).
- Check digit: weights `[7, 9, 10, 5, 8, 4, 2]` over the 7 body digits;
  `dv = 11 - (sum mod 11)`; if 11 → 0; if 10 → invalid number.
- Confidence: **high**.

## FI_VAT — ALV-numero

- Format: `FI` + 8-digit Y-tunnus (no dash).
- Validation: Y-tunnus mod-11 on the 8-digit body.
- Confidence: **high**.

## Cross-validation

- `finnish-personal-identity-code` (npm) — HETU.
- `finnish-business-ids` (npm) — Y-tunnus.
- `python-stdnum` (`stdnum.fi.hetu`, `stdnum.fi.ytunnus`).
