/**
 * Formula display: subset (subscript) and superset (superscript).
 * Converts <sub>...</sub> and <sup>...</sup> to Unicode subscript/superscript.
 */

const SUBSCRIPT_MAP: Record<string, string> = {
  "0": "₀",
  "1": "₁",
  "2": "₂",
  "3": "₃",
  "4": "₄",
  "5": "₅",
  "6": "₆",
  "7": "₇",
  "8": "₈",
  "9": "₉",
};

const SUPERSCRIPT_MAP: Record<string, string> = {
  "0": "⁰",
  "1": "¹",
  "2": "²",
  "3": "³",
  "4": "⁴",
  "5": "⁵",
  "6": "⁶",
  "7": "⁷",
  "8": "⁸",
  "9": "⁹",
  "+": "⁺",
  "-": "⁻",
};

function toSubscript(s: string): string {
  return s
    .split("")
    .map((c) => SUBSCRIPT_MAP[c] ?? c)
    .join("");
}

function toSuperscript(s: string): string {
  return s
    .split("")
    .map((c) => SUPERSCRIPT_MAP[c] ?? c)
    .join("");
}

/**
 * Converts formula string with <sub> and <sup> tags to display string
 * using Unicode subscript (subset) and superscript (superset) characters.
 * e.g. "H<sub>2</sub>O" → "H₂O", "Fe<sup>2+</sup>" → "Fe²⁺"
 */
export function formulaToDisplay(formula: string | null | undefined): string {
  if (!formula || typeof formula !== "string") return "";
  let out = formula;
  out = out.replace(/<sub>([^<]*)<\/sub>/gi, (_, content) =>
    toSubscript(String(content))
  );
  out = out.replace(/<sup>([^<]*)<\/sup>/gi, (_, content) =>
    toSuperscript(String(content))
  );
  return out;
}
