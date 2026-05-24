/**
 * Japan specs (JP_MY_NUMBER, JP_CORPORATE_NUMBER) tests.
 *
 * Vectors hand-computed per docs/v1.2-asia-research/jp.md and
 * docs/v1.2-asia-research/VERIFICATION.md (§JP-1, §JP-2). Canonical gold
 * anchor for JP_CORPORATE_NUMBER: `7000012050002` — NTA's own corporate
 * number, verifiable at https://www.houjin-bangou.nta.go.jp/.
 *
 * The oracle-agreement tests re-derive the check digit using the published
 * algorithm and assert the implementation matches across 10k random bases.
 */

import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { format, normalize, parse, validate } from "../../src/countries/jp/index.ts";

describe("JP_MY_NUMBER — weighted mod-11 (総務省令第85号 第5条)", () => {
  it.each([
    "123456789018", // base 12345678901 → check 8
    "987654321093", // base 98765432109 → check 3
    "111111111118", // repunit base → check 8
    "999999999996", // all-9s base → check 6
    "400000000050", // boundary r=1 → check 0 (special-case branch in the ordinance)
    "110000000000", // boundary r=0 → check 0
    "000000000019", // leading zeros allowed; base 00000000001 → check 9
  ])("validates %s", (v) => {
    expect(validate("MY_NUMBER", v)).toBe(true);
    expect(validate("JP_MY_NUMBER", v)).toBe(true);
  });

  it("rejects checksum-flipped (correct check is 8, not 0)", () => {
    expect(validate("MY_NUMBER", "123456789010")).toBe(false);
  });

  it("rejects repunit including check digit (correct for base 11111111111 is 8)", () => {
    expect(validate("MY_NUMBER", "111111111111")).toBe(false);
  });

  it("rejects non-digit characters", () => {
    expect(validate("MY_NUMBER", "12345678901A")).toBe(false);
  });

  it("formats 4-4-4 per 通知カード convention", () => {
    expect(format("MY_NUMBER", "123456789018")).toBe("1234 5678 9018");
    expect(format("MY_NUMBER", "400000000050")).toBe("4000 0000 0050");
  });

  it("normalize strips separators", () => {
    expect(normalize("MY_NUMBER", "1234 5678 9018")).toBe("123456789018");
    expect(normalize("MY_NUMBER", "1234-5678-9018")).toBe("123456789018");
  });

  it("parse returns invalid_checksum when shape ok but check fails", () => {
    const r = parse("MY_NUMBER", "123456789010");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
  });

  it("parse returns too_short", () => {
    const r = parse("MY_NUMBER", "1234567890");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason.kind).toBe("too_short");
  });

  it("parse returns too_long", () => {
    const r = parse("MY_NUMBER", "1234567890188");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason.kind).toBe("too_long");
  });

  it("parse returns empty on whitespace-only", () => {
    const r = parse("MY_NUMBER", "   ");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason.kind).toBe("empty");
  });

  it("parse on valid input returns normalized + formatted with confidence", () => {
    const r = parse("MY_NUMBER", "1234 5678 9018");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.normalized).toBe("123456789018");
      expect(r.formatted).toBe("1234 5678 9018");
      expect(r.confidence).toBe("high");
    }
  });
});

describe("JP_MY_NUMBER — oracle agreement (10k random bases)", () => {
  // The published algorithm, re-derived inline so the test is its own oracle.
  function oracleCheck(base11: string): number {
    const weights = [6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 11; i++) {
      sum += parseInt(base11[i] as string, 10) * (weights[i] as number);
    }
    const r = sum % 11;
    return r <= 1 ? 0 : 11 - r;
  }

  it("agrees with the published MIC algorithm over 10k random 11-digit bases", () => {
    fc.assert(
      fc.property(fc.stringMatching(/^[0-9]{11}$/), (base) => {
        const check = oracleCheck(base);
        const full = base + String(check);
        expect(validate("MY_NUMBER", full)).toBe(true);
        // Flip the check digit and assert rejection
        const wrongCheck = (check + 1) % 10;
        const wrong = base + String(wrongCheck);
        if (wrongCheck !== check) {
          expect(validate("MY_NUMBER", wrong)).toBe(false);
        }
      }),
      { numRuns: 10_000 },
    );
  });
});

