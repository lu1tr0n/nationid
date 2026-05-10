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

  // v0.4.0 — Bolivia
  BO_CI: {
    displayName: "CI",
    longName: "Cédula de Identidade",
    description:
      "Documento pessoal emitido pelo SEGIP, com sufixo departamental opcional de 2 letras (LP, CB, SC, etc.).",
  },
  BO_NIT: {
    displayName: "NIT",
    longName: "Número de Identificação Tributária",
    description:
      "Identificador tributário do SIN; o formato de 13 dígitos substitui o legado após a RND 102100000011/2021.",
  },

  // v0.4.0 — Ecuador
  EC_CEDULA: {
    displayName: "Cédula",
    longName: "Cédula de Identidade",
    description:
      "Documento pessoal de 10 dígitos emitido pelo Registro Civil; inclui código de província e dígito verificador Luhn.",
  },
  EC_RUC: {
    displayName: "RUC",
    longName: "Registro Único de Contribuintes",
    description:
      "Identificador tributário do SRI: 13 dígitos com três ramos de validação (natural, sociedade pública, jurídica privada).",
  },

  // v0.4.0 — Paraguay
  PY_CI: {
    displayName: "CI",
    longName: "Cédula de Identidade",
    description: "Documento pessoal emitido pela Polícia Nacional do Paraguai, de 6 a 9 dígitos.",
  },
  PY_RUC: {
    displayName: "RUC",
    longName: "Registro Único de Contribuintes",
    description: "Identificador tributário da SET com dígito verificador mod-11 (Lei 125/91).",
  },

  // v0.4.0 — Nicaragua
  NI_CEDULA: {
    displayName: "Cédula",
    longName: "Cédula de Identidade",
    description: "Documento de identidade emitido pelo CSE da Nicarágua.",
  },
  NI_RUC: {
    displayName: "RUC",
    longName: "Registro Único de Contribuintes",
    description: "Identificador tributário emitido pela DGI da Nicarágua.",
  },

  // v0.4.0 — Panamá
  PA_CEDULA: {
    displayName: "Cédula",
    longName: "Cédula de Identidade Pessoal",
    description: "Documento de identidade emitido pelo Tribunal Eleitoral do Panamá.",
  },
  PA_RUC: {
    displayName: "RUC",
    longName: "Registro Único de Contribuintes",
    description: "Identificador tributário emitido pela DGI do MEF do Panamá.",
  },

  // v0.4.0 — Uruguay
  UY_CI: {
    displayName: "Cédula",
    longName: "Cédula de Identidade",
    description: "Documento de identidade emitido pela DNIC do Uruguai.",
  },
  UY_RUT: {
    displayName: "RUT",
    longName: "Registro Único Tributário",
    description: "Identificador tributário emitido pela DGI do Uruguai.",
  },

  // v0.4.0 — Canadá
  CA_SIN: {
    displayName: "SIN",
    longName: "Número de Seguro Social (Canadá)",
    description:
      "Número de segurança social canadense emitido pelo Service Canada; serve como identificador pessoal e fiscal junto à CRA.",
  },
  CA_BN: {
    displayName: "BN",
    longName: "Número de Empresa",
    description:
      "Identificador fiscal canadense para empresas emitido pela Canada Revenue Agency, com contas de programa por imposto (RT, RP, RC).",
  },

  // v0.4.0 — Portugal
  PT_NIF: {
    displayName: "NIF",
    longName: "Número de Identificação Fiscal",
    description:
      "Identificador fiscal português emitido pela Autoridade Tributária; o primeiro dígito identifica o tipo de titular (singular ou coletiva).",
  },
  PT_CC: {
    displayName: "Cartão de Cidadão",
    longName: "Cartão de Cidadão",
    description:
      "Documento de identidade português emitido pelo IRN; substitui o antigo Bilhete de Identidade.",
  },

  // v0.4.0 — Venezuela
  VE_CEDULA: {
    displayName: "Cédula",
    longName: "Cédula de Identidade",
    description:
      "Documento de identidade venezuelano emitido pelo SAIME; os prefixos V e E distinguem venezuelanos de estrangeiros residentes.",
  },
  VE_RIF: {
    displayName: "RIF",
    longName: "Registro de Informação Fiscal",
    description:
      "Identificador fiscal venezuelano emitido pelo SENIAT; o prefixo V/E/J/P/G/C indica o tipo de contribuinte.",
  },

  // v0.5.0 — México (IMSS social security)
  MX_NSS: {
    displayName: "NSS",
    longName: "Número de Seguridade Social Mexicano",
    description: "Número de filiação ao IMSS para trabalhadores mexicanos.",
  },

  // v0.5.0 — Passport family
  SV_PASAPORTE: {
    displayName: "Passaporte",
    longName: "Passaporte salvadorenho",
    description: "Documento de viagem internacional emitido pela DGME de El Salvador.",
  },
  MX_PASAPORTE: {
    displayName: "Passaporte",
    longName: "Passaporte mexicano",
    description: "Documento de viagem internacional emitido pela SRE do México.",
  },
  BR_PASAPORTE: {
    displayName: "Passaporte",
    longName: "Passaporte brasileiro",
    description: "Documento de viagem internacional emitido pela Polícia Federal do Brasil.",
  },
  PE_PASAPORTE: {
    displayName: "Passaporte",
    longName: "Passaporte peruano",
    description:
      "Documento de viagem internacional emitido pela Superintendência Nacional de Migrações do Peru.",
  },
  AR_PASAPORTE: {
    displayName: "Passaporte",
    longName: "Passaporte argentino",
    description: "Documento de viagem internacional emitido pelo RENAPER da Argentina.",
  },
  CL_PASAPORTE: {
    displayName: "Passaporte",
    longName: "Passaporte chileno",
    description:
      "Documento de viagem internacional emitido pelo Serviço de Registro Civil e Identificação do Chile.",
  },
  DO_PASAPORTE: {
    displayName: "Passaporte",
    longName: "Passaporte dominicano",
    description:
      "Documento de viagem internacional emitido pela Direção Geral de Passaportes da República Dominicana.",
  },
  GT_PASAPORTE: {
    displayName: "Passaporte",
    longName: "Passaporte guatemalteco",
    description:
      "Documento de viagem internacional emitido pelo Instituto Guatemalteco de Migração (IGM).",
  },
  HN_PASAPORTE: {
    displayName: "Passaporte",
    longName: "Passaporte hondurenho",
    description:
      "Documento de viagem internacional emitido pelo Instituto Nacional de Migração (INM) de Honduras.",
  },
  CR_PASAPORTE: {
    displayName: "Passaporte",
    longName: "Passaporte costarriquenho",
    description: "Documento de viagem internacional emitido pela DGME da Costa Rica.",
  },
  ES_PASAPORTE: {
    displayName: "Passaporte",
    longName: "Passaporte espanhol",
    description:
      "Documento de viagem internacional emitido pela Polícia Nacional / Ministério do Interior da Espanha.",
  },
  US_PASAPORTE: {
    displayName: "Passaporte",
    longName: "Passaporte estadunidense",
    description:
      "Documento de viagem internacional emitido pelo Bureau of Consular Affairs do Departamento de Estado dos EUA.",
  },
  BO_PASAPORTE: {
    displayName: "Passaporte",
    longName: "Passaporte boliviano",
    description: "Documento de viagem internacional emitido pela DIGEMIG da Bolívia.",
  },
  EC_PASAPORTE: {
    displayName: "Passaporte",
    longName: "Passaporte equatoriano",
    description:
      "Documento de viagem internacional emitido pelo Ministério das Relações Exteriores e Mobilidade Humana do Equador.",
  },
  PY_PASAPORTE: {
    displayName: "Passaporte",
    longName: "Passaporte paraguaio",
    description:
      "Documento de viagem internacional emitido pela Direção Nacional de Migrações do Paraguai.",
  },
  NI_PASAPORTE: {
    displayName: "Passaporte",
    longName: "Passaporte nicaraguense",
    description: "Documento de viagem internacional emitido pela DGME da Nicarágua.",
  },
  PA_PASAPORTE: {
    displayName: "Passaporte",
    longName: "Passaporte panamenho",
    description:
      "Documento de viagem internacional emitido pelo Serviço Nacional de Migração (SNM) do Panamá.",
  },
  UY_PASAPORTE: {
    displayName: "Passaporte",
    longName: "Passaporte uruguaio",
    description: "Documento de viagem internacional emitido pela DNIC do Uruguai.",
  },
  CA_PASAPORTE: {
    displayName: "Passaporte",
    longName: "Passaporte canadense",
    description:
      "Documento de viagem internacional emitido pelo Immigration, Refugees and Citizenship Canada (IRCC).",
  },
  PT_PASAPORTE: {
    displayName: "Passaporte",
    longName: "Passaporte português",
    description: "Documento de viagem internacional emitido pelo IRN de Portugal.",
  },
  VE_PASAPORTE: {
    displayName: "Passaporte",
    longName: "Passaporte venezuelano",
    description: "Documento de viagem internacional emitido pelo SAIME da Venezuela.",
  },
};
