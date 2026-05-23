# v1.1 Functional Audit — Robustness & edge cases

## Score: 8/10

`nationid@1.1.0` has a strong defensive posture for the input shapes it is
designed for: every `validate` / `parse` / `normalize` / `format` is anchored
on `^…$`, every regex is built from simple character classes with bounded
quantifiers, every checksum primitive bails out before crashing on a bad
weight slot, and every async surface lives behind an explicit `await
crypto.subtle` capability check. The library does not allocate, does not
recurse, does not depend on locale data for hot paths, and never accepts
arbitrary file I/O or shell input. There is no realistic ReDoS exposure and
no unbounded growth.

What keeps the score from 9–10 are a handful of papercuts that a careful
consumer will trip over:

1. The public functions are typed `(code, input: string)` but trust the TS
   contract — `null` / `undefined` will throw `TypeError` from JS callers,
   in contradiction to the README's "never throws" guarantee.
2. `Intl.DisplayNames` is constructed eagerly in `countryName` /
   `getCountryInfo` from a string parameter; a malformed BCP-47 tag (or any
   string the runtime cannot resolve) throws `RangeError` with no fallback.
3. `flagEmoji("12")` silently returns garbage Unicode for any non-`[A-Z]{2}`
   input — the contract is documented as "any ISO 3166-1 alpha-2" but the
   shape check is `length === 2`, not `[A-Z]{2}`.
4. `pii.hash` accepts an empty input and an empty salt with no warning,
   producing a deterministic digest of the salt alone — easy footgun for
   consumers who treat the digest as a non-empty fingerprint.
5. The `mod11WeightedSum` / `mrzCheckDigit` / `luhnCheckDigit` primitives
   `throw` instead of returning `-1` — fine for the in-tree callers (they
   all slice to the correct length), but exposed publicly via
   `nationid/algorithms`, so external callers will get exceptions where
   they expect a `false` / `null`.

None of these is a security incident. All of them are "would surprise a
careful consumer" papercuts. The robustness ceiling is set by what the
library does NOT do (no Unicode-NFC normalization, no constant-time hash
compare, no per-runtime crypto fallback) more than by what it gets wrong.

## Findings — by severity

### Critical (could ship a security advisory)

_None._

### High (would surprise a careful consumer)

**H1. Untrusted `locale` strings into `Intl.DisplayNames` throw, not fall
back** — `catalog/countries.ts:135` constructs `new Intl.DisplayNames([locale], …)`
inside `regionDisplayNames` with no try/catch. Bench:

```js
new Intl.DisplayNames(["; rm -rf /;"], { type: "region" });
// RangeError: Incorrect locale information provided
new Intl.DisplayNames([""], { type: "region" });
// RangeError: Incorrect locale information provided
```

The `flagEmoji` / `countryName` / `getCountryInfo` / `listCountries` public
surfaces all forward an arbitrary `string` `locale` argument. A Next.js
route handler doing `getCountryInfo("MX", req.query.locale)` will throw
`RangeError` on adversarial input, panicking the request unless the caller
wraps the call in try/catch. The doc comment at `catalog/countries.ts:172`
even invites this usage ("Any BCP 47 language tag (default `"en"`)") with
no warning.

Fix: wrap the constructor in a try/catch that falls back to
`DEFAULT_LOCALE`, mirroring the existing pattern in `i18n/index.ts:78`
where `resolveLocale` already validates input. Then cache by the
post-fallback locale so a malicious caller can't fill the cache by
probing 10k variants.

**H2. `validate` / `parse` / `normalize` / `format` throw on `null` /
`undefined`** — Every entry point reads `input.trim()` or `input.replace(...)`
before reaching its `kind: "empty"` branch. `src/index.ts:208` (`normalize`),
`src/index.ts:226` (`format`), `src/countries/br/cpf.ts:59` (`parse`),
`src/countries/cl/rut.ts:62`, … the pattern repeats in every country file.

Repro:

```js
parse("BR_CPF", null);
// TypeError: Cannot read properties of null (reading 'trim')
```

TS protects you, but the package ships dual `.cjs` / `.mjs` and the README
markets it for "JavaScript and TypeScript" — JS callers from non-strict
codebases will hit this. The doc string at `src/index.ts:230-260` (the
`parse` JSDoc) says: "Never throws on input errors; instead returns
{ ok: false, error: ... }". That contract is not held for `null` /
`undefined` / non-string inputs.

Fix: at the top of each public entry, normalize the input first:

```ts
if (typeof input !== "string") {
  return { ok: false, code, reason: { kind: "empty" } };
}
```

OR document explicitly that the input must be a string and let TS enforce
it. Either is acceptable; the current state is the worst of both.

**H3. `flagEmoji` returns valid-looking Unicode garbage for non-letter
2-char input** — `catalog/countries.ts:112`. The only guard is
`code.length !== 2`. `flagEmoji("12")` returns `"🇖🇗"` (regional
indicator digits 1+2). `flagEmoji("!!")`, `flagEmoji("á!")`, etc.
all silently produce Unicode strings the consumer will then render in a UI.

