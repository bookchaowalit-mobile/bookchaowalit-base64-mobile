/**
 * Dependency-free UTF-8 Base64 encode/decode (standard and URL-safe, RFC 4648).
 * Does not rely on Buffer/btoa so it behaves identically on Hermes, web and Node.
 */

const STD = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const URL_SAFE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

export function utf8Encode(text: string): Uint8Array {
  const bytes: number[] = [];
  for (const ch of text) {
    let cp = ch.codePointAt(0)!;
    // A lone surrogate (e.g. half of an emoji from a truncated paste) is not
    // encodable as UTF-8; emit U+FFFD like TextEncoder instead of CESU-8
    // bytes that this app's own decoder would then reject.
    if (cp >= 0xd800 && cp <= 0xdfff) cp = 0xfffd;
    if (cp < 0x80) bytes.push(cp);
    else if (cp < 0x800) bytes.push(0xc0 | (cp >> 6), 0x80 | (cp & 0x3f));
    else if (cp < 0x10000) bytes.push(0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f));
    else
      bytes.push(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3f), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f));
  }
  return Uint8Array.from(bytes);
}

/** Strict UTF-8 decoder: throws on malformed sequences instead of emitting U+FFFD. */
export function utf8Decode(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; ) {
    const b = bytes[i];
    let cp: number;
    let extra: number;
    if (b < 0x80) [cp, extra] = [b, 0];
    else if (b >= 0xc2 && b < 0xe0) [cp, extra] = [b & 0x1f, 1];
    else if (b >= 0xe0 && b < 0xf0) [cp, extra] = [b & 0x0f, 2];
    else if (b >= 0xf0 && b < 0xf5) [cp, extra] = [b & 0x07, 3];
    else throw new Error("Decoded bytes are not valid UTF-8 text");
    for (let k = 1; k <= extra; k++) {
      const c = bytes[i + k];
      if (c === undefined || (c & 0xc0) !== 0x80) throw new Error("Decoded bytes are not valid UTF-8 text");
      cp = (cp << 6) | (c & 0x3f);
    }
    const min = [0, 0x80, 0x800, 0x10000][extra];
    if (cp < min || cp > 0x10ffff || (cp >= 0xd800 && cp <= 0xdfff)) {
      throw new Error("Decoded bytes are not valid UTF-8 text");
    }
    out += String.fromCodePoint(cp);
    i += extra + 1;
  }
  return out;
}

export function bytesToBase64(bytes: Uint8Array, opts: { urlSafe?: boolean; pad?: boolean } = {}): string {
  const alphabet = opts.urlSafe ? URL_SAFE : STD;
  const pad = opts.pad ?? !opts.urlSafe;
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    const remaining = bytes.length - i;
    out += alphabet[(n >> 18) & 63] + alphabet[(n >> 12) & 63];
    out += remaining > 1 ? alphabet[(n >> 6) & 63] : pad ? "=" : "";
    out += remaining > 2 ? alphabet[n & 63] : pad ? "=" : "";
  }
  return out;
}

/** Accepts standard or URL-safe alphabets, optional padding and embedded whitespace. */
export function base64ToBytes(input: string): Uint8Array {
  const clean = input.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(clean)) throw new Error("Input contains characters outside the Base64 alphabet");
  const body = clean.replace(/=+$/, "");
  if (body.length % 4 === 1) throw new Error("Input length is not valid Base64");
  if (clean.includes("=") && clean.length % 4 !== 0) throw new Error("Base64 padding is incorrect");
  const bytes: number[] = [];
  for (let i = 0; i < body.length; i += 4) {
    const chunk = body.slice(i, i + 4);
    const n = [...chunk].reduce((acc, c, idx) => acc | (STD.indexOf(c) << (18 - 6 * idx)), 0);
    bytes.push((n >> 16) & 0xff);
    if (chunk.length > 2) bytes.push((n >> 8) & 0xff);
    if (chunk.length > 3) bytes.push(n & 0xff);
  }
  return Uint8Array.from(bytes);
}

/** Characters as a person counts them (code points: an emoji is 1, not 2). */
export function charCount(text: string): number {
  let n = 0;
  for (const _ of text) n++;
  return n;
}

/** "1 character", "3 characters", with UTF-8 byte size for the text side. */
export function sizeLabel(text: string): string {
  const n = charCount(text);
  const bytes = utf8Encode(text).length;
  return `${n} ${n === 1 ? "character" : "characters"}${bytes !== n ? ` (${bytes} bytes)` : ""}`;
}

export function encode(text: string, opts: { urlSafe?: boolean } = {}): string {
  return bytesToBase64(utf8Encode(text), opts);
}

export function decode(b64: string): string {
  return utf8Decode(base64ToBytes(b64));
}

export type ConvertResult = { ok: true; output: string } | { ok: false; error: string };

/** Conversion runs on every keystroke on the JS thread; cap input so a huge paste cannot freeze the UI. */
export const MAX_INPUT_CHARS = 100_000;

export function convert(input: string, mode: "encode" | "decode", urlSafe = false): ConvertResult {
  if (input.length > MAX_INPUT_CHARS) {
    return { ok: false, error: `Input is longer than ${MAX_INPUT_CHARS.toLocaleString("en-US")} characters` };
  }
  try {

    return { ok: true, output: mode === "encode" ? encode(input, { urlSafe }) : decode(input) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
