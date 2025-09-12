// File: visualizer.js
let analyserNode;
let vizCanvas, vizCtx;
let dataArray, bufferLength;
let animationId;

export function setAnalyserNode(analyser) {
  analyserNode = analyser;
  bufferLength = analyserNode.fftSize; // time-domain buffer length = fftSize
  dataArray = new Uint8Array(bufferLength);
}

export function startVisualizer() {
  console.log('Visualizer started');
  vizCanvas = document.getElementById('viz-canvas');
  vizCtx = vizCanvas.getContext('2d');

  function resizeCanvas() {
    vizCanvas.width = vizCanvas.clientWidth;
    vizCanvas.height = vizCanvas.clientHeight;
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function draw() {
    animationId = requestAnimationFrame(draw);

    if (!analyserNode) return;

    // Get waveform data
    analyserNode.getByteTimeDomainData(dataArray);

    // Clear canvas
    vizCtx.clearRect(0, 0, vizCanvas.width, vizCanvas.height);

    const width = vizCanvas.width;
    const height = vizCanvas.height;
    const sliceWidth = width / bufferLength;

    vizCtx.lineWidth = 2;

    // Draw waveform with color changes depending on amplitude/frequency band
    vizCtx.beginPath();

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;  // Normalize 0-255 to ~0-2 (center 1)
      const y = v * height / 2;

      // Choose color based on amplitude or index (frequency band proxy)
      // Example: map frequency bands roughly
      // Lower indices = lower freq, higher = higher freq (approx)
      let color;
      if (i < bufferLength * 0.33) {
        color = `rgba(255, 100, 100, 0.8)`;  // Red for low freq band
      } else if (i < bufferLength * 0.66) {
        color = `rgba(100, 255, 100, 0.8)`;  // Green for mid freq band
      } else {
        color = `rgba(100, 100, 255, 0.8)`;  // Blue for high freq band
      }

      vizCtx.strokeStyle = color;

      if (i === 0) {
        vizCtx.moveTo(i * sliceWidth, y);
      } else {
        vizCtx.lineTo(i * sliceWidth, y);
      }
    }
    vizCtx.stroke();
  }

  draw();
}

export function stopVisualizer() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}