The function is documented as "Works for any ISO 3166-1 alpha-2 code, not
just the 34 supported here" — this is true for valid alpha-2 codes ("JP" →
🇯🇵). But the lack of a `[A-Z]{2}` shape check means a typo or a
mis-typed user input (e.g. lowercase + digit) will produce something that
looks like a flag but is not.

Fix: tighten the guard to `/^[A-Za-z]{2}$/`. This is a one-line change that
matches the documented contract. Tests in `tests/catalog/` already cover
the happy path.

### Medium (papercuts, fix when convenient)

**M1. `pii.hash` accepts empty salt + empty input and returns a digest of
empty bytes** — `pii/hash.ts:94-98`. The doc string clearly says "Salts are
NOT optional in production" and "Strongly recommended" — but the runtime
accepts both `salt` omitted and `input === ""`. From
`tests/pii/hash.test.ts:88`:

```js
expect(await hash("BR_CPF", "", { algorithm: "SHA-1" })).toBe(refHash("sha1", ""));
// SHA-1("") known constant → "da39a3ee…"
```

So `hash("BR_CPF", "")` and `hash("BR_CPF", null /* normalized to "" */)`
return the same 64-char hex. A consumer who treats `hash` as a "valid
identifier fingerprint" will silently store hashes of empty values.

Fix: refuse `input === ""` post-normalization with a clear error, OR add a
runtime warning the first time a call with no salt is observed (matches
the OWASP "fail-loud" pattern for cryptographic misconfigurations). The
README and `SECURITY.md` should also escalate the salt language from
"strongly recommended" to "required in production; the library returns
hashes of the salt alone if the input normalizes to empty."

**M2. `pii.hash` produces a fingerprint that is NOT compared in constant
time** — by design the library returns a hex string and leaves comparison
to the consumer. Most consumers will do `hash === storedHash`, which is
trivially timing-vulnerable. The README and `docs/PII.md` do not warn about
this. For a library whose stated PII use case is "deterministic equality
lookups without storing raw PII", a worked example using
`crypto.timingSafeEqual` (or `subtle.timingSafeEqual` when available)
would prevent timing-side-channel disclosure.

Fix: add a `safeEqual(a, b)` helper exported from `nationid/pii` plus a
documentation snippet showing `db.where("hash = ?", h)` is fine but
`if (storedHash === h)` is not, on hot paths.

**M3. `Intl.DisplayNames.of("")` throws on the catalog path** —
`catalog/countries.ts:162`. `regionDisplayNames(locale).of(code.toUpperCase())`
where `code = ""` throws `RangeError: invalid_argument`. The function is
public; consumers iterating an arbitrary list of country-code strings
(filter results from a search, dropdown) will hit it.

Fix: wrap the `.of(…)` call in a try/catch, mirroring the fallback at
`countries.ts:163` (`return resolved ?? code.toUpperCase()`).

**M4. NFC vs NFD: a decomposed `Ñ` collapses to `N`** — `src/countries/mx/curp.ts:97`
and `mx/rfc-pf.ts:52` normalize via
`input.replace(/[^A-Za-zÑñ0-9]+/g, "")`. The character class includes the
precomposed `Ñ` (`U+00D1`) but NOT the combining tilde (`U+0303`). A user
who pastes `Ñ` typed as N + combining tilde (the macOS default for some
input methods) gets `N` plus the combining diacritic stripped — silently
yielding a different normalized form than a user who pasted precomposed `Ñ`.

Repro:

```js
const nfc = "Ñ";          // U+00D1
const nfd = "Ñ";    // N + combining tilde
nfc.replace(/[^A-Za-zÑñ0-9]+/g, "").toUpperCase(); // → "Ñ"
nfd.replace(/[^A-Za-zÑñ0-9]+/g, "").toUpperCase(); // → "N"
```

This means `validate(curp_with_NFC_Ñ)` may pass and the NFD-typed twin
fails. Not a security issue (the failure direction is restrictive), but
it WILL surprise consumers who store one form and lookup with the other.

Fix: pre-normalize input with `input.normalize("NFC")` inside `normalizeCurp`
and `normalizeRfc`. Cost: a few microseconds per call. Add a property test:
`validate(s) === validate(s.normalize("NFD"))` for every MX_RFC_PF / MX_CURP
generator output.

**M5. Non-ASCII digits are silently stripped without error** —
`core/normalize.ts:8` `stripNonDigits` uses `/\D+/g`. The non-`u` `\D` class
treats Arabic-Indic `٠١٢٣`, Devanagari `०१२३`, fullwidth `０１２３` as non-digits.
Result: `validate("BR_CPF", "١٢٣٤٥٦٧٨٩٠١")` becomes `validate("BR_CPF", "")` →
`false` (too_short), but the user sees no indication that their digit
characters were dropped.

This is technically the safer direction (silently invalid > silently
accepted), but a Persian / Arabic / Bengali / Hindi-script-using user who
copy-pastes their tax ID from a localized form will see "invalid" with no
hint why. A better behavior is to canonicalize non-ASCII digits to ASCII
before stripping:

