// File: app.js
import { initAudioController, loadAndPlay } from './audioController.js';
import { startVisualizer, setAnalyserNode, stopVisualizer } from './visualizer.js';
import { startUIAnimation } from './uiAnimator.js';

window.addEventListener('DOMContentLoaded', () => {
  const audioSelect = document.getElementById('audio-select');
  const playButton = document.getElementById('play-button');

  const { audioContext, analyser } = initAudioController();
  setAnalyserNode(analyser);

  startUIAnimation();

  let isPlaying = false;
  let audioElement = null;

  playButton.addEventListener('click', async () => {
    const selectedFile = audioSelect.value;
    if (!selectedFile) return;

    if (audioElement && isPlaying) {
      audioElement.pause();
      stopVisualizer();
      isPlaying = false;
    }

    try {
      audioElement = await loadAndPlay(selectedFile, audioContext);
      if (audioElement) {
        isPlaying = true;
        startVisualizer();

        audioElement.addEventListener('ended', () => {
          stopVisualizer();
          isPlaying = false;
        });
      }
    } catch (error) {
      console.error(error);
    }
  });
});
