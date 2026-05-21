/**
 * Governance test — `confidence: "high"` requires a first-party citation.
 *
 * Every spec file under `src/countries/<cc>/*.ts` that declares
 * `confidence: "high"` at the top level must cite, in its file-header JSDoc:
 *
 *   - at least one URL on the issuing authority's own domain (gov/gob/etc.
 *     TLD or a recognized first-party domain), OR
 *   - at least one named legal statute / regulation (RG AFIP, Real Decreto,
 *     Decreto, Pub., DM, RG SUNAT, Resolución, Ley, Anexo …, etc.).
 *
 * Microsoft Purview links and Wikipedia entries alone DO NOT satisfy the
 * requirement. They may appear as supplementary sources but must be paired
 * with a first-party citation.
 *
 * This test pins the v1.0 promise that consumers reading
 * `getSpec("X").confidence === "high"` can rely on an issuer-grade source.
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..", "..");
const COUNTRIES_DIR = join(ROOT, "src", "countries");

/**
 * Portable directory walk for `src/countries/<cc>/*.ts` (excluding `index.ts`).
 * Avoids `globSync` from `node:fs` because that was only added in Node 22 and
 * CI exercises Node 20, 22, and 24.
 */
function discoverCountrySpecFiles(): string[] {
  const out: string[] = [];
  for (const cc of readdirSync(COUNTRIES_DIR, { withFileTypes: true })) {
    if (!cc.isDirectory()) continue;
    const dir = join(COUNTRIES_DIR, cc.name);
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isFile()) continue;
      if (!entry.name.endsWith(".ts")) continue;
      if (entry.name === "index.ts") continue;
      out.push(join(dir, entry.name));
    }
  }
  return out;
}

const COUNTRY_FILES = discoverCountrySpecFiles();

/**
 * First-party domain matcher. We parse each URL with `new URL()` and check
 * the hostname against:
 *
 *   - a TLD suffix list (`gob.*`, `gov.*`, `gouv.fr`, `gov.uk`, `go.cr`, etc.)
 *     that catches generic government domains, AND
 *   - an explicit allowlist of issuer-grade non-`.gov` domains used by EU /
 *     Nordic / agency portals (insee.fr, skat.dk, dvv.fi, bolagsverket.se, ...).
 *
 * Adding a new country requires extending one of the two lists; CI refuses
 * the PR until the new spec's source matches.
 */
const ISSUER_TLD_SUFFIXES: ReadonlyArray<RegExp> = [
  /(?:^|\.)gob\.[a-z]{2,3}$/i,
  /(?:^|\.)gov\.[a-z]{2,3}$/i,
  /(?:^|\.)gouv\.fr$/i,
  /(?:^|\.)gov\.uk$/i,
  /(?:^|\.)admin\.ch$/i,
  /(?:^|\.)go\.cr$/i,
  /(?:^|\.)gc\.ca$/i,
  /(?:^|\.)canada\.ca$/i,
  /(?:^|\.)irs\.gov$/i,
  /(?:^|\.)ssa\.gov$/i,
  /(?:^|\.)jus\.br$/i,
];

const ISSUER_ALLOWLIST_DOMAINS: ReadonlySet<string> = new Set([
  "skat.dk",
  "cpr.dk",
  "virk.dk",
  "datacvr.virk.dk",
  "dvv.fi",
  "vero.fi",
  "ytj.fi",
  "insee.fr",
  "skatteverket.se",
  "bolagsverket.se",
  "brreg.no",
  "skatteetaten.no",
  "nhs.uk",
  "digital.nhs.uk",
  "ahv-iv.ch",
  "bff-online.de",
  "bzst.de",
  "agenziaentrate.it",
  "belastingdienst.nl",
  "kvk.nl",
  "rvig.nl",
  "evatr.bff-online.de",
  "podatki.gov.pl",
  "stat.gov.pl",
  "portaldasfinancas.gov.pt",
  "info.portaldasfinancas.gov.pt",
  "belgium.be",
  "finance.belgium.be",
  "fgov.be",
  "economie.fgov.be",
  "minfin.fgov.be",
  "kbopub.economie.fgov.be",
  "seg-social.es",
  "boe.es",
  "policia.es",
  "agenciatributaria.es",
  "afip.gov.ar",
  "afip.gob.ar",
  "arca.gob.ar",
  "arca.gov.ar",
  "receita.fazenda.gov.br",
  "tse.jus.br",
  "sii.cl",
  "registraduria.gov.co",
  "dgii.gov.do",
  "sri.gob.ec",
  "sat.gob.gt",
  "rnpn.gob.sv",
  "mh.gob.sv",
  "set.gov.py",
  "dgi.gub.uy",
  "sunat.gob.pe",
  "reniec.gob.pe",
  "dgi.mef.gob.pa",
  "tribunalsupremo.gob.ve",
  "seniat.gob.ve",
  "saime.gob.ve",
  "ine.gob.hn",
  "sar.gob.hn",
  "cne.gob.ni",
  "dgi.gob.ni",
  "dgrec.go.cr",
  "tse.go.cr",
  "hacienda.go.cr",
  "tramites.gob.bo",
]);

