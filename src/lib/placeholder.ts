const PALETTE = ["#ccfbf1", "#fef3c7", "#fee2e2", "#e0e7ff", "#dcfce7", "#fae8ff", "#fde68a"];

function hash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h;
}

export function placeholderImage(seed: string, emoji: string): string {
  const color = PALETTE[hash(seed) % PALETTE.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400">
    <rect width="600" height="400" fill="${color}"/>
    <text x="50%" y="50%" font-size="120" text-anchor="middle" dominant-baseline="central">${emoji}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
