export type Circle = {
  index: number; // 0 for identifier; 1..99 for data
  label: string; // "identifier" or the actual character
  diameter: string; // e.g., "0.00999" or "0.01071"
};

export function convertToCircles(input: string): Circle[] {
  const n = input.length;
  if (n < 1 || n > 99) {
    throw new Error("Length must be between 1 and 99 characters.");
  }

  const circles: Circle[] = [];

  // Identifier circle
  circles.push({
    index: 0,
    label: "identifier",
    diameter: "0.00999",
  });

  // Data circles with character label
  for (let i = 0; i < n; i++) {
    const idx = i + 1;
    const ii = idx.toString().padStart(2, "0"); // "01".."99" [web:111]
    const code = input.charCodeAt(i); // ASCII code [web:83]
    if (code < 0 || code > 127) {
      throw new Error(`Non-ASCII (0..127) code ${code} at position ${idx}`);
    }
    const ppp = code.toString().padStart(3, "0"); // "000".."127" [web:75]
    const ch = String.fromCharCode(code); // actual character label [web:118]

    circles.push({
      index: idx,
      label: ch,
      diameter: `0.${ii}${ppp}`,
    });
  }

  return circles;
}

// let output = encodeCirclesWithIdCharLabels("GND");
// console.log(output);

// Example:
// encodeCirclesWithIdCharLabels("GND") =>
// [
//   { index: 0, label: 'identifier', diameter: '0.00999' },
//   { index: 1, label: 'G', diameter: '0.01071' },
//   { index: 2, label: 'N', diameter: '0.02078' },
//   { index: 3, label: 'D', diameter: '0.03068' },
// ]
