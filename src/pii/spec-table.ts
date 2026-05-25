/**
 * Per-code spec table local to the `nationid/pii` subpath.
 *
 * Imports every per-country spec file directly so the `pii` bundle does NOT
 * depend on `src/index.ts` (which executes a REGISTRY-IIFE that pins every
 * country's bundle into the consumer's graph regardless of which codes they
 * use). The table is the union of all known `DocumentTypeCode` entries —
 * `mask`, `lastN`, and `hash` accept any code, so we must enumerate them all.
 *
 * Why this is better than going through `getSpec`:
 *   - The dependency surface stays at the per-country spec FILES, not the root
 *     module. The bundler graph for `pii` no longer reaches `src/index.ts`.
 *   - No registry-building IIFE runs at module load. Each spec is just a
 *     statically-resolvable object literal in its own file.
 *   - When a real-world consumer uses `mask("BR_CPF", ...)`, modern bundlers
 *     can still inline-call `cpfSpec.normalize` and (with enough effort)
 *     prune unused entries from the object literal.
 *
 * Lazy resolution per code is deferred to v1.1 (see audit Blocker 1).
 */

import type { DocumentSpec, DocumentTypeCode } from "../core/types.ts";

import { cdiSpec } from "../countries/ar/cdi.ts";
import { cuilSpec } from "../countries/ar/cuil.ts";
import { cuitSpec } from "../countries/ar/cuit.ts";
import { dniSpec as arDniSpec } from "../countries/ar/dni.ts";
import { passportSpec as arPassportSpec } from "../countries/ar/passport.ts";
// v1.7.0 — EU-VAT complete (16 EU + 1 EEA)
import { uidSpec as atUidSpec } from "../countries/at/uid.ts";
import { btwSpec as beBtwSpec } from "../countries/be/btw.ts";
import { nrnSpec } from "../countries/be/nrn.ts";
import { vatSpec as bgVatSpec } from "../countries/bg/vat.ts";
import { ciSpec as boCiSpec } from "../countries/bo/ci.ts";
import { nitSpec as boNitSpec } from "../countries/bo/nit.ts";
import { passportSpec as boPassportSpec } from "../countries/bo/passport.ts";
import { cnhSpec } from "../countries/br/cnh.ts";
import { cnpjSpec } from "../countries/br/cnpj.ts";
import { cpfSpec } from "../countries/br/cpf.ts";
import { passportSpec as brPassportSpec } from "../countries/br/passport.ts";
import { pisSpec } from "../countries/br/pis.ts";
import { tituloEleitorSpec } from "../countries/br/titulo-eleitor.ts";
import { bnSpec } from "../countries/ca/bn.ts";
import { passportSpec as caPassportSpec } from "../countries/ca/passport.ts";
import { sinSpec } from "../countries/ca/sin.ts";
import { ahvSpec } from "../countries/ch/ahv.ts";
import { mwstSpec } from "../countries/ch/mwst.ts";
import { uidSpec } from "../countries/ch/uid.ts";
import { passportSpec as clPassportSpec } from "../countries/cl/passport.ts";
import { rutSpec as clRutSpec } from "../countries/cl/rut.ts";
import { ccSpec as coCcSpec } from "../countries/co/cc.ts";
import { ceSpec as coCeSpec } from "../countries/co/ce.ts";
import { nitSpec as coNitSpec } from "../countries/co/nit.ts";
import { pasaporteSpec as coPasaporteSpec } from "../countries/co/pasaporte.ts";
import { pepSpec } from "../countries/co/pep.ts";
import { pptSpec } from "../countries/co/ppt.ts";
import { tiSpec } from "../countries/co/ti.ts";
import { cedulaFisicaSpec } from "../countries/cr/cedula-fisica.ts";
import { cedulaJuridicaSpec } from "../countries/cr/cedula-juridica.ts";
import { dimexSpec } from "../countries/cr/dimex.ts";
import { passportSpec as crPassportSpec } from "../countries/cr/passport.ts";
import { vatSpec as cyVatSpec } from "../countries/cy/vat.ts";
import { dicSpec as czDicSpec } from "../countries/cz/dic.ts";
import { steuerIdSpec } from "../countries/de/steuer-id.ts";
import { steuernummerSpec } from "../countries/de/steuernummer.ts";
import { ustidSpec } from "../countries/de/ustid.ts";
import { cprSpec } from "../countries/dk/cpr.ts";
import { cvrSpec } from "../countries/dk/cvr.ts";
import { vatSpec as dkVatSpec } from "../countries/dk/vat.ts";
import { cedulaSpec as doCedulaSpec } from "../countries/do/cedula.ts";
import { passportSpec as doPassportSpec } from "../countries/do/passport.ts";
import { rncSpec } from "../countries/do/rnc.ts";
import { cedulaSpec as ecCedulaSpec } from "../countries/ec/cedula.ts";
import { passportSpec as ecPassportSpec } from "../countries/ec/passport.ts";
import { rucSpec as ecRucSpec } from "../countries/ec/ruc.ts";
import { vatSpec as eeVatSpec } from "../countries/ee/vat.ts";
import { dniSpec as esDniSpec } from "../countries/es/dni.ts";
import { nieSpec } from "../countries/es/nie.ts";
import { nifPjSpec } from "../countries/es/nif-pj.ts";
import { nussSpec } from "../countries/es/nuss.ts";
import { passportSpec as esPassportSpec } from "../countries/es/passport.ts";
import { hetuSpec } from "../countries/fi/hetu.ts";
import { vatSpec as fiVatSpec } from "../countries/fi/vat.ts";
import { ytunnusSpec } from "../countries/fi/ytunnus.ts";
import { nirSpec } from "../countries/fr/nir.ts";
import { sirenSpec } from "../countries/fr/siren.ts";
import { siretSpec } from "../countries/fr/siret.ts";
import { tvaSpec } from "../countries/fr/tva.ts";
import { nhsSpec } from "../countries/gb/nhs.ts";
import { ninoSpec } from "../countries/gb/nino.ts";
import { utrSpec } from "../countries/gb/utr.ts";
import { vatSpec as gbVatSpec } from "../countries/gb/vat.ts";
import { vatSpec as grVatSpec } from "../countries/gr/vat.ts";
import { dpiSpec } from "../countries/gt/dpi.ts";
import { nitSpec as gtNitSpec } from "../countries/gt/nit.ts";
import { passportSpec as gtPassportSpec } from "../countries/gt/passport.ts";
import { dniSpec as hnDniSpec } from "../countries/hn/dni.ts";
import { passportSpec as hnPassportSpec } from "../countries/hn/passport.ts";
import { rtnSpec } from "../countries/hn/rtn.ts";
import { oibSpec as hrOibSpec } from "../countries/hr/oib.ts";
import { vatSpec as huVatSpec } from "../countries/hu/vat.ts";
import { vatSpec as ieVatSpec } from "../countries/ie/vat.ts";
import { aadhaarSpec } from "../countries/in/aadhaar.ts";
import { epicSpec } from "../countries/in/epic.ts";
import { gstinSpec } from "../countries/in/gstin.ts";
import { panSpec } from "../countries/in/pan.ts";
import { vidSpec } from "../countries/in/vid.ts";
import { vskSpec as isVskSpec } from "../countries/is/vsk.ts";
import { cfSpec } from "../countries/it/cf.ts";
import { pivaSpec } from "../countries/it/piva.ts";
import { corporateNumberSpec as jpCorporateNumberSpec } from "../countries/jp/corporate-number.ts";
import { myNumberSpec as jpMyNumberSpec } from "../countries/jp/my-number.ts";
import { vatSpec as ltVatSpec } from "../countries/lt/vat.ts";
import { vatSpec as luVatSpec } from "../countries/lu/vat.ts";
import { vatSpec as lvVatSpec } from "../countries/lv/vat.ts";
import { vatSpec as mtVatSpec } from "../countries/mt/vat.ts";
import { claveElectorSpec } from "../countries/mx/clave-elector.ts";
import { curpSpec } from "../countries/mx/curp.ts";
import { nssSpec } from "../countries/mx/nss.ts";
import { passportSpec as mxPassportSpec } from "../countries/mx/passport.ts";
import { rfcPfSpec } from "../countries/mx/rfc-pf.ts";
import { rfcPmSpec } from "../countries/mx/rfc-pm.ts";
import { cedulaSpec as niCedulaSpec } from "../countries/ni/cedula.ts";
import { passportSpec as niPassportSpec } from "../countries/ni/passport.ts";
import { rucSpec as niRucSpec } from "../countries/ni/ruc.ts";
import { bsnSpec } from "../countries/nl/bsn.ts";
import { btwSpec as nlBtwSpec } from "../countries/nl/btw.ts";
import { dnrSpec } from "../countries/no/dnr.ts";
import { fnrSpec } from "../countries/no/fnr.ts";
import { mvaSpec } from "../countries/no/mva.ts";
import { orgnrSpec as noOrgnrSpec } from "../countries/no/orgnr.ts";
import { cedulaSpec as paCedulaSpec } from "../countries/pa/cedula.ts";
import { passportSpec as paPassportSpec } from "../countries/pa/passport.ts";
import { rucSpec as paRucSpec } from "../countries/pa/ruc.ts";
import { ceSpec as peCeSpec } from "../countries/pe/ce.ts";
import { dniSpec as peDniSpec } from "../countries/pe/dni.ts";
import { passportSpec as pePassportSpec } from "../countries/pe/passport.ts";
import { rucSpec as peRucSpec } from "../countries/pe/ruc.ts";
import { nipSpec } from "../countries/pl/nip.ts";
import { peselSpec } from "../countries/pl/pesel.ts";
import { regonSpec } from "../countries/pl/regon.ts";
import { ccSpec as ptCcSpec } from "../countries/pt/cc.ts";
import { nifSpec } from "../countries/pt/nif.ts";
import { passportSpec as ptPassportSpec } from "../countries/pt/passport.ts";
import { ciSpec as pyCiSpec } from "../countries/py/ci.ts";
import { passportSpec as pyPassportSpec } from "../countries/py/passport.ts";
import { rucSpec as pyRucSpec } from "../countries/py/ruc.ts";
import { vatSpec as roVatSpec } from "../countries/ro/vat.ts";
import { orgnrSpec as seOrgnrSpec } from "../countries/se/orgnr.ts";
import { personnummerSpec } from "../countries/se/personnummer.ts";
import { vatSpec as seVatSpec } from "../countries/se/vat.ts";
import { vatSpec as siVatSpec } from "../countries/si/vat.ts";
import { vatSpec as skVatSpec } from "../countries/sk/vat.ts";
import { duiSpec } from "../countries/sv/dui.ts";
import { nitSpec as svNitSpec } from "../countries/sv/nit.ts";
import { passportSpec as svPassportSpec } from "../countries/sv/passport.ts";
import { einSpec } from "../countries/us/ein.ts";
import { itinSpec } from "../countries/us/itin.ts";
import { passportSpec as usPassportSpec } from "../countries/us/passport.ts";
import { ssnSpec } from "../countries/us/ssn.ts";
import { ciSpec as uyCiSpec } from "../countries/uy/ci.ts";
import { passportSpec as uyPassportSpec } from "../countries/uy/passport.ts";
import { rutSpec as uyRutSpec } from "../countries/uy/rut.ts";
import { cedulaSpec as veCedulaSpec } from "../countries/ve/cedula.ts";
import { passportSpec as vePassportSpec } from "../countries/ve/passport.ts";
import { rifSpec } from "../countries/ve/rif.ts";

