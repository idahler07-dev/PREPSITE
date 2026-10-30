/** Referral codes: 8 characters without look-alikes (no 0/O, 1/I/L). */
export const REF_COOKIE = "ref";
export const REF_PATTERN = /^[A-HJ-KM-NP-Z2-9]{8}$/;
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function newReferralCode(random: (n: number) => number): string {
  return Array.from({ length: 8 }, () => ALPHABET[random(ALPHABET.length)]).join("");
}
