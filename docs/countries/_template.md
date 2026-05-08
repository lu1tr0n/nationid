# {Country name} ({ISO-2 code})

> Reference for `nationid` consumers and contributors. Copy this template when adding a new country.

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|-----------|
| `<CC>_<DOC>` | personal/tax | N | algorithm name or "none" | high/moderate/low/unconfirmed |

## `<CC>_<DOC>`

### Overview

Brief description (1-2 sentences): what is this document, who issues it, who carries it.

- **Issuer**: name + URL of the issuing authority
- **Composition**: what the digits represent (region + birth date + correlative + DV, etc.)
- **Visual format**: how the document appears on the physical card / certificate

### Algorithm

Describe the validation algorithm in plain language plus pseudocode.

```
weights = [...]
sum = ...
expected_dv = ...
```

### Sources

- Primary (official issuer): URL with date accessed
- Secondary (mature library, academic paper): URL with date accessed

### Synthetic test vectors

Five valid, five invalid. Use synthetic numbers only.

```
valid:
  - <example>
  - <example>

invalid (format):
  - <example>
  - <example>

invalid (checksum):
  - <example>
  - <example>
```

### Recent reforms

Document any reform from the last 24 months that affects format, algorithm, or scope.

### Open questions

Questions that need further research or in-country review before promoting to higher confidence.
