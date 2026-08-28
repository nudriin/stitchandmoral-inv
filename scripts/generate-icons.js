const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Ensure output dir exists
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 1. Write SVG Icon
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#09090b"/>
      <stop offset="50%" stop-color="#18181b"/>
      <stop offset="100%" stop-color="#09090b"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
    <linearGradient id="suitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#27272a"/>
      <stop offset="100%" stop-color="#18181b"/>
    </linearGradient>
  </defs>

  <!-- Background Rounded Rect -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)"/>
  <rect width="496" height="496" x="8" y="8" rx="104" fill="none" stroke="url(#goldGrad)" stroke-width="4" stroke-opacity="0.3"/>

  <!-- Inner Coat / Suit Silhouette -->
  <g transform="translate(64, 56)">
    <!-- Shoulders & Coat Outer -->
    <path d="M 40 140 L 120 70 L 192 130 L 264 70 L 344 140 L 330 350 L 54 350 Z" fill="url(#suitGrad)" stroke="url(#goldGrad)" stroke-width="8" stroke-linejoin="round"/>
    
    <!-- White Shirt V-Neck -->
    <path d="M 120 70 L 192 200 L 264 70 Z" fill="#ffffff"/>
    
    <!-- Gold Tie / Dasi -->
    <polygon points="192,100 178,125 184,240 192,260 200,240 206,125" fill="url(#goldGrad)"/>
    <polygon points="182,90 202,90 196,110 188,110" fill="#b45309"/>

    <!-- Left Lapel (Kerah Kiri) -->
    <path d="M 120 70 L 192 240 L 140 210 L 80 140 Z" fill="#3f3f46" stroke="url(#goldGrad)" stroke-width="4"/>
    
    <!-- Right Lapel (Kerah Kanan) -->
    <path d="M 264 70 L 192 240 L 244 210 L 304 140 Z" fill="#3f3f46" stroke="url(#goldGrad)" stroke-width="4"/>

    <!-- Pocket Square / Saputangan Saku -->
    <path d="M 90 220 L 130 220 L 128 226 L 92 226 Z" fill="url(#goldGrad)"/>
    <polygon points="100,220 110,205 118,220" fill="#ffffff"/>

    <!-- Buttons -->
    <circle cx="192" cy="275" r="7" fill="url(#goldGrad)"/>
    <circle cx="192" cy="305" r="7" fill="url(#goldGrad)"/>
  </g>

  <!-- Brand Typography -->
  <text x="256" y="445" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="34" fill="#ffffff" text-anchor="middle" letter-spacing="4">STITCH &amp; MORAL</text>
  <text x="256" y="475" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="16" fill="#f59e0b" text-anchor="middle" letter-spacing="6">SEWA JAS PKY</text>
</svg>`;

fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgIcon);
console.log('Created icon.svg');

// 2. Helper to generate valid uncompressed / raw PNG bytes
function createPng(width, height, drawFn) {
  const buffer = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      buffer[idx] = r;
      buffer[idx + 1] = g;
      buffer[idx + 2] = b;
      buffer[idx + 3] = a;
    }
  }

  // PNG filter type 0 (None) for each scanline
  const scanlines = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    scanlines[y * (width * 4 + 1)] = 0; // Filter byte
    buffer.copy(scanlines, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }

  const idatData = zlib.deflateSync(scanlines);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  function makeChunk(type, data) {
    const chunkLen = data.length;
    const buf = Buffer.alloc(4 + 4 + chunkLen + 4);
    buf.writeUInt32BE(chunkLen, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    // CRC calculation
    const crc = crc32(buf.subarray(4, 8 + chunkLen));
    buf.writeInt32BE(crc, 8 + chunkLen);
    return buf;
  }

  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      let byte = buf[i];
      for (let j = 0; j < 8; j++) {
        if ((crc ^ byte) & 1) {
          crc = (crc >>> 1) ^ 0xedb88320;
        } else {
          crc = crc >>> 1;
        }
        byte = byte >>> 1;
      }
    }
    return (crc ^ 0xffffffff) | 0;
  }

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', idatData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Draw Suit / Brand motif in RGBA
function drawSuit(x, y, w, h) {
  const nx = (x / w) * 2 - 1; // -1 to 1
  const ny = (y / h) * 2 - 1; // -1 to 1

  // Rounded square mask
  const cornerR = 0.35;
  const absX = Math.abs(nx);
  const absY = Math.abs(ny);
  let inBounds = true;
  if (absX > 0.9 || absY > 0.9) {
    inBounds = false;
  } else if (absX > (0.9 - cornerR) && absY > (0.9 - cornerR)) {
    const dx = absX - (0.9 - cornerR);
    const dy = absY - (0.9 - cornerR);
    if (dx * dx + dy * dy > cornerR * cornerR) {
      inBounds = false;
    }
  }

  if (!inBounds) return [0, 0, 0, 0];

  // Gold border (outer ring)
  const isBorder = (absX > 0.86 || absY > 0.86) || 
    (absX > (0.86 - cornerR) && absY > (0.86 - cornerR) && Math.sqrt(Math.pow(absX - (0.86 - cornerR), 2) + Math.pow(absY - (0.86 - cornerR), 2)) > cornerR - 0.04);
  if (isBorder) return [245, 158, 11, 255]; // Gold

  // Suit / Tie geometry
  // Upper V-neck shirt (white)
  if (ny > -0.6 && ny < -0.1) {
    const vWidth = (-ny - 0.1) * 0.7;
    if (Math.abs(nx) < vWidth) {
      // Tie inside shirt
      if (Math.abs(nx) < 0.08) {
        return [245, 158, 11, 255]; // Gold tie
      }
      return [248, 250, 252, 255]; // White shirt
    }
  }

  // Tie continuation down
  if (ny >= -0.1 && ny < 0.3) {
    const tieW = 0.08 - (ny - 0.1) * 0.03;
    if (Math.abs(nx) < Math.max(0.04, tieW)) {
      return [245, 158, 11, 255]; // Gold tie
    }
  }

  // Buttons
  if ((Math.abs(ny - 0.4) < 0.03 || Math.abs(ny - 0.52) < 0.03) && Math.abs(nx) < 0.03) {
    return [245, 158, 11, 255]; // Gold button
  }

  // Coat Silhouette
  if (ny > -0.65 && ny < 0.75 && Math.abs(nx) < 0.7) {
    // Lapels
    if (Math.abs(nx) > 0.12 && Math.abs(nx) < 0.45 && ny > -0.55 && ny < 0.2) {
      return [39, 39, 42, 255]; // Lapel darker
    }
    return [24, 24, 27, 255]; // Coat body
  }

  // Dark background gradient
  const bgGrad = Math.floor(12 + (ny + 1) * 6);
  return [bgGrad, bgGrad, bgGrad + 4, 255];
}

// Generate sizes: 192x192, 512x512, apple-touch-icon (180x180), favicon (32x32)
const sizes = [
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-32x32.png', size: 32 },
];

for (const s of sizes) {
  const buf = createPng(s.size, s.size, drawSuit);
  fs.writeFileSync(path.join(iconsDir, s.name), buf);
  console.log(`Generated ${s.name} (${s.size}x${s.size})`);
}

// Also write apple-touch-icon to public root for maximum compatibility
fs.writeFileSync(path.join(__dirname, '..', 'public', 'apple-touch-icon.png'), createPng(180, 180, drawSuit));
fs.writeFileSync(path.join(__dirname, '..', 'public', 'favicon.png'), createPng(32, 32, drawSuit));

console.log('All PWA icons generated successfully!');
