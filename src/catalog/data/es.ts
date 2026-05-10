/**
 * Spanish (es) catalog strings.
 *
 * `displayName` and `longName` follow each country's official native naming.
 * Spanish orthography is enforced: "número", "único", "identificación".
 */

import type { DocumentTypeCode } from "../../core/types.ts";
import type { LocaleStrings } from "../types.ts";

export const catalogEs: Record<DocumentTypeCode, LocaleStrings> = {
  // El Salvador
  SV_DUI: {
    displayName: "DUI",
    longName: "Documento Único de Identidad",
    description: "Identificador personal único para residentes en El Salvador.",
  },
  SV_NIT: {
    displayName: "NIT",
    longName: "Número de Identificación Tributaria",
    description: "Número tributario salvadoreño emitido por el Ministerio de Hacienda.",
  },

  // México
  MX_CURP: {
    displayName: "CURP",
    longName: "Clave Única de Registro de Población",
    description: "Identificador personal único para residentes mexicanos.",
  },
  MX_RFC_PF: {
    displayName: "RFC (Persona Física)",
    longName: "Registro Federal de Contribuyentes (Persona Física)",
    description: "Registro tributario mexicano para personas físicas, emitido por el SAT.",
  },
  MX_RFC_PM: {
    displayName: "RFC (Persona Moral)",
    longName: "Registro Federal de Contribuyentes (Persona Moral)",
    description: "Registro tributario mexicano para personas morales, emitido por el SAT.",
  },
  MX_CLAVE_ELECTOR: {
    displayName: "Clave de Elector",
    longName: "Clave de Elector (INE)",
    description: "Clave electoral impresa en la credencial INE/IFE de votantes mexicanos.",
  },

  // Colombia
  CO_CC: {
    displayName: "Cédula de Ciudadanía",
    longName: "Cédula de Ciudadanía",
    description: "Documento de identidad para ciudadanos colombianos mayores de edad.",
  },
  CO_CE: {
    displayName: "Cédula de Extranjería",
    longName: "Cédula de Extranjería",
    description: "Documento de identidad para extranjeros residentes en Colombia.",
  },
  CO_TI: {
    displayName: "Tarjeta de Identidad",
    longName: "Tarjeta de Identidad",
    description: "Documento de identidad colombiano para menores entre 7 y 17 años.",
  },
  CO_PASAPORTE: {
    displayName: "Pasaporte",
    longName: "Pasaporte Colombiano",
    description: "Documento de viaje internacional emitido por la Cancillería de Colombia.",
  },
  CO_NIT: {
    displayName: "NIT",
    longName: "Número de Identificación Tributaria",
    description: "Identificador tributario colombiano emitido por la DIAN.",
  },
  CO_PEP: {
    displayName: "PEP",
    longName: "Permiso Especial de Permanencia",
    description: "Permiso migratorio colombiano emitido a migrantes venezolanos.",
  },
  CO_PPT: {
    displayName: "PPT",
    longName: "Permiso por Protección Temporal",
    description: "Permiso migratorio colombiano para migrantes bajo protección temporal.",
  },

  // Brasil
  BR_CPF: {
    displayName: "CPF",
    longName: "Cadastro de Pessoas Físicas",
    description: "Registro tributario brasileño para personas físicas.",
  },
  BR_CNPJ: {
    displayName: "CNPJ",
    longName: "Cadastro Nacional da Pessoa Jurídica",
    description: "Registro tributario brasileño para personas jurídicas.",
  },
  BR_CNH: {
    displayName: "CNH",
    longName: "Carteira Nacional de Habilitação",
    description: "Licencia de conducir brasileña emitida por los DETRAN estatales.",
  },
  BR_TITULO_ELEITOR: {
    displayName: "Título de Eleitor",
    longName: "Título de Eleitor",
    description: "Documento electoral brasileño emitido por la Justicia Electoral.",
  },
  BR_PIS: {
    displayName: "PIS",
    longName: "Programa de Integración Social",
    description: "Número de seguridad social brasileño usado por la Caixa Econômica Federal.",
  },

  // Perú
  PE_DNI: {
    displayName: "DNI",
    longName: "Documento Nacional de Identidad",
    description: "Documento nacional de identidad para ciudadanos peruanos, emitido por el RENIEC.",
  },
  PE_RUC: {
    displayName: "RUC",
    longName: "Registro Único de Contribuyentes",
    description: "Registro tributario peruano emitido por la SUNAT.",
  },
  PE_CE: {
    displayName: "Carné de Extranjería",
    longName: "Carné de Extranjería",
    description: "Documento de identidad para extranjeros residentes en Perú.",
  },

  // Argentina
  AR_DNI: {
    displayName: "DNI",
    longName: "Documento Nacional de Identidad",
    description: "Documento nacional de identidad para ciudadanos argentinos.",
  },
  AR_CUIT: {
    displayName: "CUIT",
    longName: "Clave Única de Identificación Tributaria",
    description: "Identificador tributario argentino emitido por la AFIP.",
  },
  AR_CUIL: {
    displayName: "CUIL",
    longName: "Código Único de Identificación Laboral",
    description: "Identificador laboral argentino para trabajadores en relación de dependencia.",
  },
  AR_CDI: {
    displayName: "CDI",
    longName: "Clave de Identificación",
    description: "Clave tributaria argentina para personas sin CUIT ni CUIL.",
  },

  // Chile
  CL_RUT: {
    displayName: "RUT/RUN",
    longName: "Rol Único Tributario / Rol Único Nacional",
    description: "Identificador único chileno usado tanto para fines civiles como tributarios.",
  },

  // República Dominicana
  DO_CEDULA: {
    displayName: "Cédula",
    longName: "Cédula de Identidad y Electoral",
    description: "Documento de identidad y electoral para ciudadanos dominicanos.",
  },
  DO_RNC: {
    displayName: "RNC",
    longName: "Registro Nacional de Contribuyentes",
    description: "Identificador tributario dominicano emitido por la DGII.",
  },

  // Guatemala
  GT_DPI: {
    displayName: "DPI",
    longName: "Documento Personal de Identificación",
    description: "Documento personal de identificación para ciudadanos guatemaltecos.",
  },
  GT_NIT: {
    displayName: "NIT",
    longName: "Número de Identificación Tributaria",
    description: "Identificador tributario guatemalteco emitido por la SAT.",
  },

  // Honduras
  HN_DNI: {
    displayName: "DNI",
    longName: "Documento Nacional de Identificación",
    description: "Documento nacional de identificación para ciudadanos hondureños.",
  },
  HN_RTN: {
    displayName: "RTN",
    longName: "Registro Tributario Nacional",
    description: "Identificador tributario hondureño emitido por el SAR.",
  },

  // Costa Rica
  CR_CEDULA_FISICA: {
    displayName: "Cédula Física",
    longName: "Cédula de Identidad",
    description: "Cédula de identidad para personas físicas costarricenses.",
  },
  CR_CEDULA_JURIDICA: {
    displayName: "Cédula Jurídica",
    longName: "Cédula de Persona Jurídica",
    description: "Identificador tributario y de identidad para personas jurídicas en Costa Rica.",
  },
  CR_DIMEX: {
    displayName: "DIMEX",
    longName: "Documento de Identificación Migratoria para Extranjeros",
    description:
      "Documento de identificación migratoria para extranjeros residentes en Costa Rica.",
  },

  // España
  ES_DNI: {
    displayName: "DNI",
    longName: "Documento Nacional de Identidad",
    description: "Documento nacional de identidad para ciudadanos españoles.",
  },
  ES_NIE: {
    displayName: "NIE",
    longName: "Número de Identidad de Extranjero",
    description: "Número de identidad para extranjeros residentes en España.",
  },
  ES_NIF_PJ: {
    displayName: "NIF (Persona Jurídica)",
    longName: "Número de Identificación Fiscal (Persona Jurídica)",
    description:
      "Identificador fiscal español para personas jurídicas, anteriormente conocido como CIF.",
  },
  ES_NUSS: {
    displayName: "NUSS",
    longName: "Número de Seguridad Social",
    description: "Número de afiliación a la Seguridad Social española.",
  },

  // United States
  US_SSN: {
    displayName: "SSN",
    longName: "Número de Seguro Social",
    description: "Número de seguro social estadounidense emitido por la SSA.",
  },
  US_ITIN: {
    displayName: "ITIN",
    longName: "Número de Identificación Personal del Contribuyente",
    description:
      "Identificador tributario estadounidense para personas sin SSN, emitido por el IRS.",
  },
  US_EIN: {
    displayName: "EIN",
    longName: "Número de Identificación del Empleador",
    description: "Identificador tributario estadounidense para empleadores, emitido por el IRS.",
  },

  // v0.4.0 — Bolivia
  BO_CI: {
    displayName: "CI",
    longName: "Cédula de Identidad",
    description:
      "Documento personal emitido por SEGIP, con complemento departamental opcional (LP, CB, SC, etc.).",
  },
  BO_NIT: {
    displayName: "NIT",
    longName: "Número de Identificación Tributaria",
    description:
      "Identificador tributario del SIN; el formato de 13 dígitos sustituye al legado tras la RND 102100000011/2021.",
  },

  // v0.4.0 — Ecuador
  EC_CEDULA: {
    displayName: "Cédula",
    longName: "Cédula de Identidad",
    description:
      "Documento personal de 10 dígitos emitido por el Registro Civil; incluye código de provincia y dígito verificador Luhn.",
  },
  EC_RUC: {
    displayName: "RUC",
    longName: "Registro Único de Contribuyentes",
    description:
      "Identificador tributario del SRI: 13 dígitos con tres ramas de validación (natural, sociedad pública, jurídica privada).",
  },

  // v0.4.0 — Paraguay
  PY_CI: {
    displayName: "CI",
    longName: "Cédula de Identidad",
    description:
      "Documento personal emitido por la Policía Nacional del Paraguay, de 6 a 9 dígitos.",
  },
  PY_RUC: {
    displayName: "RUC",
    longName: "Registro Único de Contribuyentes",
    description: "Identificador tributario de la SET con dígito verificador mod-11 (Ley 125/91).",
  },

  // v0.4.0 — Nicaragua
  NI_CEDULA: {
    displayName: "Cédula",
    longName: "Cédula de Identidad",
    description: "Documento de identidad emitido por el CSE de Nicaragua.",
  },
  NI_RUC: {
    displayName: "RUC",
    longName: "Registro Único de Contribuyentes",
    description: "Identificador tributario emitido por la DGI de Nicaragua.",
  },

  // v0.4.0 — Panamá
  PA_CEDULA: {
    displayName: "Cédula",
    longName: "Cédula de Identidad Personal",
    description: "Documento de identidad emitido por el Tribunal Electoral de Panamá.",
  },
  PA_RUC: {
    displayName: "RUC",
    longName: "Registro Único de Contribuyentes",
    description: "Identificador tributario emitido por la DGI del MEF de Panamá.",
  },

  // v0.4.0 — Uruguay
  UY_CI: {
    displayName: "Cédula",
    longName: "Cédula de Identidad",
    description: "Documento de identidad emitido por la DNIC de Uruguay.",
  },
  UY_RUT: {
    displayName: "RUT",
    longName: "Registro Único Tributario",
    description: "Identificador tributario emitido por la DGI de Uruguay.",
  },

  // v0.4.0 — Canadá
  CA_SIN: {
    displayName: "SIN",
    longName: "Número de Seguro Social (Canadá)",
    description:
      "Número de seguro social canadiense emitido por Service Canada; sirve de identificador personal y tributario ante la CRA.",
  },
  CA_BN: {
    displayName: "BN",
    longName: "Número de Negocio",
    description:
      "Identificador tributario para empresas emitido por la Canada Revenue Agency, con cuentas de programa por impuesto (RT, RP, RC).",
  },

  // v0.4.0 — Portugal
  PT_NIF: {
    displayName: "NIF",
    longName: "Número de Identificación Fiscal",
    description:
      "Identificador fiscal portugués emitido por la Autoridade Tributária; el primer dígito determina el tipo de titular (singular o coletiva).",
  },
  PT_CC: {
    displayName: "Cartão de Cidadão",
    longName: "Cartão de Cidadão",
    description:
      "Documento de identidad portugués emitido por el IRN; sustituye al antiguo Bilhete de Identidade.",
  },

  // v0.4.0 — Venezuela
  VE_CEDULA: {
    displayName: "Cédula",
    longName: "Cédula de Identidad",
    description:
      "Documento de identidad venezolano emitido por SAIME; los prefijos V y E distinguen venezolanos de extranjeros residentes.",
  },
  VE_RIF: {
    displayName: "RIF",
    longName: "Registro de Información Fiscal",
    description:
      "Identificador tributario venezolano emitido por el SENIAT; el prefijo V/E/J/P/G/C indica el tipo de contribuyente.",
  },

  // v0.5.0 — México (IMSS social security)
  MX_NSS: {
    displayName: "NSS",
    longName: "Número de Seguridad Social",
    description: "Número de afiliación al IMSS para trabajadores y derechohabientes en México.",
  },

  // v0.5.0 — Passport family
  SV_PASAPORTE: {
    displayName: "Pasaporte",
    longName: "Pasaporte salvadoreño",
    description: "Documento de viaje internacional emitido por la DGME de El Salvador.",
  },
  MX_PASAPORTE: {
    displayName: "Pasaporte",
    longName: "Pasaporte mexicano",
    description: "Documento de viaje internacional emitido por la SRE de México.",
  },
  BR_PASAPORTE: {
    displayName: "Pasaporte",
    longName: "Pasaporte brasileño",
    description: "Documento de viaje internacional emitido por la Policía Federal de Brasil.",
  },
  PE_PASAPORTE: {
    displayName: "Pasaporte",
    longName: "Pasaporte peruano",
    description:
      "Documento de viaje internacional emitido por la Superintendencia Nacional de Migraciones del Perú.",
  },
  AR_PASAPORTE: {
    displayName: "Pasaporte",
    longName: "Pasaporte argentino",
    description: "Documento de viaje internacional emitido por el RENAPER de Argentina.",
  },
  CL_PASAPORTE: {
    displayName: "Pasaporte",
    longName: "Pasaporte chileno",
    description:
      "Documento de viaje internacional emitido por el Servicio de Registro Civil e Identificación de Chile.",
  },
  DO_PASAPORTE: {
    displayName: "Pasaporte",
    longName: "Pasaporte dominicano",
    description:
      "Documento de viaje internacional emitido por la Dirección General de Pasaportes de la República Dominicana.",
  },
  GT_PASAPORTE: {
    displayName: "Pasaporte",
    longName: "Pasaporte guatemalteco",
    description:
      "Documento de viaje internacional emitido por el Instituto Guatemalteco de Migración (IGM).",
  },
  HN_PASAPORTE: {
    displayName: "Pasaporte",
    longName: "Pasaporte hondureño",
    description:
      "Documento de viaje internacional emitido por el Instituto Nacional de Migración (INM) de Honduras.",
  },
  CR_PASAPORTE: {
    displayName: "Pasaporte",
    longName: "Pasaporte costarricense",
    description: "Documento de viaje internacional emitido por la DGME de Costa Rica.",
  },
  ES_PASAPORTE: {
    displayName: "Pasaporte",
    longName: "Pasaporte español",
    description:
      "Documento de viaje internacional emitido por la Policía Nacional / Ministerio del Interior de España.",
  },
  US_PASAPORTE: {
    displayName: "Pasaporte",
    longName: "Pasaporte estadounidense",
    description:
      "Documento de viaje internacional emitido por el Bureau of Consular Affairs del Departamento de Estado de EE. UU.",
  },
  BO_PASAPORTE: {
    displayName: "Pasaporte",
    longName: "Pasaporte boliviano",
    description: "Documento de viaje internacional emitido por la DIGEMIG de Bolivia.",
  },
  EC_PASAPORTE: {
    displayName: "Pasaporte",
    longName: "Pasaporte ecuatoriano",
    description:
      "Documento de viaje internacional emitido por el Ministerio de Relaciones Exteriores y Movilidad Humana de Ecuador.",
  },
  PY_PASAPORTE: {
    displayName: "Pasaporte",
    longName: "Pasaporte paraguayo",
    description:
      "Documento de viaje internacional emitido por la Dirección Nacional de Migraciones de Paraguay.",
  },
  NI_PASAPORTE: {
    displayName: "Pasaporte",
    longName: "Pasaporte nicaragüense",
    description: "Documento de viaje internacional emitido por la DGME de Nicaragua.",
  },
  PA_PASAPORTE: {
    displayName: "Pasaporte",
    longName: "Pasaporte panameño",
    description:
      "Documento de viaje internacional emitido por el Servicio Nacional de Migración (SNM) de Panamá.",
  },
  UY_PASAPORTE: {
    displayName: "Pasaporte",
    longName: "Pasaporte uruguayo",
    description: "Documento de viaje internacional emitido por la DNIC de Uruguay.",
  },
  CA_PASAPORTE: {
    displayName: "Pasaporte",
    longName: "Pasaporte canadiense",
    description:
      "Documento de viaje internacional emitido por Immigration, Refugees and Citizenship Canada (IRCC).",
  },
  PT_PASAPORTE: {
    displayName: "Pasaporte",
    longName: "Pasaporte portugués",
    description: "Documento de viaje internacional emitido por el IRN de Portugal.",
  },
  VE_PASAPORTE: {
    displayName: "Pasaporte",
    longName: "Pasaporte venezolano",
    description: "Documento de viaje internacional emitido por el SAIME de Venezuela.",
  },
};
