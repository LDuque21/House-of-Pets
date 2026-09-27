// Cuts black-on-white silhouette artwork into the tight alpha masks in
// public/silhouettes/ (black RGBA, 512px tall). A sheet with several animals
// is split into one mask per animal, named left to right:
//
//   node scripts/cut-silhouettes.mjs art/raccoon-rat.png raccoon rat
//
// Animals are found as connected shapes, not by empty columns, so they may
// overlap horizontally (a tail under a neighbor's snout). The N largest shapes
// are the animals; every smaller detached bit (a whisker, an eye pupil, a
// striped tail band) joins the animal whose outline is nearest.
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

// Label 8-connected shapes of ink.
const label = new Int32Array(width * height).fill(-1);
const shapes = [];
for (let start = 0; start < alpha.length; start++) {
  if (!alpha[start] || label[start] !== -1) continue;
  const shape = { id: shapes.length, area: 0, x0: width, y0: height, x1: 0, y1: 0 };
  const stack = [start];
  label[start] = shape.id;
  while (stack.length) {
    const i = stack.pop();
    const x = i % width;
    const y = (i - x) / width;
    shape.area++;
    shape.x0 = Math.min(shape.x0, x);
    shape.x1 = Math.max(shape.x1, x);
    shape.y0 = Math.min(shape.y0, y);
    shape.y1 = Math.max(shape.y1, y);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const j = ny * width + nx;
        if (alpha[j] && label[j] === -1) {
          label[j] = shape.id;
          stack.push(j);
        }
      }
    }
  }
  shapes.push(shape);
}
if (shapes.length < names.length) {
  console.error(`Found ${shapes.length} shapes but got ${names.length} names.`);
  process.exit(1);
}

// The largest shapes are the animals, left to right; the rest attach to the nearest.
const animals = [...shapes]
  .sort((a, b) => b.area - a.area)
  .slice(0, names.length)
  .sort((a, b) => a.x0 + a.x1 - (b.x0 + b.x1));
const boxGap = (a, b) =>
  Math.hypot(Math.max(0, a.x0 - b.x1, b.x0 - a.x1), Math.max(0, a.y0 - b.y1, b.y0 - a.y1));
const centerGap = (a, b) => Math.hypot(a.x0 + a.x1 - b.x0 - b.x1, a.y0 + a.y1 - b.y0 - b.y1);
// Boxes can overlap (a tail under a neighbor's snout), so ties on box gap go
// to the nearer center, and each animal always owns its own shape.
const closer = (shape, a, b) => {
  const [ga, gb] = [boxGap(shape, a), boxGap(shape, b)];
  return ga !== gb ? ga < gb : centerGap(shape, a) < centerGap(shape, b);
};
const owner = new Int32Array(shapes.length);
for (const shape of shapes) {
  const own = animals.indexOf(shape);
  if (own !== -1) {
    owner[shape.id] = own;
    continue;
  }
  let best = 0;
  animals.forEach((animal, k) => {
    if (closer(shape, animal, animals[best])) best = k;
  });
  owner[shape.id] = best;
}

for (const [k, name] of names.entries()) {
  const parts = shapes.filter((s) => owner[s.id] === k);
  const x0 = Math.min(...parts.map((s) => s.x0));
  const x1 = Math.max(...parts.map((s) => s.x1));
  const y0 = Math.min(...parts.map((s) => s.y0));
  const y1 = Math.max(...parts.map((s) => s.y1));
  const w = x1 - x0 + 1;
  const h = y1 - y0 + 1;
  const rgba = Buffer.alloc(w * h * 4); // black, opacity from the artwork
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y0 + y) * width + x0 + x;
      if (label[i] !== -1 && owner[label[i]] === k) rgba[(y * w + x) * 4 + 3] = alpha[i];
    }
  }
  const png = await sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
    .resize({ height: 512 })
    .png({ compressionLevel: 9 })
    .toBuffer();
  const out = `public/silhouettes/${name}.png`;
  writeFileSync(out, png);
  console.log(`${out}: ${w}x${h} (${parts.length} parts) -> height 512`);
}
