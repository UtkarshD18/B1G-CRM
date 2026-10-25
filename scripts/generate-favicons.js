const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const pathData = `
  M 256 226
  C 276 190, 298 180, 322 180
  A 76 76 0 0 1 398 256
  C 398 274, 388 290, 374 302
  L 396 338
  L 344 324
  C 337 329, 329 332, 322 332
  C 298 332, 276 322, 256 286
  C 236 322, 214 332, 190 332
  A 76 76 0 0 1 114 256
  A 76 76 0 0 1 190 180
  C 214 180, 236 190, 256 226
  Z
  M 190 218
  A 38 38 0 1 0 190 294
  A 38 38 0 1 0 190 218
  Z
  M 322 218
  A 38 38 0 1 0 322 294
  A 38 38 0 1 0 322 218
  Z
`.trim().replace(/\s+/g, ' ');

// 1. Dark theme SVG
const darkSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgDark" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#141c24"/>
      <stop offset="100%" stop-color="#0a1017"/>
    </linearGradient>
    <linearGradient id="neonTeal" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#10b981"/>
      <stop offset="45%" stop-color="#14b8a6"/>
      <stop offset="75%" stop-color="#06b6d4"/>
      <stop offset="100%" stop-color="#38bdf8"/>
    </linearGradient>
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="18" result="blur1"/>
      <feGaussianBlur stdDeviation="30" result="blur2"/>
      <feMerge>
        <feMergeNode in="blur2"/>
        <feMergeNode in="blur1"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="512" height="512" rx="118" fill="url(#bgDark)"/>
  <rect width="508" height="508" x="2" y="2" rx="116" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="2"/>
  <g filter="url(#glow)" opacity="0.45">
    <path d="${pathData}" fill="url(#neonTeal)" fill-rule="evenodd"/>
  </g>
  <path d="${pathData}" fill="url(#neonTeal)" fill-rule="evenodd"/>
</svg>`;

// 2. Light theme SVG (Teal tile with crisp white mark)
const lightSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgTeal" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0fa383"/>
      <stop offset="60%" stop-color="#0d8e80"/>
      <stop offset="100%" stop-color="#07797e"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="rgba(0,0,0,0.18)"/>
    </filter>
  </defs>
  <rect width="512" height="512" rx="118" fill="url(#bgTeal)"/>
  <rect width="508" height="508" x="2" y="2" rx="116" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>
  <g filter="url(#shadow)">
    <path d="${pathData}" fill="#ffffff" fill-rule="evenodd"/>
  </g>
</svg>`;

// 3. Adaptive SVG with media queries
const adaptiveSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgDark" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#141c24"/>
      <stop offset="100%" stop-color="#0a1017"/>
    </linearGradient>
    <linearGradient id="neonTeal" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#10b981"/>
      <stop offset="45%" stop-color="#14b8a6"/>
      <stop offset="75%" stop-color="#06b6d4"/>
      <stop offset="100%" stop-color="#38bdf8"/>
    </linearGradient>
    <filter id="darkGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="18" result="blur1"/>
      <feGaussianBlur stdDeviation="30" result="blur2"/>
      <feMerge>
        <feMergeNode in="blur2"/>
        <feMergeNode in="blur1"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <linearGradient id="bgTeal" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0fa383"/>
      <stop offset="60%" stop-color="#0d8e80"/>
      <stop offset="100%" stop-color="#07797e"/>
    </linearGradient>
    <filter id="lightShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="rgba(0,0,0,0.18)"/>
    </filter>
  </defs>
  <style>
    .theme-light { display: block; }
    .theme-dark { display: none; }
    @media (prefers-color-scheme: dark) {
      .theme-light { display: none; }
      .theme-dark { display: block; }
    }
  </style>

  <!-- Light theme: Teal tile with solid white mark -->
  <g class="theme-light">
    <rect width="512" height="512" rx="118" fill="url(#bgTeal)"/>
    <rect width="508" height="508" x="2" y="2" rx="116" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>
    <g filter="url(#lightShadow)">
      <path d="${pathData}" fill="#ffffff" fill-rule="evenodd"/>
    </g>
  </g>

  <!-- Dark theme: Dark tile with glowing neon mark -->
  <g class="theme-dark">
    <rect width="512" height="512" rx="118" fill="url(#bgDark)"/>
    <rect width="508" height="508" x="2" y="2" rx="116" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="2"/>
    <g filter="url(#darkGlow)" opacity="0.45">
      <path d="${pathData}" fill="url(#neonTeal)" fill-rule="evenodd"/>
    </g>
    <path d="${pathData}" fill="url(#neonTeal)" fill-rule="evenodd"/>
  </g>
</svg>`;

async function main() {
  const publicDir = path.join(__dirname, '..', 'client', 'public');

  // Save SVGs
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), adaptiveSvg, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'favicon-light.svg'), lightSvg, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'favicon-dark.svg'), darkSvg, 'utf8');
  console.log('✓ SVGs written to client/public');

  // Launch browser for raster PNGs (apple-touch-icon 180x180, 32x32, 16x16)
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });

  const page = await browser.newPage();

  async function renderPng(svgContent, size, outputPath) {
    await page.setViewport({ width: size, height: size });
    await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden;background:transparent;">${svgContent}</body></html>`);
    await page.screenshot({ path: outputPath, omitBackground: true });
    console.log(`✓ Generated ${path.basename(outputPath)} (${size}x${size})`);
  }

  // Apple touch icon (180x180) - use dark tile (recommended)
  await renderPng(darkSvg, 180, path.join(publicDir, 'apple-touch-icon.png'));
  await renderPng(darkSvg, 96, path.join(publicDir, 'favicon-96x96.png'));
  await renderPng(darkSvg, 48, path.join(publicDir, 'favicon-48x48.png'));
  await renderPng(darkSvg, 32, path.join(publicDir, 'favicon-32x32.png'));
  await renderPng(darkSvg, 16, path.join(publicDir, 'favicon-16x16.png'));

  await browser.close();
  console.log('✓ All favicon assets generated successfully!');
}

main().catch(console.error);
