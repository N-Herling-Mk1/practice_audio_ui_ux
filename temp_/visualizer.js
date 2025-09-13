// File: visualizer.js
// File: visualizer.js

let analyserNode;
let vizCanvas, vizCtx;
let overlayCanvas, overlayCtx;
let dataArray, bufferLength;
let animationId;

const circles = [];
const CIRCLE_LIFETIME = 1500; // ms

/**
 * Sets the analyser node for visualization.
 */
export function setAnalyserNode(analyser) {
  analyserNode = analyser;
  bufferLength = analyser.fftSize;
  dataArray = new Uint8Array(bufferLength);
}

/**
 * Weighted random value between 0–1 with bias toward center (0.5)
 */
function weightedCenterRandom() {
  const n = 6;
  let total = 0;
  for (let i = 0; i < n; i++) total += Math.random();
  return total / n;
}

/**
 * Converts hex color to rgba with alpha
 */
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.substr(1, 2), 16);
  const g = parseInt(hex.substr(3, 2), 16);
  const b = parseInt(hex.substr(5, 2), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Initializes canvases and starts the draw loop.
 */
export function startVisualizer() {
  console.log('[Visualizer] Starting...');

  vizCanvas = document.getElementById('viz-canvas');
  overlayCanvas = document.getElementById('overlay-canvas');

  if (!vizCanvas || !overlayCanvas) {
    console.warn('[Visualizer] One or both canvas elements not found.');
    return;
  }

  vizCtx = vizCanvas.getContext('2d');
  overlayCtx = overlayCanvas.getContext('2d');

  function resizeCanvases() {
    [vizCanvas, overlayCanvas].forEach(canvas => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    });
  }

  window.addEventListener('resize', resizeCanvases);
  resizeCanvases();

  function getBandAverages(frequencyData, sampleRate, fftSize) {
    const binSize = sampleRate / fftSize;
    let low = 0, mid = 0, high = 0;
    let lowCount = 0, midCount = 0, highCount = 0;

    for (let i = 0; i < frequencyData.length; i++) {
      const freq = i * binSize;
      const val = frequencyData[i];

      if (freq < 250) low += val, lowCount++;
      else if (freq < 4000) mid += val, midCount++;
      else if (freq < 16000) high += val, highCount++;
    }

    return {
      low: lowCount ? low / lowCount : 0,
      mid: midCount ? mid / midCount : 0,
      high: highCount ? high / highCount : 0,
    };
  }

  function spawnCircles(lowAvg, midAvg, highAvg, width, height) {
    const now = performance.now();

    function createCircle(amplitude, band) {
      const radius = 2 + (amplitude / 255) * 6;
      let colorHex;
      switch (band) {
        case 'low': colorHex = '#440154'; break;
        case 'mid': colorHex = '#21918c'; break;
        case 'high': colorHex = '#fde725'; break;
        default: colorHex = '#ffffff';
      }

      circles.push({
        x: weightedCenterRandom() * width,
        y: weightedCenterRandom() * height,
        radius,
        colorHex,
        createdAt: now,
        lifetime: CIRCLE_LIFETIME,
      });
    }

    for (let i = 0; i < Math.floor(lowAvg / 60); i++) createCircle(lowAvg, 'low');
    for (let i = 0; i < Math.floor(midAvg / 60); i++) createCircle(midAvg, 'mid');
    for (let i = 0; i < Math.floor(highAvg / 60); i++) createCircle(highAvg, 'high');
  }

  function draw() {
    animationId = requestAnimationFrame(draw);
    if (!analyserNode) return;

    const width = vizCanvas.width;
    const height = vizCanvas.height;

    // === Draw waveform on vizCanvas ===
    analyserNode.getByteTimeDomainData(dataArray);
    vizCtx.clearRect(0, 0, width, height);

    vizCtx.lineWidth = 2;
    vizCtx.beginPath();
    const sliceWidth = width / bufferLength;

    for (let i = 0; i < bufferLength; i++) {
      const value = dataArray[i] / 128.0;
      const y = value * height / 2;
      const x = i * sliceWidth;

      const color = 'rgba(100, 255, 100, 0.8)';
      vizCtx.shadowColor = color;
      vizCtx.shadowBlur = 20;
      vizCtx.strokeStyle = color;

      if (i === 0) vizCtx.moveTo(x, y);
      else vizCtx.lineTo(x, y);
    }

    vizCtx.stroke();
    vizCtx.shadowBlur = 0;

    // === Circle logic based on frequency data ===
    const frequencyData = new Uint8Array(analyserNode.frequencyBinCount);
    analyserNode.getByteFrequencyData(frequencyData);

    const sampleRate = analyserNode.context.sampleRate || 44100;
    const fftSize = analyserNode.fftSize;

    const bandAverages = getBandAverages(frequencyData, sampleRate, fftSize);
    spawnCircles(bandAverages.low, bandAverages.mid, bandAverages.high, width, height);

    // === Draw circles to overlayCanvas (no clear!) ===
    const now = performance.now();
    for (let i = circles.length - 1; i >= 0; i--) {
      const c = circles[i];
      const age = now - c.createdAt;

      if (age > c.lifetime) {
        circles.splice(i, 1);
        continue;
      }

      const alpha = (1 - age / c.lifetime) * 0.3;
      overlayCtx.beginPath();
      overlayCtx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
      overlayCtx.strokeStyle = hexToRgba(c.colorHex, alpha);
      overlayCtx.lineWidth = 2;
      overlayCtx.stroke();
    }
  }

  draw();
}

/**
 * Stop the visualizer animation and clear canvases.
 */
export function stopVisualizer() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  if (vizCtx && vizCanvas) {
    vizCtx.clearRect(0, 0, vizCanvas.width, vizCanvas.height);
  }

  if (overlayCtx && overlayCanvas) {
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
  }

  circles.length = 0; // clear circle data
  console.log('[Visualizer] Stopped and canvases cleared');
}
