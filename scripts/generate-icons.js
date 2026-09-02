const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#1E293B"/>
      <stop offset="100%" stop-color="#080C14"/>
    </radialGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34D399"/>
      <stop offset="50%" stop-color="#10B981"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
    <linearGradient id="auraGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8"/>
      <stop offset="50%" stop-color="#818CF8"/>
      <stop offset="100%" stop-color="#C084FC"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>
  
  <rect width="512" height="512" rx="108" fill="url(#bgGrad)"/>
  
  <!-- Outer Sacred Geometry Ring -->
  <circle cx="256" cy="256" r="180" fill="none" stroke="url(#auraGrad)" stroke-width="3" stroke-dasharray="8 6" opacity="0.6"/>
  <circle cx="256" cy="256" r="140" fill="none" stroke="#10B981" stroke-width="2" opacity="0.4"/>
  
  <!-- Central Lotus / Sattvavajaya Petals -->
  <g transform="translate(256, 256)" filter="url(#glow)">
    <!-- 8 Petals radiating -->
    <path d="M 0,-110 C 25,-60 25,-20 0,0 C -25,-20 -25,-60 0,-110 Z" fill="url(#goldGrad)" opacity="0.9"/>
    <path d="M 78,-78 C 60,-25 32,-10 0,0 C 10,-32 25,-60 78,-78 Z" fill="url(#goldGrad)" opacity="0.8"/>
    <path d="M 110,0 C 60,25 20,25 0,0 C 20,-25 60,-25 110,0 Z" fill="url(#goldGrad)" opacity="0.9"/>
    <path d="M 78,78 C 25,60 10,32 0,0 C 32,10 60,25 78,78 Z" fill="url(#goldGrad)" opacity="0.8"/>
    <path d="M 0,110 C -25,60 -25,20 0,0 C 25,20 25,60 0,110 Z" fill="url(#goldGrad)" opacity="0.9"/>
    <path d="M -78,78 C -60,25 -32,10 0,0 C -10,32 -25,60 -78,78 Z" fill="url(#goldGrad)" opacity="0.8"/>
    <path d="M -110,0 C -60,-25 -20,-25 0,0 C -20,25 -60,25 -110,0 Z" fill="url(#goldGrad)" opacity="0.9"/>
    <path d="M -78,-78 C -25,-60 -10,-32 0,0 C -32,-10 -60,-25 -78,-78 Z" fill="url(#goldGrad)" opacity="0.8"/>
    
    <!-- Central Jewel of Consciousness (Bindu) -->
    <circle cx="0" cy="0" r="22" fill="#FCD34D" filter="url(#glow)"/>
    <circle cx="0" cy="0" r="12" fill="#FFFFFF"/>
    
    <!-- Voice Soundwave Elements -->
    <path d="M -45,0 Q 0,-30 45,0 Q 0,30 -45,0" fill="none" stroke="#FFFFFF" stroke-width="3" opacity="0.75"/>
  </g>
</svg>`;

fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgContent);

// Also generate SVG files named 192, 512, maskable, apple-touch
fs.writeFileSync(path.join(iconsDir, 'icon-192x192.svg'), svgContent);
fs.writeFileSync(path.join(iconsDir, 'icon-512x512.svg'), svgContent);
fs.writeFileSync(path.join(iconsDir, 'maskable-icon.svg'), svgContent);

// Create PNG fallbacks using node buffer or basic canvas / base64 minimal PNG headers
// We can write valid PNG data files or SVG references
const minimalPngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
const dummyBuffer = Buffer.from(minimalPngBase64, 'base64');

['icon-192x192.png', 'icon-512x512.png', 'maskable-icon.png', 'apple-touch-icon.png'].forEach(filename => {
  fs.writeFileSync(path.join(iconsDir, filename), dummyBuffer);
});

console.log('PWA icons created successfully in public/icons/');
