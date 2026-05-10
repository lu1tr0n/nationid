/**
 * i18n error catalog — public API tests.
 *
 * Coverage matrix:
 *   - every (locale × kind) produces a non-empty string
 *   - documentName interpolation works for every locale
 *   - omitted documentName falls back to neutral phrasing
 *   - unknown locale falls back to DEFAULT_LOCALE
 *   - unknown kind (forward-compat) falls back to a generic per-locale message
 *   - Spanish/Portuguese strings keep their orthographic accents verbatim
 */

import { describe, expect, it } from "vitest";
import type { ParseError } from "../../src/core/types.ts";
import {
  DEFAULT_LOCALE,
  getErrorMessage,
  getErrorTemplate,
  type Locale,
  SUPPORTED_LOCALES,
} from "../../src/i18n/index.ts";

const KINDS: ReadonlyArray<ParseError["kind"]> = [
  "empty",
  "too_short",
  "too_long",
  "invalid_format",
  "invalid_checksum",
];

describe("i18n — module surface", () => {
  it("exports the three supported locales", () => {
    expect(SUPPORTED_LOCALES).toEqual(["es", "en", "pt"]);
  });

  it("defaults to English", () => {
    expect(DEFAULT_LOCALE).toBe("en");
  });
});

describe("i18n — every (locale, kind) produces a non-empty message", () => {
  for (const locale of SUPPORTED_LOCALES) {
    for (const kind of KINDS) {
      it(`returns a non-empty string for (${locale}, ${kind})`, () => {
        const message = getErrorMessage({ kind } as ParseError, locale, "DUI");
        expect(typeof message).toBe("string");
        expect(message.length).toBeGreaterThan(0);
        expect(message.includes("{document}")).toBe(false);
      });
    }
  }
});

describe("i18n — documentName interpolation", () => {
  it("substitutes the document name in Spanish", () => {
    expect(getErrorMessage({ kind: "too_short" }, "es", "DUI")).toBe("El DUI es demasiado corto.");
    expect(getErrorMessage({ kind: "too_long" }, "es", "NIT")).toBe("El NIT es demasiado largo.");
    expect(getErrorMessage({ kind: "invalid_format" }, "es", "DUI")).toBe(
      "El formato del DUI no es válido.",
    );
    expect(getErrorMessage({ kind: "invalid_checksum" }, "es", "DUI")).toBe(
      "El DUI no es válido (dígito verificador incorrecto).",
    );
  });

  it("substitutes the document name in English", () => {
    expect(getErrorMessage({ kind: "too_short" }, "en", "SSN")).toBe("The SSN is too short.");
    expect(getErrorMessage({ kind: "invalid_format" }, "en", "SSN")).toBe(
      "The SSN format is not valid.",
    );
    expect(getErrorMessage({ kind: "invalid_checksum" }, "en", "SSN")).toBe(
      "The SSN is not valid (checksum failed).",
    );
  });

  it("substitutes the document name in Portuguese", () => {
    expect(getErrorMessage({ kind: "invalid_format" }, "pt", "CPF")).toBe(
      "O formato do CPF não é válido.",
    );
    expect(getErrorMessage({ kind: "too_short" }, "pt", "CNPJ")).toBe("O CNPJ é muito curto.");
    expect(getErrorMessage({ kind: "invalid_checksum" }, "pt", "CPF")).toBe(
      "O CPF não é válido (dígito verificador incorreto).",
    );
  });

  it("ignores `empty` interpolation slot (template has none)", () => {
    expect(getErrorMessage({ kind: "empty" }, "es", "DUI")).toBe("Ingresa un valor.");
    expect(getErrorMessage({ kind: "empty" }, "en", "SSN")).toBe("Please enter a value.");
    expect(getErrorMessage({ kind: "empty" }, "pt", "CPF")).toBe("Insira um valor.");
  });

  it("treats whitespace-only documentName as missing", () => {
    expect(getErrorMessage({ kind: "too_short" }, "es", "   ")).toBe(
      "El documento es demasiado corto.",
    );
  });

  it("trims surrounding whitespace from a non-empty documentName", () => {
    expect(getErrorMessage({ kind: "too_short" }, "en", "  SSN  ")).toBe("The SSN is too short.");
  });
});

describe("i18n — neutral phrasing when documentName is omitted", () => {
  it("renders Spanish neutral phrasing", () => {
    expect(getErrorMessage({ kind: "too_short" }, "es")).toBe("El documento es demasiado corto.");
    expect(getErrorMessage({ kind: "invalid_format" }, "es")).toBe(
      "El formato del documento no es válido.",
    );
    expect(getErrorMessage({ kind: "invalid_checksum" }, "es")).toBe(
      "El documento no es válido (dígito verificador incorrecto).",
    );
  });

  it("renders English neutral phrasing", () => {
    expect(getErrorMessage({ kind: "too_short" }, "en")).toBe("The document is too short.");
    expect(getErrorMessage({ kind: "invalid_format" }, "en")).toBe(
      "The document format is not valid.",
    );
  });

  it("renders Portuguese neutral phrasing", () => {
    expect(getErrorMessage({ kind: "too_long" }, "pt")).toBe("O documento é muito longo.");
    expect(getErrorMessage({ kind: "invalid_format" }, "pt")).toBe(
      "O formato do documento não é válido.",
    );
  });
});

