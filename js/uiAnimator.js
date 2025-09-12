// File: uiAnimator.js
// Create the ellipses..
let uiCanvas, uiCtx;
let tick = 0;

export function startUIAnimation() {
  console.log('startUIAnimation called');

  uiCanvas = document.getElementById('ui-canvas');
  if (!uiCanvas) {
    console.error('ui-canvas not found!');
    return;
  }
  console.log('ui-canvas found:', uiCanvas);

  uiCtx = uiCanvas.getContext('2d');
  if (!uiCtx) {
    console.error('Failed to get 2D context from ui-canvas!');
    return;
  }
  console.log('Got 2D context');

  function resizeCanvas() {
    uiCanvas.width = uiCanvas.clientWidth;
    uiCanvas.height = uiCanvas.clientHeight;
    console.log(`Canvas resized to ${uiCanvas.width}x${uiCanvas.height}`);
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function draw() {
    requestAnimationFrame(draw);
    tick += 0.01;

    const w = uiCanvas.width;
    const h = uiCanvas.height;

    // Clear background with slight transparency for haze effect
    uiCtx.fillStyle = 'rgba(24, 24, 24, 0.15)';
    uiCtx.fillRect(0, 0, w, h);

    uiCtx.save();
    uiCtx.translate(w / 2, h / 2); // Move origin to center

    const ellipseCount = 3;
    const baseRadiusX = w * 0.6; // 70% of canvas width
    const baseRadiusY = h * 0.4; // 40% of canvas height

    for (let i = 0; i < ellipseCount; i++) {
      const rotationSpeeds = [0.02, 0.01, 0.5]; // outer → inner (i = 0 → 2)
      const rotation = tick * rotationSpeeds[i] * (i % 2 === 0 ? 1 : -1);

      uiCtx.save();
      uiCtx.rotate(rotation);

      // Glow / haze effect
      uiCtx.shadowColor = `rgba(68, 217, 230, 0.6)`; // cyan-ish glow
      uiCtx.shadowBlur = 20;

      // Ellipse border
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
