# Denmark (DK)

Document specs implemented in v0.6.

## DK_CPR — CPR-nummer

- Issuer: CPR-kontoret.
- Source: <https://cpr.dk/>
- Format: 10 digits (`DDMMYY-NNNN`).
- Composition: 6 DDMMYY + 4 løbenummer (last digit's parity = sex).
- Check digit policy:
  - **Pre-2007 numbers**: weights `[4, 3, 2, 7, 6, 5, 4, 3, 2, 1]` over all
    10 digits, `sum mod 11 == 0`.
  - **Post-2007 numbers**: the CPR Office formally **abolished the modulus**
    because the legacy number-space had run out and modern numbers
    cannot satisfy it consistently.
- Library policy: `validate()` is **format-only** (length, regex, plausible
  date). The legacy mod-11 check is exposed as `cprMod11Legacy(input)` for
  callers that want to discriminate pre-2007 numbers, but it is **not
  enforced**.
- `hasCheckDigit` is `false` and `confidence` is `moderate`, reflecting the
  partial coverage (format + date deterministic; checksum only available
  for legacy numbers).

Reference: <https://cpr.dk/cpr-systemet/personnumre-uden-kontrolciffer-modulus-11-kontrol/>

## DK_CVR — CVR

- Issuer: Erhvervsstyrelsen.
- Source: <https://datacvr.virk.dk/>
- Format: 8 digits.
- Check digit: weights `[2, 7, 6, 5, 4, 3, 2, 1]` over all 8 digits;
  `sum mod 11 == 0`.
- Confidence: **high**.

## DK_VAT — Moms

- Format: `DK` + 8-digit CVR.
- Validation: CVR mod-11 on the 8-digit body.
- Confidence: **high**.

## Cross-validation

- `python-stdnum` (`stdnum.dk.cpr`, `stdnum.dk.cvr`) — same approach: CPR
  format-only, CVR full mod-11.
- `validator.js` — `isVAT('DK')`.