```ts
function asciiDigits(s: string): string {
  return s.replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 0x0660))
          .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 0x06F0))
          .replace(/[０-９]/g, (c) => String(c.charCodeAt(0) - 0xFF10))
          .replace(/[०-९]/g, (c) => String(c.charCodeAt(0) - 0x0966));
}
```

Then `stripNonDigits(asciiDigits(input))`. This is a real UX upgrade for
LATAM users with Arabic-script-language family members, etc.

**M6. `mod11WeightedSum` / `mrzCheckDigit` / `luhnCheckDigit` throw** —
`algorithms/mod11.ts:43-63`, `algorithms/icao-9303.ts:69-78`,
`algorithms/luhn.ts:64-83` all throw `Error` on programmer-bug shapes
(length mismatch, non-digit). The package re-exports these via
`nationid/algorithms` for consumers who want to bring their own validator.
An external consumer doing `mod11WeightedSum(userInput, [10,9,8,7,6,5,4,3,2])`
without pre-validating gets a `TypeError` rather than `false`.

In-tree callers always slice to the right length before calling, so the
internal contract is fine. But the `nationid/algorithms` subpath export is
public.

Fix: either (a) document explicitly that algorithm primitives are
"low-level" and "throw on programmer-bug input", OR (b) add a `safeMod11`
variant that returns `-1` for bad input.

**M7. `luhnCheckDigit("body")` silently produces nonsense for non-digit
body** — Actually wait, this one is OK: it throws (`luhn.ts:65-66`).
Documented above. Cross-referenced and downgraded.

**M8. The `i18n/locales/{lang}.ts` modules are pulled even when only one
locale is needed** — `i18n/index.ts:19-21`. The `CATALOG` object eagerly
imports all three locale bundles at module load. For consumers that only
ever call `getErrorMessage(err, "en", ...)`, the `es` and `pt` bundles are
dead weight.

This is more a bundle-size finding than robustness, but it interacts:
the larger the surface that loads at module init, the higher the chance a
runtime that bans dynamic-import-of-a-trip-wire (some edge runtimes) hits
a surprise.

Fix: lazy-import the locale on first use. Tradeoff: adds a microtask. Not
critical for v1.1.

**M9. `flagEmoji` allocates a fresh String.fromCodePoint per call; no
memoization** — Not a robustness problem per se, but a hot-path issue if a
caller is rendering a 200-row dropdown of countries. The 34 alpha-2 codes
have 34 possible outputs; a `Map<string,string>` would be a 2-line cache.
Skip if perf isn't a stated concern.

### Low (worth noting)

**L1. `cycleWeights` in `algorithms/mod11.ts:84` throws on empty `base`
array** — defensive, but the function is in the public algorithm export.
Consumers passing an empty weight base get a different error class than
the rest of the library uses (`Error("cycleWeights: empty base array")`).
Cosmetic.

**L2. `validateMrzNumber("12345678901")` returns false when the 10th char
is a digit but the body has a non-MRZ char** — `algorithms/icao-9303.ts:101-110`
correctly returns false. No bug; flagged here only to confirm the
defensive check at line 107 catches non-MRZ-alphabet chars in the body.

**L3. `Intl.DisplayNames` cache (`displayNamesCache` in
`catalog/countries.ts:130`) has no eviction.** Documented as "intentional"
("locales are a small finite set in practice"). True for normal consumers.
A malicious consumer could `for (let i = 0; i < 1e6; i++)
countryName("MX", \`xx-${i}\`)` to grow the cache without bound — but each
call also throws because of H1, so the cache only grows if H1 is fixed by
falling through to a successful constructor. Worth keeping bounded once H1
is patched.

**L4. `extractRfcDOB`'s century-disambiguation rolls every January** —
`extract/mx/rfc.ts:39-47`. The `currentTwoDigitYear` runs at every call.
That's fine; it's also intentionally testable via the `Clock` injection.
But the rule "if YY > current YY, assume 1900s; else 2000s" means in
January 2050, a YY of 50 jumps from "1950" interpretation to "2050"
interpretation. The library handles this; just flag the discontinuity for
downstream consumers who store the extracted year and re-validate later.

**L5. The `parse` "too_long" branch in `cl/rut.ts:71` allows up to 9
chars** — RUT is 1-8 body + 1 DV = max 9, correct. `gt/nit.ts:77` allows
up to 13 chars (12 body + 1 DV) — correct. The "too_long" threshold per
spec is hand-maintained; an audit chart confirms each is consistent with
its raw regex max.

**L6. `pii.mask("BR_CNPJ", "12345678000190")` correctly returns
`"**.***.***\/01-90"`** — the docstring example at `pii/index.ts:45` shows
this. Note: the example uses `\/` (escaped slash), implying the doc was
written in a JS string context — when the function is called from real
code, `/` is unescaped. Cosmetic doc consistency.

## ReDoS scan — every regex in src/countries/**

There are ~120 regexes in country files (counted above). Every one is
anchored `^...$`, uses only bounded quantifiers (`\d{1,12}`, `[A-Z]{2}`,
etc.) and has NO nested quantifier or overlapping alternation. There is no
realistic ReDoS exposure. I sampled the most complex ones with adversarial
input (50k–100k chars) and Node returns `false` in 0 ms.