describe("JP_CORPORATE_NUMBER — weighted mod-9 (NTA, 法人番号の指定等に関する省令 第3条)", () => {
  it.each([
    "7000012050002", // 国税庁 (NTA) itself — gold oracle, verifiable in the public registry
    "9111111111111", // base 111111111111 → S mod 9 = 0 → check 9
    "9999999999999", // all-9s base → check 9
    "7123456789012", // base 123456789012 → check 7
    "8000000000001", // base 000000000001 → check 8
    "7000000000010", // base 000000000010 → check 7
    "9000000000009", // base 000000000009 → check 9 (rightmost weight 1 boundary)
  ])("validates %s", (v) => {
    expect(validate("CORPORATE_NUMBER", v)).toBe(true);
    expect(validate("JP_CORPORATE_NUMBER", v)).toBe(true);
  });

  it("rejects leading zero (algorithm cannot produce check 0)", () => {
    expect(validate("CORPORATE_NUMBER", "0123456789012")).toBe(false);
  });

  it("rejects checksum-flipped", () => {
    expect(validate("CORPORATE_NUMBER", "1123456789012")).toBe(false);
    expect(validate("CORPORATE_NUMBER", "7123456789013")).toBe(false);
  });

  it("rejects entirely non-numeric input", () => {
    expect(validate("CORPORATE_NUMBER", "abcdefghijklm")).toBe(false);
    expect(validate("CORPORATE_NUMBER", "")).toBe(false);
  });

  it("formats unchanged (NTA uses no separator)", () => {
    expect(format("CORPORATE_NUMBER", "7000012050002")).toBe("7000012050002");
  });

  it("normalize strips separators", () => {
    // Hyphens / spaces inside the number are tolerated and stripped.
    expect(normalize("CORPORATE_NUMBER", "7-000012-050002")).toBe("7000012050002");
    expect(normalize("CORPORATE_NUMBER", "7 000012 050002")).toBe("7000012050002");
  });

  it("parse returns invalid_checksum when shape ok but check fails", () => {
    const r = parse("CORPORATE_NUMBER", "1123456789012");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
  });

  it("parse returns invalid_format on leading zero", () => {
    const r = parse("CORPORATE_NUMBER", "0123456789012");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
  });

  it("parse returns too_short", () => {
    const r = parse("CORPORATE_NUMBER", "712345678901");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason.kind).toBe("too_short");
  });

  it("parse returns too_long", () => {
    const r = parse("CORPORATE_NUMBER", "71234567890123");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason.kind).toBe("too_long");
  });

  it("parse on valid input returns normalized + formatted with confidence", () => {
    const r = parse("CORPORATE_NUMBER", "7000012050002");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.normalized).toBe("7000012050002");
      expect(r.formatted).toBe("7000012050002");
      expect(r.confidence).toBe("high");
    }
  });
});

describe("JP_CORPORATE_NUMBER — oracle agreement (10k random bases)", () => {
  // Inline port of python-stdnum/stdnum/jp/cn.py calc_check_digit.
  // Key invariant: 9 - (sum % 9), NOT (9 - sum) % 9 — the former never returns 0.
  function oracleCheck(base12: string): number {
    const weights = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(base12[11 - i] as string, 10) * (weights[i] as number);
    }
    return 9 - (sum % 9);
  }

  it("agrees with the published NTA algorithm over 10k random 12-digit bases", () => {
    fc.assert(
      fc.property(fc.stringMatching(/^[0-9]{12}$/), (base) => {
        const check = oracleCheck(base);
        const full = String(check) + base;
        expect(validate("CORPORATE_NUMBER", full)).toBe(true);
      }),
      { numRuns: 10_000 },
    );
  });

  it("oracle never produces check digit 0", () => {
    fc.assert(
      fc.property(fc.stringMatching(/^[0-9]{12}$/), (base) => {
        const check = oracleCheck(base);
        expect(check).toBeGreaterThanOrEqual(1);
        expect(check).toBeLessThanOrEqual(9);
      }),
      { numRuns: 5_000 },
    );
  });
});
