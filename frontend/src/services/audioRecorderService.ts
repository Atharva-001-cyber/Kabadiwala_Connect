export interface AudioRecordingResult {
  blob: Blob;
  base64Audio: string;
  mimeType: string;
}

export class AudioRecorderService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private volumeCallback: ((volume: number) => void) | null = null;
  private animationFrameId: number | null = null;

  public async startRecording(onVolumeChange?: (volume: number) => void): Promise<boolean> {
    this.stopRecordingSilent();
    this.audioChunks = [];
    this.volumeCallback = onVolumeChange || null;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      this.mediaStream = stream;

      // Setup Web Audio API volume visualizer
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          this.audioContext = ctx;
          if (ctx.state === 'suspended') {
            await ctx.resume().catch(() => {});
          }
          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          this.analyserNode = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateVolume = () => {
            if (this.analyserNode && this.volumeCallback) {
              this.analyserNode.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
              }
              const avg = sum / dataArray.length;
              const normalized = Math.min(100, Math.round((avg / 128) * 100));
              this.volumeCallback(normalized);
            }
            this.animationFrameId = requestAnimationFrame(updateVolume);
          };
          updateVolume();
        }
      } catch (e) {
        console.warn('[AudioRecorder] Visualizer setup error:', e);
      }

      // Determine supported MIME type
      let options: MediaRecorderOptions = {};
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          options = { mimeType: 'audio/webm;codecs=opus' };
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          options = { mimeType: 'audio/webm' };
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          options = { mimeType: 'audio/mp4' };
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          options = { mimeType: 'audio/ogg' };
        }
      }

      const recorder = new MediaRecorder(stream, options);
      this.mediaRecorder = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      recorder.start(100);
      return true;
    } catch (err) {
      console.error('[AudioRecorder] Failed to start microphone recording:', err);
      this.stopRecordingSilent();
      throw err;
    }
  }

  public stopRecording(): Promise<AudioRecordingResult> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording instance found'));
        return;
      }

      const recorder = this.mediaRecorder;
      const mimeType = recorder.mimeType || 'audio/webm';

      recorder.onstop = async () => {
        try {
          const audioBlob = new Blob(this.audioChunks, { type: mimeType });
          const base64Audio = await this.blobToBase64(audioBlob);
          this.stopRecordingSilent();
          resolve({ blob: audioBlob, base64Audio, mimeType });
        } catch (err) {
          this.stopRecordingSilent();
          reject(err);
        }
      };

      try {
        recorder.stop();
      } catch (e) {
        this.stopRecordingSilent();
        reject(e);
      }
    });
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1] || result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  public stopRecordingSilent(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.audioContext) {
      try { this.audioContext.close(); } catch {}
      this.audioContext = null;
    }
    this.analyserNode = null;

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try { this.mediaRecorder.stop(); } catch {}
    }
    this.mediaRecorder = null;

    if (this.mediaStream) {
      try {
        this.mediaStream.getTracks().forEach(track => track.stop());
      } catch {}
      this.mediaStream = null;
    }
    this.audioChunks = [];
    this.volumeCallback = null;
  }

  public isRecording(): boolean {
    return this.mediaRecorder !== null && this.mediaRecorder.state === 'recording';
  }
}

export const audioRecorderService = new AudioRecorderService();
