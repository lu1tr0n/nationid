# Panamá (PA)

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|-----------|
| `PA_CEDULA` | personal | variable | none | moderate |
| `PA_RUC` | tax | variable | none (DV not normalized) | low |

## `PA_CEDULA` — Cédula de Identidad Personal

### Overview

Personal identity document for Panamanian citizens and resident foreigners. Issued by the Tribunal Electoral.

- **Issuer**: Tribunal Electoral — <https://www.tribunal-electoral.gob.pa/>
- **Composition**: `[Tipo]-[Tomo]-[Asiento]`
- **Visual format**: `8-123-456` or `PE-12-345`

### Algorithm

Format-only:

```
[Tipo]    in {1..13, PE, E, N}
[Tomo]    \d{1,4}
[Asiento] \d{1,6}
```

The hyphens are mandatory delimiters in the canonical form.

#### Prefix glossary

| Prefix | Meaning |
|--------|---------|
| 1-13   | Provincia / comarca de nacimiento |
| `PE`   | Panameño nacido en el extranjero |
| `E`    | Extranjero residente |
| `N`    | Naturalizado |

### Sources

- Tribunal Electoral: <https://www.tribunal-electoral.gob.pa/>
- Ley 31/2006 (modificaciones al Código Electoral)

### Synthetic test vectors

```
valid:
  - 1-23-456
  - 8-123-456
  - 13-1234-567890
  - PE-12-345
  - E-12-345
  - N-12-345

invalid (format):
  - "" (empty)
  - 8-123 (missing asiento)
  - 8-12345-678901 (tomo too long)
  - 0-123-456 (provincia 0)
  - 14-123-456 (provincia > 13)
  - X-12-345 (unknown letter prefix)
```

### Recent reforms

None affecting format. The Tribunal Electoral periodically reissues physical cédulas with updated security features but the alphanumeric structure is unchanged.

### Open questions

- The cédula has no embedded checksum; identity is verified against the central registry. We do not query that registry.

---

## `PA_RUC` — Registro Único de Contribuyentes

### Overview

Tax identifier maintained by the DGI (Dirección General de Ingresos) within the Ministerio de Economía y Finanzas.

- **Issuer**: DGI — <https://dgi.mef.gob.pa/>
- **Composition (natural)**: same as `PA_CEDULA`
- **Composition (jurídica)**: `[Tomo]-[Folio]-[Asiento]` plus an optional DV (`DV NN`) printed on the certificate.

### Algorithm

Format-only:

```
form A: [1..13|PE|E|N]-\d{1,4}-\d{1,6}     (natural)
form B: \d{1,4}-\d{1,4}-\d{1,6}            (jurídica)
suffix: optional " DV NN" stripped during normalize
```

DGI computes a DV (mod-11 weighted) but the formula is not publicly normalized. Community libraries do not converge on a single algorithm. We strip and ignore the DV during normalization.

### Sources

- DGI: <https://dgi.mef.gob.pa/>

### Synthetic test vectors

```
valid:
  - 8-123-456
  - PE-12-345
  - 1234-5678-901234
  - 1234-5678-901234 DV 32
  - 1234-5678-901234-DV-32

invalid:
  - "" (empty)
  - 12345-5678-901234 (tomo too long)
  - 1234-5678-901234567 (asiento too long)
```

### Recent reforms

None affecting format.

### Open questions

- The mod-11 weight vector for the DV is not publicly documented. Promoting `PA_RUC` to `moderate` requires either an official DGI publication or convergence across two independent mature libraries.
