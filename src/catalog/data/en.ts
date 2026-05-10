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

  // v0.4.0 — Bolivia
  BO_CI: {
    displayName: "CI",
    longName: "Identity Card",
    description:
      "Personal ID issued by SEGIP, with optional 2-letter departmental suffix (LP, CB, SC, etc.).",
  },
  BO_NIT: {
    displayName: "NIT",
    longName: "Tax Identification Number",
    description:
      "SIN tax ID; the 13-digit format replaces the legacy 7-11 digit one after RND 102100000011/2021.",
  },

  // v0.4.0 — Ecuador
  EC_CEDULA: {
    displayName: "Cédula",
    longName: "Identity Card",
    description:
      "10-digit personal ID issued by the Civil Registry; includes province code and Luhn-variant check digit.",
  },
  EC_RUC: {
    displayName: "RUC",
    longName: "Taxpayer Registry",
    description:
      "SRI tax ID: 13 digits with three validation branches (natural person, public entity, private legal entity).",
  },

  // v0.4.0 — Paraguay
  PY_CI: {
    displayName: "CI",
    longName: "Identity Card",
    description: "Personal ID issued by the Policía Nacional del Paraguay, 6 to 9 digits.",
  },
  PY_RUC: {
    displayName: "RUC",
    longName: "Taxpayer Registry",
    description: "SET tax ID with mod-11 check digit (Ley 125/91).",
  },

  // v0.4.0 — Nicaragua
  NI_CEDULA: {
    displayName: "Cédula",
    longName: "National Identity Card",
    description: "Identity document issued by Nicaragua's Supreme Electoral Council (CSE).",
  },
  NI_RUC: {
    displayName: "RUC",
    longName: "Single Taxpayer Registry",
    description: "Tax identifier issued by Nicaragua's DGI.",
  },

  // v0.4.0 — Panamá
  PA_CEDULA: {
    displayName: "Cédula",
    longName: "Personal Identity Card",
    description: "Identity document issued by Panama's Electoral Tribunal.",
  },
  PA_RUC: {
    displayName: "RUC",
    longName: "Single Taxpayer Registry",
    description: "Tax identifier issued by Panama's DGI (Ministry of Economy and Finance).",
  },

  // v0.4.0 — Uruguay
  UY_CI: {
    displayName: "CI",
    longName: "Identity Card",
    description:
      "Identity document issued by Uruguay's National Civil Identification Directorate (DNIC).",
  },
  UY_RUT: {
    displayName: "RUT",
    longName: "Single Tax Registry",
    description: "Tax identifier issued by Uruguay's General Tax Directorate (DGI).",
  },

  // v0.4.0 — Canadá
  CA_SIN: {
    displayName: "SIN",
    longName: "Social Insurance Number",
    description:
      "Canadian social insurance number issued by Service Canada; serves as both personal ID and tax identifier with the CRA.",
  },
  CA_BN: {
    displayName: "BN",
    longName: "Business Number",
    description:
      "Canadian business tax identifier issued by the Canada Revenue Agency, extended with per-program accounts (RT, RP, RC).",
  },

  // v0.4.0 — Portugal
  PT_NIF: {
    displayName: "NIF",
    longName: "Tax Identification Number",
    description:
      "Portuguese tax identifier issued by the Autoridade Tributária; the first digit indicates whether the holder is an individual or a legal entity.",
  },
  PT_CC: {
    displayName: "Citizen Card",
    longName: "Cartão de Cidadão",
    description:
      "Portuguese national identity card issued by IRN; replaces the legacy Bilhete de Identidade.",
  },

  // v0.4.0 — Venezuela
  VE_CEDULA: {
    displayName: "Cédula",
    longName: "Cédula de Identidad",
    description:
      "Venezuelan national ID issued by SAIME; the V and E prefixes distinguish Venezuelan citizens from foreign residents.",
  },
  VE_RIF: {
    displayName: "RIF",
    longName: "Tax Information Registry",
    description:
      "Venezuelan tax identifier issued by SENIAT; the V/E/J/P/G/C prefix indicates the taxpayer type.",
  },

  // v0.5.0 — Mexico (IMSS social security)
  MX_NSS: {
    displayName: "NSS",
    longName: "Mexican Social Security Number",
    description: "IMSS affiliation number for Mexican workers and beneficiaries.",
  },

  // v0.5.0 — Passport family
  SV_PASAPORTE: {
    displayName: "Passport",
    longName: "Salvadoran Passport",
    description: "International travel document issued by El Salvador's DGME.",
  },
  MX_PASAPORTE: {
    displayName: "Passport",
    longName: "Mexican Passport",
    description: "International travel document issued by Mexico's SRE.",
  },
  BR_PASAPORTE: {
    displayName: "Passport",
    longName: "Brazilian Passport",
    description: "International travel document issued by Brazil's Federal Police.",
  },
  PE_PASAPORTE: {
    displayName: "Passport",
    longName: "Peruvian Passport",
    description:
      "International travel document issued by Peru's National Superintendence of Migration.",
  },
  AR_PASAPORTE: {
    displayName: "Passport",
    longName: "Argentine Passport",
    description: "International travel document issued by Argentina's RENAPER.",
  },
  CL_PASAPORTE: {
    displayName: "Passport",
    longName: "Chilean Passport",
    description:
      "International travel document issued by Chile's Civil Registry and Identification Service.",
  },
  DO_PASAPORTE: {
    displayName: "Passport",
    longName: "Dominican Passport",
    description:
      "International travel document issued by the Dominican Republic's Passport Directorate.",
  },
  GT_PASAPORTE: {
    displayName: "Passport",
    longName: "Guatemalan Passport",
    description: "International travel document issued by Guatemala's Migration Institute (IGM).",
  },
  HN_PASAPORTE: {
    displayName: "Passport",
    longName: "Honduran Passport",
    description:
      "International travel document issued by Honduras's National Migration Institute (INM).",
  },
  CR_PASAPORTE: {
    displayName: "Passport",
    longName: "Costa Rican Passport",
    description: "International travel document issued by Costa Rica's DGME.",
  },
  ES_PASAPORTE: {
    displayName: "Passport",
    longName: "Spanish Passport",
    description:
      "International travel document issued by Spain's National Police / Ministry of the Interior.",
  },
  US_PASAPORTE: {
    displayName: "Passport",
    longName: "United States Passport",
    description:
      "International travel document issued by the U.S. Department of State's Bureau of Consular Affairs.",
  },
  BO_PASAPORTE: {
    displayName: "Passport",
    longName: "Bolivian Passport",
    description: "International travel document issued by Bolivia's DIGEMIG.",
  },
  EC_PASAPORTE: {
    displayName: "Passport",
    longName: "Ecuadorian Passport",
    description:
      "International travel document issued by Ecuador's Ministry of Foreign Affairs and Human Mobility.",
  },
  PY_PASAPORTE: {
    displayName: "Passport",
    longName: "Paraguayan Passport",
    description:
      "International travel document issued by Paraguay's National Directorate of Migration.",
  },
  NI_PASAPORTE: {
    displayName: "Passport",
    longName: "Nicaraguan Passport",
    description: "International travel document issued by Nicaragua's DGME.",
  },
  PA_PASAPORTE: {
    displayName: "Passport",
    longName: "Panamanian Passport",
    description:
      "International travel document issued by Panama's National Migration Service (SNM).",
  },
  UY_PASAPORTE: {
    displayName: "Passport",
    longName: "Uruguayan Passport",
    description: "International travel document issued by Uruguay's DNIC.",
  },
  CA_PASAPORTE: {
    displayName: "Passport",
    longName: "Canadian Passport",
    description:
      "International travel document issued by Immigration, Refugees and Citizenship Canada (IRCC).",
  },
  PT_PASAPORTE: {
    displayName: "Passport",
    longName: "Portuguese Passport",
    description: "International travel document issued by Portugal's IRN.",
  },
  VE_PASAPORTE: {
    displayName: "Passport",
    longName: "Venezuelan Passport",
    description: "International travel document issued by Venezuela's SAIME.",
  },
};
