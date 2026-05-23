# PII guidance for consumers of `nationid`

`nationid` is a **validator**: it accepts identity / tax document strings and tells you whether they parse, format correctly, and pass the issuer's checksum. The library never persists, transmits, or logs the documents you pass to it — but **once a document is in your application's memory, the responsibility for storing, transmitting, and disposing of it shifts to you**.

This document is a practical guide to handling PII safely when you use `nationid`. It is not legal advice; consult counsel for your jurisdiction's specific requirements (GDPR, LGPD, CCPA, El Salvador's Ley de Protección de Datos Personales, etc.).

## What counts as PII in this context

Every `DocumentTypeCode` shipped by `nationid` is personally identifiable under at least one major data-protection regime:

- **Direct identifiers** (under GDPR Art. 4, LGPD Art. 5): MX_CURP, MX_RFC_PF, BR_CPF, AR_DNI, CL_RUT, ES_DNI, US_SSN, GB_NHS, FR_NIR, IT_CF, DE_STEUER_ID, NL_BSN, all passport codes, all *_CEDULA, etc.
- **Indirect / combined identifiers**: tax IDs like BR_CNPJ, MX_RFC_PM, AR_CUIT identify legal entities but combined with a name and address become identifying.
- **Sensitive special category** in some jurisdictions: documents that encode date of birth or sex inside the number (e.g. MX_CURP, NO_FNR, SE_PERSONNUMMER, FR_NIR, IT_CF, PL_PESEL) are functionally equivalent to disclosing those attributes.

Treat every value you pass to `validate()` / `parse()` / `format()` / `normalize()` as PII.

## Minimum-viable storage pattern

For a typical KYC database row:

```ts
import { parse, normalize } from "nationid";
import { mask, lastN, hash } from "nationid/pii";

const code = "BR_CPF";
const input = "529.982.247-25";

const result = parse(code, input);
if (!result.ok) throw new ValidationError(result.reason);

await db.user.update({
  id: userId,
  data: {
    // Store the salted hash for indexed equality lookup.
    documentHash: await hash(code, input, { salt: process.env.PII_SALT }),
    // Store the last-4 for human-facing display (account confirmation).
    documentLast4: lastN(code, input, 4),
    // Optionally encrypt the full normalized form at rest.
    documentEncrypted: await encryptAtRest(result.normalized),
    // Country code (not PII).
    documentCountry: result.country,
    // Document type code (not PII).
    documentCode: result.code,
  },
});
```

**Do not** store the raw, unencrypted document string. Even on private databases, the row is one backup exfiltration away from being public.

## Display patterns

Use `mask()` for any UI that shows the document to a logged-in user (account settings, confirmation screens):

```ts
mask("BR_CPF", "12345678901"); // "***.***.**9-01"
mask("MX_CURP", "GOMC850315HDFRRR07"); // "**************RR07"
```

The reveal count is bounded at 4 characters (or `floor(numPlaceholders / 3)` for shorter docs). The format separators stay intact so the masked value is visually consistent with the unmasked one.

**Never** log or surface the unmasked value to support staff, analytics, error trackers, or third-party services. Most accidental leaks happen here.

## Search patterns

For finding a user by their (presumably forgotten) document number, hash the candidate input with the same salt and compare against the stored hash:

```ts
const candidateHash = await hash("BR_CPF", userTypedInput, {
  salt: process.env.PII_SALT,
});
const user = await db.user.findFirst({ where: { documentHash: candidateHash } });
```

The salt must be:
- **Non-empty** — `hash()` accepts an empty salt but the resulting digest is brute-forceable in milliseconds for any 11-digit CPF / SSN / etc.
- **Per-environment** (different dev / staging / prod salts so dev databases don't enable rainbow attacks on prod).
- **Stored outside the database row** — env var, secrets manager, KMS. Storing it next to the hash defeats the purpose.

Rotating a salt requires a re-hash migration; plan for it before launch.

## Transmission patterns

- **HTTPS only**, always. No exceptions for "internal" services.
- **Avoid query strings**: `?cpf=12345678901` ends up in proxy logs, server logs, browser history, referer headers. Use POST body or path parameters with TLS.
- **Strip from logs at the edge**: redact known field names (`document`, `cpf`, `curp`, etc.) in your log pipeline before they reach centralized storage.

## What `nationid` itself never does

- Does not phone home — zero network requests, anywhere, ever (zero deps, no telemetry).
- Does not persist anything — every public function is pure given its inputs.
- Does not log — the library does not call `console.*` anywhere.
- Does not throw with the input in the message — `parse()` returns `{ ok: false, reason: { kind } }` with no echo of the raw value. Custom errors from `pii.mask` / `lastN` / `hash` reference the *code*, not the *input*.

## Out-of-scope: questions to ask your DPO / lawyer

- Retention period for hashed identifiers under your applicable regime.
- Whether you must offer deletion-on-request and how to comply with hash-only storage (you typically must store a `documentDeleted: true` flag so future hash-lookups don't recover the previous user).
- Whether your `PII_SALT` qualifies as a "key" under your jurisdiction's pseudonymization criteria (most do; check).
- Cross-border transfer rules when your DB and your `nationid` hosting are in different jurisdictions.

## Related references

- GDPR Art. 4 (definitions) and Art. 25 (data protection by design and by default)
- LGPD Art. 5 (definitions) and Art. 6 (principles)
- NIST SP 800-122 (Guide to Protecting the Confidentiality of PII)
- OWASP Cheat Sheet — "Cryptographic Storage"
- OWASP Cheat Sheet — "Logging"