function isIssuerHost(host: string): boolean {
  const h = host.toLowerCase().replace(/^www\./, "");
  if (ISSUER_ALLOWLIST_DOMAINS.has(h)) return true;
  // Walk up the dot-suffixes — e.g. "foo.bar.gob.mx" must also match gob.mx.
  const parts = h.split(".");
  for (let i = 0; i < parts.length - 1; i++) {
    const suffix = parts.slice(i).join(".");
    if (ISSUER_ALLOWLIST_DOMAINS.has(suffix)) return true;
  }
  return ISSUER_TLD_SUFFIXES.some((re) => re.test(h));
}

/**
 * Statute / regulation keywords that count as a first-party citation when
 * a URL is absent (or in addition to a URL). These are real statute names
 * referenced in the spec headers.
 */
const STATUTE_PATTERNS: ReadonlyArray<RegExp> = [
  /\bRG\s+AFIP\b/i,
  /\bRG\s+\d+\/\d+/i,
  /\bRG\s+SUNAT\b/i,
  /\bResoluci[oó]n\s+\d+/i,
  /\bAnexo\s+\d+\b/i,
  /\bRMF\b/i,
  /\bReal\s+Decreto\s+\d+\/\d+/i,
  /\bDecreto\s+\d+\/\d+/i,
  /\bDecreto\s+Ley\s+\d+/i,
  /\bLey\s+\d+(?:[./]\d+)?/i,
  /\bDM\s+\d/i,
  /\bD\.\s*M\.\s+\d/i,
  /\bIRS\s+Pub\.?\s*\d+/i,
  /\bIRS\s+Publication\s+\d+/i,
  /\bSSA\s+RM\b/i,
  /\bForm\s+SS-?\d+\b/i,
  /\bSAT\s+Anexo\s+\d+/i,
  /\bGazzetta\s+Ufficiale\b/i,
  /\bBundessteuerblatt\b/i,
  /\bBundesgesetz\b/i,
  /\bFederal\s+law\b/i,
  /\bCódigo\s+Tributario\b/i,
  /\bDOU\b/i,
];

/** Returns the JSDoc block at the top of the file (before any imports). */
function extractFileHeader(source: string): string {
  const idx = source.indexOf("*/");
  if (idx === -1) return "";
  return source.slice(0, idx + 2);
}

/** Does any URL in `header` match a first-party issuer domain? */
function hasFirstPartyUrl(header: string): boolean {
  const urls = header.match(/https?:\/\/[^\s,)]+/g) ?? [];
  for (const raw of urls) {
    try {
      const u = new URL(raw);
      if (isIssuerHost(u.hostname)) return true;
    } catch {
      // ignore malformed URLs — they don't satisfy the requirement
    }
  }
  return false;
}

/** Does `header` reference any recognized legal statute? */
function hasStatuteCitation(header: string): boolean {
  return STATUTE_PATTERNS.some((re) => re.test(header));
}

interface HighSpecFile {
  readonly path: string;
  readonly relPath: string;
  readonly header: string;
}

function collectHighSpecs(): ReadonlyArray<HighSpecFile> {
  const out: HighSpecFile[] = [];
  for (const path of COUNTRY_FILES) {
    const source = readFileSync(path, "utf8");
    // Match a `confidence: "high"` declaration NOT inside the JSDoc header.
    // We look for the field in the spec object, not in a comment.
    const codeAfterHeader = source.slice(extractFileHeader(source).length);
    if (!/^\s*confidence:\s*"high"/m.test(codeAfterHeader)) continue;
    out.push({
      path,
      relPath: path.replace(`${ROOT}/`, ""),
      header: extractFileHeader(source),
    });
  }
  return out;
}

describe("governance — confidence: 'high' requires a first-party citation", () => {
  const highSpecs = collectHighSpecs();

  it("the high-confidence tier is not empty", () => {
    // Sanity guard: if a future refactor accidentally erases all high specs
    // we don't want this whole test file to vacuously pass.
    expect(highSpecs.length).toBeGreaterThan(40);
  });

  it.each(
    highSpecs.map((f) => [f.relPath, f] as const),
  )("%s cites a first-party source (issuer-TLD URL or legal statute)", (_relPath, file) => {
    const ok = hasFirstPartyUrl(file.header) || hasStatuteCitation(file.header);
    if (!ok) {
      // Build a diagnostic so a failing PR sees what's missing.
      const urls = file.header.match(/https?:\/\/[^\s,)]+/g) ?? [];
      throw new Error(
        [
          `${file.relPath}: declares confidence:"high" but the JSDoc header lacks a first-party citation.`,
          `URLs found: ${urls.length === 0 ? "<none>" : urls.join(", ")}`,
          `Required: at least one URL on an issuer domain (e.g., *.gob.*, *.gov.uk, agenciatributaria.es),`,
          `or a recognized legal-statute reference (RG AFIP, Real Decreto, Pub., Anexo …).`,
          `Microsoft Purview / Wikipedia URLs alone do NOT satisfy the requirement.`,
        ].join("\n"),
      );
    }
    expect(ok).toBe(true);
  });
});
