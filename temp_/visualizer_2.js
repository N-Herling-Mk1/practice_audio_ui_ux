// File: visualizer.js
// File: visualizer.js
let analyserNode;
let vizCanvas, vizCtx;
let dataArray, bufferLength;
let animationId; // For tracking the animation frame

export function setAnalyserNode(analyser) {
  analyserNode = analyser;
  bufferLength = analyserNode.fftSize; // use fftSize for time domain
  dataArray = new Uint8Array(bufferLength);
}

export function startVisualizer() {
  console.log('Visualizer started');
  vizCanvas = document.getElementById('viz-canvas');
  vizCtx = vizCanvas.getContext('2d');

  function resizeCanvas() {
    vizCanvas.width = vizCanvas.clientWidth;
    vizCanvas.height = vizCanvas.clientHeight;
    console.log('Canvas resized:', vizCanvas.width, vizCanvas.height);
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function draw() {
    animationId = requestAnimationFrame(draw);

    if (!analyserNode) return;

    analyserNode.getByteTimeDomainData(dataArray);

    const width = vizCanvas.width;
    const height = vizCanvas.height;
    const sliceWidth = width / bufferLength;

    vizCtx.clearRect(0, 0, width, height);
    vizCtx.lineWidth = 2;

    const thirds = [0, Math.floor(bufferLength * 0.33), Math.floor(bufferLength * 0.66), bufferLength];
    const colors = [
      'rgba(255, 100, 100, 0.8)', // low - red
      'rgba(100, 255, 100, 0.8)', // mid - green
      'rgba(100, 100, 255, 0.8)'  // high - blue
    ];

    // Draw each third as a separate path
    for (let part = 0; part < 3; part++) {
      vizCtx.beginPath();
      vizCtx.strokeStyle = colors[part];

      for (let i = thirds[part]; i < thirds[part + 1]; i++) {
        const v = (dataArray[i] - 128) / 128;
        const y = height / 2 + v * (height / 2);
        const x = i * sliceWidth;

        if (i === thirds[part]) {
          vizCtx.moveTo(x, y);
        } else {
          vizCtx.lineTo(x, y);
        }
      }
      vizCtx.stroke();
    }
  }

  draw();
}

export function stopVisualizer() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}
