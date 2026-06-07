---
"nationid": patch
---

Audit-cleanup patch closing two backlog items from the post-v2.1 architecture audit.

- **M7 — Nordic country docs** (`docs/countries/{dk,fi,no,se}.md`): restructured to the `docs/countries/_template.md` shape (Documents table + per-spec Overview / Algorithm / Sources / Synthetic test vectors / Recent reforms / Open questions). Statute citations, issuer URLs, and worked examples from `docs/research/v2.2-source-of-truth/` are now surfaced in the country docs themselves. With this change 53/53 country docs conform to the template.
- **M2 — `mod-11` hoist for the remaining specs**: `CH_UID`, `PL_NIP`, and `PL_REGON` were the last three specs still reinventing the weighted mod-11 loop locally. Migrating them to `mod11WeightedSum` from `nationid/algorithms` removes the duplicated arithmetic while preserving each spec's check-digit policy (CH `r==1` rejection, PL_NIP `r==10` rejection with `dv=r`, PL_REGON `r==10 → dv=0` with `dv=r`). No runtime behaviour change; full test suite stays green.

No user-visible API change. Country counts, spec counts, and exported surface are identical to v2.2.0.
