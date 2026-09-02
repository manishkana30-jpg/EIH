/**
 * public/audio-worklet-processor.js
 *
 * High-Precision AudioWorkletProcessor for Emotional Intelligence Healer
 * Captures raw browser Float32 PCM audio (at any native hardware sample rate e.g. 44.1kHz, 48kHz, 96kHz),
 * performs linear interpolation resampling to target sample rate (16kHz / 24kHz),
 * and converts samples into 16-bit linear signed integers (Int16 PCM) for low-latency streaming.
 */

class PCMProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.targetSampleRate = options?.processorOptions?.targetSampleRate || 16000;
    this.bufferSize = options?.processorOptions?.bufferSize || 2048;
    this.chunkBuffer = new Int16Array(this.bufferSize);
    this.chunkIndex = 0;
    this.isMuted = false;

    // Resampling state
    this.resampleRatio = currentSampleRate ? currentSampleRate / this.targetSampleRate : 1.0;
    this.resamplePosition = 0;
    this.lastInputSample = 0;

    this.port.onmessage = (event) => {
      if (event.data && event.data.type === 'SET_MUTE') {
        this.isMuted = !!event.data.muted;
      }
      if (event.data && event.data.type === 'SET_TARGET_SAMPLE_RATE') {
        this.targetSampleRate = event.data.targetSampleRate || 16000;
        this.resampleRatio = currentSampleRate ? currentSampleRate / this.targetSampleRate : 1.0;
      }
    };
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || input.length === 0 || this.isMuted) {
      return true;
    }

    const inputChannel = input[0]; // Mono channel
    if (!inputChannel || inputChannel.length === 0) {
      return true;
    }

    const inputLength = inputChannel.length;
    const ratio = currentSampleRate ? currentSampleRate / this.targetSampleRate : 1.0;

    if (Math.abs(ratio - 1.0) < 0.01) {
      // 1:1 Sample Rate (No resampling needed)
      for (let i = 0; i < inputLength; i++) {
        let sample = Math.max(-1, Math.min(1, inputChannel[i]));
        this.chunkBuffer[this.chunkIndex++] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;

        if (this.chunkIndex >= this.bufferSize) {
          this.emitChunk();
        }
      }
    } else {
      // Linear Interpolation Resampler
      let inIdx = 0;
      while (inIdx < inputLength) {
        const nextInIdx = Math.floor(this.resamplePosition);
        if (nextInIdx >= inputLength) {
          this.resamplePosition -= inputLength;
          break;
        }

        const frac = this.resamplePosition - nextInIdx;
        const s0 = nextInIdx === 0 ? this.lastInputSample : inputChannel[nextInIdx - 1];
        const s1 = inputChannel[nextInIdx];
        const interpolated = s0 + frac * (s1 - s0);

        let sample = Math.max(-1, Math.min(1, interpolated));
        this.chunkBuffer[this.chunkIndex++] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;

        if (this.chunkIndex >= this.bufferSize) {
          this.emitChunk();
        }

        this.resamplePosition += ratio;
        inIdx = Math.floor(this.resamplePosition);
      }
      this.lastInputSample = inputChannel[inputLength - 1];
    }

    return true;
  }

  emitChunk() {
    const pcmData = this.chunkBuffer.slice(0, this.bufferSize);
    this.port.postMessage(
      {
        type: 'PCM_CHUNK',
        buffer: pcmData.buffer,
        sampleRate: this.targetSampleRate,
      },
      [pcmData.buffer]
    );
    this.chunkIndex = 0;
  }
}

registerProcessor('pcm-processor', PCMProcessor);
