/**
 * In-Browser Transformers.js Whisper-Tiny Web Worker
 * Runs client-side automatic speech recognition (ASR) in an isolated background thread
 * using Xenova/whisper-tiny.en via WebAssembly & WebGPU / CPU ONNX runtime.
 */

import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';

// Configure environment for browser web worker
env.allowLocalModels = false;
env.useBrowserCache = true;

class WhisperPipelineSingleton {
  static task = 'automatic-speech-recognition';
  static model = 'Xenova/whisper-tiny.en';
  static instance = null;

  static async getInstance(progress_callback = null) {
    if (this.instance === null) {
      this.instance = await pipeline(this.task, this.model, {
        quantized: true,
        progress_callback,
      });
    }
    return this.instance;
  }
}

self.addEventListener('message', async (event) => {
  const { type, data, id } = event.data;

  if (type === 'INIT') {
    try {
      self.postMessage({ type: 'STATUS', status: 'loading', message: 'Loading Whisper-Tiny model...' });
      const transcriber = await WhisperPipelineSingleton.getInstance((x) => {
        self.postMessage({ type: 'PROGRESS', data: x });
      });
      self.postMessage({ type: 'STATUS', status: 'ready', message: 'Whisper-Tiny model ready.' });
    } catch (err) {
      self.postMessage({ type: 'ERROR', error: err.message || 'Failed to load Whisper model' });
    }
    return;
  }

  if (type === 'TRANSCRIBE') {
    try {
      const transcriber = await WhisperPipelineSingleton.getInstance();
      const audioData = data.audio; // Float32Array at 16kHz
      
      const output = await transcriber(audioData, {
        chunk_length_s: 30,
        stride_length_s: 5,
        language: 'english',
        task: 'transcribe',
      });

      self.postMessage({
        type: 'TRANSCRIBE_RESULT',
        id,
        text: output.text ? output.text.trim() : '',
      });
    } catch (err) {
      self.postMessage({
        type: 'TRANSCRIBE_ERROR',
        id,
        error: err.message || 'Transcription error',
      });
    }
  }
});
