const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const SIZE = 192;
const INK = '#2b1b24';
const LINE = `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
const THIN = `stroke="${INK}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"`;
const sleep = ms => new Promise(r => setTimeout(r, ms));

const SKIN = { base: '#fde4d4', shade: '#f2bfae', blush: '#f7a3a3' };

function lace(base, thread) {
  const scallops = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return `<circle cx="${(32 + Math.cos(a) * 24).toFixed(1)}" cy="${(32 + Math.sin(a) * 24).toFixed(1)}" r="5.5"/>`;
  }).join('');
  return `
    <defs>
      <pattern id="lace" width="64" height="64" patternUnits="userSpaceOnUse">
        <g fill="none" stroke="${thread}" stroke-width="1.4">
          ${scallops}
          <circle cx="32" cy="32" r="17"/>
          <circle cx="32" cy="32" r="11" stroke-dasharray="1.5 3"/>
          <circle cx="32" cy="32" r="4"/>
          <circle cx="0" cy="0" r="5"/><circle cx="64" cy="0" r="5"/><circle cx="0" cy="64" r="5"/><circle cx="64" cy="64" r="5"/>
        </g>
      </pattern>
    </defs>
    <rect width="${SIZE}" height="${SIZE}" fill="${base}"/>
    <rect width="${SIZE}" height="${SIZE}" fill="url(#lace)"/>`;
}

function eye({ id, x, y, w, h, side, iris, lid = 0 }) {
  const rx = w / 2;
  const ry = h / 2;
  const outer = x + side * rx * 1.08;
  const inner = x - side * rx * 0.95;
  const top = y - ry + lid * h;
  const lidPath = `M${inner},${y - ry * 0.66 + lid * h} Q${x - side * rx * 0.15},${top - ry * 0.4} ${outer},${y - ry * 0.32 + lid * h} L${outer + side * 5},${y - ry * 0.02 + lid * h}`;
  return `
    <defs>
      <clipPath id="${id}"><path d="M${x - rx},${y} C${x - rx},${y - ry * 1.15} ${x + rx},${y - ry * 1.15} ${x + rx},${y} C${x + rx},${y + ry * 1.05} ${x - rx},${y + ry * 1.05} ${x - rx},${y} Z${lid ? ` M0,0 H${SIZE} V${top} H0 Z` : ''}" clip-rule="evenodd"/></clipPath>
      <linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${iris[0]}"/><stop offset="0.55" stop-color="${iris[1]}"/><stop offset="1" stop-color="${iris[2]}"/></linearGradient>
    </defs>
    <g clip-path="url(#${id})">
      <rect x="${x - rx - 2}" y="${y - ry - 4}" width="${w + 4}" height="${h + 8}" fill="#ffffff"/>
      <ellipse cx="${x - side * rx * 0.04}" cy="${y + ry * 0.12}" rx="${rx * 0.84}" ry="${ry * 0.92}" fill="url(#${id}g)" stroke="${INK}" stroke-width="1.6"/>
      <ellipse cx="${x - side * rx * 0.04}" cy="${y + ry * 0.05}" rx="${rx * 0.4}" ry="${ry * 0.48}" fill="${iris[0]}"/>
      <ellipse cx="${x - side * rx * 0.04}" cy="${y + ry * 0.62}" rx="${rx * 0.5}" ry="${ry * 0.18}" fill="${iris[2]}" opacity="0.7"/>
      ${lid ? '' : `<rect x="${x - rx - 2}" y="${y - ry - 4}" width="${w + 4}" height="${ry * 0.3}" fill="${INK}" opacity="0.35"/>`}
      <ellipse cx="${x - side * rx * 0.28}" cy="${y - ry * 0.3 + lid * h * 0.5}" rx="${rx * 0.32}" ry="${ry * 0.26}" fill="#ffffff"/>
      <circle cx="${x + side * rx * 0.36}" cy="${y + ry * 0.42}" r="${rx * 0.14}" fill="#ffffff"/>
    </g>
    <path d="${lidPath}" fill="none" stroke="${INK}" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M${x + side * rx * 0.1},${y + ry * 0.98} Q${x + side * rx * 0.55},${y + ry * 0.95} ${x + side * rx * 0.8},${y + ry * 0.7}" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`;
}

