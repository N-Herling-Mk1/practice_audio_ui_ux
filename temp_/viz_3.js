// File: visualizer.js

let analyserNode;
let vizCanvas, vizCtx;
let dataArray, bufferLength;
let animationId;

/**
 * Connect the analyser node from your audio graph
 */
export function setAnalyserNode(analyser) {
  analyserNode = analyser;

  // Use frequencyBinCount, which is half of fftSize
  bufferLength = analyserNode.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);

  // Smooth transitions between frames
  analyserNode.smoothingTimeConstant = 0.8;
}

/**
 * Start drawing frequency bars to the canvas
 */
export function startVisualizer() {
  console.log('Visualizer started');

  vizCanvas = document.getElementById('viz-canvas');
  if (!vizCanvas) {
    console.error('Canvas with id "viz-canvas" not found!');
    return;
  }

  vizCtx = vizCanvas.getContext('2d');
  if (!vizCtx) {
    console.error('2D context not available!');
    return;
  }

  function resizeCanvas() {
    vizCanvas.width = vizCanvas.clientWidth;
    vizCanvas.height = vizCanvas.clientHeight;
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function draw() {
    animationId = requestAnimationFrame(draw);
    if (!analyserNode) return;

    analyserNode.getByteFrequencyData(dataArray);

    const width = vizCanvas.width;
    const height = vizCanvas.height;
    const barWidth = width / bufferLength;

    vizCtx.clearRect(0, 0, width, height);

    for (let i = 0; i < bufferLength; i++) {
      const value = dataArray[i]; // Amplitude (0–255)
      const barHeight = (value / 255) * height;

      // Hue from 0 (red) to 360 (violet)
      const hue = (i / bufferLength) * 360;
      vizCtx.fillStyle = `hsl(${hue}, 100%, 50%)`;

      vizCtx.fillRect(i * barWidth, height - barHeight, barWidth, barHeight);
    }
  }

  draw();
}

/**
 * Stop the animation loop
 */
export function stopVisualizer() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}
