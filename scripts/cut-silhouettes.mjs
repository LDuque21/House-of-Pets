// Cuts black-on-white silhouette artwork into the tight alpha masks in
// public/silhouettes/ (black RGBA, 512px tall). A sheet with several animals
// side by side is split on the empty columns between them, left to right:
//
//   node scripts/cut-silhouettes.mjs art/raccoon-rat.png raccoon rat
//
// Writes with toBuffer() + fs, since libvips' toFile fails on long Windows paths.
import { writeFileSync } from "node:fs";
import sharp from "sharp";

const [input, ...names] = process.argv.slice(2);
if (!input || names.length === 0) {
  console.error("Usage: node scripts/cut-silhouettes.mjs <image> <species> [<species> ...]");
  process.exit(1);
}

const { data, info } = await sharp(input).flatten({ background: "#ffffff" }).greyscale().raw().toBuffer({ resolveWithObject: true });
const { width, height } = info;

// Darkness -> opacity. Near-white (paper, JPEG noise) is fully transparent.
const alpha = Buffer.alloc(width * height);
for (let i = 0; i < alpha.length; i++) {
  const lum = data[i];
  alpha[i] = lum >= 235 ? 0 : lum <= 40 ? 255 : Math.round(((235 - lum) / 195) * 255);
}

// Columns that contain ink, grouped into animals (gaps under 40px are merged,
// so whiskers and tails stay with their owner).
const inked = Array.from({ length: width }, (_, x) => {
  for (let y = 0; y < height; y++) if (alpha[y * width + x] > 64) return true;
  return false;
});
const segments = [];
for (let x = 0; x < width; x++) {
  if (!inked[x]) continue;
  const last = segments.at(-1);
  if (last && x - last.end < 40) last.end = x;
  else segments.push({ start: x, end: x });
}
if (segments.length !== names.length) {
  console.error(`Found ${segments.length} animals but got ${names.length} names.`);
  process.exit(1);
}

for (const [i, { start, end }] of segments.entries()) {
  let top = height, bottom = 0;
  for (let y = 0; y < height; y++) {
    for (let x = start; x <= end; x++) {
      if (alpha[y * width + x] > 64) {
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
        break;
      }
    }
  }
  const w = end - start + 1;
  const h = bottom - top + 1;
  const rgba = Buffer.alloc(w * h * 4); // black, opacity from the artwork
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) rgba[(y * w + x) * 4 + 3] = alpha[(top + y) * width + start + x];
  }
  const png = await sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
    .resize({ height: 512 })
    .png({ compressionLevel: 9 })
    .toBuffer();
  const out = `public/silhouettes/${names[i]}.png`;
  writeFileSync(out, png);
  console.log(`${out}: ${w}x${h} -> height 512`);
}
