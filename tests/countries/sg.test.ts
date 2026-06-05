/**
 * Singapore specs (SG_NRIC, SG_FIN, SG_UEN) tests.
 *
 * Vectors hand-computed / extracted per docs/research/v2.2-source-of-truth/sg.md.
 * NRIC/FIN constants are corroborated by SAP KBA #2572734 and the
 * samliew/IonBazan/Jqnxyz reference implementations. UEN constants are verbatim
 * from python-stdnum/stdnum/sg/uen.py; the four doctest fixtures (00192200M,
 * 197401143C, S16FC0121D, T01FC6132D) anchor the suite, alongside the
 * real-world Cat B UENs 196800306E (DBS) and 199201624D (Singtel).
 *
 * The oracle-agreement tests re-derive each check letter from the published
 * algorithm so the test is its own oracle.
 */

import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { format, normalize, parse, validate } from "../../src/countries/sg/index.ts";

/* ------------------------------------------------------------------ */
/* SG_NRIC                                                            */
/* ------------------------------------------------------------------ */

describe("SG_NRIC — weighted mod-11 (National Registration Act 1965)", () => {
  it.each([
    "S0000001I",
    "S1234567D",
    "S9876543C", // hand-verified (research doc miscomputed the weighted sum)
    "S1111111D",
    "S0000000J",
    "T0123456G",
    "T0000000G",
    "T1234567J",
  ])("validates %s", (v) => {
    expect(validate("NRIC", v)).toBe(true);
    expect(validate("SG_NRIC", v)).toBe(true);
  });

  it.each([
    "S1234567A", // correct check is D (R=7)
    "S1234567Z", // Z is R=1; here R=7
    "T1234567D", // T-prefix with these digits gives R=0 → J
    "S0000000A", // correct check is J (R=0)
  ])("rejects checksum failure %s", (v) => {
    expect(validate("SG_NRIC", v)).toBe(false);
  });

  it("does not accept a valid FIN as an NRIC (routes to SG_FIN)", () => {
    expect(validate("SG_NRIC", "F1234567N")).toBe(false);
    expect(validate("SG_NRIC", "M5012345J")).toBe(false);
  });

  it("normalize uppercases and strips separators", () => {
    expect(normalize("NRIC", "s1234567d")).toBe("S1234567D");
    expect(normalize("NRIC", "S-1234567-D")).toBe("S1234567D");
    expect(normalize("NRIC", " S1234567D ")).toBe("S1234567D");
  });

  it("validates a lowercased input after normalization", () => {
    expect(validate("NRIC", "s1234567d")).toBe(true);
  });

  it("format returns the canonical (unseparated) uppercase form", () => {
    expect(format("NRIC", "s1234567d")).toBe("S1234567D");
  });

  it("parse returns empty on whitespace-only", () => {
    const r = parse("NRIC", "   ");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason.kind).toBe("empty");
  });

  it("parse returns too_short (6 digits)", () => {
    const r = parse("NRIC", "S123456D");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason.kind).toBe("too_short");
  });

  it("parse returns too_long (8 digits)", () => {
    const r = parse("NRIC", "S12345678D");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason.kind).toBe("too_long");
  });

  it("parse returns invalid_format on a missing prefix letter", () => {
    const r = parse("NRIC", "12345678D"); // 9 chars, no [ST] prefix
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
  });

  it("parse returns invalid_checksum when shape ok but check fails", () => {
    const r = parse("NRIC", "S1234567A");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
  });

  it("parse on valid input returns normalized + formatted with confidence", () => {
    const r = parse("NRIC", "s1234567d");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.normalized).toBe("S1234567D");
      expect(r.formatted).toBe("S1234567D");
      expect(r.confidence).toBe("high");
    }
  });
});

describe("SG_NRIC — oracle agreement (10k random bodies)", () => {
  const WEIGHTS = [2, 7, 6, 5, 4, 3, 2];
  const TABLE = "JZIHGFEDCBA";

  function oracleCheck(prefix: string, body7: string): string {
    let sum = 0;
    for (let i = 0; i < 7; i++) sum += parseInt(body7[i] as string, 10) * (WEIGHTS[i] as number);
    const offset = prefix === "T" ? 4 : 0;
    return TABLE.charAt((sum + offset) % 11);
  }

  it("agrees with the published NRIC algorithm over random S/T bodies", () => {
    fc.assert(
      fc.property(fc.constantFrom("S", "T"), fc.stringMatching(/^[0-9]{7}$/), (prefix, body) => {
        const full = prefix + body + oracleCheck(prefix, body);
        expect(validate("SG_NRIC", full)).toBe(true);
      }),
      { numRuns: 10_000 },
    );
  });
});

/* ------------------------------------------------------------------ */
/* SG_FIN                                                             */
/* ------------------------------------------------------------------ */