function bell({ id, x, y, r, tilt = 0 }) {
  return `
    <defs><radialGradient id="${id}" cx="0.36" cy="0.32" r="0.75"><stop offset="0" stop-color="#fff5b0"/><stop offset="0.35" stop-color="#f9cb48"/><stop offset="0.85" stop-color="#e3a02a"/><stop offset="1" stop-color="#c57d1c"/></radialGradient></defs>
    <g transform="rotate(${tilt} ${x} ${y})">
      <circle cx="${x}" cy="${y}" r="${r}" fill="url(#${id})" ${LINE}/>
      <path d="M${x - r * 0.92},${y - r * 0.05} Q${x},${y + r * 0.22} ${x + r * 0.92},${y - r * 0.05}" fill="none" stroke="${INK}" stroke-width="1.6" opacity="0.55"/>
      <circle cx="${x}" cy="${y + r * 0.3}" r="${r * 0.17}" fill="${INK}"/>
      <path d="M${x},${y + r * 0.3} L${x},${y + r * 0.96}" stroke="${INK}" stroke-width="${r * 0.13}" stroke-linecap="round"/>
      <ellipse cx="${x - r * 0.38}" cy="${y - r * 0.42}" rx="${r * 0.2}" ry="${r * 0.12}" transform="rotate(-35 ${x - r * 0.38} ${y - r * 0.42})" fill="#ffffff" opacity="0.85"/>
    </g>`;
}

function bow({ x, y, s, fill, shade }) {
  return `
    <g transform="translate(${x} ${y}) scale(${s})">
      <path d="M0,0 L-14,-9 C-18,-4 -18,5 -14,9 Z" fill="${fill}" ${THIN}/>
      <path d="M0,0 L14,-9 C18,-4 18,5 14,9 Z" fill="${fill}" ${THIN}/>
      <path d="M-2,2 L-8,16 L-3,14 L0,18 Z M2,2 L8,16 L3,14 L0,18 Z" fill="${shade}" ${THIN}/>
      <rect x="-4" y="-4" width="8" height="8" rx="2" fill="${shade}" ${THIN}/>
    </g>`;
}

function face(d, clip) {
  return `
    <defs><clipPath id="${clip}"><path d="${d}"/></clipPath></defs>
    <path d="${d}" fill="${SKIN.base}" ${LINE}/>`;
}

function sweat(x, y, s = 1) {
  return `<path transform="translate(${x} ${y}) scale(${s})" d="M0,-9 C3,-3 6,1 6,4 C6,8 3,10 0,10 C-3,10 -6,8 -6,4 C-6,1 -3,-3 0,-9 Z" fill="#dff2ff" ${THIN}/>`;
}

