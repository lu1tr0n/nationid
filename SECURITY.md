# Security Policy

## Reporting a vulnerability

If you discover a security issue in `nationid`, please report it privately. **Do not open a public GitHub issue.**

### Preferred channel

Use [GitHub Security Advisories](https://github.com/lu1tr0n/nationid/security/advisories/new) — this opens a private discussion that allows us to coordinate a fix and disclosure.

### Alternative channel

If you cannot use GitHub Security Advisories, email **luis.navarro.alvarez.1991@gmail.com** with the subject prefix `[nationid security]`.

### What to include

- Affected version(s)
- A clear description of the issue
- Steps to reproduce, or a minimal proof of concept
- Impact assessment (what an attacker could achieve)
- Any suggested mitigation

We will acknowledge your report within **3 business days** and aim to provide an initial assessment within **7 business days**.

## Supported versions

Until v1.0.0, only the latest released minor version receives security fixes. Once v1.0.0 ships, we will support the two most recent minor versions.

| Version | Supported |
|---------|-----------|
| Latest minor (pre-1.0) | Yes |
| Older pre-1.0 versions | No — please upgrade |

## Scope

In scope:

- Validation logic that incorrectly accepts invalid documents (false negatives) or rejects valid ones (false positives) **at a rate that suggests an algorithm bug**, not edge cases
- Regex denial-of-service (ReDoS) in any exported function
- Type-level errors that allow unsafe runtime values
- Supply-chain or build-pipeline issues affecting published artifacts

Out of scope:

- Reports about input data being PII — `nationid` is a validator; data handling is the responsibility of the consumer (see [docs/PII_GUIDANCE.md](./docs/PII_GUIDANCE.md))
- Country-spec corrections that do not have a security impact — please open an issue using the `algorithm_correction` template instead

## Disclosure policy

We follow coordinated disclosure. Once a fix is available we publish a GitHub Security Advisory with credit to the reporter (unless they prefer to remain anonymous).

## Supply-chain hardening

`nationid` is published with [npm provenance](https://docs.npmjs.com/generating-provenance-statements) attestations. The published artifact links back to the exact GitHub Actions workflow run that built it. Verify with:

```sh
npm view nationid --json | jq '.dist.attestations'
```