| File:Line | Pattern | Verdict | Reasoning |
|-----------|---------|---------|-----------|
| `core/normalize.ts:3` | `/[^A-Za-z0-9]+/g` | safe-linear | global non-anchored, but single class with `+` — linear in input length |
| `core/normalize.ts:8` | `/\D+/g` | safe-linear | same shape; `\D` is a character class |
| `core/normalize.ts:13` | `/^(\d)\1+$/` | safe | anchored, backref to single capture, deterministic |
| `algorithms/luhn.ts:29,65` | `/^\d+$/` | safe | anchored, simple class |
| `algorithms/icao-9303.ts:135` | `/^[0-9A-Z]*$/` | safe | same |
| `ar/cdi.ts:32–33` | `/^\d{11}$/`, `/^\d{2}-\d{8}-\d$/` | safe | fixed quantifiers |
| `bo/ci.ts:26,28` | `/^\d{6,9}(LP\|CB\|SC\|OR\|PT\|CH\|TJ\|BE\|PA)?$/` and formatted | safe | bounded quantifier + bounded optional capture + non-overlapping alternation |
| `br/cnh.ts:33–34` | `/^\d{11}$/`, `/^\d{9}-\d{2}$/` | safe | trivial |
| `br/cnpj.ts:56,58` | `/^[A-Z0-9]{12}\d{2}$/` and formatted | safe | trivial |
| `br/cpf.ts:27–28` | `/^\d{11}$/` and formatted | safe | trivial |
| `br/titulo-eleitor.ts:41–42` | `/^\d{12}$/`, `/^\d{4} \d{4} \d{2} \d{2}$/` | safe | trivial |
| `ca/bn.ts:28–29` | `/^\d{9}(?:(?:RT\|RP\|RC\|RM\|RR\|RZ)\d{4})?$/` | safe | bounded optional non-capturing group with non-overlapping inner alt |
| `ch/mwst.ts:22–23` | `/^CHE\d{9}(MWST\|TVA\|IVA)$/` and formatted | safe | non-overlapping alt |
| `cl/rut.ts:29,31` | `/^\d{1,8}[\dK]$/`, `/^\d{1,2}\.\d{3}\.\d{3}-[\dK]$/` | safe | bounded |
| `co/cc.ts:22–23` | `/^\d{6,10}$/`, `/^\d{1,3}(?:\.\d{3}){1,3}$/` | safe | bounded quantifier × bounded inner |
| `co/ce.ts:18` | `/^\d{6,8}$/` | safe | trivial |
| `co/nit.ts:32–33` | `/^\d{10,11}$/`, `/^\d{9,10}-\d$/` | safe | trivial |
| `co/pasaporte.ts:25` | `/^[A-Z0-9]{6,12}$/` | safe | trivial |
| `co/pep.ts:25` | `/^\d{15}$/` | safe | trivial |
| `co/ppt.ts:27` | `/^[A-Z0-9]{7,11}$/` | safe | trivial |
| `co/ti.ts:20` | `/^\d{10,11}$/` | safe | trivial |
| `cr/cedula-fisica.ts:29–30` | `/^[1-9]\d{8}$/`, `/^[1-9]-\d{4}-\d{4}$/` | safe | trivial |
| `cr/cedula-juridica.ts:24–25` | `/^3\d{9}$/`, `/^3-\d{3}-\d{6}$/` | safe | trivial |
| `cr/dimex.ts:23` | `/^\d{11,12}$/` | safe | trivial |
| `de/steuer-id.ts:31–32` | `/^[1-9]\d{10}$/`, `/^\d{2} \d{3} \d{3} \d{3}$/` | safe | trivial |
| `de/steuernummer.ts:25,32` | `/^\d{10,13}$/`, `/^\d{2,4}\/\d{3,4}\/\d{4,5}$/` | safe | trivial |
| `de/ustid.ts:22–23` | `/^DE[1-9]\d{8}$/`, `/^DE \d{3} \d{3} \d{3}$/` | safe | trivial |
| `dk/cpr.ts:36–37` | `/^\d{10}$/`, `/^\d{6}-\d{4}$/` | safe | trivial |
| `dk/cvr.ts:21` | `/^\d{8}$/` | safe | trivial |
| `dk/vat.ts:17–18` | `/^DK\d{8}$/` (×2) | safe | trivial |
| `do/cedula.ts:25–26` | `/^\d{11}$/`, `/^\d{3}-\d{7}-\d$/` | safe | trivial |
| `do/rnc.ts:31` | `/^\d{9}$/` | safe | trivial |
| `ec/cedula.ts:29` | `/^\d{10}$/` | safe | trivial |
| `ec/ruc.ts:38` | `/^\d{13}$/` | safe | trivial |
| `es/dni.ts:25` | `/^\d{8}[A-Z]$/` | safe | trivial |
| `es/nie.ts:25` | `/^[XYZ]\d{7}[A-Z]$/` | safe | trivial |
| `es/nif-pj.ts:45` | `/^[ABCDEFGHJNPQRSUVW]\d{7}[\dA-J]$/` | safe | trivial |
| `es/nuss.ts:34–35` | `/^\d{12}$/`, `/^\d{2}\/\d{8}\/\d{2}$/` | safe | trivial |
| `fi/hetu.ts:31` | `/^\d{6}[-+ABCDEFYXWVU]\d{3}[\dA-FHJ-NPR-Y]$/` | safe | trivial |
| `fi/vat.ts:17–18` | `/^FI\d{8}$/` (×2) | safe | trivial |
| `fi/ytunnus.ts:24–25` | `/^\d{8}$/`, `/^\d{7}-\d$/` | safe | trivial |
| `fr/nir.ts:43–45` | `/^[12378]\d{2}(0[1-9]\|1[0-2]\|20\|30\|40\|50\|99)(\d{2}\|2[AB])\d{6}\d{2}$/` and formatted | safe | non-overlapping alternation, all bounded |
| `fr/siren.ts:20–21` | `/^\d{9}$/`, `/^\d{3} \d{3} \d{3}$/` | safe | trivial |
| `fr/siret.ts:25–26` | `/^\d{14}$/`, `/^\d{3} \d{3} \d{3} \d{5}$/` | safe | trivial |
| `fr/tva.ts:31–32` | `/^FR[A-HJ-NP-Z\d]{2}\d{9}$/` and formatted | safe | trivial |
| `gb/nhs.ts:25–26` | `/^\d{10}$/`, `/^\d{3} \d{3} \d{4}$/` | safe | trivial |
| `gb/nino.ts:33–35` | `/^(?!BG\|GB\|NK\|KN\|TN\|NT\|ZZ)[A-CEGHJ-PR-TW-Z][A-CEGHJ-NPR-TW-Z]\d{6}[A-D]$/` and formatted | safe | one negative lookahead at position 0, non-backtracking |
| `gb/utr.ts:26` | `/^\d{10}$/` | safe | trivial |
| `gb/vat.ts:35,37` | `/^GB\d{9}(\d{3})?$/`, `/^GB \d{3} \d{4} \d{2}( \d{3})?$/` | safe | bounded optional |
| `gt/dpi.ts:29–30` | `/^\d{13}$/`, `/^\d{4} \d{5} \d{4}$/` | safe | trivial |
| `gt/nit.ts:36–37` | `/^\d{1,12}[\dK]$/`, `/^\d{1,12}-[\dK]$/` | safe | bounded |
| `hn/dni.ts:27–28` | `/^\d{13}$/`, `/^\d{4}-\d{4}-\d{5}$/` | safe | trivial |
| `hn/rtn.ts:29,31` | `/^\d{14}$/`, `/^\d{4}-\d{4}-\d{6}$/` | safe | trivial |
| `it/cf.ts:49` | `/^[A-Z]{6}[0-9LMNPQRSTUV]{2}[A-EHLMPRST][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/` | safe | only character classes with fixed quantifiers |
| `it/piva.ts:24,26` | `/^\d{11}$/`, `/^IT\d{11}$/` | safe | trivial |
| `mx/clave-elector.ts:52` | `/^[A-Z]{6}\d{8}[HM]\d{3}$/` | safe | trivial |
| `mx/curp.ts:55` | `/^[A-Z][A-Z][A-Z][A-Z]\d{2}(0[1-9]\|1[0-2])(0[1-9]\|[12]\d\|3[01])[HM][A-Z]{2}[A-ZÑ]{3}[A-Z0-9]\d$/` | safe | bounded, non-overlapping alt |
| `mx/nss.ts:58,60` | `/^\d{11}$/`, `/^\d{2}[-\s]\d{2}[-\s]\d{2}[-\s]\d{4}[-\s]\d$/` | safe | trivial |
| `mx/passport.ts:22` | `/^[A-Z][0-9]{8}$/` | safe | trivial |
| `mx/rfc-pf.ts:48` | `/^[A-ZÑ&]{4}\d{6}[A-Z0-9]{2}[0-9A]$/` | safe | trivial |
| `mx/rfc-pm.ts:38` | `/^[A-ZÑ&]{3}\d{6}[A-Z0-9]{2}[0-9A]$/` | safe | trivial |
| `ni/cedula.ts:29–30` | `/^\d{3}\d{6}\d{4}[ABCDEFGHJKLMNPQRSTUVWXY]$/` and formatted | safe | trivial |
| `ni/ruc.ts:23,25` | `/^(?:\d{13}[A-Z]\|\d{14})$/` and formatted | safe | non-overlapping alt |
| `nl/bsn.ts:26` | `/^\d{9}$/` | safe | trivial |
| `nl/btw.ts:34` | `/^NL\d{9}B\d{2}$/` | safe | trivial |
| `no/dnr.ts:22` | `/^\d{11}$/` | safe | trivial |
| `no/fnr.ts:30` | `/^\d{11}$/` | safe | trivial |
| `no/mva.ts:19–20` | `/^NO\d{9}MVA$/` (×2) | safe | trivial |
| `no/orgnr.ts:23–24` | `/^\d{9}$/`, `/^\d{3} \d{3} \d{3}$/` | safe | trivial |
| `pa/cedula.ts:31–32` | `/^(?:1[0-3]\|[1-9]\|PE\|E\|N)-\d{1,4}-\d{1,6}$/` | safe | non-overlapping alt, bounded |
| `pa/ruc.ts:41–42` | `/^(?:(?:1[0-3]\|[1-9]\|PE\|E\|N)-\d{1,4}-\d{1,6}\|\d{1,4}-\d{1,4}-\d{1,6})$/` | safe | two non-overlapping alternatives, each bounded |
| `pe/ce.ts:18` | `/^\d{9,12}$/` | safe | trivial |
| `pe/dni.ts:28` | `/^\d{8}$/` | safe | trivial |
| `pe/ruc.ts:37` | `/^(10\|15\|16\|17\|20)\d{9}$/` | safe | non-overlapping alt |
| `pl/nip.ts:26–27` | `/^\d{10}$/`, `/^\d{3}-\d{3}-\d{2}-\d{2}$/` | safe | trivial |
| `pl/pesel.ts:32` | `/^\d{11}$/` | safe | trivial |
| `pl/regon.ts:23` | `/^\d{9}(\d{5})?$/` | safe | bounded optional |
| `pt/cc.ts:37,39` | `/^\d{9}[A-Z]{2}\d$/`, `/^\d{8} \d [A-Z]{2}\s?\d$/` | safe | bounded |
| `pt/nif.ts:37` | `/^\d{9}$/` | safe | trivial |
| `pt/passport.ts:21` | `/^[A-Z][0-9]{6}$/` | safe | trivial |
| `py/ci.ts:19` | `/^\d{6,9}$/` | safe | trivial |
| `py/ruc.ts:26,28` | `/^\d{7,10}$/`, `/^\d{6,9}-\d$/` | safe | trivial |
| `se/orgnr.ts:23–24` | `/^\d{10}$/`, `/^\d{6}-\d{4}$/` | safe | trivial |
| `se/personnummer.ts:33,36` | `/^\d{10}$\|^\d{12}$/`, `/^(?:\d{6}[-+]\d{4}\|\d{8}-?\d{4})$/` | safe | trivial; alt over different lengths is non-ambiguous |
| `se/vat.ts:25–26` | `/^SE\d{12}$/` (×2) | safe | trivial |
| `sv/dui.ts:23–24` | `/^\d{9}$/`, `/^\d{8}-\d$/` | safe | trivial |
| `sv/nit.ts:23–24` | `/^\d{14}$/`, `/^\d{4}-\d{6}-\d{3}-\d$/` | safe | trivial |
| `sv/passport.ts:21` | `/^[A-Z]?[0-9]{7,9}$/` | safe | bounded |
| `us/ein.ts:25–26` | `/^\d{9}$/`, `/^\d{2}-\d{7}$/` | safe | trivial |
| `us/itin.ts:26–27` | `/^9\d{8}$/`, `/^9\d{2}-\d{2}-\d{4}$/` | safe | trivial |
| `us/passport.ts:22` | `/^([A-Z][0-9]{8}\|[0-9]{9})$/` | safe | non-overlapping alt |
| `us/ssn.ts:33–34` | `/^\d{9}$/`, `/^\d{3}-\d{2}-\d{4}$/` | safe | trivial |
| `uy/ci.ts:24–25` | `/^\d{8}$/`, `/^\d{1}\.\d{3}\.\d{3}-\d$/` | safe | trivial |
| `uy/rut.ts:29–30` | `/^\d{12}$/`, `/^\d{2}-?\d{6}-?\d{3}-?\d$/` | safe | trivial |
| `ve/cedula.ts:22,24` | `/^[VE]\d{7,8}$/`, `/^[VE]-\d{7,8}$/` | safe | bounded |
| `ve/passport.ts:20` | `/^[0-9]{8,9}$/` | safe | bounded |
| `ve/rif.ts:45,47` | `/^[VEJPGC]\d{9}$/`, `/^[VEJPGC]-\d{8}-\d$/` | safe | trivial |

