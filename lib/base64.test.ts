import { describe, expect, it } from "vitest";
import { base64ToBytes, bytesToBase64, convert, decode, encode, utf8Decode } from "./base64";

const bytes = (s: string) => Uint8Array.from([...s].map((c) => c.charCodeAt(0)));

describe("RFC 4648 test vectors", () => {
  const vectors: [string, string][] = [
    ["", ""],
    ["f", "Zg=="],
    ["fo", "Zm8="],
    ["foo", "Zm9v"],
    ["foob", "Zm9vYg=="],
    ["fooba", "Zm9vYmE="],
    ["foobar", "Zm9vYmFy"],
  ];
  it.each(vectors)("encodes %j", (plain, b64) => {
    expect(encode(plain)).toBe(b64);
    expect(decode(b64)).toBe(plain);
  });
});

describe("UTF-8", () => {
  it("round-trips Thai, accents and emoji", () => {
    expect(encode("สวัสดี")).toBe("4Liq4Lin4Lix4Liq4LiU4Li1");
    expect(encode("héllo wörld 😀")).toBe("aMOpbGxvIHfDtnJsZCDwn5iA");
    expect(decode("aMOpbGxvIHfDtnJsZCDwn5iA")).toBe("héllo wörld 😀");
  });
  it("rejects invalid UTF-8", () => {
    expect(() => utf8Decode(Uint8Array.from([0xff]))).toThrow(/UTF-8/);
    expect(() => utf8Decode(Uint8Array.from([0xe0, 0x80]))).toThrow(/UTF-8/); // truncated
    expect(() => utf8Decode(Uint8Array.from([0xc0, 0x80]))).toThrow(/UTF-8/); // overlong
    expect(() => decode("/w==")).toThrow(/UTF-8/);
  });
});

describe("URL-safe", () => {
  it("uses - and _ without padding", () => {
    expect(encode("ÿþ?>", { urlSafe: true })).toBe("w7_Dvj8-");
    expect(encode("ÿþ?>")).toBe("w7/Dvj8+");
    expect(encode("f", { urlSafe: true })).toBe("Zg");
  });
  it("decodes URL-safe and unpadded input", () => {
    expect(decode("w7_Dvj8-")).toBe("ÿþ?>");
    expect(decode("Zg")).toBe("f");
  });
});

describe("binary helpers", () => {
  it("round-trips arbitrary bytes", () => {
    const all = Uint8Array.from({ length: 256 }, (_, i) => i);
    expect([...base64ToBytes(bytesToBase64(all))]).toEqual([...all]);
    expect(bytesToBase64(bytes("\x00\x01\x02"))).toBe("AAEC");
  });
  it("ignores whitespace and line breaks", () => {
    expect(decode("Zm9v\nYmFy ")).toBe("foobar");
  });
  it("rejects malformed Base64", () => {
    expect(() => decode("Zm9v!")).toThrow(/alphabet/);
    expect(() => decode("Z")).toThrow(/length/);
    expect(() => decode("Zg=")).toThrow(/padding/);
  });
});

describe("convert", () => {
  it("wraps errors into a result", () => {
    expect(convert("foo", "encode")).toEqual({ ok: true, output: "Zm9v" });
    expect(convert("@@", "decode")).toMatchObject({ ok: false });
  });
});
