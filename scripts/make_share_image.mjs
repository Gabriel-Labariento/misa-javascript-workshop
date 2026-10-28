// Draw the 1200×630 link-preview image (web/public/og.png) used when the site is shared.
// Usage (from the repository root, after `pnpm install` in web/): node scripts/make_share_image.mjs
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WEB = join(ROOT, 'web');
// sharp comes with Astro, so load it from Astro's own dependencies.
const astro = createRequire(join(WEB, 'package.json')).resolve('astro/package.json');
const sharp = createRequire(astro)('sharp');

const SHELL = '#17949b';
const FACE = '#d2fbfd';
const STEM = '#2a5d62';
const CHEEK = '#ff9fbf';
const CONFETTI = ['#19aab1', '#ffc94d', '#ff7aa8', '#8f7aff', '#7ad66b'];

const mark = readFileSync(join(WEB, 'public', 'assets', 'misa-mark.svg'), 'utf8')
  .replace(/^[\s\S]*?<svg[^>]*>/, '')
  .replace(/<\/svg>\s*$/, '');

// The same drawing as src/components/MisaBot.astro, with the cheering face.
const misabot = `
  <path d="M24 12v16M96 12v16" stroke="${STEM}" stroke-width="5" stroke-linecap="round"/>
  <circle cx="24" cy="10" r="6" fill="${SHELL}"/>
  <circle cx="96" cy="10" r="6" fill="${SHELL}"/>
  <rect x="3" y="38" width="16" height="28" rx="6" fill="${SHELL}"/>
  <rect x="101" y="38" width="16" height="28" rx="6" fill="${SHELL}"/>
  <path d="M60 6 104 22q6 2 6 9v33q0 22-22 22H32Q10 86 10 64V31q0-7 6-9Z" fill="${SHELL}"/>
  <rect x="22" y="27" width="76" height="52" rx="14" fill="${FACE}"/>
  <path d="M38 50q6-9 12 0M70 50q6-9 12 0" fill="none" stroke="${SHELL}" stroke-width="4" stroke-linecap="round"/>
  <path d="M50 60q10 12 20 0Z" fill="${SHELL}" stroke="${SHELL}" stroke-width="4" stroke-linejoin="round"/>
  <ellipse cx="34" cy="60" rx="5" ry="3" fill="${CHEEK}"/>
  <ellipse cx="86" cy="60" rx="5" ry="3" fill="${CHEEK}"/>
  <rect x="52" y="84" width="16" height="10" fill="${SHELL}"/>
  <path d="M22 112q4-22 38-22t38 22Z" fill="${SHELL}"/>`;

const pieces = [
  [700, 150, 20], [1160, 36, -30], [690, 330, 45], [1150, 300, 15], [760, 70, -15],
  [1060, 60, 60], [1130, 470, -40], [655, 470, 25], [940, 40, 10], [1170, 200, -60],
];
const confetti = pieces
  .map(([x, y, angle], i) => `<rect x="${x}" y="${y}" width="14" height="22" rx="3" fill="${CONFETTI[i % CONFETTI.length]}" transform="rotate(${angle} ${x + 7} ${y + 11})"/>`)
  .join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#05292d"/>
      <stop offset="1" stop-color="#0b5d63"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#19aab1" stop-opacity="0.45"/>
      <stop offset="1" stop-color="#19aab1" stop-opacity="0"/>
    </radialGradient>
    <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="2" fill="#9ce9e9" fill-opacity="0.08"/>
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#dots)"/>
  <circle cx="920" cy="380" r="330" fill="url(#glow)"/>

  <rect x="80" y="72" width="64" height="88" rx="16" fill="#ffffff"/>
  <svg x="92" y="84" width="40" height="64" viewBox="0 0 29 43">${mark}</svg>
  <text x="168" y="128" font-family="Avenir Next" font-weight="700" font-size="24" letter-spacing="3" fill="#9ce9e9">MISA · FOR BEGINNERS</text>

  <text font-family="Avenir Next" font-weight="700" font-size="96" letter-spacing="-2" fill="#ffffff">
    <tspan x="76" y="280">JavaScript</tspan>
    <tspan x="76" y="378">Workshop</tspan>
  </text>
  <text font-family="Avenir Next" font-weight="500" font-size="30" fill="${FACE}" fill-opacity="0.92">
    <tspan x="80" y="444">Build Bop the Bot, a little browser game,</tspan>
    <tspan x="80" y="486">and learn JS one step at a time.</tspan>
  </text>

  <rect x="80" y="528" width="214" height="54" rx="27" fill="#ffc94d"/>
  <text x="187" y="564" text-anchor="middle" font-family="Avenir Next" font-weight="700" font-size="26" fill="#05292d">js.gmpl.dev</text>

  ${confetti}

  <g transform="translate(700 214) scale(3.7)">${misabot}</g>

  <g transform="translate(828 92)">
    <rect width="300" height="70" rx="22" fill="#ffffff"/>
    <path d="M196 68 L216 98 L226 68 Z" fill="#ffffff"/>
    <text x="150" y="45" text-anchor="middle" font-family="Menlo" font-weight="700" font-size="25" fill="#0b5d63">console.log("Hi!")</text>
  </g>
</svg>`;

const out = join(WEB, 'public', 'og.png');
await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(out);
console.log(`Wrote ${out}`);