function dejiko() {
  const hair = { base: '#86d9a0', shade: '#4fae7a', light: '#d2f7da' };
  const faceD = 'M54,96 C54,128 72,150 96,151 C120,150 138,128 138,96 C138,70 120,56 96,56 C72,56 54,70 54,96 Z';
  return `
    ${lace('#cfe2ef', '#eef6fb')}
    <path d="M34,192 C36,172 54,160 76,158 L116,158 C138,160 156,172 158,192 Z" fill="#2b3a8e" ${LINE}/>
    <path d="M58,192 C62,180 70,172 76,170 L116,170 C122,172 130,180 134,192 Z" fill="#ffffff" ${THIN}/>
    <path d="M60,160 Q64,173 74,167 Q80,178 88,169 Q96,180 104,169 Q112,178 118,167 Q128,173 132,160 C114,152 78,152 60,160 Z" fill="#ffffff" ${LINE}/>
    <path d="M46,82 C40,118 44,146 54,160 C62,150 66,138 68,126 L124,126 C126,138 130,150 138,160 C148,146 152,118 146,82 C140,52 120,42 96,42 C72,42 52,52 46,82 Z" fill="${hair.shade}" ${LINE}/>
    <path d="M52,152 C44,158 36,158 32,150 C40,154 46,150 50,142 Z" fill="${hair.base}" ${THIN}/>
    <path d="M140,152 C148,158 156,158 160,150 C152,154 146,150 142,142 Z" fill="${hair.base}" ${THIN}/>
    <path d="M86,140 L106,140 L106,160 L86,160 Z" fill="${SKIN.shade}" ${THIN}/>
    ${face(faceD, 'dejikoFace')}
    <g clip-path="url(#dejikoFace)"><path d="M50,100 C70,104 84,100 96,102 C108,100 122,104 142,100 L142,50 L50,50 Z" fill="${SKIN.shade}"/></g>
    <ellipse cx="64" cy="132" rx="8" ry="3.5" fill="${SKIN.blush}" opacity="0.55"/>
    <ellipse cx="128" cy="132" rx="8" ry="3.5" fill="${SKIN.blush}" opacity="0.55"/>
    ${eye({ id: 'dl', x: 76, y: 114, w: 25, h: 31, side: -1, iris: ['#0f4d2a', '#2f9a58', '#8fe8a6'] })}
    ${eye({ id: 'dr', x: 116, y: 114, w: 25, h: 31, side: 1, iris: ['#0f4d2a', '#2f9a58', '#8fe8a6'] })}
    <path d="M89,135 Q96,132 103,135 Q101,146 96,146 Q91,146 89,135 Z" fill="#a52a3a" ${THIN}/>
    <path d="M91.5,141.5 Q96,138.5 100.5,141.5 Q99,145 96,145 Q93,145 91.5,141.5 Z" fill="#f28a9a"/>
    <path d="M54,80 C44,104 44,132 50,152 C55,140 59,124 60,108 C61,98 60,90 58,84 Z" fill="${hair.base}" ${LINE}/>
    <path d="M138,80 C148,104 148,132 142,152 C137,140 133,124 132,108 C131,98 132,90 134,84 Z" fill="${hair.base}" ${LINE}/>
    <path d="M50,104 C46,72 68,50 96,50 C124,50 146,72 142,104 Q138,92 134,82 Q132,92 126,99 Q124,86 118,77 Q116,88 110,95 Q108,82 103,73 Q102,88 96,101 Q90,88 89,73 Q84,82 82,95 Q76,88 74,77 Q68,86 66,99 Q60,92 58,82 Q54,92 50,104 Z" fill="${hair.base}" ${LINE}/>
    <path d="M70,62 Q78,70 76,80 Q72,70 64,68 Z M122,62 Q114,70 116,80 Q120,70 128,68 Z" fill="${hair.shade}"/>
    <path d="M66,64 L72,58 L74,66 L80,58 M112,58 L118,66 L120,58 L126,64" fill="none" stroke="${hair.light}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M52,50 L36,8 L78,30 Z" fill="#ffffff" ${LINE}/>
    <path d="M55,40 L44,16 L68,30 Z" fill="#f4a3bd"/>
    <path d="M140,50 L156,8 L114,30 Z" fill="#ffffff" ${LINE}/>
    <path d="M137,40 L148,16 L124,30 Z" fill="#f4a3bd"/>
    <path d="M42,68 C40,38 66,22 96,22 C126,22 152,38 150,68 C134,56 116,52 96,52 C76,52 58,56 42,68 Z" fill="#ffffff" ${LINE}/>
    <path d="M48,62 C62,54 80,50 96,50 C112,50 130,54 144,62 C130,58 112,56 96,56 C80,56 62,58 48,62 Z" fill="#dfe5ef"/>
    <path d="M100,28 C100,18 120,16 122,28 Z" fill="#e8e486" ${THIN}/>
    <path d="M96,54 C92,30 74,14 56,24 C70,20 84,32 89,54 Z" fill="${hair.base}" ${THIN}/>
    ${bow({ x: 48, y: 82, s: 0.85, fill: '#33449c', shade: '#1f2a6a' })}
    ${bow({ x: 144, y: 82, s: 0.85, fill: '#33449c', shade: '#1f2a6a' })}
    ${bell({ id: 'b1', x: 30, y: 104, r: 22, tilt: 18 })}
    ${bell({ id: 'b2', x: 162, y: 104, r: 22, tilt: -18 })}
    ${bell({ id: 'b3', x: 96, y: 176, r: 15, tilt: 0 })}`;
}

