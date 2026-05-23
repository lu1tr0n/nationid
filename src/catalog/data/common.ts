/**
 * Locale-agnostic catalog metadata.
 *
 * Pairs each `DocumentTypeCode` with its purpose classification and the list
 * of colloquial / alternative names users may type in a "select your document"
 * dropdown. Country and confidence are derived from the underlying `DocumentSpec`
 * to avoid duplication.
 */

import type { DocumentTypeCode } from "../../core/types.ts";
import type { DocumentPurpose } from "../types.ts";

export interface CommonEntry {
  readonly purpose: DocumentPurpose;
  readonly knownAs: ReadonlyArray<string>;
}

export const catalogCommon: Record<DocumentTypeCode, CommonEntry> = {
  // El Salvador
  SV_DUI: { purpose: "identity", knownAs: ["DUI"] },
  SV_NIT: { purpose: "tax", knownAs: ["NIT"] },

  // México
  MX_CURP: { purpose: "identity", knownAs: ["CURP"] },
  MX_RFC_PF: { purpose: "tax", knownAs: ["RFC"] },
  MX_RFC_PM: { purpose: "tax", knownAs: ["RFC", "RFC PM"] },
  MX_CLAVE_ELECTOR: { purpose: "voter", knownAs: ["INE", "IFE", "MX_INE"] },

  // Colombia
  CO_CC: { purpose: "identity", knownAs: ["CC", "Cédula"] },
  CO_CE: { purpose: "migratory", knownAs: ["CE", "Cédula de Extranjería"] },
  CO_TI: { purpose: "identity", knownAs: ["TI", "Tarjeta de Identidad"] },
  CO_PASAPORTE: { purpose: "identity", knownAs: ["Pasaporte"] },
  CO_NIT: { purpose: "tax", knownAs: ["NIT"] },
  CO_PEP: { purpose: "migratory", knownAs: ["PEP"] },
  CO_PPT: { purpose: "migratory", knownAs: ["PPT"] },

  // Brasil
  BR_CPF: { purpose: "tax", knownAs: ["CPF"] },
  BR_CNPJ: { purpose: "tax", knownAs: ["CNPJ"] },
  BR_CNH: { purpose: "driver_license", knownAs: ["CNH"] },
  BR_TITULO_ELEITOR: { purpose: "voter", knownAs: ["Título de Eleitor"] },
  BR_PIS: { purpose: "social_security", knownAs: ["PIS", "PASEP", "NIT", "NIS"] },

  // Perú
  PE_DNI: { purpose: "identity", knownAs: ["DNI"] },
  PE_CE: { purpose: "migratory", knownAs: ["CE"] },
  PE_RUC: { purpose: "tax", knownAs: ["RUC"] },

  // Argentina
  AR_DNI: { purpose: "identity", knownAs: ["DNI"] },
  AR_CUIL: { purpose: "social_security", knownAs: ["CUIL"] },
  AR_CUIT: { purpose: "tax", knownAs: ["CUIT"] },
  AR_CDI: { purpose: "tax", knownAs: ["CDI"] },

  // Chile
  CL_RUT: { purpose: "identity", knownAs: ["RUT", "RUN"] },

  // República Dominicana
  DO_CEDULA: { purpose: "identity", knownAs: ["Cédula"] },
  DO_RNC: { purpose: "tax", knownAs: ["RNC"] },

  // Guatemala
  GT_DPI: { purpose: "identity", knownAs: ["DPI"] },
  GT_NIT: { purpose: "tax", knownAs: ["NIT"] },

  // Honduras
  HN_DNI: { purpose: "identity", knownAs: ["DNI"] },
  HN_RTN: { purpose: "tax", knownAs: ["RTN"] },

  // Costa Rica
  CR_CEDULA_FISICA: { purpose: "identity", knownAs: ["Cédula"] },
  CR_DIMEX: { purpose: "migratory", knownAs: ["DIMEX"] },
  CR_CEDULA_JURIDICA: { purpose: "tax", knownAs: ["Cédula Jurídica"] },

  // España
  ES_DNI: { purpose: "identity", knownAs: ["DNI"] },
  ES_NIE: { purpose: "identity", knownAs: ["NIE"] },
  ES_NIF_PJ: { purpose: "tax", knownAs: ["CIF", "NIF-J"] },
  ES_NUSS: { purpose: "social_security", knownAs: ["NUSS"] },

  // United States
  US_SSN: { purpose: "social_security", knownAs: ["SSN"] },
  US_ITIN: { purpose: "tax", knownAs: ["ITIN"] },
  US_EIN: { purpose: "tax", knownAs: ["EIN"] },

  // v0.4.0 — Bolivia
  BO_CI: { purpose: "identity", knownAs: ["CI", "Cédula"] },
  BO_NIT: { purpose: "tax", knownAs: ["NIT"] },

  // v0.4.0 — Ecuador
  EC_CEDULA: { purpose: "identity", knownAs: ["Cédula", "CI"] },
  EC_RUC: { purpose: "tax", knownAs: ["RUC"] },

  // v0.4.0 — Paraguay
  PY_CI: { purpose: "identity", knownAs: ["CI", "Cédula"] },
  PY_RUC: { purpose: "tax", knownAs: ["RUC"] },

  // v0.4.0 — Nicaragua
  NI_CEDULA: { purpose: "identity", knownAs: ["Cédula"] },
  NI_RUC: { purpose: "tax", knownAs: ["RUC"] },

  // v0.4.0 — Panamá
  PA_CEDULA: { purpose: "identity", knownAs: ["Cédula", "CIP"] },
  PA_RUC: { purpose: "tax", knownAs: ["RUC"] },

  // v0.4.0 — Uruguay
  UY_CI: { purpose: "identity", knownAs: ["CI", "Cédula"] },
  UY_RUT: { purpose: "tax", knownAs: ["RUT"] },

  // v0.4.0 — Canadá
  CA_SIN: { purpose: "social_security", knownAs: ["SIN", "NAS", "Numéro d'assurance sociale"] },
  CA_BN: { purpose: "tax", knownAs: ["BN", "Numéro d'entreprise"] },

  // v0.4.0 — Portugal
  PT_NIF: { purpose: "tax", knownAs: ["NIF", "NIPC", "Contribuinte"] },
  PT_CC: { purpose: "identity", knownAs: ["CC", "BI"] },

  // v0.4.0 — Venezuela
  VE_CEDULA: { purpose: "identity", knownAs: ["Cédula", "CI"] },
  VE_RIF: { purpose: "tax", knownAs: ["RIF"] },

  // v0.5.0 — México (IMSS social security)
  MX_NSS: { purpose: "social_security", knownAs: ["NSS", "Número de Afiliación"] },

  // v0.5.0 — Passport family (CO_PASAPORTE already in v0.1)
  SV_PASAPORTE: { purpose: "identity", knownAs: ["Pasaporte", "Passport"] },
  MX_PASAPORTE: { purpose: "identity", knownAs: ["Pasaporte", "Passport"] },
  BR_PASAPORTE: { purpose: "identity", knownAs: ["Passaporte", "Passport"] },
  PE_PASAPORTE: { purpose: "identity", knownAs: ["Pasaporte", "Passport"] },
  AR_PASAPORTE: { purpose: "identity", knownAs: ["Pasaporte", "Passport"] },
  CL_PASAPORTE: { purpose: "identity", knownAs: ["Pasaporte", "Passport"] },
  DO_PASAPORTE: { purpose: "identity", knownAs: ["Pasaporte", "Passport"] },
  GT_PASAPORTE: { purpose: "identity", knownAs: ["Pasaporte", "Passport"] },
  HN_PASAPORTE: { purpose: "identity", knownAs: ["Pasaporte", "Passport"] },
  CR_PASAPORTE: { purpose: "identity", knownAs: ["Pasaporte", "Passport"] },
  ES_PASAPORTE: { purpose: "identity", knownAs: ["Pasaporte", "Passport"] },
  US_PASAPORTE: { purpose: "identity", knownAs: ["Passport", "Pasaporte"] },
  BO_PASAPORTE: { purpose: "identity", knownAs: ["Pasaporte", "Passport"] },
  EC_PASAPORTE: { purpose: "identity", knownAs: ["Pasaporte", "Passport"] },
  PY_PASAPORTE: { purpose: "identity", knownAs: ["Pasaporte", "Passport"] },
  NI_PASAPORTE: { purpose: "identity", knownAs: ["Pasaporte", "Passport"] },
  PA_PASAPORTE: { purpose: "identity", knownAs: ["Pasaporte", "Passport"] },
  UY_PASAPORTE: { purpose: "identity", knownAs: ["Pasaporte", "Passport"] },
  CA_PASAPORTE: { purpose: "identity", knownAs: ["Passport", "Passeport", "Pasaporte"] },
  PT_PASAPORTE: { purpose: "identity", knownAs: ["Passaporte", "Passport"] },
  VE_PASAPORTE: { purpose: "identity", knownAs: ["Pasaporte", "Passport"] },

  // v0.6.0 — United Kingdom
  GB_NINO: { purpose: "social_security", knownAs: ["NINO", "NI Number"] },
  GB_UTR: { purpose: "tax", knownAs: ["UTR"] },
  GB_VAT: { purpose: "tax", knownAs: ["VAT", "VRN"] },
  GB_NHS: { purpose: "identity", knownAs: ["NHS Number"] },

  // v0.6.0 — France
  FR_NIR: { purpose: "social_security", knownAs: ["NIR", "Sécu", "INSEE"] },
  FR_SIREN: { purpose: "tax", knownAs: ["SIREN"] },
  FR_SIRET: { purpose: "tax", knownAs: ["SIRET"] },
  FR_TVA: { purpose: "tax", knownAs: ["TVA", "VAT"] },

  // v0.6.0 — Germany
  DE_STEUER_ID: { purpose: "tax", knownAs: ["IdNr", "Steuer-ID", "Tax ID"] },
  DE_STEUERNUMMER: { purpose: "tax", knownAs: ["Steuernummer", "St-Nr"] },
  DE_USTID: { purpose: "tax", knownAs: ["USt-IdNr", "VAT"] },

  // v0.6.0 — Italy
  IT_CF: { purpose: "tax", knownAs: ["Codice Fiscale", "CF"] },
  IT_PIVA: { purpose: "tax", knownAs: ["P.IVA", "Partita IVA", "VAT"] },

  // v0.6.0 — Netherlands
  NL_BSN: { purpose: "identity", knownAs: ["BSN"] },
  NL_BTW: { purpose: "tax", knownAs: ["BTW", "BTW-id", "VAT"] },

  // v0.6.0 — Belgium
  BE_NRN: { purpose: "identity", knownAs: ["NRN", "Rijksregisternummer", "Registre National"] },
  BE_BTW: { purpose: "tax", knownAs: ["BTW", "TVA", "VAT"] },

  // v0.6.0 — Switzerland
  CH_AHV: { purpose: "social_security", knownAs: ["AHV", "AVS"] },
  CH_UID: { purpose: "tax", knownAs: ["UID"] },
  CH_MWST: { purpose: "tax", knownAs: ["MWST", "TVA", "IVA", "VAT"] },

  // v0.6.0 — Poland
  PL_PESEL: { purpose: "identity", knownAs: ["PESEL"] },
  PL_NIP: { purpose: "tax", knownAs: ["NIP"] },
  PL_REGON: { purpose: "tax", knownAs: ["REGON"] },

  // v0.6.0 — Sweden
  SE_PERSONNUMMER: { purpose: "identity", knownAs: ["Personnummer"] },
  SE_ORGNR: { purpose: "tax", knownAs: ["Organisationsnummer", "Orgnr"] },
  SE_VAT: { purpose: "tax", knownAs: ["Moms", "VAT"] },

  // v0.6.0 — Norway
  NO_FNR: { purpose: "identity", knownAs: ["Fødselsnummer", "FNR"] },
  NO_DNR: { purpose: "identity", knownAs: ["D-nummer", "DNR"] },
  NO_ORGNR: { purpose: "tax", knownAs: ["Organisasjonsnummer", "Orgnr"] },
  NO_MVA: { purpose: "tax", knownAs: ["MVA", "VAT"] },

  // v0.6.0 — Denmark
  DK_CPR: { purpose: "identity", knownAs: ["CPR-nummer", "CPR"] },
  DK_CVR: { purpose: "tax", knownAs: ["CVR"] },
  DK_VAT: { purpose: "tax", knownAs: ["Moms", "VAT"] },

  // v0.6.0 — Finland
  FI_HETU: { purpose: "identity", knownAs: ["HETU", "Henkilötunnus"] },
  FI_YTUNNUS: { purpose: "tax", knownAs: ["Y-tunnus"] },
  FI_VAT: { purpose: "tax", knownAs: ["ALV", "VAT"] },

  // v1.2.0 — India
  IN_AADHAAR: { purpose: "identity", knownAs: ["Aadhaar", "UID"] },
  IN_PAN: { purpose: "tax", knownAs: ["PAN"] },
  IN_GSTIN: { purpose: "tax", knownAs: ["GSTIN", "GSTN"] },
  IN_EPIC: { purpose: "voter", knownAs: ["EPIC", "Voter ID"] },
  IN_VID: { purpose: "identity", knownAs: ["VID", "Virtual ID"] },
};