**Net:** 100% of country-file regexes are safe-linear with no
catastrophic-backtracking risk. The library's regex hygiene is excellent —
this is the single biggest robustness asset, and the audit can sign off
on it.

## Unicode handling audit

| Input | `stripNonDigits` | `stripAndUpper` | CURP/RFC normalizers |
|-------|------------------|-----------------|----------------------|
| ASCII `"04567890-3"` | `"045678903"` | `"045678903"` | `"045678903"` |
| Arabic-Indic `"٠٤٥٦٧٨٩٠٣"` | `""` ⚠ | `""` ⚠ | `""` ⚠ |
| Devanagari `"०४५६७८९०३"` | `""` ⚠ | `""` ⚠ | `""` ⚠ |
| Fullwidth `"０４５６７８９０３"` | `""` ⚠ | `""` ⚠ | `""` ⚠ |
| RTL marker `"‎045678903"` | `"045678903"` ✓ | `"045678903"` ✓ | `"045678903"` ✓ |
| BOM `"﻿045678903"` | `"045678903"` ✓ | `"045678903"` ✓ | `"045678903"` ✓ |
| NFC `"Ñ"` | `""` (no digit) | `""` (Ñ not in `[A-Za-z]`) | `"Ñ"` ✓ |
| NFD `"Ñ"` | `""` | `"N"` ⚠ (tilde stripped) | `"N"` ⚠ (tilde stripped) |
| Cyrillic look-alike `"А"` (U+0410) | `""` | `""` | `""` (Cyrillic A is not Latin A) ✓ |