describe("i18n — locale fallback", () => {
  it("falls back to DEFAULT_LOCALE when locale is undefined", () => {
    const fromUndefined = getErrorMessage({ kind: "too_short" }, undefined, "X");
    const fromDefault = getErrorMessage({ kind: "too_short" }, DEFAULT_LOCALE, "X");
    expect(fromUndefined).toBe(fromDefault);
  });

  it("falls back to DEFAULT_LOCALE when locale is unsupported", () => {
    // Cast through `unknown` to simulate a runtime call from JS or a stale
    // consumer that passes an unsupported tag.
    const fakeLocale = "fr" as unknown as Locale;
    const result = getErrorMessage({ kind: "empty" }, fakeLocale);
    expect(result).toBe("Please enter a value.");
  });

  it("falls back in getErrorTemplate as well", () => {
    const fakeLocale = "de" as unknown as Locale;
    expect(getErrorTemplate("empty", fakeLocale)).toBe("Please enter a value.");
  });
});

describe("i18n — unknown kind fallback (forward-compat)", () => {
  it("returns a generic message in the requested locale", () => {
    const future = { kind: "future_kind_we_dont_have_yet" } as unknown as ParseError;
    expect(getErrorMessage(future, "es", "DUI")).toBe("El DUI no es válido.");
    expect(getErrorMessage(future, "en", "SSN")).toBe("The SSN is not valid.");
    expect(getErrorMessage(future, "pt", "CPF")).toBe("O CPF não é válido.");
  });

  it("uses neutral phrasing in the generic fallback when no documentName", () => {
    const future = { kind: "future_kind" } as unknown as ParseError;
    expect(getErrorMessage(future, "es")).toBe("El documento no es válido.");
    expect(getErrorMessage(future, "en")).toBe("The document is not valid.");
    expect(getErrorMessage(future, "pt")).toBe("O documento não é válido.");
  });

  it("getErrorTemplate returns the generic fallback for unknown kinds", () => {
    const fakeKind = "future_kind" as unknown as ParseError["kind"];
    expect(getErrorTemplate(fakeKind, "es")).toBe("El {document} no es válido.");
  });
});

describe("i18n — getErrorTemplate (raw, no interpolation)", () => {
  it("returns the raw template with the {document} slot intact", () => {
    expect(getErrorTemplate("too_short", "es")).toBe("El {document} es demasiado corto.");
    expect(getErrorTemplate("invalid_format", "en")).toBe("The {document} format is not valid.");
    expect(getErrorTemplate("invalid_checksum", "pt")).toBe(
      "O {document} não é válido (dígito verificador incorreto).",
    );
  });

  it("returns `empty` template without any slot", () => {
    expect(getErrorTemplate("empty", "es")).toBe("Ingresa un valor.");
    expect(getErrorTemplate("empty", "en")).toBe("Please enter a value.");
    expect(getErrorTemplate("empty", "pt")).toBe("Insira um valor.");
  });
});

describe("i18n — orthography (verbatim accents and tildes)", () => {
  it("preserves Spanish tildes/acentos byte-for-byte", () => {
    expect(getErrorTemplate("invalid_format", "es")).toContain("válido");
    expect(getErrorTemplate("invalid_checksum", "es")).toContain("dígito");
    expect(getErrorTemplate("invalid_checksum", "es")).toContain("válido");
  });

  it("preserves Portuguese accents byte-for-byte", () => {
    expect(getErrorTemplate("too_short", "pt")).toContain("é");
    expect(getErrorTemplate("invalid_format", "pt")).toContain("não");
    expect(getErrorTemplate("invalid_format", "pt")).toContain("válido");
    expect(getErrorTemplate("invalid_checksum", "pt")).toContain("dígito");
    expect(getErrorTemplate("invalid_checksum", "pt")).toContain("incorreto");
  });
});

describe("i18n — locale modules are standalone-importable", () => {
  it("loads the Spanish bundle without the orchestrator", async () => {
    const mod = await import("../../src/i18n/locales/es.ts");
    expect(mod.errors.empty).toBe("Ingresa un valor.");
    expect(mod.neutralDocument).toBe("documento");
  });

  it("loads the English bundle without the orchestrator", async () => {
    const mod = await import("../../src/i18n/locales/en.ts");
    expect(mod.errors.empty).toBe("Please enter a value.");
    expect(mod.neutralDocument).toBe("document");
  });

  it("loads the Portuguese bundle without the orchestrator", async () => {
    const mod = await import("../../src/i18n/locales/pt.ts");
    expect(mod.errors.empty).toBe("Insira um valor.");
    expect(mod.neutralDocument).toBe("documento");
  });
});
