# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog 1.1](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning 2.0](https://semver.org/spec/v2.0.0.html).

Entries are managed via [changesets](https://github.com/changesets/changesets) — create one with `pnpm changeset` when opening a PR.

## [Unreleased]

### Added

- Initial scaffold with TypeScript-first dual ESM+CJS build
- Core types: `CountryCode`, `DocumentTypeCode`, `DocumentSpec`, `ParseResult`
- Algorithm primitives: Luhn (ISO/IEC 7812-1), parameterized mod-11
- Tree-shakable subpath exports per country
- npm provenance attestations on releases
