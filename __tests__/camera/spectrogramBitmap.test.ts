import { inflateSync } from "zlib";
import {
  encodeGrayscalePng,
  spectrogramBitmap,
} from "../../src/features/camera/utils/spectrogramBitmap";

function decode(uri: string) {
  const bytes = Buffer.from(uri.split(",")[1], "base64");
  expect(Array.from(bytes.subarray(0, 8))).toEqual([
    137, 80, 78, 71, 13, 10, 26, 10,
  ]);
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  const compressed: Buffer[] = [];
  for (let offset = 8; offset < bytes.length; ) {
    const length = bytes.readUInt32BE(offset);
    let crc = 0xffffffff;
    for (const byte of bytes.subarray(offset + 4, offset + 8 + length)) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit++)
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
    expect((crc ^ 0xffffffff) >>> 0).toBe(
      bytes.readUInt32BE(offset + 8 + length)
    );
    if (bytes.toString("ascii", offset + 4, offset + 8) === "IDAT")
      compressed.push(bytes.subarray(offset + 8, offset + 8 + length));
    offset += length + 12;
  }
  const rows = inflateSync(Buffer.concat(compressed));
  const pixels: number[] = [];
  for (let y = 0; y < height; y++) {
    expect(rows[y * (width + 1)]).toBe(0);
    pixels.push(...rows.subarray(y * (width + 1) + 1, (y + 1) * (width + 1)));
  }
  return { width, height, pixels };
}

it("encodes exact grayscale pixels across multiple deflate blocks", () => {
  const pixels = Uint8Array.from({ length: 640 * 128 }, (_, i) => i % 256);
  const result = decode(encodeGrayscalePng(640, 128, pixels));
  expect(result.width).toBe(640);
  expect(result.height).toBe(128);
  expect(result.pixels).toEqual(Array.from(pixels));
});

it("preserves high-to-low frequency orientation and grayscale contrast", () => {
  expect(
    decode(
      spectrogramBitmap(
        [
          [0, 1],
          [0.5, 0],
        ],
        2,
        2,
        false
      )
    ).pixels
  ).toEqual([245, 150, 55, 245]);
});

it("keeps short calls between sampled columns when shrinking a full track", () => {
  expect(
    decode(spectrogramBitmap([[0], [1], [0], [0.5]], 2, 1, false)).pixels
  ).toEqual([55, 150]);
});

it("draws live speech as wide stripes that enter on the right edge", () => {
  const width = 160;
  const { pixels } = decode(spectrogramBitmap([[0.5], [1]], width, 1, true));
  const slot = width / 80;
  expect(pixels.slice(0, width - slot * 2).every((pixel) => pixel === 245)).toBe(
    true
  );
  const older = pixels[width - slot * 2];
  const newest = pixels[width - 1];
  expect(pixels.slice(width - slot * 2, width - slot).every((pixel) => pixel === older)).toBe(
    true
  );
  expect(pixels.slice(width - slot).every((pixel) => pixel === newest)).toBe(true);
  expect(newest).toBeLessThan(older);
  expect(older).toBeLessThan(245);
});
