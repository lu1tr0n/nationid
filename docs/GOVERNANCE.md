# Governance

## Project leadership

`nationid` is currently maintained by **Luis Navarro** ([@lu1tr0n](https://github.com/lu1tr0n)) as the sole owner.

This document describes how decisions are made today and how the project will scale governance as it grows.

## Decision-making

### Pre-1.0 (current)

- The owner has final say on all merges, releases, and roadmap priorities
- Significant changes must include cited official sources
- Public discussion happens in GitHub Issues and Discussions
- Major API changes are signaled with a `breaking-change` label and an RFC issue at least 7 days before merge

### Post-1.0

When the project gains 2+ active maintainers, governance moves to:

- A maintainer team listed in `.github/MAINTAINERS.md`
- Decisions on breaking changes require lazy consensus among maintainers (3 day window, no objections = approved)
- Maintainers are added by unanimous agreement of existing maintainers
- The owner has tie-breaking authority

## Release cadence

- Patch releases: as needed, on the same week as the fix
- Minor releases: every ~4 weeks while pre-1.0; coordinated with country additions
- Major releases: signaled at least 30 days in advance, accompanied by a migration guide

## Roadmap process

- The roadmap lives in [README.md](../README.md) and is updated each release
- Any contributor can propose a change via an issue
- Country requests use the `country_request` issue template
- Algorithm corrections use the `algorithm_correction` template

## Conflict resolution

Disagreements that cannot be resolved through discussion escalate to the project owner. If the disagreement involves the owner, a neutral arbitrator may be invited from the broader OSS community.

## Code of Conduct enforcement

Reports go to the maintainer email listed in [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md). Enforcement actions follow the Contributor Covenant 2.1 enforcement ladder.

## Funding and resources

`nationid` is currently maintained on volunteer time. If the project becomes infrastructure-critical for organizations, sponsorship is welcome via GitHub Sponsors (configured in `.github/FUNDING.yml` once enabled).
