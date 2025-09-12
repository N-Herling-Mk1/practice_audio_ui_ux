// File: visualizer.js
// File: visualizer.js

let analyserNode;
let vizCanvas, vizCtx;
let timeDataArray, freqDataArray, bufferLength;
let animationId;

export function setAnalyserNode(analyser) {
  analyserNode = analyser;
  bufferLength = analyserNode.fftSize;
  timeDataArray = new Uint8Array(bufferLength);
  freqDataArray = new Uint8Array(analyserNode.frequencyBinCount);
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

    analyserNode.getByteTimeDomainData(timeDataArray);
    analyserNode.getByteFrequencyData(freqDataArray);

    const width = vizCanvas.width;
    const height = vizCanvas.height;

    vizCtx.clearRect(0, 0, width, height);

    // === Draw MAIN waveform ===
    const sliceWidth = width / bufferLength;
    vizCtx.beginPath();

    for (let i = 0; i < bufferLength; i++) {
      const v = (timeDataArray[i] - 128) / 128;
      const y = height / 2 + v * height * 0.4;
      const x = i * sliceWidth;

      if (i === 0) {
        vizCtx.moveTo(x, y);
      } else {
        vizCtx.lineTo(x, y);
      }
    }

    vizCtx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    vizCtx.lineWidth = 2;
    vizCtx.stroke();

    // === Pixelation Clouds ===
    const numBands = 3;
    const bandSize = Math.floor(freqDataArray.length / numBands);

    for (let band = 0; band < numBands; band++) {
      const startIdx = band * bandSize;
      const endIdx = (band === numBands - 1) ? freqDataArray.length : startIdx + bandSize;

      let color;
      switch (band) {
        case 0: color = 'rgba(255, 80, 80, 0.75)'; break;   // red - low freq
        case 1: color = 'rgba(80, 255, 80, 0.75)'; break;   // green - mid freq
        case 2: color = 'rgba(80, 80, 255, 0.75)'; break;   // blue - high freq
      }

      for (let i = startIdx; i < endIdx; i++) {
        const amplitude = freqDataArray[i];

        // Lower threshold to show more pixels
        if (amplitude < 10) continue;

        const x = (i / freqDataArray.length) * width;
        const y = height * (0.2 + Math.random() * 0.6); // spread vertically

        const radius = 2 + amplitude / 40; // dynamic size
        const blur = 10 + amplitude / 10;  // dynamic glow

        vizCtx.beginPath();
        vizCtx.arc(x, y, radius, 0, 2 * Math.PI);
        vizCtx.fillStyle = color;
        vizCtx.shadowColor = color;
        vizCtx.shadowBlur = blur;
        vizCtx.fill();

        // Reset shadows for next draw
        vizCtx.shadowBlur = 0;
      }
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
