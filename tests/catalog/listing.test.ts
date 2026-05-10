/**
 * Catalog sub-feature tests.
 *
 * Cover: locale resolution, country/purpose filtering, default locale,
 * unknown inputs, full coverage (drift guard), and Spanish orthography.
 */

import { describe, expect, it } from "vitest";
import {
  type DocumentInfo,
  type DocumentPurpose,
  getDocumentInfo,
  listDocuments,
  listDocumentsByPurpose,
} from "../../src/catalog/index.ts";
import type { CountryCode, DocumentTypeCode } from "../../src/core/types.ts";
import { listSupportedCodes } from "../../src/index.ts";

describe("listDocuments — country + locale", () => {
  it("returns all MX specs in Spanish", () => {
    const docs = listDocuments("MX", "es");
    const codes = docs.map((d) => d.code).sort();
    expect(codes).toEqual(
      (
        [
          "MX_CLAVE_ELECTOR",
          "MX_CURP",
          "MX_NSS",
          "MX_PASAPORTE",
          "MX_RFC_PF",
          "MX_RFC_PM",
        ] as DocumentTypeCode[]
      ).sort(),
    );

    const curp = docs.find((d) => d.code === "MX_CURP");
    expect(curp?.displayName).toBe("CURP");
    expect(curp?.longName).toBe("Clave Única de Registro de Población");
    expect(curp?.country).toBe("MX");
    expect(curp?.purpose).toBe("identity");
  });

  it("returns BR specs with Portuguese descriptions", () => {
    const docs = listDocuments("BR", "pt");
    const cpf = docs.find((d) => d.code === "BR_CPF");
    expect(cpf?.displayName).toBe("CPF");
    expect(cpf?.longName).toBe("Cadastro de Pessoas Físicas");
    expect(cpf?.description).toMatch(/Cadastro tributário brasileiro/);

    const cnpj = docs.find((d) => d.code === "BR_CNPJ");
    expect(cnpj?.description).toContain("pessoas jurídicas");
  });

  it("returns CO specs in English", () => {
    const docs = listDocuments("CO", "en");
    const cc = docs.find((d) => d.code === "CO_CC");
    expect(cc?.longName).toBe("Colombian Citizenship ID Card");
    expect(cc?.description).toMatch(/Colombian/);
  });

  it("returns an empty array for an unknown country", () => {
    // @ts-expect-error — intentional: caller passes a value outside the union.
    expect(listDocuments("XX", "es")).toEqual([]);
  });

  it("defaults to English when locale is omitted", () => {
    const docs = listDocuments("MX");
    const curp = docs.find((d) => d.code === "MX_CURP");
    expect(curp?.longName).toBe("Mexican Personal Identification Code");
  });
});

describe("getDocumentInfo — single lookup", () => {
  it("returns the English description for MX_CURP", () => {
    const info = getDocumentInfo("MX_CURP", "en");
    expect(info).not.toBeNull();
    expect(info?.code).toBe("MX_CURP");
    expect(info?.description).toBe("Unique personal identifier for Mexican residents.");
    expect(info?.purpose).toBe("identity");
  });

  it("returns Spanish info for ES_NUSS by default-overridden locale", () => {
    const info = getDocumentInfo("ES_NUSS", "es");
    expect(info?.longName).toBe("Número de Seguridad Social");
    expect(info?.purpose).toBe("social_security");
  });

  it("returns English info for ES_NUSS", () => {
    const info = getDocumentInfo("ES_NUSS", "en");
    expect(info?.longName).toBe("Spanish Social Security Number");
  });

  it("returns null on an unknown code", () => {
    // @ts-expect-error — intentional: outside the union.
    expect(getDocumentInfo("XX_UNKNOWN", "en")).toBeNull();
  });

  it("defaults to English when locale is omitted", () => {
    const info = getDocumentInfo("BR_CPF");
    expect(info?.longName).toBe("Brazilian Individual Tax Registry");
  });
});

describe("listDocumentsByPurpose — cross-country filter", () => {
  it("returns every tax document across all countries in Spanish", () => {
    const docs = listDocumentsByPurpose("tax", "es");
    const codes = new Set(docs.map((d) => d.code));

    // Sanity: a representative subset must be present.
    const expected: DocumentTypeCode[] = [
      "SV_NIT",
      "MX_RFC_PF",
      "MX_RFC_PM",
      "CO_NIT",
      "BR_CPF",
      "BR_CNPJ",
      "PE_RUC",
      "AR_CUIT",
      "AR_CDI",
      "DO_RNC",
      "GT_NIT",
      "HN_RTN",
      "CR_CEDULA_JURIDICA",
      "ES_NIF_PJ",
      "US_ITIN",
      "US_EIN",
    ];
    for (const code of expected) {
      expect(codes.has(code), `missing tax doc ${code}`).toBe(true);
    }

    // All returned docs must actually be tax-purpose.
    for (const d of docs) {
      expect(d.purpose).toBe("tax");
    }
  });

  it("returns only social_security docs when filtered", () => {
    const docs = listDocumentsByPurpose("social_security", "en");
    const codes = docs.map((d) => d.code).sort();
    expect(codes).toEqual(
      (
        [
          "AR_CUIL",
          "BR_PIS",
          "CA_SIN",
          "CH_AHV",
          "ES_NUSS",
          "FR_NIR",
          "GB_NINO",
          "MX_NSS",
          "US_SSN",
        ] as DocumentTypeCode[]
      ).sort(),
    );
  });

  it("returns voter docs across countries", () => {
    const docs = listDocumentsByPurpose("voter", "es");
    const codes = new Set(docs.map((d) => d.code));
    expect(codes.has("MX_CLAVE_ELECTOR")).toBe(true);
    expect(codes.has("BR_TITULO_ELEITOR")).toBe(true);
  });

  it("returns driver_license docs", () => {
    const docs = listDocumentsByPurpose("driver_license", "en");
    expect(docs.map((d) => d.code)).toEqual(["BR_CNH"]);
  });

  it("defaults to English when locale is omitted", () => {
    const docs = listDocumentsByPurpose("identity");
    const dni = docs.find((d) => d.code === "AR_DNI");
    expect(dni?.longName).toBe("Argentine National Identity Document");
  });
});

