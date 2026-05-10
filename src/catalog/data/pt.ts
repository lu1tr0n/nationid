/**
 * Portuguese (pt) catalog strings.
 *
 * For Brazilian specs the displayName matches the official acronym. For
 * non-Brazilian specs the displayName mirrors the local acronym while the
 * longName/description are translated to Portuguese.
 */

import type { DocumentTypeCode } from "../../core/types.ts";
import type { LocaleStrings } from "../types.ts";

export const catalogPt: Record<DocumentTypeCode, LocaleStrings> = {
  // El Salvador
  SV_DUI: {
    displayName: "DUI",
    longName: "Documento Único de Identidade (El Salvador)",
    description: "Documento de identidade pessoal para residentes em El Salvador.",
  },
  SV_NIT: {
    displayName: "NIT",
    longName: "Número de Identificação Tributária (El Salvador)",
    description: "Identificador tributário salvadorenho emitido pelo Ministério da Fazenda.",
  },

  // México
  MX_CURP: {
    displayName: "CURP",
    longName: "Chave Única de Registro Populacional (México)",
    description: "Identificador pessoal único para residentes mexicanos.",
  },
  MX_RFC_PF: {
    displayName: "RFC (Pessoa Física)",
    longName: "Registro Federal de Contribuintes (Pessoa Física)",
    description: "Cadastro tributário mexicano para pessoas físicas, emitido pelo SAT.",
  },
  MX_RFC_PM: {
    displayName: "RFC (Pessoa Jurídica)",
    longName: "Registro Federal de Contribuintes (Pessoa Jurídica)",
    description: "Cadastro tributário mexicano para pessoas jurídicas, emitido pelo SAT.",
  },
  MX_CLAVE_ELECTOR: {
    displayName: "Clave de Elector",
    longName: "Chave de Eleitor (INE) — México",
    description: "Chave eleitoral impressa na credencial INE/IFE de eleitores mexicanos.",
  },

  // Colombia
  CO_CC: {
    displayName: "Cédula de Ciudadanía",
    longName: "Cédula de Cidadania (Colômbia)",
    description: "Documento de identidade para cidadãos colombianos maiores de idade.",
  },
  CO_CE: {
    displayName: "Cédula de Extranjería",
    longName: "Cédula de Estrangeiro (Colômbia)",
    description: "Documento de identidade para estrangeiros residentes na Colômbia.",
  },
  CO_TI: {
    displayName: "Tarjeta de Identidad",
    longName: "Cartão de Identidade para Menores (Colômbia)",
    description: "Documento de identidade colombiano para menores entre 7 e 17 anos.",
  },
  CO_PASAPORTE: {
    displayName: "Pasaporte",
    longName: "Passaporte Colombiano",
    description: "Documento de viagem internacional emitido pela Chancelaria da Colômbia.",
  },
  CO_NIT: {
    displayName: "NIT",
    longName: "Número de Identificação Tributária (Colômbia)",
    description: "Identificador tributário colombiano emitido pela DIAN.",
  },
  CO_PEP: {
    displayName: "PEP",
    longName: "Permissão Especial de Permanência (Colômbia)",
    description: "Permissão migratória colombiana emitida a migrantes venezuelanos.",
  },
  CO_PPT: {
    displayName: "PPT",
    longName: "Permissão por Proteção Temporária (Colômbia)",
    description: "Permissão migratória colombiana para migrantes sob proteção temporária.",
  },

  // Brasil
  BR_CPF: {
    displayName: "CPF",
    longName: "Cadastro de Pessoas Físicas",
    description: "Cadastro tributário brasileiro para pessoas físicas.",
  },
  BR_CNPJ: {
    displayName: "CNPJ",
    longName: "Cadastro Nacional da Pessoa Jurídica",
    description: "Cadastro tributário brasileiro para pessoas jurídicas.",
  },
  BR_CNH: {
    displayName: "CNH",
    longName: "Carteira Nacional de Habilitação",
    description: "Carteira de habilitação emitida pelos DETRAN estaduais brasileiros.",
  },
  BR_TITULO_ELEITOR: {
    displayName: "Título de Eleitor",
    longName: "Título de Eleitor",
    description: "Documento eleitoral brasileiro emitido pela Justiça Eleitoral.",
  },
  BR_PIS: {
    displayName: "PIS",
    longName: "Programa de Integração Social",
    description: "Número da seguridade social brasileira utilizado pela Caixa Econômica Federal.",
  },

  // Perú
  PE_DNI: {
    displayName: "DNI",
    longName: "Documento Nacional de Identidade (Peru)",
    description: "Documento nacional de identidade para cidadãos peruanos, emitido pelo RENIEC.",
  },
  PE_RUC: {
    displayName: "RUC",
    longName: "Cadastro Único de Contribuintes (Peru)",
    description: "Cadastro tributário peruano emitido pela SUNAT.",
  },
  PE_CE: {
    displayName: "Carné de Extranjería",
    longName: "Carteira de Estrangeiro (Peru)",
    description: "Documento de identidade para estrangeiros residentes no Peru.",
  },

  // Argentina
  AR_DNI: {
    displayName: "DNI",
    longName: "Documento Nacional de Identidade (Argentina)",
    description: "Documento nacional de identidade para cidadãos argentinos.",
  },
  AR_CUIT: {
    displayName: "CUIT",
    longName: "Chave Única de Identificação Tributária (Argentina)",
    description: "Identificador tributário argentino emitido pela AFIP.",
  },
  AR_CUIL: {
    displayName: "CUIL",
    longName: "Código Único de Identificação Trabalhista (Argentina)",
    description: "Identificador trabalhista argentino para empregados em relação de dependência.",
  },
  AR_CDI: {
    displayName: "CDI",
    longName: "Chave de Identificação (Argentina)",
    description: "Identificador tributário argentino para pessoas sem CUIT nem CUIL.",
  },

  // Chile
  CL_RUT: {
    displayName: "RUT/RUN",
    longName: "Rol Único Tributário / Rol Único Nacional (Chile)",
    description: "Identificador único chileno utilizado tanto para fins civis quanto tributários.",
  },

  // República Dominicana
  DO_CEDULA: {
    displayName: "Cédula",
    longName: "Cédula de Identidade e Eleitoral (República Dominicana)",
    description: "Documento de identidade e eleitoral para cidadãos dominicanos.",
  },
  DO_RNC: {
    displayName: "RNC",
    longName: "Cadastro Nacional de Contribuintes (República Dominicana)",
    description: "Identificador tributário dominicano emitido pela DGII.",
  },

  // Guatemala
  GT_DPI: {
    displayName: "DPI",
    longName: "Documento Pessoal de Identificação (Guatemala)",
    description: "Documento pessoal de identificação para cidadãos guatemaltecos.",
  },
  GT_NIT: {
    displayName: "NIT",
    longName: "Número de Identificação Tributária (Guatemala)",
    description: "Identificador tributário guatemalteco emitido pela SAT.",
  },

  // Honduras
  HN_DNI: {
    displayName: "DNI",
    longName: "Documento Nacional de Identificação (Honduras)",
    description: "Documento nacional de identificação para cidadãos hondurenhos.",
  },
  HN_RTN: {
    displayName: "RTN",
    longName: "Cadastro Tributário Nacional (Honduras)",
    description: "Identificador tributário hondurenho emitido pelo SAR.",
  },

  // Costa Rica
  CR_CEDULA_FISICA: {
    displayName: "Cédula Física",
    longName: "Cédula de Identidade (Costa Rica)",
    description: "Cédula de identidade para pessoas físicas costa-riquenhas.",
  },
  CR_CEDULA_JURIDICA: {
    displayName: "Cédula Jurídica",
    longName: "Cédula de Pessoa Jurídica (Costa Rica)",
    description: "Identificador tributário e de identidade para pessoas jurídicas na Costa Rica.",
  },
  CR_DIMEX: {
    displayName: "DIMEX",
    longName: "Documento de Identificação Migratória para Estrangeiros (Costa Rica)",
    description:
      "Documento de identificação migratória para estrangeiros residentes na Costa Rica.",
  },

  // España
  ES_DNI: {
    displayName: "DNI",
    longName: "Documento Nacional de Identidade (Espanha)",
    description: "Documento nacional de identidade para cidadãos espanhóis.",
  },
  ES_NIE: {
    displayName: "NIE",
    longName: "Número de Identidade de Estrangeiro (Espanha)",
    description: "Número de identidade para estrangeiros residentes na Espanha.",
  },
  ES_NIF_PJ: {
    displayName: "NIF (Pessoa Jurídica)",
    longName: "Número de Identificação Fiscal (Pessoa Jurídica) — Espanha",
    description:
      "Identificador fiscal espanhol para pessoas jurídicas, antigamente conhecido como CIF.",
  },
  ES_NUSS: {
    displayName: "NUSS",
    longName: "Número da Segurança Social (Espanha)",
    description: "Número de afiliação à Segurança Social espanhola.",
  },

  // United States
  US_SSN: {
    displayName: "SSN",
    longName: "Número de Seguridade Social (Estados Unidos)",
    description: "Número de seguridade social estadunidense emitido pela SSA.",
  },
  US_ITIN: {
    displayName: "ITIN",
    longName: "Número de Identificação Pessoal do Contribuinte (Estados Unidos)",
    description: "Identificador tributário estadunidense para pessoas sem SSN, emitido pelo IRS.",
  },
  US_EIN: {
    displayName: "EIN",
    longName: "Número de Identificação do Empregador (Estados Unidos)",
    description: "Identificador tributário estadunidense para empregadores, emitido pelo IRS.",
  },
};
