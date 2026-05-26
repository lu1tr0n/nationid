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

  // v0.6.0 — United Kingdom
  GB_NINO: {
    displayName: "NINO",
    longName: "Número de Seguro Nacional del Reino Unido",
    description:
      "Identificador permanente del sistema de seguridad social británico, emitido por HMRC.",
  },
  GB_UTR: {
    displayName: "UTR",
    longName: "Referencia Única del Contribuyente",
    description: "Número de 10 dígitos asignado por HMRC para Self Assessment y Corporation Tax.",
  },
  GB_VAT: {
    displayName: "VAT",
    longName: "Número de IVA del Reino Unido",
    description:
      "Identificador de IVA emitido por HMRC, formato GB + 9 dígitos (o 12 con sucursal).",
  },
  GB_NHS: {
    displayName: "NHS Number",
    longName: "Número del Servicio Nacional de Salud",
    description: "Identificador sanitario de 10 dígitos para Inglaterra y Gales.",
  },

  // v0.6.0 — France
  FR_NIR: {
    displayName: "NIR",
    longName: "Número de la Seguridad Social francés",
    description:
      "Identificador permanente del INSEE que codifica sexo, fecha y lugar de nacimiento.",
  },
  FR_SIREN: {
    displayName: "SIREN",
    longName: "Identificador de Empresa francesa",
    description: "Número de 9 dígitos del INSEE que identifica a la persona jurídica.",
  },
  FR_SIRET: {
    displayName: "SIRET",
    longName: "Identificador de Establecimiento francés",
    description:
      "Número de 14 dígitos: SIREN (9) + NIC (5) que identifica un establecimiento concreto.",
  },
  FR_TVA: {
    displayName: "TVA",
    longName: "Número de IVA Intracomunitario francés",
    description: "Identificador VIES con clave derivada del SIREN.",
  },

  // v0.6.0 — Germany
  DE_STEUER_ID: {
    displayName: "IdNr",
    longName: "Número de Identificación Fiscal Personal alemán",
    description:
      "Identificador fiscal vitalicio de 11 dígitos emitido por el Bundeszentralamt für Steuern.",
  },
  DE_STEUERNUMMER: {
    displayName: "Steuernummer",
    longName: "Número Fiscal alemán por Bundesland",
    description: "Número fiscal emitido por la oficina del Land; el formato varía entre estados.",
  },
  DE_USTID: {
    displayName: "USt-IdNr",
    longName: "Número de Identificación de IVA alemán",
    description: "Identificador de IVA intracomunitario, formato DE + 9 dígitos.",
  },

  // v0.6.0 — Italy
  IT_CF: {
    displayName: "Codice Fiscale",
    longName: "Código Fiscal italiano",
    description:
      "Identificador alfanumérico de 16 caracteres derivado de nombre, fecha de nacimiento y comune.",
  },
  IT_PIVA: {
    displayName: "Partita IVA",
    longName: "Número de IVA italiano",
    description:
      "Identificador de 11 dígitos de la Agenzia delle Entrate; coincide con el CF de personas jurídicas.",
  },

  // v0.6.0 — Netherlands
  NL_BSN: {
    displayName: "BSN",
    longName: "Número de Servicio al Ciudadano",
    description: "Identificador personal único emitido por el gobierno de los Países Bajos.",
  },
  NL_BTW: {
    displayName: "BTW-id",
    longName: "Número de IVA neerlandés",
    description:
      "Identificador de IVA emitido por la Belastingdienst, formato NL + 9 dígitos + B + 2 dígitos.",
  },

  // v0.6.0 — Belgium
  BE_NRN: {
    displayName: "NRN",
    longName: "Número de Registro Nacional belga",
    description:
      "Identificador personal emitido por el Registro Nacional; codifica fecha de nacimiento y sexo.",
  },
  BE_BTW: {
    displayName: "BTW",
    longName: "Número de Empresa / IVA belga",
    description:
      "Identificador unificado de empresa e IVA, formato BE0 + 9 dígitos con verificación mod-97.",
  },

  // v0.6.0 — Switzerland
  CH_AHV: {
    displayName: "AHV",
    longName: "Número de Seguridad Social suizo",
    description:
      "Identificador permanente del sistema AHV/AVS, formato 756.xxxx.xxxx.xx con dígito EAN-13.",
  },
  CH_UID: {
    displayName: "UID",
    longName: "Identificador de Empresa suizo",
    description:
      "Número único de empresa emitido por la Confederación, formato CHE-xxx.xxx.xxx con mod-11.",
  },
  CH_MWST: {
    displayName: "MWST",
    longName: "Registro de IVA suizo",
    description: "UID + sufijo MWST/TVA/IVA según el idioma cantonal del contribuyente.",
  },

  // v0.6.0 — Poland
  PL_PESEL: {
    displayName: "PESEL",
    longName: "Número de Identificación Personal polaco",
    description:
      "Identificador personal de 11 dígitos que codifica fecha de nacimiento, sexo y dígito de control.",
  },
  PL_NIP: {
    displayName: "NIP",
    longName: "Número de Identificación Fiscal polaco",
    description: "Identificador tributario de 10 dígitos con verificación mod-11.",
  },
  PL_REGON: {
    displayName: "REGON",
    longName: "Número del Registro Estadístico polaco",
    description: "Identificador estadístico de 9 o 14 dígitos emitido por la GUS.",
  },

  // v0.6.0 — Sweden
  SE_PERSONNUMMER: {
    displayName: "Personnummer",
    longName: "Número Personal sueco",
    description:
      "Identificador personal de 10 o 12 dígitos con verificación Luhn; codifica fecha de nacimiento.",
  },
  SE_ORGNR: {
    displayName: "Organisationsnummer",
    longName: "Número de Organización sueco",
    description: "Identificador de persona jurídica de 10 dígitos con verificación Luhn.",
  },
  SE_VAT: {
    displayName: "Moms",
    longName: "Número de IVA sueco",
    description: "Formato SE + organisationsnummer + 01.",
  },

  // v0.6.0 — Norway
  NO_FNR: {
    displayName: "Fødselsnummer",
    longName: "Número de Identidad noruego",
    description: "Identificador personal de 11 dígitos con doble verificación mod-11.",
  },
  NO_DNR: {
    displayName: "D-nummer",
    longName: "D-nummer (Noruega)",
    description:
      "Identificador para residentes extranjeros; mismo formato que FNR pero con día desplazado +40.",
  },
  NO_ORGNR: {
    displayName: "Organisasjonsnummer",
    longName: "Número de Organización noruego",
    description: "Identificador de persona jurídica de 9 dígitos con verificación mod-11.",
  },
  NO_MVA: {
    displayName: "MVA",
    longName: "Número de IVA noruego",
    description: "Formato NO + organisasjonsnummer + MVA.",
  },

  // v0.6.0 — Denmark
  DK_CPR: {
    displayName: "CPR",
    longName: "Número Personal danés",
    description:
      "Identificador personal de 10 dígitos con fecha de nacimiento; verificación mod-11 abolida en 2007.",
  },
  DK_CVR: {
    displayName: "CVR",
    longName: "Número de Empresa danés",
    description:
      "Identificador de empresa de 8 dígitos emitido por Erhvervsstyrelsen, con verificación mod-11.",
  },
  DK_VAT: {
    displayName: "Moms",
    longName: "Número de IVA danés",
    description: "Formato DK + CVR.",
  },

  // v0.6.0 — Finland
  FI_HETU: {
    displayName: "HETU",
    longName: "Número Personal finlandés",
    description:
      "Identificador personal con fecha de nacimiento, separador de siglo y dígito de control mod-31.",
  },
  FI_YTUNNUS: {
    displayName: "Y-tunnus",
    longName: "Identificador de Empresa finlandés",
    description: "Identificador de empresa de 7+1 dígitos con verificación mod-11.",
  },
  FI_VAT: {
    displayName: "ALV",
    longName: "Número de IVA finlandés",
    description: "Formato FI + Y-tunnus sin guion.",
  },
  IN_AADHAAR: {
    displayName: "Aadhaar",
    longName: "Número Aadhaar",
    description:
      "Identificador único de 12 dígitos emitido por UIDAI con dígito verificador Verhoeff.",
  },
  IN_PAN: {
    displayName: "PAN",
    longName: "Permanent Account Number",
    description:
      "Identificador tributario alfanumérico de 10 caracteres emitido por el Departamento de Impuestos.",
  },
  IN_GSTIN: {
    displayName: "GSTIN",
    longName: "Número de identificación del impuesto a bienes y servicios",
    description:
      "Registro tributario de 15 caracteres por estado, embebe PAN y dígito verificador Luhn mod-36.",
  },
  IN_EPIC: {
    displayName: "Voter ID",
    longName: "Tarjeta de identidad electoral",
    description:
      "Identificador de elector de 10 caracteres emitido por la Comisión Electoral de India.",
  },
  IN_VID: {
    displayName: "VID",
    longName: "Virtual ID",
    description: "Alias Aadhaar revocable de 16 dígitos emitido por UIDAI, mismo esquema Verhoeff.",
  },

  // v2.1.0 — Japón
  JP_MY_NUMBER: {
    displayName: "My Number",
    longName: "Número Individual (個人番号)",
    description:
      "Identificador personal de 12 dígitos asignado a cada residente de Japón; dígito de control mod-11 ponderado según la Ordenanza Ministerial 85 (MIC, 2014).",
  },
  JP_CORPORATE_NUMBER: {
    displayName: "Corporate Number",
    longName: "Número Corporativo (法人番号)",
    description:
      "Identificador de 13 dígitos para entidades jurídicas emitido por la Agencia Tributaria de Japón; dígito de control mod-9 ponderado en la posición más a la izquierda.",
  },

  // v2.0.0 — EU-VAT completo
  IE_VAT: {
    displayName: "VAT",
    longName: "Número de IVA irlandés",
    description:
      "Registro de IVA de 8 o 9 caracteres emitido por Revenue Commissioners; dígito de control mod-23 alfabético.",
  },
  AT_UID: {
    displayName: "UID",
    longName: "Umsatzsteuer-Identifikationsnummer",
    description:
      "ATU + 8 dígitos. Identificación de IVA austriaca emitida por el BMF; dígito de control mod-10 ponderado.",
  },
  LU_VAT: {
    displayName: "TVA",
    longName: "Número de identificación de IVA luxemburgués",
    description: "Número de IVA de 8 dígitos emitido por la AED; control derivado de body6 mod 89.",
  },
  GR_VAT: {
    displayName: "ΑΦΜ",
    longName: "Número de IVA griego (ΑΦΜ)",
    description: "Número fiscal/IVA griego de 9 dígitos emitido por la AADE; prefijo VIES EL.",
  },
  CZ_DIC: {
    displayName: "DIČ",
    longName: "Número de identificación fiscal checo",
    description:
      "Número de IVA checo de 8 dígitos para personas jurídicas; control mod-11 ponderado.",
  },
  HU_VAT: {
    displayName: "ÁFA",
    longName: "Número fiscal comunitario húngaro",
    description: "Número de IVA húngaro de 8 dígitos emitido por NAV; control mod-10 ponderado.",
  },
  RO_VAT: {
    displayName: "CUI",
    longName: "Código Único de Registro rumano",
    description:
      "Número fiscal/IVA rumano de 2 a 10 dígitos emitido por ANAF; control mod-11 ponderado.",
  },
  BG_VAT: {
    displayName: "ДДС",
    longName: "Número de IVA búlgaro (persona jurídica)",
    description:
      "Número de IVA búlgaro de 9 dígitos para personas jurídicas emitido por NRA; mod-11 con pesos de respaldo.",
  },
  HR_OIB: {
    displayName: "OIB",
    longName: "Número de identificación personal croata",
    description:
      "Identificador personal/fiscal croata de 11 dígitos emitido por Porezna uprava; ISO/IEC 7064 MOD 11,10.",
  },
  SK_VAT: {
    displayName: "IČ DPH",
    longName: "IČ DPH (IVA eslovaco)",
    description:
      "Número de IVA eslovaco de 10 dígitos emitido por Finančná správa; divisibilidad por 11.",
  },
  SI_VAT: {
    displayName: "DDV",
    longName: "Número de identificación de IVA esloveno",
    description: "Número de IVA esloveno de 8 dígitos emitido por FURS; control mod-11 ponderado.",
  },
  LT_VAT: {
    displayName: "PVM",
    longName: "Código de contribuyente de IVA lituano",
    description:
      "Número de IVA lituano de 9 o 12 dígitos emitido por VMI; mod-11 con pesos alternativos.",
  },
  LV_VAT: {
    displayName: "PVN",
    longName: "Registro PVN letón",
    description:
      "Número de IVA letón de 11 dígitos emitido por VID; rama de persona jurídica con mod-11 ponderado.",
  },
  EE_VAT: {
    displayName: "KMKR",
    longName: "Número de IVA estonio",
    description: "Número de IVA estonio de 9 dígitos emitido por MTA; control mod-10 ponderado.",
  },
  MT_VAT: {
    displayName: "IVA",
    longName: "Registro de IVA de Malta",
    description: "Número de IVA maltés de 8 dígitos emitido por CFR; control mod-37 ponderado.",
  },
  CY_VAT: {
    displayName: "ΦΠΑ",
    longName: "Número de IVA chipriota",
    description: "8 dígitos + 1 letra de control; tabla de traducción posicional mod 26.",
  },
  IS_VSK: {
    displayName: "VSK",
    longName: "Número de IVA islandés",
    description:
      "Número de IVA islandés de 5 o 6 dígitos emitido por RSK; validación solo de formato (sin checksum).",
  },
};
