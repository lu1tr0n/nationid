# PII helpers

`nationid/pii` is a small set of helpers for safely handling identity
documents in storage, search indexes, and UI.

The three primitives, all built on top of the existing `DocumentSpec`
registry:

| Helper | Use case |
| --- | --- |
| `mask(code, input)` | UI-safe redacted display (`***.***.890-01`). |
| `lastN(code, input, n?)` | Search-friendly indexed `last4` column. |
| `hash(code, input, opts?)` | Equality lookup without storing raw PII. |

Every helper normalizes the input first, so any user-visible formatting
variation collapses to the same canonical representation before the
transform is applied.

## Why

KYC and tax-invoice flows routinely need to **show** an identity document
on the screen ("ending in `1234`"), **search** for one without exposing it
in URLs and logs, and **uniquely identify** a customer across formatting
variants. Doing any of these naively leaks PII into log files, error
reports, BI dashboards, and analytics events.

`nationid/pii` covers those three patterns with a tiny zero-dependency
surface that uses only the Web Crypto API and the existing `DocumentSpec`
methods.

## Mask

```ts
import { mask } from "nationid/pii";

mask("BR_CPF", "12345678901");      // "***.***.**9-01"
mask("BR_CNPJ", "12345678000190");  // "**.***.***/**01-90"
mask("MX_CURP", "GOMC850315HDFRRR07"); // "**************RR07"
mask("SV_DUI", "012345678");         // "******67-8"
mask("US_SSN", "123456789");         // "***-**-*789"
mask("ES_DNI", "12345678Z");         // "******78Z"
```

### Reveal rule

The mask reveals the **last `n` placeholder positions**, where:

```
n = min(4, floor(numPlaceholders / 3))
```

| Placeholder count | Revealed | Example codes |
| ---:| ---:|:--- |
|  ≤ 8 | 0–2 | (none in v0.x) |
|  9   | 3   | `SV_DUI`, `US_SSN`, `ES_DNI` |
| 10–11 | 3   | `CO_CC`, `BR_CPF`, `AR_CUIT` |
| 12+  | 4   | `BR_CNPJ`, `MX_CURP`, `MX_RFC_PF` |

### Mask alphabet

The reveal is applied against the spec's `mask` field, which is
cleave-style:

| Char | Meaning |
|:--- |:--- |
| `0` | digit placeholder |
| `A` | uppercase letter placeholder |
| `*` | alphanumeric placeholder |
| anything else | literal separator (preserved verbatim) |

Stars in the masked output land **only** on placeholder positions —
separators are never replaced. So a CNPJ keeps its dots, slash, and dash
exactly where they would appear in the formatted form.

### Edge cases

- Empty or whitespace-only input → `"***"`.
- Input that normalizes to empty (e.g. only separators) → `"***"`.
- Unknown `code` → returns `input` unchanged (soft contract).
- Input shorter than the mask → tail positions emit `*` instead of
  crashing.

## lastN

```ts
import { lastN } from "nationid/pii";

lastN("BR_CPF",  "529.982.247-25");      // "4725"
lastN("BR_CNPJ", "12.345.678/0001-90");  // "0190"
lastN("BR_CNPJ", "12345678000190");      // "0190" (same input, different formatting)
lastN("MX_CURP", "GOMC850315HDFRRR07");  // "RR07"
lastN("ES_DNI",  "12345678z", 1);        // "Z"  (uppercased by normalize)
```

Default `n = 4`. If the normalized form is shorter than `n`, the entire
normalized form is returned. `n <= 0` returns `""`.

The intended use is a database column you can index for `O(log n)` lookup
of the form "find the customer whose document ends in `1234`":

```sql
CREATE INDEX customers_doc_last4_idx ON customers (doc_last4);
```

## hash

```ts
import { hash } from "nationid/pii";

const digest = await hash("BR_CPF", "529.982.247-25", {
  salt: process.env.PII_HASH_SALT,
});
// → "a7c3...64-hex-chars"
```

The input is normalized before hashing, so:

```ts
await hash("BR_CNPJ", "12.345.678/0001-90") ===
await hash("BR_CNPJ", "12345678000190");
```

This makes `hash()` safe as a deterministic equality column for
deduplication and lookup, even when users paste documents in any
formatting variant.

### Algorithms

`SHA-256` (default), `SHA-1`, `SHA-384`, `SHA-512`. Pick whichever your
platform / regulator requires. SHA-256 is universally available across
runtimes and produces a 64-char hex string.

### Runtime

`hash()` uses `globalThis.crypto.subtle.digest` (Web Crypto API). It works
in:

- Node 20+ (`crypto` is global without `--experimental-...`).
- Deno, Bun.
- Modern browsers.
- Cloudflare Workers, Vercel Edge, AWS Lambda@Edge.

If `crypto.subtle` is unavailable (very old runtimes), `hash()` throws
with a descriptive error instead of silently degrading.

## Security notes

- **Always salt.** A raw unsalted SHA-256 of an 11-digit CPF or 9-digit
  SSN is brute-forceable in milliseconds. Use a per-tenant or per-user
  salt that is itself stored separately from the hashed column.

- **Hash is not encryption.** If you need to recover the original value
  (e.g. to print on an invoice), encrypt it instead — `hash()` is one-way.

- **Do not use the unsalted hash as a unique constraint.** It still leaks
  membership ("is this CPF in the database?") to anyone who can run the
  same hash function. Salt + per-row pepper, or use a deterministic
  authenticated encryption scheme if you need both equality lookup and
  reversal.

- **`mask()` is for display, not redaction in logs.** If you need to log
  identity documents for debugging, prefer `lastN()` plus a separate
  irreversible hash column. The `mask()` output still includes 3-4
  recoverable chars and a structural mask pattern, which is enough
  signal for a targeted attacker.

- **Rotate salts on key compromise.** Because `hash()` is deterministic,
  the salt is the only thing standing between an attacker and a rainbow
  table. Plan for rotation at the application layer (e.g. a `hash_v2`
  column populated lazily on next access).

## API reference

```ts
function mask(code: DocumentTypeCode, input: string): string;

function lastN(code: DocumentTypeCode, input: string, n?: number): string;

type HashOptions = {
  readonly salt?: string;
  readonly algorithm?: "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";
};
function hash(
  code: DocumentTypeCode,
  input: string,
  opts?: HashOptions,
): Promise<string>;
```