describe("SG_FIN — weighted mod-11 with F/G/M tables (SAP KBA #2572734)", () => {
  it.each([
    "F0000001U",
    "F1234567N",
    "F9999999M", // hand-verified (research doc miscomputed the all-9s weighted sum)
    "G0000000R",
    "G1122334L",
    "G5872776N", // SAP KBA worked example
    "M0000000T",
    "M5012345J", // critical M-series vector
    "M1234567K",
  ])("validates %s", (v) => {
    expect(validate("FIN", v)).toBe(true);
    expect(validate("SG_FIN", v)).toBe(true);
  });

  it.each([
    "F1234567A", // correct check is N (F/G table at R=7)
    "G1122334K", // correct check is L (F/G table at R=9)
    "M5012345N", // M-table at R=8 is J; F/G table at R=8 would be M
    "M5012345U", // the v1.2 research's claimed "valid" — actually invalid
  ])("rejects checksum failure %s", (v) => {
    expect(validate("SG_FIN", v)).toBe(false);
  });

  it("does not accept a valid NRIC as a FIN (routes to SG_NRIC)", () => {
    expect(validate("SG_FIN", "S1234567D")).toBe(false);
    expect(validate("SG_FIN", "T0123456G")).toBe(false);
  });

  it("rejects an invalid prefix letter", () => {
    expect(validate("SG_FIN", "H1234567N")).toBe(false);
  });

  it("normalize uppercases and strips separators", () => {
    expect(normalize("FIN", "m5012345j")).toBe("M5012345J");
    expect(normalize("FIN", "M-5012345-J")).toBe("M5012345J");
  });

  it("validates a lowercased M-series input after normalization", () => {
    expect(validate("FIN", "m5012345J")).toBe(true);
  });

  it("parse returns too_short (6 digits)", () => {
    const r = parse("FIN", "M123456X");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason.kind).toBe("too_short");
  });

  it("parse returns too_long (8 digits)", () => {
    const r = parse("FIN", "M12345678X");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason.kind).toBe("too_long");
  });

  it("parse returns invalid_checksum when shape ok but check fails", () => {
    const r = parse("FIN", "M5012345N");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
  });

  it("parse on valid input returns normalized + formatted with confidence", () => {
    const r = parse("FIN", "m5012345j");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.normalized).toBe("M5012345J");
      expect(r.formatted).toBe("M5012345J");
      expect(r.confidence).toBe("high");
    }
  });
});

describe("SG_FIN — oracle agreement (10k random bodies)", () => {
  const WEIGHTS = [2, 7, 6, 5, 4, 3, 2];
  const FG_TABLE = "XWUTRQPNMLK";
  const M_TABLE = "XWUTRQPNJLK";

  function oracleCheck(prefix: string, body7: string): string {
    let sum = 0;
    for (let i = 0; i < 7; i++) sum += parseInt(body7[i] as string, 10) * (WEIGHTS[i] as number);
    const offset = prefix === "G" ? 4 : prefix === "M" ? 3 : 0;
    const table = prefix === "M" ? M_TABLE : FG_TABLE;
    return table.charAt((sum + offset) % 11);
  }

  it("agrees with the published FIN algorithm over random F/G/M bodies", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("F", "G", "M"),
        fc.stringMatching(/^[0-9]{7}$/),
        (prefix, body) => {
          const full = prefix + body + oracleCheck(prefix, body);
          expect(validate("SG_FIN", full)).toBe(true);
        },
      ),
      { numRuns: 10_000 },
    );
  });
});

/* ------------------------------------------------------------------ */
/* SG_UEN                                                             */
/* ------------------------------------------------------------------ */

describe("SG_UEN — three-category check letters (python-stdnum sg/uen.py)", () => {
  it.each([
    // Category A — Business
    "00192200M", // stdnum doctest
    "53000001J", // hand-verified (research doc had an off-by-one table index)
    "52912345B",
    // Category B — Local Company
    "197401143C", // stdnum doctest
    "196800306E", // DBS Bank (real)
    "199201624D", // Singtel (real)
    // Category C — Other Entity
    "S16FC0121D", // stdnum doctest
    "T01FC6132D", // stdnum doctest
    "T08LL0001K", // synthetic, hand-verified
  ])("validates %s", (v) => {
    expect(validate("UEN", v)).toBe(true);
    expect(validate("SG_UEN", v)).toBe(true);
  });

  it.each([
    "00192200A", // Cat A; correct check is M (R=1)
    "197401143A", // Cat B; correct check is C (R=2)
    "S16FC0121A", // Cat C; correct check is D (R=3)
    "T08LL0001B", // Cat C; correct check is K
  ])("rejects checksum failure %s", (v) => {
    expect(validate("SG_UEN", v)).toBe(false);
  });

  it.each([
    "T08ZZ0001K", // ZZ not in the 38-code entity-type whitelist
    "U08LL0001K", // first char U not in [RST]
  ])("rejects out-of-spec Cat C %s", (v) => {
    expect(validate("SG_UEN", v)).toBe(false);
  });

  it("rejects shapes that fit no category", () => {
    expect(validate("SG_UEN", "1968030E")).toBe(false); // 8 chars
    expect(validate("SG_UEN", "1968003060E")).toBe(false); // 11 chars
    expect(validate("SG_UEN", "196800306")).toBe(false); // 9 digits, no check letter
  });

  it("normalize uppercases and strips separators", () => {
    expect(normalize("UEN", "s16fc0121d")).toBe("S16FC0121D");
    expect(normalize("UEN", "197401143-C")).toBe("197401143C");
  });

  it("validates a lowercased Cat C input after normalization", () => {
    expect(validate("UEN", "s16fc0121d")).toBe(true);
  });

  it("parse returns too_short (8 chars)", () => {
    const r = parse("UEN", "1968030E");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason.kind).toBe("too_short");
  });

  it("parse returns too_long (11 chars)", () => {
    const r = parse("UEN", "1968003060E");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason.kind).toBe("too_long");
  });

  it("parse returns invalid_format on a 10-char shape fitting no category", () => {
    const r = parse("UEN", "U08LL0001K"); // 10 chars but U not in [RST]; not 9-digit Cat B either
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
  });

  it("parse returns invalid_checksum when Cat A shape ok but check fails", () => {
    const r = parse("UEN", "00192200A");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
  });

  it("parse on valid Cat B input returns normalized + formatted with confidence", () => {
    const r = parse("UEN", "197401143C");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.normalized).toBe("197401143C");
      expect(r.formatted).toBe("197401143C");
      expect(r.confidence).toBe("high");
    }
  });
});