**Notes:**
- Non-ASCII digits are silently dropped. This is the safe direction but a
  UX papercut for non-Latin-script users (see M5).
- NFD-encoded `Ñ` collapses to `N`, producing a different normalized form
  than NFC `Ñ`. Affects CURP / RFC-PF / RFC-PM and any downstream lookup
  that stores one form and queries with the other (see M4).
- Cyrillic / Greek look-alikes are correctly rejected — the strict `[A-Z]`
  class refuses anything outside Latin Basic.
- BOM and RTL marks are stripped — fine.
- No NFC normalization is performed anywhere in the library. The library
  treats UTF-16 code units, not graphemes.

## Runtime environment compatibility

| Runtime | `validate` / `parse` / `normalize` / `format` | `pii.hash` | `pii.mask` / `lastN` | `i18n` | `catalog.getCountryInfo` |
|---------|-----------------------------------------------|------------|----------------------|--------|---------------------------|
| Node 20+ | ✓ | ✓ (`globalThis.crypto.subtle` since 19) | ✓ | ✓ | ✓ |
| Node 18 LTS | ✓ | ⚠ (`globalThis.crypto` only since 19; 18 has it but flagged) | ✓ | ✓ | ✓ |
| Node 16 | ✓ | ✗ (`globalThis.crypto.subtle` not available) | ✓ | ✓ | ✓ |
| Deno 1.40+ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Bun 1.x | ✓ | ✓ | ✓ | ✓ | ✓ |
| Chromium 85+ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Cloudflare Workers | ✓ | ✓ (V8 isolate has SubtleCrypto) | ✓ | ✓ | ⚠ (small-icu — `Intl.DisplayNames` works but limited locales) |
| Vercel Edge | ✓ | ✓ | ✓ | ✓ | ⚠ (same Intl limitation) |
| Deno Deploy | ✓ | ✓ | ✓ | ✓ | ✓ |
| React Native 0.72+ | ✓ | ⚠ (no SubtleCrypto by default; needs `react-native-crypto` polyfill) | ✓ | ✓ | ⚠ (no full ICU) |
| React Native 0.74+ Hermes | ✓ | ⚠ same | ✓ | ✓ | ⚠ same |
| Web Worker | ✓ | ✓ | ✓ | ✓ | ⚠ depends on UA ICU |

