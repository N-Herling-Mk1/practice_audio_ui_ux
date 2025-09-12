// File: audioController.js

let analyser;
let sourceNode;
let audioElement;

/**
 * Initializes the AudioContext and AnalyserNode.
 */
export function initAudioController() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioContext.createAnalyser();

  // Configure the analyser
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0.8;

  return { audioContext, analyser };
}

/**
 * Loads and plays the given audio file using the provided AudioContext.
 * Connects it to the analyser node for visualization.
 */
export async function loadAndPlay(url, audioContext) {
  try {
    // Resume context if not running
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
      console.log('[AudioController] AudioContext resumed.');
    }

    // Stop and clean up previous audio element
    if (audioElement) {
      audioElement.pause();
      audioElement.src = '';
      audioElement.load();
      audioElement = null;
    }

    // Create new audio element
    audioElement = new Audio();
    audioElement.src = url;
    audioElement.crossOrigin = 'anonymous'; // If loading local or remote
    audioElement.preload = 'auto';
    audioElement.autoplay = false;

    // Wait for it to be ready
    await new Promise((resolve, reject) => {
      audioElement.oncanplay = resolve;
      audioElement.onerror = () => reject('Failed to load audio');
    });

    // Disconnect old source node if needed
    if (sourceNode) {
      sourceNode.disconnect();
    }

    // Create new MediaElementSource and connect it
    sourceNode = audioContext.createMediaElementSource(audioElement);
    sourceNode.connect(analyser);
    analyser.connect(audioContext.destination);

    // Start playing
    await audioElement.play();
    console.log('[AudioController] Audio started:', url);

    return audioElement;
  } catch (err) {
    console.error('[AudioController] Error loading/playing audio:', err);
    throw err;
  }
}
