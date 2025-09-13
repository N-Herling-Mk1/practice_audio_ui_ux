let analyserNode;
let vizCanvas, vizCtx;
let dataArray, bufferLength;
let animationId;

const circles = [];
const CIRCLE_LIFETIME = 1500; // ms

// Fade-out control
let isFadingOut = false;
let fadeStartTime = 0;
const FADE_DURATION = 1500; // ms

// Store last waveform data for fading
let lastWaveformData = null;

/**
 * Sets the analyser node for visualization.
 * Should be called before starting the visualizer.
 */
export function setAnalyserNode(analyser) {
  analyserNode = analyser;
  bufferLength = analyserNode.fftSize;
  dataArray = new Uint8Array(bufferLength);
}

/**
 * Returns a random number weighted towards center (0 to 1)
 * Using a normal distribution-like approach centered at 0.5
 */
function weightedCenterRandom() {
  const n = 6;
  let total = 0;
  for (let i = 0; i < n; i++) {
    total += Math.random();
  }
  return total / n;
}

/**
 * Converts hex color to rgba string with given alpha
 */
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.substr(1, 2), 16);
  const g = parseInt(hex.substr(3, 2), 16);
  const b = parseInt(hex.substr(5, 2), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Starts the audio visualizer on the canvas.
 * Assumes a canvas element with id 'viz-canvas' exists.
 */
export function startVisualizer() {
  console.log('[Visualizer] Started');

  vizCanvas = document.getElementById('viz-canvas');
  if (!vizCanvas) {
    console.warn('[Visualizer] Canvas element not found.');
    return;
  }

  vizCtx = vizCanvas.getContext('2d');

  function resizeCanvas() {
    vizCanvas.width = vizCanvas.clientWidth;
    vizCanvas.height = vizCanvas.clientHeight;
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function getBandAverages(frequencyData, sampleRate, fftSize) {
    const binSize = sampleRate / fftSize;

    let lowSum = 0, lowCount = 0;
    let midSum = 0, midCount = 0;
    let highSum = 0, highCount = 0;

    for (let i = 0; i < frequencyData.length; i++) {
      const freq = i * binSize;
      const value = frequencyData[i];

      if (freq < 250) {
        lowSum += value;
        lowCount++;
      } else if (freq >= 250 && freq < 4000) {
        midSum += value;
        midCount++;
      } else if (freq >= 4000 && freq < 16000) {
        highSum += value;
        highCount++;
      }
    }

    return {
      low: lowCount ? lowSum / lowCount : 0,
      mid: midCount ? midSum / midCount : 0,
      high: highCount ? highSum / highCount : 0,
    };
  }

  function spawnCircles(lowAvg, midAvg, highAvg, width, height) {
    const now = performance.now();

    function createCircle(amplitude, band) {
      const radius = 2 + (amplitude / 255) * 6;

      let colorHex;
      switch (band) {
        case 'low': colorHex = '#00ff00'; break;
        case 'mid': colorHex = '#ffff00'; break;
        case 'high': colorHex = '#ff0000'; break;
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

    const lowCount = Math.floor(lowAvg / 60);
    const midCount = Math.floor(midAvg / 60);
    const highCount = Math.floor(highAvg / 60);

    for (let i = 0; i < lowCount; i++) createCircle(lowAvg, 'low');
    for (let i = 0; i < midCount; i++) createCircle(midAvg, 'mid');
    for (let i = 0; i < highCount; i++) createCircle(highAvg, 'high');
  }

  function draw() {
    animationId = requestAnimationFrame(draw);

    const width = vizCanvas.width;
    const height = vizCanvas.height;
    const sliceWidth = width / bufferLength;

    // Clear canvas before redraw
    vizCtx.clearRect(0, 0, width, height);

    // Handle fade out logic
    let alpha = 1;
    if (isFadingOut) {
      const now = performance.now();
      const elapsed = now - fadeStartTime;
      alpha = 1 - elapsed / FADE_DURATION;

      if (alpha <= 0) {
        // Fade complete: hard clear & stop animation
        cancelAnimationFrame(animationId);
        animationId = null;
        isFadingOut = false;
        vizCtx.clearRect(0, 0, width, height);
        console.log('[Visualizer] Fade out complete, canvas cleared.');
        return;
      }
    } else if (!analyserNode) {
      // No analyser and no fade: stop drawing
      cancelAnimationFrame(animationId);
      animationId = null;
      return;
    }

    // Use latest waveform data or fallback
    if (!isFadingOut) {
      analyserNode.getByteTimeDomainData(dataArray);
      lastWaveformData = new Uint8Array(dataArray);
    }

    // Draw waveform with fade alpha
    vizCtx.lineWidth = 2;
    vizCtx.beginPath();
    for (let i = 0; i < bufferLength; i++) {
      const value = (lastWaveformData ? lastWaveformData[i] : dataArray[i]) / 128.0;
      const y = value * height / 2;
      const x = i * sliceWidth;

      const color = `rgba(100, 255, 100, ${0.8 * alpha})`;
      vizCtx.shadowColor = color;
      vizCtx.shadowBlur = 20 * alpha;
      vizCtx.strokeStyle = color;

      if (i === 0) {
        vizCtx.moveTo(x, y);
      } else {
        vizCtx.lineTo(x, y);
      }
    }
    vizCtx.stroke();
    vizCtx.shadowBlur = 0;

    // Spawn circles only if NOT fading out
    if (!isFadingOut) {
      const frequencyData = new Uint8Array(analyserNode.frequencyBinCount);
      analyserNode.getByteFrequencyData(frequencyData);

      const sampleRate = analyserNode.context.sampleRate || 44100;
      const fftSize = analyserNode.fftSize;

      const bandAverages = getBandAverages(frequencyData, sampleRate, fftSize);
      spawnCircles(bandAverages.low, bandAverages.mid, bandAverages.high, width, height);
    }

    // Draw circles with fade alpha applied (always draw for smooth fade-out)
    const now = performance.now();
    for (let i = circles.length - 1; i >= 0; i--) {
      const c = circles[i];
      const age = now - c.createdAt;

      if (age > c.lifetime) {
        circles.splice(i, 1);
        continue;
      }

      const baseAlpha = (1 - age / c.lifetime) * 0.3;
      const circleAlpha = baseAlpha * alpha;

      vizCtx.beginPath();
      vizCtx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
      vizCtx.strokeStyle = hexToRgba(c.colorHex, circleAlpha);
      vizCtx.lineWidth = 2;
      vizCtx.stroke();
    }
  }

  draw();
}

/**
 * Stops the visualizer animation and fades out the waveform and circles, then clears.
 */
export function stopVisualizer() {
  if (animationId && !isFadingOut) {
    isFadingOut = true;
    fadeStartTime = performance.now();
  } else if (vizCtx && vizCanvas) {
    vizCtx.clearRect(0, 0, vizCanvas.width, vizCanvas.height);
    console.log('[Visualizer] Stopped and canvas cleared');
  }
}