/**
 * Full registry of `DocumentTypeCode` → spec, built without depending on
 * `src/index.ts`. Used by `mask`, `lastN`, and `hash` for normalization.
 *
 * The literal object form (rather than an IIFE-built `Map`) preserves the
 * structural references bundlers need to know which specs are reachable from
 * each call site.
 */
export const PII_SPEC_TABLE: Record<DocumentTypeCode, DocumentSpec> = {
  // El Salvador
  SV_DUI: duiSpec,
  SV_NIT: svNitSpec,
  SV_PASAPORTE: svPassportSpec,
  // México
  MX_CURP: curpSpec,
  MX_RFC_PF: rfcPfSpec,
  MX_RFC_PM: rfcPmSpec,
  MX_CLAVE_ELECTOR: claveElectorSpec,
  MX_NSS: nssSpec,
  MX_PASAPORTE: mxPassportSpec,
  // Colombia
  CO_CC: coCcSpec,
  CO_CE: coCeSpec,
  CO_TI: tiSpec,
  CO_PASAPORTE: coPasaporteSpec,
  CO_NIT: coNitSpec,
  CO_PEP: pepSpec,
  CO_PPT: pptSpec,
  // Brasil
  BR_CPF: cpfSpec,
  BR_CNPJ: cnpjSpec,
  BR_CNH: cnhSpec,
  BR_TITULO_ELEITOR: tituloEleitorSpec,
  BR_PIS: pisSpec,
  BR_PASAPORTE: brPassportSpec,
  // Perú
  PE_DNI: peDniSpec,
  PE_CE: peCeSpec,
  PE_RUC: peRucSpec,
  PE_PASAPORTE: pePassportSpec,
  // Argentina
  AR_DNI: arDniSpec,
  AR_CUIL: cuilSpec,
  AR_CUIT: cuitSpec,
  AR_CDI: cdiSpec,
  AR_PASAPORTE: arPassportSpec,
  // Chile
  CL_RUT: clRutSpec,
  CL_PASAPORTE: clPassportSpec,
  // República Dominicana
  DO_CEDULA: doCedulaSpec,
  DO_RNC: rncSpec,
  DO_PASAPORTE: doPassportSpec,
  // Guatemala
  GT_DPI: dpiSpec,
  GT_NIT: gtNitSpec,
  GT_PASAPORTE: gtPassportSpec,
  // Honduras
  HN_DNI: hnDniSpec,
  HN_RTN: rtnSpec,
  HN_PASAPORTE: hnPassportSpec,
  // Costa Rica
  CR_CEDULA_FISICA: cedulaFisicaSpec,
  CR_DIMEX: dimexSpec,
  CR_CEDULA_JURIDICA: cedulaJuridicaSpec,
  CR_PASAPORTE: crPassportSpec,
  // España
  ES_DNI: esDniSpec,
  ES_NIE: nieSpec,
  ES_NIF_PJ: nifPjSpec,
  ES_NUSS: nussSpec,
  ES_PASAPORTE: esPassportSpec,
  // Estados Unidos
  US_SSN: ssnSpec,
  US_ITIN: itinSpec,
  US_EIN: einSpec,
  US_PASAPORTE: usPassportSpec,
  // Bolivia
  BO_CI: boCiSpec,
  BO_NIT: boNitSpec,
  BO_PASAPORTE: boPassportSpec,
  // Ecuador
  EC_CEDULA: ecCedulaSpec,
  EC_RUC: ecRucSpec,
  EC_PASAPORTE: ecPassportSpec,
  // Paraguay
  PY_CI: pyCiSpec,
  PY_RUC: pyRucSpec,
  PY_PASAPORTE: pyPassportSpec,
  // Nicaragua
  NI_CEDULA: niCedulaSpec,
  NI_RUC: niRucSpec,
  NI_PASAPORTE: niPassportSpec,
  // Panamá
  PA_CEDULA: paCedulaSpec,
  PA_RUC: paRucSpec,
  PA_PASAPORTE: paPassportSpec,
  // Uruguay
  UY_CI: uyCiSpec,
  UY_RUT: uyRutSpec,
  UY_PASAPORTE: uyPassportSpec,
  // Canadá
  CA_SIN: sinSpec,
  CA_BN: bnSpec,
  CA_PASAPORTE: caPassportSpec,
  // Portugal
  PT_NIF: nifSpec,
  PT_CC: ptCcSpec,
  PT_PASAPORTE: ptPassportSpec,
  // Venezuela
  VE_CEDULA: veCedulaSpec,
  VE_RIF: rifSpec,
  VE_PASAPORTE: vePassportSpec,
  // Reino Unido
  GB_NINO: ninoSpec,
  GB_UTR: utrSpec,
  GB_VAT: gbVatSpec,
  GB_NHS: nhsSpec,
  // Francia
  FR_NIR: nirSpec,
  FR_SIREN: sirenSpec,
  FR_SIRET: siretSpec,
  FR_TVA: tvaSpec,
  // Alemania
  DE_STEUER_ID: steuerIdSpec,
  DE_STEUERNUMMER: steuernummerSpec,
  DE_USTID: ustidSpec,
  // Italia
  IT_CF: cfSpec,
  IT_PIVA: pivaSpec,
  // Países Bajos
  NL_BSN: bsnSpec,
  NL_BTW: nlBtwSpec,
  // Bélgica
  BE_NRN: nrnSpec,
  BE_BTW: beBtwSpec,
  // Suiza
  CH_AHV: ahvSpec,
  CH_UID: uidSpec,
  CH_MWST: mwstSpec,
  // Polonia
  PL_PESEL: peselSpec,
  PL_NIP: nipSpec,
  PL_REGON: regonSpec,
  // Suecia
  SE_PERSONNUMMER: personnummerSpec,
  SE_ORGNR: seOrgnrSpec,
  SE_VAT: seVatSpec,
  // Noruega
  NO_FNR: fnrSpec,
  NO_DNR: dnrSpec,
  NO_ORGNR: noOrgnrSpec,
  NO_MVA: mvaSpec,
  // Dinamarca
  DK_CPR: cprSpec,
  DK_CVR: cvrSpec,
  DK_VAT: dkVatSpec,
  // Finlandia
  FI_HETU: hetuSpec,
  FI_YTUNNUS: ytunnusSpec,
  FI_VAT: fiVatSpec,
  IN_AADHAAR: aadhaarSpec,
  IN_PAN: panSpec,
  IN_GSTIN: gstinSpec,
  IN_EPIC: epicSpec,
  IN_VID: vidSpec,
  JP_MY_NUMBER: jpMyNumberSpec,
  JP_CORPORATE_NUMBER: jpCorporateNumberSpec,
  // v1.7.0 — EU-VAT complete
  IE_VAT: ieVatSpec,
  AT_UID: atUidSpec,
  LU_VAT: luVatSpec,
  GR_VAT: grVatSpec,
  CZ_DIC: czDicSpec,
  HU_VAT: huVatSpec,
  RO_VAT: roVatSpec,
  BG_VAT: bgVatSpec,
  HR_OIB: hrOibSpec,
  SK_VAT: skVatSpec,
  SI_VAT: siVatSpec,
  LT_VAT: ltVatSpec,
  LV_VAT: lvVatSpec,
  EE_VAT: eeVatSpec,
  MT_VAT: mtVatSpec,
  CY_VAT: cyVatSpec,
  IS_VSK: isVskSpec,
};

/**
 * Lookup a spec by code without depending on the root registry. Returns
 * `undefined` (not throws) so consumer fallback code paths can decide how to
 * handle unknown codes — matching the existing `mask()` soft-fallback policy.
 */
export function getPiiSpec(code: DocumentTypeCode): DocumentSpec | undefined {
  // Cast through `Record<string, ...>` to avoid an exhaustive-check warning
  // when `code` is widened beyond the `DocumentTypeCode` union at runtime.
  return (PII_SPEC_TABLE as Record<string, DocumentSpec | undefined>)[code];
}
