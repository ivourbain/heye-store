/* =====================================================================
   qrcode.js — kleine, zelfgeschreven QR-code generator (byte/UTF-8 modus)
   Gebaseerd op het publieke-domein algoritme van Nayuki (QR Code generator).
   Doel: in de browser van de klant een QR-code tekenen, zonder externe partij.
   Gebruik:  const m = maakQR("tekst");  // m = 2D-array van true/false (donker/licht)
   ===================================================================== */
(function (global) {
  "use strict";

  // ---- Reed-Solomon / Galois-veld rekenwerk ----
  function reedSolomonMultiply(x, y) {
    let z = 0;
    for (let i = 7; i >= 0; i--) {
      z = (z << 1) ^ ((z >>> 7) * 0x11D);
      z ^= ((y >>> i) & 1) * x;
    }
    return z & 0xFF;
  }
  function reedSolomonDivisor(degree) {
    const result = new Uint8Array(degree);
    result[degree - 1] = 1;
    let root = 1;
    for (let i = 0; i < degree; i++) {
      for (let j = 0; j < result.length; j++) {
        result[j] = reedSolomonMultiply(result[j], root);
        if (j + 1 < result.length) result[j] ^= result[j + 1];
      }
      root = reedSolomonMultiply(root, 0x02);
    }
    return result;
  }
  function reedSolomonRemainder(data, divisor) {
    const result = new Uint8Array(divisor.length);
    for (const b of data) {
      const factor = b ^ result[0];
      result.copyWithin(0, 1);
      result[result.length - 1] = 0;
      for (let i = 0; i < result.length; i++)
        result[i] ^= reedSolomonMultiply(divisor[i], factor);
    }
    return result;
  }

  // ---- Tabellen (per versie 1..40) ----
  const ECC_CODEWORDS_PER_BLOCK = [
    // L, M, Q, H  (index 1..40; index 0 ongebruikt)
    [-1,7,10,15,20,26,18,20,24,30,18,20,24,26,30,22,24,28,30,28,28,28,28,30,30,26,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
    [-1,10,16,26,18,24,16,18,22,22,26,30,22,22,24,24,28,28,26,26,26,26,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28],
    [-1,13,22,18,26,18,24,18,22,20,24,28,26,24,20,30,24,28,28,26,30,28,30,30,30,30,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
    [-1,17,28,22,16,22,28,26,26,24,28,24,28,22,24,24,30,28,28,26,28,30,24,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30]
  ];
  const NUM_ERROR_CORRECTION_BLOCKS = [
    [-1,1,1,1,1,1,2,2,2,2,4,4,4,4,4,6,6,6,6,7,8,8,9,9,10,12,12,12,13,14,15,16,17,18,19,19,20,21,22,24,25],
    [-1,1,1,1,2,2,4,4,4,5,5,5,8,9,9,10,10,11,13,14,16,17,17,18,20,21,23,25,26,28,29,31,33,35,37,38,40,43,45,47,49],
    [-1,1,1,2,2,4,4,6,6,8,8,8,10,12,16,12,17,16,18,21,20,23,23,25,27,29,34,34,35,38,40,43,45,48,51,53,56,59,62,65,68],
    [-1,1,1,2,4,4,4,5,6,8,8,11,11,16,16,18,16,19,21,25,25,25,34,30,32,35,37,40,42,45,48,51,54,57,60,63,66,70,74,77,81]
  ];

  const MIN_VERSION = 1, MAX_VERSION = 40;

  function numRawDataModules(ver) {
    let result = (16 * ver + 128) * ver + 64;
    if (ver >= 2) {
      const numAlign = Math.floor(ver / 7) + 2;
      result -= (25 * numAlign - 10) * numAlign - 55;
      if (ver >= 7) result -= 36;
    }
    return result;
  }
  function numDataCodewords(ver, ecl) {
    return Math.floor(numRawDataModules(ver) / 8)
      - ECC_CODEWORDS_PER_BLOCK[ecl][ver] * NUM_ERROR_CORRECTION_BLOCKS[ecl][ver];
  }

  function getAlignmentPatternPositions(ver) {
    if (ver === 1) return [];
    const numAlign = Math.floor(ver / 7) + 2;
    const step = Math.floor((ver * 8 + numAlign * 3 + 5) / (numAlign * 4 - 4)) * 2;
    const result = [6];
    for (let pos = ver * 4 + 10; result.length < numAlign; pos -= step)
      result.splice(1, 0, pos);
    return result;
  }

  // ---- Bouw de QR-matrix ----
  function encodeBytes(dataBytes, ecl) {
    // ecl: 0=L 1=M 2=Q 3=H
    // Kies kleinste versie die past
    let version;
    for (version = MIN_VERSION; ; version++) {
      const dataCapacityBits = numDataCodewords(version, ecl) * 8;
      const charCountBits = (version <= 9) ? 8 : 16;
      const usedBits = 4 + charCountBits + dataBytes.length * 8;
      if (usedBits <= dataCapacityBits) break;
      if (version >= MAX_VERSION) throw new Error("Data te lang voor QR");
    }

    // ---- Bitbuffer opbouwen ----
    const bb = [];
    function appendBits(val, len) {
      for (let i = len - 1; i >= 0; i--) bb.push((val >>> i) & 1);
    }
    appendBits(0x4, 4);                                   // byte-modus
    appendBits(dataBytes.length, version <= 9 ? 8 : 16);  // aantal tekens
    for (const b of dataBytes) appendBits(b, 8);

    const dataCapacityBits = numDataCodewords(version, ecl) * 8;
    appendBits(0, Math.min(4, dataCapacityBits - bb.length)); // terminator
    while (bb.length % 8 !== 0) bb.push(0);
    for (let pad = 0xEC; bb.length < dataCapacityBits; pad ^= 0xEC ^ 0x11)
      appendBits(pad, 8);

    // bits -> bytes
    const dataCodewords = new Uint8Array(bb.length / 8);
    for (let i = 0; i < bb.length; i++)
      dataCodewords[i >>> 3] |= bb[i] << (7 - (i & 7));

    // ---- Reed-Solomon foutcorrectie per blok ----
    const numBlocks = NUM_ERROR_CORRECTION_BLOCKS[ecl][version];
    const blockEccLen = ECC_CODEWORDS_PER_BLOCK[ecl][version];
    const rawCodewords = Math.floor(numRawDataModules(version) / 8);
    const numShortBlocks = numBlocks - rawCodewords % numBlocks;
    const shortBlockLen = Math.floor(rawCodewords / numBlocks);

    const blocks = [];
    const rsDiv = reedSolomonDivisor(blockEccLen);
    let k = 0;
    for (let i = 0; i < numBlocks; i++) {
      const datLen = shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1);
      const dat = dataCodewords.slice(k, k + datLen);
      k += datLen;
      const ecc = reedSolomonRemainder(dat, rsDiv);
      const block = Array.from(dat);
      if (i < numShortBlocks) block.push(0); // opvul-byte: alle blokken even lang maken
      ecc.forEach(b => block.push(b));
      blocks.push(block);
    }
    // interleave
    const result = [];
    for (let i = 0; i < shortBlockLen + 1; i++) {
      for (let j = 0; j < blocks.length; j++) {
        if (i !== shortBlockLen - blockEccLen || j >= numShortBlocks)
          result.push(blocks[j][i]);
      }
    }

    return drawMatrix(version, ecl, result);
  }

  function drawMatrix(version, ecl, allCodewords) {
    const size = version * 4 + 17;
    const modules = [], isFunction = [];
    for (let i = 0; i < size; i++) {
      modules.push(new Array(size).fill(false));
      isFunction.push(new Array(size).fill(false));
    }
    function setFunc(x, y, val) { modules[y][x] = val; isFunction[y][x] = true; }

    // finder-patronen
    function drawFinder(x, y) {
      for (let dy = -4; dy <= 4; dy++)
        for (let dx = -4; dx <= 4; dx++) {
          const dist = Math.max(Math.abs(dx), Math.abs(dy));
          const xx = x + dx, yy = y + dy;
          if (xx >= 0 && xx < size && yy >= 0 && yy < size)
            setFunc(xx, yy, dist !== 2 && dist !== 4);
        }
    }
    // timing
    for (let i = 0; i < size; i++) { setFunc(6, i, i % 2 === 0); setFunc(i, 6, i % 2 === 0); }
    drawFinder(3, 3); drawFinder(size - 4, 3); drawFinder(3, size - 4);

    // alignment
    const alignPos = getAlignmentPatternPositions(version);
    const n = alignPos.length;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        if ((i === 0 && j === 0) || (i === 0 && j === n - 1) || (i === n - 1 && j === 0)) continue;
        const cx = alignPos[i], cy = alignPos[j];
        for (let dy = -2; dy <= 2; dy++)
          for (let dx = -2; dx <= 2; dx++)
            setFunc(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }

    // reserveer format & version info (voorlopig)
    function drawFormatBits(mask) {
      const eclBits = [1, 0, 3, 2][ecl]; // L=01 M=00 H=10 Q=11 -> tabel
      let data = (eclBits << 3) | mask;
      let rem = data;
      for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
      const bits = ((data << 10) | rem) ^ 0x5412;
      for (let i = 0; i <= 5; i++) setFunc(8, i, ((bits >>> i) & 1) !== 0);
      setFunc(8, 7, ((bits >>> 6) & 1) !== 0);
      setFunc(8, 8, ((bits >>> 7) & 1) !== 0);
      setFunc(7, 8, ((bits >>> 8) & 1) !== 0);
      for (let i = 9; i < 15; i++) setFunc(14 - i, 8, ((bits >>> i) & 1) !== 0);
      for (let i = 0; i < 8; i++) setFunc(size - 1 - i, 8, ((bits >>> i) & 1) !== 0);
      for (let i = 8; i < 15; i++) setFunc(8, size - 15 + i, ((bits >>> i) & 1) !== 0);
      setFunc(8, size - 8, true);
    }
    function drawVersion() {
      if (version < 7) return;
      let rem = version;
      for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
      const bits = (version << 12) | rem;
      for (let i = 0; i < 18; i++) {
        const bit = ((bits >>> i) & 1) !== 0;
        const a = size - 11 + i % 3, b = Math.floor(i / 3);
        setFunc(a, b, bit); setFunc(b, a, bit);
      }
    }
    drawVersion();
    drawFormatBits(0); // RESERVEER de format-modules (dummy) vóór data-plaatsing

    // ---- data plaatsen (zigzag) ----
    let i = 0;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let vert = 0; vert < size; vert++) {
        for (let j = 0; j < 2; j++) {
          const x = right - j;
          const upward = ((right + 1) & 2) === 0;
          const y = upward ? size - 1 - vert : vert;
          if (!isFunction[y][x] && i < allCodewords.length * 8) {
            modules[y][x] = ((allCodewords[i >>> 3] >>> (7 - (i & 7))) & 1) !== 0;
            i++;
          }
        }
      }
    }

    // ---- maskers proberen, beste kiezen ----
    function applyMask(mask) {
      for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++) {
          if (isFunction[y][x]) continue;
          let invert = false;
          switch (mask) {
            case 0: invert = (x + y) % 2 === 0; break;
            case 1: invert = y % 2 === 0; break;
            case 2: invert = x % 3 === 0; break;
            case 3: invert = (x + y) % 3 === 0; break;
            case 4: invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
            case 5: invert = (x * y) % 2 + (x * y) % 3 === 0; break;
            case 6: invert = ((x * y) % 2 + (x * y) % 3) % 2 === 0; break;
            case 7: invert = ((x + y) % 2 + (x * y) % 3) % 2 === 0; break;
          }
          if (invert) modules[y][x] = !modules[y][x];
        }
    }
    function penalty() {
      let p = 0;
      // regels 1: rijen/kolommen van 5+
      for (let y = 0; y < size; y++) {
        let runColor = modules[y][0], runLen = 1;
        for (let x = 1; x < size; x++) {
          if (modules[y][x] === runColor) { runLen++; if (runLen === 5) p += 3; else if (runLen > 5) p++; }
          else { runColor = modules[y][x]; runLen = 1; }
        }
      }
      for (let x = 0; x < size; x++) {
        let runColor = modules[0][x], runLen = 1;
        for (let y = 1; y < size; y++) {
          if (modules[y][x] === runColor) { runLen++; if (runLen === 5) p += 3; else if (runLen > 5) p++; }
          else { runColor = modules[y][x]; runLen = 1; }
        }
      }
      // regel 2: 2x2 blokken
      for (let y = 0; y < size - 1; y++)
        for (let x = 0; x < size - 1; x++) {
          const c = modules[y][x];
          if (c === modules[y][x + 1] && c === modules[y + 1][x] && c === modules[y + 1][x + 1]) p += 3;
        }
      // regel 4: donkerverhouding
      let dark = 0;
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (modules[y][x]) dark++;
      const total = size * size;
      const k2 = Math.floor((Math.abs(dark * 20 - total * 10) + total - 1) / total) - 1;
      p += k2 * 10;
      return p;
    }

    let bestMask = 0, minPenalty = Infinity;
    for (let mask = 0; mask < 8; mask++) {
      applyMask(mask);
      drawFormatBits(mask);
      const pen = penalty();
      if (pen < minPenalty) { minPenalty = pen; bestMask = mask; }
      applyMask(mask); // ongedaan maken (XOR)
    }
    applyMask(bestMask);
    drawFormatBits(bestMask);

    return modules;
  }

  // ---- Publieke functie ----
  // tekst -> 2D boolean array (true = donkere module)
  function maakQR(text, ecl) {
    const bytes = [];
    // UTF-8 codering
    for (const ch of unescape(encodeURIComponent(text))) bytes.push(ch.charCodeAt(0));
    return encodeBytes(bytes, ecl === undefined ? 1 : ecl); // standaard ECC = M
  }

  global.maakQR = maakQR;
})(typeof window !== "undefined" ? window : this);