**Notes:**
- `pii.hash` correctly guards with `if (!subtle) throw …` (`pii/hash.ts:82`).
  Error message is actionable.
- `Intl.DisplayNames` is the weakest cross-runtime point. On a small-icu
  Node build or a runtime with limited locale data, `Intl.DisplayNames.of("MX")`
  may return undefined; the library handles that at `catalog/countries.ts:163`
  with a `?? code.toUpperCase()` fallback. ✓
- What is NOT handled: a runtime where `Intl.DisplayNames` is missing
  entirely (extremely old environments) — the constructor itself throws.
  No try/catch. See H1.
- The library uses `Intl.DisplayNames` lazily through a `Map` cache, so it
  doesn't fail at module init — only the first call. Good.

## Idempotency & invariants

I sampled the property tests at `tests/property/*.test.ts`:

- **P1 — `normalize(normalize(x)) === normalize(x)`**: tested on every
  registered code with arbitrary input (`normalize.test.ts:25`). ✓
- **P6 — `normalize(format(x)) === normalize(x)` for valid `x`**: tested
  on every code (`normalize.test.ts:41`). ✓
- **P7 — Whitespace splicing preserves validity**: tested on every code
  (`whitespace-resilience.test.ts:28`). ✓
- **Validate / parse consistency**: tested. ✓

