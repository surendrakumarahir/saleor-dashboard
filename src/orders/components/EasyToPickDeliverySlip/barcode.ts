// Code 128 (Subset B) pattern table for 0-106
const CODE128_PATTERNS: readonly string[] = [
  "212222",
  "222122",
  "222221",
  "121223",
  "121322",
  "131222",
  "122213",
  "122312",
  "132212",
  "221213",
  "221312",
  "231212",
  "112232",
  "122132",
  "122231",
  "113222",
  "123122",
  "123221",
  "223211",
  "221132",
  "221231",
  "213212",
  "223112",
  "312131",
  "311222",
  "321122",
  "321221",
  "312212",
  "322112",
  "322211",
  "212123",
  "212321",
  "232121",
  "111323",
  "131123",
  "131321",
  "112313",
  "132113",
  "132311",
  "211313",
  "231113",
  "231311",
  "112133",
  "112331",
  "132131",
  "113123",
  "113321",
  "133121",
  "313121",
  "211331",
  "231131",
  "213113",
  "213311",
  "213131",
  "311123",
  "311321",
  "331121",
  "312113",
  "312311",
  "332111",
  "314111",
  "221411",
  "431111",
  "111224",
  "111422",
  "121124",
  "121421",
  "141122",
  "141221",
  "112214",
  "112412",
  "122114",
  "122411",
  "142112",
  "142211",
  "241211",
  "221114",
  "413111",
  "241112",
  "134111",
  "111242",
  "121142",
  "121241",
  "114212",
  "124112",
  "124211",
  "411212",
  "421112",
  "421211",
  "212141",
  "214121",
  "412121",
  "111143",
  "111341",
  "131141",
  "114113",
  "114311",
  "411113",
  "411311",
  "113141",
  "114131",
  "311141",
  "411131",
  "211412",
  "211214",
  "211232",
  "2331112",
];

export interface BarcodeSvgOptions {
  height?: number;
  barWidth?: number;
  showText?: boolean;
  quietZone?: number;
}

export interface BarcodeModule {
  x: number;
  width: number;
}

export const encodeCode128B = (rawText: string): BarcodeModule[] => {
  const safeText = rawText || "0000";
  const codes: number[] = [104]; // Start B
  let checksum = 104;

  for (let i = 0; i < safeText.length; i++) {
    const code = safeText.charCodeAt(i) - 32;
    const clampedCode = code >= 0 && code <= 95 ? code : 0;

    codes.push(clampedCode);
    checksum += clampedCode * (i + 1);
  }

  codes.push(checksum % 103);
  codes.push(106); // Stop

  const modules: BarcodeModule[] = [];
  let currentX = 0;

  for (const c of codes) {
    const pattern = CODE128_PATTERNS[c] || "212222";

    for (let j = 0; j < pattern.length; j++) {
      const w = Number.parseInt(pattern[j], 10);
      const isBar = j % 2 === 0;

      if (isBar) {
        modules.push({ x: currentX, width: w });
      }

      currentX += w;
    }
  }

  return modules;
};

export const generateBarcodeSvg = (
  text: string,
  options: BarcodeSvgOptions = {},
): { svgString: string; totalWidth: number; totalHeight: number } => {
  const height = options.height ?? 40;
  const barWidth = options.barWidth ?? 1.5;
  const showText = options.showText ?? true;
  const quietZone = options.quietZone ?? 10;

  const modules = encodeCode128B(text);
  const totalModuleWidth = modules.reduce((max, m) => Math.max(max, m.x + m.width), 0);
  const totalWidth = totalModuleWidth * barWidth + quietZone * 2;
  const textHeight = showText ? 14 : 0;
  const totalHeight = height + textHeight + 4;

  const rects = modules
    .map(
      m =>
        `<rect x="${(quietZone + m.x * barWidth).toFixed(1)}" y="0" width="${(m.width * barWidth).toFixed(1)}" height="${height}" fill="#000000" />`,
    )
    .join("");

  const textElement = showText
    ? `<text x="${(totalWidth / 2).toFixed(1)}" y="${(height + 12).toFixed(1)}" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, monospace" font-size="11" font-weight="600" text-anchor="middle" fill="#111827" letter-spacing="1.5">* ${text} *</text>`
    : "";

  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth.toFixed(1)} ${totalHeight.toFixed(1)}" width="${totalWidth.toFixed(1)}" height="${totalHeight.toFixed(1)}" shape-rendering="crispEdges">
    <rect width="100%" height="100%" fill="#ffffff" />
    ${rects}
    ${textElement}
  </svg>`;

  return { svgString, totalWidth, totalHeight };
};
