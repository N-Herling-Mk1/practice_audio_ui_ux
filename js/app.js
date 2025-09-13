//File: app.js 
//app.js is the main controller script for the audio 
//visualization web app. It manages the user interface and 
// coordinates the audio playback and visualization processes by:
//Initializing the audio context and analyzer nodes.
//Setting up UI elements such as the audio file selector and play button.
//Handling user interactions to start and stop audio playback.
//Coordinating the start and stop of visual effects tied to the audio.
//Managing event callbacks, like detecting when audio ends, to update the UI and stop visualizations cleanly.

// -------- code
import { initAudioController, loadAndPlay, onAudioEnded } from './audioController.js';
import { startVisualizer, setAnalyserNode, stopVisualizer } from './visualizer.js';
import { startUIAnimation } from './uiAnimator.js';

window.addEventListener('DOMContentLoaded', () => {
  const audioSelect = document.getElementById('audio-select');
  const playButton = document.getElementById('play-button');

  const { audioContext, analyser } = initAudioController();

  setAnalyserNode(analyser);
  // Removed setFuzzAnalyserNode(analyser);

  startUIAnimation();

  let isPlaying = false;
  let audioElement = null;

  // Register end callback centrally
  onAudioEnded(() => {
    stopVisualizer();
    // Removed stopFuzz();
    isPlaying = false;
  });

  playButton.addEventListener('click', async () => {
    const selectedFile = audioSelect.value;
    if (!selectedFile) return;

    if (audioElement && isPlaying) {
      audioElement.pause();
      stopVisualizer();
      // Removed stopFuzz();
      isPlaying = false;
    }

    try {
      audioElement = await loadAndPlay(selectedFile, audioContext);

      if (audioElement) {
        isPlaying = true;
        startVisualizer();
        // Removed startFuzz();
      }
    } catch (error) {
      console.error('[App] Failed to play audio:', error);
    }
  });
});