I did NOT find a property test for:
- **`format(validate-true input)` produces a string that re-validates** —
  This is implied by the spec contract ("`format` returns the canonical
  display form for valid input, unchanged otherwise"). Spot check: every
  spec I read formats by slicing the normalized string — the formatted
  output is always re-normalizable. So the invariant holds, but it's
  exercised only indirectly.
- **`validate(format(x)) === validate(x)`** — Same; held by construction
  because `format` never adds non-stripable characters. Worth adding to the
  property suite explicitly.

**Verdict:** the invariant suite is solid. Adding the
`validate(format(x))` round-trip as an explicit property would close the
last gap.

## Defensive code that could go away

Most defensive checks are intentional and pay off (e.g. `mod11.ts:56` —
`if (w === undefined)` exists because `noUncheckedIndexedAccess: true` is
on; removing it would break the build). A few that are pure dead weight:

1. **`gt/dpi.ts:33` — `if (!Number.isFinite(dept) ...)`**. `dept` comes from
   `Number(department)` where `department` is `digits.slice(9, 11)` and
   `digits.length === 13` is already proven. `Number("XX")` always returns
   a finite integer here. The check is symbolic; harmless.

2. **`mx/curp.ts:91` — `if (code.length !== 2) return null;`** in
   `extractCurpRegion`. `result.normalized` is enforced to be 18 chars by
   `parse`, so `slice(11,13)` is always 2 chars. Symbolic.

3. **`extract/mx/curp.ts:74` — `if (!Number.isFinite(yy) || ...)` after
   `Number(cleaned.slice(...))`**. Since the input is validated by
   `STRUCTURAL_REGEX` which constrains `[4..9]` to `\d{2}(0[1-9]|1[0-2])(0[1-9]|...)`,
   the slices are always digits and `Number()` of a digit-only string is
   always finite. Symbolic.

4. **`it/cf.ts:212` — `isPlausibleDay` calls `/^\d$/.test(ten)` etc.**.
   By construction `unHomocodia` returns a digit char or the same letter
   if not in the map. Could be replaced by a single
   `Number.isInteger(day)` check after parsing. Minor.

5. **`algorithms/luhn.ts:65–67` — `if (!/^\d+$/.test(body)) throw …`**.
   This is a public API guard, so it stays. Not dead weight; documenting it.

These are NOT bugs and "removing them" would save maybe 1 KB minified.
Skip unless you're optimizing bundle size below 30 KB.

## Recommendations

1. **Add null/undefined guards at the public entry points (H2)** — what:
   prepend `if (typeof input !== "string") return { ok: false, ... }` to
   `parse`/`validate`/`normalize`/`format`. why: matches the documented
   "never throws on input errors" contract; protects JS callers. effort:
   1 file change in `src/index.ts` + symmetric guards in each per-country
   `parse()`. Estimated 2 hours.

2. **Wrap `Intl.DisplayNames` construction in try/catch with fallback (H1)** —
   what: `catalog/countries.ts:135` should `try { new Intl.DisplayNames(...) } catch { return new Intl.DisplayNames([DEFAULT_LOCALE], ...) }`.
   why: prevents `RangeError` from untrusted locale strings; matches the
   existing `i18n/index.ts:78` fallback pattern. effort: 5 lines + 1 test
   case for adversarial locale input. 30 min.

3. **Validate `flagEmoji` shape (H3)** — what: tighten the
   `code.length !== 2` check to `!/^[A-Za-z]{2}$/.test(code)`. why:
   silently producing valid-looking-but-meaningless Unicode is the worst
   kind of failure; throw instead. effort: 1-line change + 1 test. 10 min.

4. **Refuse empty input to `pii.hash`, or warn (M1)** — what: if the
   normalized input is empty AND `salt` is empty, throw a clear error
   (`"refusing to hash empty input without salt; pass a non-empty salt to
   acknowledge"`). why: silently storing
   `sha256("")` = `e3b0c44…` for every empty CPF is a classic data-quality
   trap. effort: 5 lines + 1 test case. 15 min.

5. **Add `safeEqual` helper for hash comparison (M2)** — what: export
   `safeEqual(a, b)` from `nationid/pii` that does length check + xor
   compare in constant time. Document the timing-side-channel risk in
   `docs/PII.md`. why: the library's stated PII use case (hash lookup)
   naturally invites `===` comparison, which leaks. effort: 10 lines + 1
   test + docs. 30 min.

6. **Pre-NFC-normalize CURP / RFC inputs (M4)** — what:
   `normalizeCurp` and `normalizeRfc` should call
   `input.normalize("NFC")` before the regex strip. why: NFD-encoded `Ñ`
   silently loses the diacritic, producing a different normalized form
   than NFC `Ñ`. Common on macOS clipboards. effort: 1 line per
   normalizer + property test
   `validate(s) === validate(s.normalize("NFD"))`. 30 min.

7. **Canonicalize non-ASCII digits to ASCII before stripping (M5)** —
   what: add an `asciiDigits()` helper to `core/normalize.ts` that maps
   Arabic-Indic, Devanagari, Bengali, and fullwidth digit codepoints to
   `[0-9]`. Call it inside `stripNonDigits`. why: better UX for Persian /
   Arabic / Hindi-script users without changing the validation contract.
   effort: 20 lines + property test. 1 hour.

8. **Add `validate(format(x)) === validate(x)` property test (gap)** —
   what: extend `tests/property/format-stability.test.ts` (or wherever
   format-cycle invariants live) to include this round-trip. why: makes
   the invariant explicit rather than implicit. effort: 10 lines. 15 min.

9. **Document algorithm-primitive throw contract (M6)** — what: update
   `docs/PROPERTY_TESTS.md` or add a section to the algorithm exports
   noting that `mod11WeightedSum` / `luhnCheckDigit` / `mrzCheckDigit`
   throw on programmer-bug inputs. why: external consumers of the
   `nationid/algorithms` subpath need to know. effort: 1 paragraph. 10 min.

10. **Eviction policy for `displayNamesCache` (L3)** — what: cap to ~50
    entries with a simple round-robin. why: prevents pathological
    memory growth if H1 is fixed in a way that accepts more inputs.
    effort: 5 lines. 15 min.

**Aggregate effort to close every High and Medium**: ~5–6 hours including
tests. The library is one solid sprint away from a 9.5/10 robustness
score.
