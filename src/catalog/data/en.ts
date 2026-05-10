/**
 * English (en) catalog strings.
 *
 * Native acronyms are preserved as `displayName` (CPF stays "CPF", DUI stays
 * "DUI") since that is how local users identify them. `longName` is the
 * faithful English translation.
 */

import type { DocumentTypeCode } from "../../core/types.ts";
import type { LocaleStrings } from "../types.ts";

export const catalogEn: Record<DocumentTypeCode, LocaleStrings> = {
  // El Salvador
  SV_DUI: {
    displayName: "DUI",
    longName: "Salvadoran Unique Identity Document",
    description: "Personal identity document for residents of El Salvador.",
  },
  SV_NIT: {
    displayName: "NIT",
    longName: "Salvadoran Tax Identification Number",
    description: "Salvadoran tax identifier issued by the Ministry of Finance.",
  },

  // México
  MX_CURP: {
    displayName: "CURP",
    longName: "Mexican Personal Identification Code",
    description: "Unique personal identifier for Mexican residents.",
  },
  MX_RFC_PF: {
    displayName: "RFC (Individual)",
    longName: "Mexican Federal Taxpayer Registry (Individual)",
    description: "Mexican tax registry for individuals, issued by the SAT.",
  },
  MX_RFC_PM: {
    displayName: "RFC (Legal Entity)",
    longName: "Mexican Federal Taxpayer Registry (Legal Entity)",
    description: "Mexican tax registry for legal entities, issued by the SAT.",
  },
  MX_CLAVE_ELECTOR: {
    displayName: "Clave de Elector",
    longName: "Mexican Voter Key (INE)",
    description: "Voter key printed on the Mexican INE/IFE voter credential.",
  },

  // Colombia
  CO_CC: {
    displayName: "Cédula de Ciudadanía",
    longName: "Colombian Citizenship ID Card",
    description: "Identity document for adult Colombian citizens.",
  },
  CO_CE: {
    displayName: "Cédula de Extranjería",
    longName: "Colombian Foreigner ID Card",
    description: "Identity document for foreign residents in Colombia.",
  },
  CO_TI: {
    displayName: "Tarjeta de Identidad",
    longName: "Colombian Minor Identity Card",
    description: "Colombian identity document for minors aged 7 to 17.",
  },
  CO_PASAPORTE: {
    displayName: "Pasaporte",
    longName: "Colombian Passport",
    description: "International travel document issued by the Colombian Foreign Ministry.",
  },
  CO_NIT: {
    displayName: "NIT",
    longName: "Colombian Tax Identification Number",
    description: "Colombian tax identifier issued by the DIAN.",
  },
  CO_PEP: {
    displayName: "PEP",
    longName: "Colombian Special Stay Permit",
    description: "Migratory permit issued by Colombia to Venezuelan migrants.",
  },
  CO_PPT: {
    displayName: "PPT",
    longName: "Colombian Temporary Protection Permit",
    description: "Migratory permit for migrants under temporary protection in Colombia.",
  },

  // Brasil
  BR_CPF: {
    displayName: "CPF",
    longName: "Brazilian Individual Tax Registry",
    description: "Brazilian tax registry for individuals.",
  },
  BR_CNPJ: {
    displayName: "CNPJ",
    longName: "Brazilian Legal Entity Tax Registry",
    description: "Brazilian tax registry for legal entities.",
  },
  BR_CNH: {
    displayName: "CNH",
    longName: "Brazilian National Driver's License",
    description: "Brazilian driver's license issued by state DETRAN agencies.",
  },
  BR_TITULO_ELEITOR: {
    displayName: "Título de Eleitor",
    longName: "Brazilian Voter Registration",
    description: "Brazilian voter registration issued by the Electoral Justice.",
  },
  BR_PIS: {
    displayName: "PIS",
    longName: "Brazilian Social Integration Program Number",
    description: "Brazilian social security number used by the Caixa Econômica Federal.",
  },

  // Perú
  PE_DNI: {
    displayName: "DNI",
    longName: "Peruvian National Identity Document",
    description: "National identity document for Peruvian citizens, issued by RENIEC.",
  },
  PE_RUC: {
    displayName: "RUC",
    longName: "Peruvian Unique Taxpayer Registry",
    description: "Peruvian tax registry issued by SUNAT.",
  },
  PE_CE: {
    displayName: "Carné de Extranjería",
    longName: "Peruvian Foreigner ID Card",
    description: "Identity document for foreign residents in Peru.",
  },

  // Argentina
  AR_DNI: {
    displayName: "DNI",
    longName: "Argentine National Identity Document",
    description: "National identity document for Argentine citizens.",
  },
  AR_CUIT: {
    displayName: "CUIT",
    longName: "Argentine Unique Tax Identification Code",
    description: "Argentine tax identifier issued by AFIP.",
  },
  AR_CUIL: {
    displayName: "CUIL",
    longName: "Argentine Unique Labor Identification Code",
    description: "Argentine labor identifier for employees under formal employment.",
  },
  AR_CDI: {
    displayName: "CDI",
    longName: "Argentine Identification Code",
    description: "Argentine tax identifier for individuals without a CUIT or CUIL.",
  },

  // Chile
  CL_RUT: {
    displayName: "RUT/RUN",
    longName: "Chilean Unique Tax Roll / Unique National Roll",
    description: "Unique Chilean identifier used for both civil and tax purposes.",
  },

  // República Dominicana
  DO_CEDULA: {
    displayName: "Cédula",
    longName: "Dominican Identity and Electoral Card",
    description: "Identity and electoral document for Dominican citizens.",
  },
  DO_RNC: {
    displayName: "RNC",
    longName: "Dominican National Taxpayer Registry",
    description: "Dominican tax identifier issued by the DGII.",
  },

  // Guatemala
  GT_DPI: {
    displayName: "DPI",
    longName: "Guatemalan Personal Identification Document",
    description: "Personal identification document for Guatemalan citizens.",
  },
  GT_NIT: {
    displayName: "NIT",
    longName: "Guatemalan Tax Identification Number",
    description: "Guatemalan tax identifier issued by SAT.",
  },

  // Honduras
  HN_DNI: {
    displayName: "DNI",
    longName: "Honduran National Identity Document",
    description: "National identity document for Honduran citizens.",
  },
  HN_RTN: {
    displayName: "RTN",
    longName: "Honduran National Tax Registry",
    description: "Honduran tax identifier issued by SAR.",
  },

  // Costa Rica
  CR_CEDULA_FISICA: {
    displayName: "Cédula Física",
    longName: "Costa Rican Identity Card",
    description: "Identity card for Costa Rican individuals.",
  },
  CR_CEDULA_JURIDICA: {
    displayName: "Cédula Jurídica",
    longName: "Costa Rican Legal Entity ID",
    description: "Identity and tax identifier for legal entities in Costa Rica.",
  },
  CR_DIMEX: {
    displayName: "DIMEX",
    longName: "Costa Rican Foreigner Migratory ID",
    description: "Migratory identification document for foreign residents in Costa Rica.",
  },

  // España
  ES_DNI: {
    displayName: "DNI",
    longName: "Spanish National Identity Document",
    description: "National identity document for Spanish citizens.",
  },
  ES_NIE: {
    displayName: "NIE",
    longName: "Spanish Foreigner Identity Number",
    description: "Identity number for foreign residents in Spain.",
  },
  ES_NIF_PJ: {
    displayName: "NIF (Legal Entity)",
    longName: "Spanish Tax Identification Number (Legal Entity)",
    description: "Spanish tax identifier for legal entities, formerly known as CIF.",
  },
  ES_NUSS: {
    displayName: "NUSS",
    longName: "Spanish Social Security Number",
    description: "Spanish social security affiliation number.",
  },

  // United States
  US_SSN: {
    displayName: "SSN",
    longName: "Social Security Number",
    description: "United States social security number issued by the SSA.",
  },
  US_ITIN: {
    displayName: "ITIN",
    longName: "Individual Taxpayer Identification Number",
    description: "United States tax identifier for individuals without an SSN, issued by the IRS.",
  },
  US_EIN: {
    displayName: "EIN",
    longName: "Employer Identification Number",
    description: "United States tax identifier for employers, issued by the IRS.",
  },
};