function puchiko() {
  const hair = { base: '#8f6b66', shade: '#6a4a4c', light: '#cdb3bd' };
  const hat = { base: '#f3ca7c', shade: '#dba659', stripe: '#a87a3c' };
  const faceD = 'M54,104 C54,142 72,162 96,162 C120,162 138,142 138,104 C138,84 120,74 96,74 C72,74 54,84 54,104 Z';
  return `
    ${lace('#f5e9d3', '#fdf7ec')}
    <path d="M34,98 C26,130 30,162 44,180 L148,180 C162,162 166,130 158,98 Z" fill="${hair.shade}" ${LINE}/>
    <path d="M54,192 C58,178 70,168 84,166 L108,166 C122,168 134,178 138,192 Z" fill="#ffffff" ${LINE}/>
    <path d="M62,192 L74,170 L84,166 L96,182 L108,166 L118,170 L130,192" fill="none" stroke="#2f3f8f" stroke-width="3"/>
    <path d="M84,166 L96,182 L108,166 Z" fill="#7fd0a2" ${THIN}/>
    <path d="M92,178 L86,192 L96,188 L106,192 L100,178 Z" fill="#7fd0a2" ${THIN}/>
    <path d="M88,152 L104,152 L104,168 L88,168 Z" fill="${SKIN.shade}" ${THIN}/>
    ${face(faceD, 'puchikoFace')}
    <g clip-path="url(#puchikoFace)"><path d="M50,110 C70,114 84,110 96,112 C108,110 122,114 142,110 L142,60 L50,60 Z" fill="${SKIN.shade}"/></g>
    <ellipse cx="64" cy="142" rx="8" ry="3.5" fill="${SKIN.blush}" opacity="0.6"/>
    <ellipse cx="128" cy="142" rx="8" ry="3.5" fill="${SKIN.blush}" opacity="0.6"/>
    ${eye({ id: 'pl', x: 75, y: 124, w: 29, h: 35, side: -1, iris: ['#2c1c0e', '#6a5424', '#c8ae4a'] })}
    ${eye({ id: 'pr', x: 117, y: 124, w: 29, h: 35, side: 1, iris: ['#2c1c0e', '#6a5424', '#c8ae4a'] })}
    <path d="M93,148 L99,152 M99,148 L93,152" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M56,92 C42,124 38,156 34,178 C44,166 51,150 56,134 C59,120 60,106 60,96 Z" fill="${hair.base}" ${LINE}/>
    <path d="M136,92 C150,124 154,156 158,178 C148,166 141,150 136,134 C133,120 132,106 132,96 Z" fill="${hair.base}" ${LINE}/>
    <path d="M38,176 L30,188 L42,184 Z M154,176 L162,188 L150,184 Z" fill="${hair.base}" ${THIN}/>
    ${bell({ id: 'b1', x: 38, y: 172, r: 7, tilt: 10 })}
    ${bell({ id: 'b2', x: 154, y: 172, r: 7, tilt: -10 })}
    <path d="M52,106 C48,84 70,70 96,70 C122,70 144,84 140,106 Q136,98 132,92 Q132,104 126,112 Q122,96 116,88 Q116,104 108,112 Q106,96 102,86 Q102,104 96,116 Q90,104 90,86 Q86,96 84,112 Q76,104 76,88 Q70,96 66,112 Q60,104 60,92 Q56,98 52,106 Z" fill="${hair.base}" ${LINE}/>
    <path d="M70,84 L76,80 L78,88 L84,80 M108,80 L114,88 L116,80 L122,84" fill="none" stroke="${hair.light}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M40,52 L28,4 L80,26 Z" fill="${hat.base}" ${LINE}/>
    <path d="M44,44 L36,14 L68,28 Z" fill="#f4a8ba"/>
    <path d="M144,24 L196,6 L180,70 Z" fill="${hat.base}" ${LINE}/>
    <path d="M150,28 L186,16 L176,60 Z" fill="#f4a8ba"/>
    <path d="M20,116 C10,56 50,18 96,18 C144,18 182,56 172,116 C156,96 128,84 96,84 C64,84 36,96 20,116 Z" fill="${hat.base}" ${LINE}/>
    <path d="M24,110 C44,92 70,82 96,82 C122,82 148,92 168,110 C148,96 122,88 96,88 C70,88 44,96 24,110 Z" fill="${hat.shade}"/>
    <path d="M72,21 L82,46 L90,19 Z M106,19 L112,42 L122,21 Z M18,72 L44,80 L18,88 Z M174,68 L148,78 L174,86 Z M36,40 L56,54 L44,32 Z M156,36 L138,52 L148,30 Z" fill="${hat.stripe}"/>
    <g transform="translate(140 52)">
      ${[0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-7" rx="5.5" ry="7" transform="rotate(${a})" fill="#ffffff" ${THIN}/>`).join('')}
      <circle r="4.5" fill="#e0457a" ${THIN}/>
    </g>
