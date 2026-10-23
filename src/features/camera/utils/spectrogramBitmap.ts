import { LIVE_SPECTROGRAM_WINDOW_COLUMNS } from "../constants/soundRecording.constants";

/** Small, lossless grayscale PNGs: one native image instead of a cell view tree. */
const QUIET = 245;
const LOUD = 55;
/** Darker ink for the live view so speech reads as clear moving lines. */
const LIVE_LOUD = 28;
export const SPECTROGRAM_BG = `#${QUIET.toString(16).repeat(3)}`;
const crcTable = Uint32Array.from({ length: 256 }, (_, value) => {
  let crc = value;
  for (let i = 0; i < 8; i += 1) {
    crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return crc >>> 0;
});

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(data.length + 12);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  for (let i = 0; i < 4; i += 1) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  let crc = 0xffffffff;
  for (let i = 4; i < out.length - 4; i += 1) {
    crc = crcTable[(crc ^ out[i]) & 255] ^ (crc >>> 8);
  }
  view.setUint32(out.length - 4, (crc ^ 0xffffffff) >>> 0);
  return out;
}

/** Stored DEFLATE blocks keep encoding bounded and avoid a native dependency. */
function deflateStored(data: Uint8Array): Uint8Array {
  const blocks = Math.ceil(data.length / 65535);
  const out = new Uint8Array(2 + blocks * 5 + data.length + 4);
  out.set([0x78, 0x01]);
  const view = new DataView(out.buffer);
  let offset = 2;
  let a = 1;
  let b = 0;
  for (let start = 0; start < data.length; start += 65535) {
    const length = Math.min(65535, data.length - start);
    out[offset] = start + length === data.length ? 1 : 0;
    view.setUint16(offset + 1, length, true);
    view.setUint16(offset + 3, ~length & 65535, true);
    offset += 5;
    out.set(data.subarray(start, start + length), offset);
    offset += length;
  }
  for (let i = 0; i < data.length; i += 1) {
    a = (a + data[i]) % 65521;
    b = (b + a) % 65521;
  }
  view.setUint32(offset, ((b << 16) | a) >>> 0);
  return out;
}

export function encodeGrayscalePng(
  width: number,
  height: number,
  pixels: Uint8Array
): string {
  if (width < 1 || height < 1 || pixels.length !== width * height) {
    throw new Error("Invalid spectrogram bitmap dimensions");
  }
  const header = new Uint8Array(13);
  const headerView = new DataView(header.buffer);
  headerView.setUint32(0, width);
  headerView.setUint32(4, height);
  header[8] = 8; // 8-bit grayscale; remaining IHDR fields are zero.
  const rows = new Uint8Array((width + 1) * height);
  for (let y = 0; y < height; y += 1) {
    rows.set(pixels.subarray(y * width, (y + 1) * width), y * (width + 1) + 1);
  }
  const parts = [
    new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateStored(rows)),
    chunk("IEND", new Uint8Array(0)),
  ];
  let binary = "";
  for (const part of parts) {
    for (let i = 0; i < part.length; i += 8192) {
      binary += String.fromCharCode(...part.subarray(i, i + 8192));
    }
  }
  return `data:image/png;base64,${globalThis.btoa(binary)}`;
}

function ink(peak: number, live: boolean): number {
  const clamped = Math.min(1, Math.max(0, peak));
  const level = live ? Math.sqrt(clamped) : clamped;
  const loud = live ? LIVE_LOUD : LOUD;
  return Math.round(QUIET - level * (QUIET - loud));
}

function paintSlice(
  pixels: Uint8Array,
  width: number,
  bands: number,
  x: number,
  columns: number[][],
  from: number,
  to: number,
  live: boolean
): void {
  for (let y = 0; y < bands; y += 1) {
    let peak = 0;
    // Peak pooling retains brief calls when a whole recording is reduced to
    // screen width, unlike selecting one column and dropping its neighbours.
    for (let c = from; c < to; c += 1) {
      const column = columns[c];
      if (!column?.length) continue;
      const band = Math.min(
        column.length - 1,
        Math.floor((y * column.length) / bands)
      );
      peak = Math.max(peak, column[band] ?? 0);
    }
    pixels[y * width + x] = ink(peak, live);
  }
}

export function spectrogramBitmap(
  columns: number[][],
  width: number,
  bands: number,
  playheadCenter: boolean
): string {
  const pixels = new Uint8Array(width * bands).fill(QUIET);
  if (playheadCenter) {
    // A short rolling window fills the width. The newest slice is the right
    // edge, so speech draws a visible stripe that travels left.
    const slots = Math.max(
      1,
      Math.min(width, LIVE_SPECTROGRAM_WINDOW_COLUMNS)
    );
    const historyCount = Math.min(columns.length, slots);
    const startColumn = columns.length - historyCount;
    for (let i = 0; i < historyCount; i += 1) {
      const slot = slots - historyCount + i;
      const x0 = Math.floor((slot * width) / slots);
      const x1 = Math.min(width, Math.floor(((slot + 1) * width) / slots));
      for (let x = x0; x < x1; x += 1) {
        paintSlice(
          pixels,
          width,
          bands,
          x,
          columns,
          startColumn + i,
          startColumn + i + 1,
          true
        );
      }
    }
    return encodeGrayscalePng(width, bands, pixels);
  }

  for (let x = 0; x < width; x += 1) {
    const from = Math.floor((x * columns.length) / width);
    const to = Math.max(from + 1, Math.floor(((x + 1) * columns.length) / width));
    paintSlice(pixels, width, bands, x, columns, from, to, false);
  }
  return encodeGrayscalePng(width, bands, pixels);
}
