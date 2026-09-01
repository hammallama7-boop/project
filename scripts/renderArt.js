// Renders deterministic 32x32 pixel-art PNGs for each Pixel Cat from its
// trait combination (metadata/token-traits.json). Pure JS + pngjs.
//
// Usage: node scripts/renderArt.js
// Output: images/generated/{tokenId}.png

const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");

const SIZE = 32;
const SCALE = 8; // output 256x256

// 16-color palette per fur color, hand-tuned for pixel-art look.
const FUR_PALETTES = {
  Orange: {
    main: [255, 154, 96], dark: [200, 108, 55], light: [255, 210, 170],
    outline: [90, 50, 35],
  },
  Gray: {
    main: [158, 168, 180], dark: [105, 115, 130], light: [215, 222, 230],
    outline: [60, 65, 75],
  },
  White: {
    main: [240, 244, 248], dark: [190, 200, 212], light: [255, 255, 255],
    outline: [80, 88, 100],
  },
  Black: {
    main: [70, 74, 82], dark: [38, 40, 46], light: [120, 126, 138],
    outline: [15, 16, 20],
  },
  Calico: {
    main: [240, 244, 248], dark: [70, 74, 82], light: [255, 200, 170],
    outline: [60, 60, 70],
  },
  Tuxedo: {
    main: [60, 62, 70], dark: [35, 36, 42], light: [250, 250, 255],
    outline: [15, 16, 20],
  },
};

const EYE_COLORS = {
  Green: [96, 220, 120],
  Yellow: [255, 220, 80],
  Blue: [90, 160, 255],
  Heterochromia: [120, 200, 140], // one green one blue
  Red: [255, 90, 90],
};

const GLASSES_COLOR = [40, 40, 48];
const COLLAR_COLOR = [220, 60, 60];
const BOW_COLOR = [255, 110, 160];
const SCAR_COLOR = [200, 150, 130];
const STITCH_COLOR = [190, 140, 120];
const WHISKER_COLOR = [220, 220, 220];

function setPixel(img, x, y, [r, g, b], alpha = 255) {
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
  const idx = (y * SIZE + x) * 4;
  img.data[idx] = r;
  img.data[idx + 1] = g;
  img.data[idx + 2] = b;
  img.data[idx + 3] = alpha;
}

function getPixel(img, x, y) {
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return null;
  const idx = (y * SIZE + x) * 4;
  return [img.data[idx], img.data[idx + 1], img.data[idx + 2]];
}