`;
}

function gema() {
  return `
    ${lace('#dcf0df', '#f1faf2')}
    <defs><radialGradient id="gemaBody" cx="0.42" cy="0.4" r="0.62"><stop offset="0" stop-color="#fbf686"/><stop offset="0.72" stop-color="#f8ea70"/><stop offset="1" stop-color="#f1c35c"/></radialGradient></defs>
    <path d="M42,112 C30,124 22,140 18,156" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M150,104 C160,104 170,96 176,84" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="17" cy="160" r="9" fill="#f7941e" ${LINE}/>
    <circle cx="178" cy="80" r="9" fill="#f7941e" ${LINE}/>
    <circle cx="14" cy="157" r="2.8" fill="#ffd28a"/>
    <circle cx="175" cy="77" r="2.8" fill="#ffd28a"/>
    <ellipse cx="96" cy="176" rx="46" ry="6" fill="#9cc7a3" opacity="0.6"/>
    <circle cx="96" cy="100" r="62" fill="url(#gemaBody)" ${LINE}/>
    <path d="M84,104 L96,80 L108,104 C100,106 92,106 84,104 Z" fill="#f2786a" ${THIN}/>
    <path d="M92,90 L96,83" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.8"/>
    <circle cx="82" cy="124" r="3.4" fill="${INK}"/>
    <circle cx="110" cy="124" r="3.4" fill="${INK}"/>
    <ellipse cx="70" cy="64" rx="14" ry="8" transform="rotate(-35 70 64)" fill="#ffffff" opacity="0.6"/>`;
}

function rabi() {
  const hair = { base: '#c370b8', shade: '#97468f', light: '#efbde8' };
  const faceD = 'M56,98 C56,130 74,150 96,151 C118,150 136,130 136,98 C136,72 118,58 96,58 C74,58 56,72 56,98 Z';
  const rose = (x, y, r) => `
    <g transform="translate(${x} ${y})">
      <path d="M${-r * 1.4},${r * 0.5} C${-r * 1.2},${-r * 0.2} ${-r * 0.6},${-r * 0.3} ${-r * 0.4},${r * 0.2} Z M${r * 1.4},${r * 0.6} C${r * 1.1},${-r * 0.1} ${r * 0.6},${-r * 0.2} ${r * 0.4},${r * 0.3} Z" fill="#8cbc72" ${THIN}/>
      <circle r="${r}" fill="#f07c92" ${THIN}/>
      <path d="M${-r * 0.55},${-r * 0.1} C${-r * 0.4},${-r * 0.75} ${r * 0.5},${-r * 0.7} ${r * 0.55},${-r * 0.05} C${r * 0.5},${r * 0.5} ${-r * 0.2},${r * 0.55} ${-r * 0.25},${r * 0.05} C${-r * 0.2},${-r * 0.3} ${r * 0.25},${-r * 0.3} ${r * 0.2},${r * 0.05}" fill="none" stroke="#b83a5a" stroke-width="1.6" stroke-linecap="round"/>
    </g>`;
  return `
    ${lace('#f6cbd2', '#fce8ec')}
    ${rose(18, 176, 15)}
    ${rose(176, 180, 13)}
    <path d="M58,62 C30,40 18,8 26,-8 L46,-8 C52,18 66,40 74,58 Z" fill="#ffffff" ${LINE}/>
    <path d="M52,52 C36,34 30,14 32,-6 L40,-6 C42,16 52,34 62,50 Z" fill="#ece4ef"/>
    <path d="M134,62 C162,40 176,8 168,-8 L148,-8 C140,18 126,40 118,58 Z" fill="#ffffff" ${LINE}/>
    <path d="M140,52 C156,34 162,14 160,-6 L152,-6 C150,16 140,34 130,50 Z" fill="#ece4ef"/>
    <path d="M50,72 C26,104 20,152 28,192 L50,192 C46,150 52,112 66,88 Z" fill="${hair.base}" ${LINE}/>
    <path d="M142,72 C166,104 172,152 164,192 L142,192 C146,150 140,112 126,88 Z" fill="${hair.base}" ${LINE}/>
    <path d="M38,120 C34,146 34,170 38,192 L44,192 C40,168 40,146 44,124 Z M154,120 C158,146 158,170 154,192 L148,192 C152,168 152,146 148,124 Z" fill="${hair.shade}"/>
    <path d="M50,84 C46,118 50,150 58,192 L134,192 C142,150 146,118 142,84 C136,58 118,48 96,48 C74,48 56,58 50,84 Z" fill="${hair.shade}" ${LINE}/>
    <path d="M56,192 C60,174 72,164 86,162 L106,162 C120,164 132,174 136,192 Z" fill="#ffffff" ${LINE}/>
    <path d="M58,170 Q52,176 56,184 Q50,190 54,192 M134,170 Q140,176 136,184 Q142,190 138,192" fill="none" ${THIN}/>
    <path d="M70,192 C74,184 80,180 84,180 M122,192 C118,184 112,180 108,180" fill="none" stroke="#e6dce8" stroke-width="3"/>
    <path d="M88,140 L104,140 L104,164 L88,164 Z" fill="${SKIN.shade}" ${THIN}/>
    ${bow({ x: 96, y: 170, s: 1.05, fill: '#e33a52', shade: '#b0213a' })}
    ${face(faceD, 'rabiFace')}
    <g clip-path="url(#rabiFace)"><path d="M52,100 C70,104 84,100 96,102 C108,100 122,104 140,100 L140,50 L52,50 Z" fill="${SKIN.shade}"/></g>
    <ellipse cx="66" cy="130" rx="8" ry="3.5" fill="${SKIN.blush}" opacity="0.55"/>
    <ellipse cx="126" cy="130" rx="8" ry="3.5" fill="${SKIN.blush}" opacity="0.55"/>
    ${eye({ id: 'rl', x: 77, y: 114, w: 24, h: 28, side: -1, iris: ['#5e0a1c', '#c32a40', '#f6788a'], lid: 0.28 })}
    ${eye({ id: 'rr', x: 115, y: 114, w: 24, h: 28, side: 1, iris: ['#5e0a1c', '#c32a40', '#f6788a'], lid: 0.28 })}
    <path d="M66,98 Q76,94 86,99 M106,99 Q116,94 126,98" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>
    <path d="M89,138 Q96,143 104,136" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>
    <path d="M58,80 C48,104 48,128 54,148 C59,136 62,120 62,104 Z" fill="${hair.base}" ${LINE}/>
    <path d="M134,80 C144,104 144,128 138,148 C133,136 130,120 130,104 Z" fill="${hair.base}" ${LINE}/>
    <path d="M52,104 C48,72 70,54 96,54 C122,54 144,72 140,104 Q136,94 132,86 Q130,96 124,103 Q122,90 116,80 Q114,92 108,99 Q106,86 100,76 Q100,92 96,104 Q92,92 92,76 Q86,86 84,99 Q78,92 76,80 Q70,90 68,103 Q62,96 60,86 Q56,94 52,104 Z" fill="${hair.base}" ${LINE}/>
    <path d="M70,68 L76,62 L78,70 L84,62 M108,62 L114,70 L116,62 L122,68" fill="none" stroke="${hair.light}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M92,56 C88,40 94,28 106,24 C98,32 96,42 98,56 Z" fill="${hair.base}" ${THIN}/>
    ${bow({ x: 52, y: 70, s: 1.15, fill: '#9a1d34', shade: '#6c1022' })}
    ${bow({ x: 140, y: 70, s: 1.15, fill: '#9a1d34', shade: '#6c1022' })}
    <g transform="rotate(-14 148 46)">
      <rect x="136" y="34" width="24" height="24" rx="5" fill="#ffffff" ${LINE}/>
      <circle cx="148" cy="46" r="5.5" fill="#e03048"/>
      <circle cx="141.5" cy="39.5" r="2" fill="${INK}"/>
      <circle cx="154.5" cy="52.5" r="2" fill="${INK}"/>
    </g>`;
}

function otaku() {
  const lens = '#e3eaee';
  const tallFace = 'M102,64 C102,98 112,118 126,118 C140,118 150,98 150,64 Z';
  const roundFace = 'M26,116 C26,148 44,168 68,168 C92,168 110,148 110,116 C110,98 92,86 68,86 C44,86 26,98 26,116 Z';
  return `
    <defs><linearGradient id="night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#121b30"/><stop offset="1" stop-color="#3a5274"/></linearGradient></defs>
    ${lace('url(#night)', '#2c3e5e')}
    <path d="M96,192 C98,150 110,132 126,130 C142,132 160,144 170,192 Z" fill="#3f62b8" ${LINE}/>
    <path d="M112,192 C114,162 120,146 126,142 C132,146 138,162 140,192 Z" fill="#f0f0f0" ${THIN}/>
    <circle cx="126" cy="166" r="9" fill="#86d9a0" ${THIN}/>
    <path d="M118,110 L134,110 L134,134 L118,134 Z" fill="${SKIN.shade}" ${THIN}/>
    <path d="M100,40 C92,64 90,96 98,118 L104,96 C104,108 106,116 108,120 L110,90 L142,90 L144,120 C146,116 148,108 148,96 L154,118 C162,96 160,64 152,40 C144,24 108,24 100,40 Z" fill="#262735" ${LINE}/>
    ${face(tallFace, 'tallFace')}
    <path d="M98,64 L90,46 L101,49 L98,30 L111,39 L116,20 L126,33 L137,20 L141,38 L154,30 L151,49 L162,46 L154,64 C140,56 112,56 98,64 Z" fill="#262735" ${LINE}/>
    <path d="M110,34 L118,30 L116,38 M132,30 L140,34" fill="none" stroke="#5a5e7e" stroke-width="2" stroke-linecap="round"/>
    <path d="M102,62 L104,78 L110,66 L116,82 L122,66 L126,80 L130,66 L136,82 L142,66 L148,78 L150,62 Z" fill="#262735" ${THIN}/>
    <path d="M100,58 C116,54 136,52 152,56 L152,64 C136,60 116,62 100,66 Z" fill="#d6282a" ${THIN}/>
    <path d="M152,58 C160,56 166,60 170,54 C168,64 160,66 152,64 Z" fill="#d6282a" ${THIN}/>
    <ellipse cx="114" cy="80" rx="10" ry="8.5" fill="${lens}" ${THIN}/>
    <ellipse cx="138" cy="80" rx="10" ry="8.5" fill="${lens}" ${THIN}/>
    <path d="M124,79 L128,79 M104,78 L101,74 M148,78 L151,74" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>
    <circle cx="115" cy="81" r="1.8" fill="${INK}"/>
    <circle cx="137" cy="81" r="1.8" fill="${INK}"/>
    <path d="M117,98 Q126,94 135,98 Q132,108 126,108 Q120,108 117,98 Z" fill="#e48a86" ${THIN}/>
    ${sweat(148, 92, 0.8)}
    <path d="M6,192 C10,172 30,162 48,162 L88,162 C106,164 120,176 124,192 Z" fill="#f2f2f2" ${LINE}/>
    <path d="M40,164 C50,172 86,172 96,164" fill="none" stroke="#c8c8d0" stroke-width="2"/>
    ${face(roundFace, 'roundFace')}
    <g clip-path="url(#roundFace)"><path d="M20,112 C40,122 96,122 116,112 L116,80 L20,80 Z" fill="${SKIN.shade}"/></g>
    <path d="M22,128 C16,96 36,72 68,72 C100,72 120,96 114,128 C110,118 106,112 104,106 C92,110 80,104 74,98 C66,106 44,112 32,108 C30,114 26,120 22,128 Z" fill="#c99a64" ${LINE}/>
    <path d="M40,88 C50,80 62,78 72,80 M84,80 C94,82 102,88 106,96" fill="none" stroke="#e8c48e" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="51" cy="128" r="12.5" fill="${lens}" ${THIN}/>
    <circle cx="85" cy="128" r="12.5" fill="${lens}" ${THIN}/>
    <path d="M63,127 Q68,124 73,127 M38,126 L28,122 M98,126 L108,122" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>
    <circle cx="52" cy="129" r="2" fill="${INK}"/>
    <circle cx="84" cy="129" r="2" fill="${INK}"/>
    ${[[40, 144], [45, 148], [36, 149], [96, 144], [91, 148], [100, 149]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.2" fill="#b36a4a"/>`).join('')}
    <path d="M58,150 Q68,145 78,150 Q74,160 68,160 Q62,160 58,150 Z" fill="#e48a86" ${THIN}/>
    ${sweat(32, 110, 0.9)}
    ${sweat(104, 112, 0.75)}`;
}

function manager() {
  const hood = { base: '#4f80d4', shade: '#3a64b6' };
  const skin = { base: '#f2a776', light: '#f7c6ae', freckle: '#c06a44' };
  const opening = 'M56,78 C56,48 74,34 96,34 C118,34 136,48 136,78 L136,148 C136,158 118,164 96,164 C74,164 56,158 56,148 Z';
  return `
    ${lace('#f3eab8', '#fbf6dc')}
    <path d="M36,192 L36,74 C36,36 62,12 96,12 C130,12 156,36 156,74 L156,192 Z" fill="${hood.base}" ${LINE}/>
    <path d="M36,74 C36,50 46,32 62,22 C52,40 48,60 48,80 L48,192 L36,192 Z M156,74 C156,50 146,32 130,22 C140,40 144,60 144,80 L144,192 L156,192 Z" fill="${hood.shade}"/>
    <path d="${opening}" fill="${skin.base}" ${LINE}/>
    <path d="M56,140 C70,152 122,152 136,140 L136,148 C136,158 118,164 96,164 C74,164 56,158 56,148 Z" fill="${skin.light}" ${THIN}/>
    <circle cx="74" cy="94" r="21" fill="#cdd8e3" ${THIN}/>
    <circle cx="118" cy="94" r="21" fill="#cdd8e3" ${THIN}/>
    <path d="M62,84 Q72,80 84,86 M108,86 Q120,80 130,84" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M66,96 Q74,90 84,96 M108,96 Q118,90 126,96" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>
    <ellipse cx="77" cy="102" rx="3.6" ry="5" fill="${INK}"/>
    <ellipse cx="121" cy="102" rx="3.6" ry="5" fill="${INK}"/>
    <circle cx="78.2" cy="100" r="1.2" fill="#ffffff"/>
    <circle cx="122.2" cy="100" r="1.2" fill="#ffffff"/>
    <path d="M95,94 L97,94" stroke="${INK}" stroke-width="2"/>
    ${[[86, 52], [96, 48], [106, 53], [91, 58], [64, 124], [70, 129], [62, 131], [128, 124], [122, 129], [130, 131]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.3" fill="${skin.freckle}"/>`).join('')}
    <path d="M91,132 Q96,137 101,132" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>
    <text x="72" y="186" font-family="MS Mincho, MS Gothic, serif" font-size="16" fill="${INK}" text-anchor="middle">店</text>
    <text x="120" y="186" font-family="MS Mincho, MS Gothic, serif" font-size="16" fill="${INK}" text-anchor="middle">長</text>`;
}

const PORTRAITS = { dejiko, puchiko, gema, rabienrose: rabi, otaku, manager };

function svgFor(id) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">${PORTRAITS[id]()}</svg>`;
}

async function render(jobs) {
  const port = 9500 + Math.floor(Math.random() * 400);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'digiedge-'));
  const edge = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });
  let ws = null;
  try {
    let target = null;
    for (let i = 0; i < 60 && !target; i++) {
      await sleep(250);
      try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === 'page'); } catch (e) { }
    }
    ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise(r => ws.addEventListener('open', r, { once: true }));
    let id = 0;
    const pending = new Map();
    ws.addEventListener('message', m => {
      const d = JSON.parse(m.data);
      if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
    });
    const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
    const results = {};
    for (const [name, svg] of jobs) {
      const expr = `new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const c = document.createElement('canvas');
          c.width = ${SIZE}; c.height = ${SIZE};
          const ctx = c.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, ${SIZE}, ${SIZE});
          ctx.drawImage(img, 0, 0);
          resolve(c.toDataURL('image/jpeg', 0.93));
        };
        img.onerror = () => reject(new Error('svg failed: ${name}'));
        img.src = 'data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}';
      })`;
      const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
      if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception.description);
      results[name] = Buffer.from(r.result.result.value.split(',')[1], 'base64');
    }
    return results;
  } finally {
    try {
      const v = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
      const bws = new WebSocket(v.webSocketDebuggerUrl);
      await new Promise(r => bws.addEventListener('open', r, { once: true }));
      bws.send(JSON.stringify({ id: 1, method: 'Browser.close' }));
      await sleep(300);
    } catch (e) { }
    try { spawnSync('taskkill', ['/PID', String(edge.pid), '/T', '/F'], { stdio: 'ignore' }); } catch (e) { }
  }
}

async function main() {
  const out = process.argv[2] || path.join(ROOT, 'content', 'digi', 'pic');
  const ids = process.argv.slice(3).length ? process.argv.slice(3) : Object.keys(PORTRAITS);
  fs.mkdirSync(out, { recursive: true });
  const images = await render(ids.map(id => [id, svgFor(id)]));
  for (const [id, data] of Object.entries(images)) {
    const file = path.join(out, `profile_${id}.jpg`);
    fs.writeFileSync(file, data);
    console.log('wrote', file);
  }
}

if (require.main === module) main().catch(e => { console.error(e); process.exit(1); });

module.exports = { svgFor, PORTRAITS };
