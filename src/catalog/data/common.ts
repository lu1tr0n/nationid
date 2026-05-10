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
};
