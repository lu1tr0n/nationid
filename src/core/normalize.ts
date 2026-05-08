/** Strip everything that is not a letter or digit, then uppercase. */
export function stripAndUpper(input: string): string {
  return input.replace(/[^A-Za-z0-9]+/g, "").toUpperCase();
}

/** Strip everything that is not a digit. */
export function stripNonDigits(input: string): string {
  return input.replace(/\D+/g, "");
}

/** Returns true if every character is the same digit (e.g. `111111`). */
export function allSameDigit(input: string): boolean {
  return /^(\d)\1+$/.test(input);
}