describe("knownAs — alternative names exposed", () => {
  it("MX_CLAVE_ELECTOR includes INE and IFE", () => {
    const info = getDocumentInfo("MX_CLAVE_ELECTOR", "es");
    expect(info?.knownAs).toEqual(["INE", "IFE", "MX_INE"]);
  });

  it("BR_PIS includes PASEP / NIT / NIS aliases", () => {
    const info = getDocumentInfo("BR_PIS", "pt");
    expect(info?.knownAs).toEqual(["PIS", "PASEP", "NIT", "NIS"]);
  });

  it("CL_RUT exposes both RUT and RUN", () => {
    const info = getDocumentInfo("CL_RUT", "es");
    expect(info?.knownAs).toEqual(["RUT", "RUN"]);
  });
});

describe("coverage — every registered code has a catalog entry", () => {
  for (const locale of ["es", "en", "pt"] as const) {
    it(`every spec in listSupportedCodes() resolves in locale=${locale}`, () => {
      for (const code of listSupportedCodes()) {
        const info = getDocumentInfo(code, locale);
        expect(info, `${code} missing in locale ${locale}`).not.toBeNull();
        // exhaustive non-null narrowing
        const ok = info as DocumentInfo;
        expect(ok.displayName.length).toBeGreaterThan(0);
        expect(ok.longName.length).toBeGreaterThan(0);
        expect(ok.description.length).toBeGreaterThan(0);
      }
    });
  }

  it("country derived from spec matches the code prefix", () => {
    for (const code of listSupportedCodes()) {
      const info = getDocumentInfo(code, "en");
      expect(info?.country).toBeDefined();
      expect(code.startsWith(`${info?.country as CountryCode}_`)).toBe(true);
    }
  });
});

describe("Spanish orthography — tildes and accents are correct", () => {
  it("uses 'Número' (with tilde) in Spanish longName", () => {
    const sv = getDocumentInfo("SV_NIT", "es");
    expect(sv?.longName).toContain("Número");
    expect(sv?.longName).not.toContain("Numero ");
  });

  it("uses 'Único' (with tilde) where applicable", () => {
    const curp = getDocumentInfo("MX_CURP", "es");
    expect(curp?.longName).toContain("Única");

    const ar = getDocumentInfo("AR_CUIT", "es");
    expect(ar?.longName).toContain("Única");
  });

  it("uses 'Identificación' (with tilde) in tax-document longNames", () => {
    const samples: DocumentTypeCode[] = ["SV_NIT", "CO_NIT", "GT_NIT", "AR_CUIT", "ES_NIF_PJ"];
    for (const code of samples) {
      const info = getDocumentInfo(code, "es");
      expect(info?.longName, `${code} should contain "Identificación"`).toMatch(/Identificación/);
    }
  });

  it("never emits 'numero' or 'unico' without tildes in Spanish strings", () => {
    for (const code of listSupportedCodes()) {
      const info = getDocumentInfo(code, "es");
      const blob = `${info?.displayName} ${info?.longName} ${info?.description}`.toLowerCase();
      // word-boundary check: the tilde-less spellings must not appear standalone
      expect(blob, `${code} contains untilded "numero"`).not.toMatch(/\bnumero\b/);
      expect(blob, `${code} contains untilded "unico"`).not.toMatch(/\bunico\b/);
    }
  });

  it("Portuguese strings use cedilha and tildes", () => {
    const cpf = getDocumentInfo("BR_CPF", "pt");
    expect(cpf?.description).toContain("tributário");
    const cnh = getDocumentInfo("BR_CNH", "pt");
    expect(cnh?.longName).toContain("Habilitação");
  });
});

describe("purpose categorization sanity", () => {
  it.each<[DocumentTypeCode, DocumentPurpose]>([
    ["SV_DUI", "identity"],
    ["SV_NIT", "tax"],
    ["MX_CLAVE_ELECTOR", "voter"],
    ["BR_CNH", "driver_license"],
    ["AR_CUIL", "social_security"],
    ["CO_PEP", "migratory"],
    ["CR_DIMEX", "migratory"],
    ["US_EIN", "tax"],
  ])("%s has purpose=%s", (code, purpose) => {
    expect(getDocumentInfo(code, "en")?.purpose).toBe(purpose);
  });
});