// Simple deterministic RNG so art is reproducible from tokenId alone.
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawCatRaster(combo, seed) {
  const img = new PNG({ width: SIZE, height: SIZE });
  // initialize transparent
  for (let i = 0; i < img.data.length; i += 4) {
    img.data[i + 3] = 0;
  }

  const fur = FUR_PALETTES[combo["Fur Color"]] || FUR_PALETTES.Orange;
  const eyeColor = combo["Eye Color"];
  const eyeRGB = EYE_COLORS[eyeColor] || EYE_COLORS.Green;
  const rng = mulberry32(seed);

  // Figure silhouette (simple front-facing cat).
  // We draw from raw shapes.
  const drawPixels = (shape, color) => {
    for (const [y, x] of shape) setPixel(img, x, y, color);
  };

  // Build coordinate lists for each region.
  const body = [];
  const ears = [];
  const eyes = [];
  const nose = [];
  const mouth = [];
  const innerEars = [];
  const whiskers = [];
  const tail = [];
  const noseShadow = [];

  // body: a rounded rectangle covering rows 8..28, cols 6..26
  for (let y = 8; y < 29; y++) {
    for (let x = 6; x < 27; x++) {
      body.push([y, x]);
      // rounded corners
      if (y === 8 && (x < 8 || x > 24)) continue;
      if (y === 28 && (x < 8 || x > 24)) continue;
    }
  }
  // tail on the left
  for (let i = 0; i < 8; i++) tail.push([28 - i, 4]);
  for (let i = 0; i < 4; i++) tail.push([21 - i, 3]);

  // ears: two triangles at top (rows 2..8)
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j <= i; j++) {
      ears.push([2 + i, 8 + j]);           // left ear
      ears.push([2 + i, 22 - j]);          // right ear
    }
  }
  // inner ear fill
  for (let i = 2; i < 6; i++) {
    for (let j = 2; j <= i; j++) {
      innerEars.push([2 + i, 10 + j]);
      innerEars.push([2 + i, 20 - j]);
    }
  }

  // eyes (two 3x2 blocks)
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 3; j++) {
      eyes.push([14 + i, 12 + j]);
      eyes.push([14 + i, 17 + j]);
    }
  }
  // nose
  nose.push([17, 15]); nose.push([17, 16]);
  // mouth
  mouth.push([19, 14]); mouth.push([20, 15]); mouth.push([19, 17]); mouth.push([20, 16]);
  // whiskers
  whiskers.push([18, 4]); whiskers.push([19, 3]);
  whiskers.push([18, 27]); whiskers.push([19, 28]);

  // nose shadow
  noseShadow.push([17, 14]); noseShadow.push([17, 17]);

  // ---- draw ----
  // outline pass: everything slightly darker edges handled by fur.dark already;
  // simpler: draw main fur, then add dark accents.
  // body fill
  drawPixels(body, fur.main);
  drawPixels(tail, fur.main);
  // body shading: a few darker rows at bottom
  for (let y = 24; y < 29; y++) {
    for (let x = 8; x < 24; x++) setPixel(img, x, y, fur.dark);
  }
  // ears fill
  drawPixels(ears, fur.main);
  drawPixels(innerEars, fur.light);
  // eyes
  drawPixels(eyes, eyeRGB);
  // nose + shade
  drawPixels(nose, [255, 120, 140]);
  drawPixels(noseShadow, fur.dark);
  // mouth
  drawPixels(mouth, fur.dark);
  // whiskers
  drawPixels(whiskers, WHISKER_COLOR);

  // ---- injuries ----
  const injury = combo["Injuries"];
  if (injury === "Scar") {
    setPixel(img, 6, 10, SCAR_COLOR);
    setPixel(img, 7, 10, SCAR_COLOR);
    setPixel(img, 6, 11, SCAR_COLOR);
  } else if (injury === "Ear Tipped") {
    // snip top-right corner of left ear: overwrite dark pixels with light
    setPixel(img, 3, 8, fur.light);
    setPixel(img, 2, 8, fur.light);
    setPixel(img, 3, 9, fur.light);
  } else if (injury === "Stitches") {
    // cross stitches on cheek
    setPixel(img, 26, 12, STITCH_COLOR);
    setPixel(img, 26, 13, STITCH_COLOR);
    setPixel(img, 25, 12, STITCH_COLOR);
  }

  // ---- accessories ----
  const acc = combo["Accessories"];
  if (acc === "Collar") {
    for (let x = 10; x < 22; x++) setPixel(img, x, 22, COLLAR_COLOR);
    setPixel(img, 15, 23, [240, 200, 60]); // bell
    setPixel(img, 16, 23, [240, 200, 60]);
  } else if (acc === "Bow") {
    setPixel(img, 11, 11, BOW_COLOR);
    setPixel(img, 12, 10, BOW_COLOR);
    setPixel(img, 13, 11, BOW_COLOR);
    setPixel(img, 12, 12, [255, 200, 220]);
    setPixel(img, 18, 11, BOW_COLOR);
    setPixel(img, 19, 10, BOW_COLOR);
    setPixel(img, 20, 11, BOW_COLOR);
    setPixel(img, 19, 12, [255, 200, 220]);
  } else if (acc === "Glasses") {
    // rectangles around eyes
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 5; j++) {
        setPixel(img, 13 + i, 11 + j, GLASSES_COLOR);
        setPixel(img, 13 + i, 18 + j, GLASSES_COLOR);
      }
    }
    // bridge
    setPixel(img, 14, 15, GLASSES_COLOR);
    setPixel(img, 15, 15, GLASSES_COLOR);
    setPixel(img, 16, 15, GLASSES_COLOR);
  }

  // ---- toes ----
  const toes = combo["Toes"];
  const totalToes = toes === "All 5" ? 5 : toes === "Missing 1" ? 4 : 3;
  // draw toe claws under the body left-to-right, count determines how many
  const baseY = 29;
  const startX = 12;
  for (let t = 0; t < totalToes; t++) {
    const x = startX + t * 2;
    setPixel(img, x, baseY, fur.light);
    setPixel(img, x + 1, baseY, fur.light);
  }

  // Heterochromia: override one eye
  if (eyeColor === "Heterochromia") {
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 3; j++) setPixel(img, 14 + i, 17 + j, [120, 200, 140]);
    }
  }

  return img;
}

function upscale(img, scale) {
  const out = new PNG({ width: SIZE * scale, height: SIZE * scale });
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const src = getPixel(img, x, y) || [0, 0, 0];
      const alpha =
        img.data[(y * SIZE + x) * 4 + 3];
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const idx = ((y * scale + dy) * SIZE * scale + (x * scale + dx)) * 4;
          out.data[idx] = src[0];
          out.data[idx + 1] = src[1];
          out.data[idx + 2] = src[2];
          out.data[idx + 3] = alpha;
        }
      }
    }
  }
  return out;
}

function main() {
  const indexPath = path.join(__dirname, "..", "metadata", "token-traits.json");
  const traits = JSON.parse(fs.readFileSync(indexPath, "utf8"));

  const outDir = path.join(__dirname, "..", "images", "generated");
  fs.mkdirSync(outDir, { recursive: true });

  for (const { tokenId, combo } of traits) {
    const small = drawCatRaster(combo, tokenId);
    const big = upscale(small, SCALE);
    fs.writeFileSync(
      path.join(outDir, `${tokenId}.png`),
      PNG.sync.write(big)
    );
  }

  console.log(`Rendered ${traits.length} pixel-art cats to ${outDir}`);
  // check one file is non-empty
  const sample = path.join(outDir, "1.png");
  console.log(`Sample file size: ${fs.statSync(sample).size} bytes`);
}

main();