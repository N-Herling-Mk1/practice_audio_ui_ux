// File: audioController.js
// File: audioController.js

let analyser;
let sourceNode;
let audioElement;
let endCallback = null; // External callback for audio end

/**
 * Initializes the AudioContext and AnalyserNode.
 */
export function initAudioController() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioContext.createAnalyser();

  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0.8;

  return { audioContext, analyser };
}

/**
 * Allows external modules to register a callback when audio finishes.
 */
export function onAudioEnded(callback) {
  endCallback = callback;
}

/**
 * Loads and plays the given audio file using the provided AudioContext.
 * Connects it to the analyser node for visualization.
 */
export async function loadAndPlay(url, audioContext) {
  try {
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
      console.log('[AudioController] AudioContext resumed.');
    }

    // Stop and clean up previous audio
    if (audioElement) {
      audioElement.pause();
      audioElement.src = '';
      audioElement.load();
      audioElement = null;
    }

    audioElement = new Audio();
    audioElement.src = url;
    audioElement.crossOrigin = 'anonymous';
    audioElement.preload = 'auto';
    audioElement.autoplay = false;

    await new Promise((resolve, reject) => {
      audioElement.oncanplay = resolve;
      audioElement.onerror = () => reject('Failed to load audio');
    });

    if (sourceNode) {
      sourceNode.disconnect();
    }

    sourceNode = audioContext.createMediaElementSource(audioElement);
    sourceNode.connect(analyser);
    analyser.connect(audioContext.destination);

    // Attach internal listener for the end event
    audioElement.addEventListener('ended', () => {
      console.log('[AudioController] Audio playback finished.');
      if (typeof endCallback === 'function') {
        endCallback();
      }
    });

    await audioElement.play();
    console.log('[AudioController] Audio started:', url);

    return audioElement;
  } catch (err) {
    console.error('[AudioController] Error loading/playing audio:', err);
    throw err;
  }
}
