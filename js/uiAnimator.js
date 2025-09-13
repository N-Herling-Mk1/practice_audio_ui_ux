// File: uiAnimator.js

let uiCanvas, uiCtx;
let tick = 0;
let noiseCanvas, noiseCtx;
let noiseData;
const noiseDensity = 0.0025; // between 0 (no noise) and 1 (full static)

export function startUIAnimation() {
  console.log('startUIAnimation called');

  uiCanvas = document.getElementById('ui-canvas');
  if (!uiCanvas) {
    console.error('ui-canvas not found!');
    return;
  }

  uiCtx = uiCanvas.getContext('2d');
  if (!uiCtx) {
    console.error('Failed to get 2D context from ui-canvas!');
    return;
  }

  // Noise buffer canvas for better performance
  noiseCanvas = document.createElement('canvas');
  noiseCtx = noiseCanvas.getContext('2d');

  function resizeCanvas() {
    uiCanvas.width = uiCanvas.clientWidth;
    uiCanvas.height = uiCanvas.clientHeight;

    noiseCanvas.width = uiCanvas.width;
    noiseCanvas.height = uiCanvas.height;

    generateStatic();
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function generateStatic() {
    const imageData = noiseCtx.createImageData(noiseCanvas.width, noiseCanvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.random() < noiseDensity ? Math.floor(Math.random() * 255) : 0;
      data[i] = gray;     // R
      data[i + 1] = gray; // G
      data[i + 2] = gray; // B
      data[i + 3] = Math.random() * 20 + 10; // Alpha for subtle transparency
    }

    noiseCtx.putImageData(imageData, 0, 0);
    noiseData = imageData;
  }

  function draw() {
    requestAnimationFrame(draw);
    tick += 0.01;

    const w = uiCanvas.width;
    const h = uiCanvas.height;

    // Hazy dark background
    uiCtx.fillStyle = 'rgba(24, 24, 24, 0.15)';
    uiCtx.fillRect(0, 0, w, h);

    // Draw noise layer
    uiCtx.drawImage(noiseCanvas, 0, 0);

    // Re-generate noise every few frames for dynamic shimmer
    if (Math.floor(tick * 10) % 3 === 0) {
      generateStatic();
    }

    uiCtx.save();
    uiCtx.translate(w / 2, h / 2); // Move origin to center

    const ellipseCount = 3;
    const baseRadiusX = w * 0.6;
    const baseRadiusY = h * 0.4;

    for (let i = 0; i < ellipseCount; i++) {
      const rotationSpeeds = [0.02, 0.01, 0.05];
      const rotation = tick * rotationSpeeds[i] * (i % 2 === 0 ? 1 : -1);

      uiCtx.save();
      uiCtx.rotate(rotation);

      // Glow / haze effect
      uiCtx.shadowColor = `rgba(68, 217, 230, 0.6)`;
      uiCtx.shadowBlur = 20;

      uiCtx.strokeStyle = `rgba(68, 217, 230, 0.9)`;
      uiCtx.lineWidth = 3;

      uiCtx.beginPath();
      uiCtx.ellipse(
        0,
        0,
        baseRadiusX - i * 20,
        baseRadiusY - i * 10,
        0,
        0,
        2 * Math.PI
      );
      uiCtx.stroke();

      uiCtx.restore();
    }

    uiCtx.restore();
  }

  draw();
}
