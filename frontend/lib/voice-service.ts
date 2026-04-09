import { ELEVENLABS_API_KEY } from './config';
import apiClient from './api-client';

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

/**
 * Voice service providing:
 *  - Text-to-Speech (ElevenLabs + browser fallback)
 *  - Speech-to-Text (backend Gemini STT + Web Speech API fallback)
 *  - Audio playback
 */
export const voiceService = {
  // ─── Browser TTS fallback (fast, no API keys) ───────────────────────
  speakText: async (text: string, opts?: { rate?: number; pitch?: number; volume?: number }) => {
    if (typeof window === 'undefined') return;
    const synth = window.speechSynthesis;
    if (!synth || typeof SpeechSynthesisUtterance === 'undefined') {
      throw new Error('Speech Synthesis API not supported');
    }

    // Cancel any ongoing speech so the latest question is heard immediately
    try {
      synth.cancel();
    } catch {
      // ignore
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = opts?.rate ?? 1.15;
    utterance.pitch = opts?.pitch ?? 1.0;
    utterance.volume = opts?.volume ?? 1.0;

    await new Promise<void>((resolve, reject) => {
      utterance.onend = () => resolve();
      utterance.onerror = () => reject(new Error('Error speaking text'));
      synth.speak(utterance);
    });
  },

  // ─── Text to speech using ElevenLabs ────────────────────────────────
  textToSpeech: async (text: string, voiceId = 'pNInz6obpgDQGcFmaJgB') => {
    try {
      const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs TTS failed: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error in text to speech:', error);
      throw error;
    }
  },

  // ─── Play audio blob ───────────────────────────────────────────────
  playAudio: async (audioBlob: Blob) => {
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    return new Promise<void>((resolve, reject) => {
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        reject(new Error('Error playing audio'));
      };
      audio.play().catch(reject);
    });
  },

  // ─── Speech to Text (primary: record + send to backend Gemini STT) ─
  speechToText: async (
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (error: string) => void
  ): Promise<string> => {
    // Try backend-powered Gemini STT first (better accuracy for technical terms)
    try {
      const transcript = await voiceService._recordAndTranscribeViaBackend(onStart, onEnd, onError);
      if (transcript && transcript.trim().length > 0) {
        return transcript;
      }
    } catch (err) {
      console.warn('Backend STT failed, falling back to Web Speech API:', err);
    }

    // Fallback to browser Web Speech API
    return voiceService._webSpeechAPIFallback(onStart, onEnd, onError);
  },

  // ─── Record audio via MediaRecorder and send to backend STT ────────
  _recordAndTranscribeViaBackend: async (
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (error: string) => void
  ): Promise<string> => {
    return new Promise<string>(async (resolve, reject) => {
      try {
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 16000,
          },
        });

        // Determine best supported MIME type
        const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4']
          .find((type) => MediaRecorder.isTypeSupported(type)) || 'audio/webm';

        const recorder = new MediaRecorder(stream, { mimeType });
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstart = () => {
          onStart?.();
        };

        recorder.onstop = async () => {
          onEnd?.();
          // Stop all mic tracks
          stream.getTracks().forEach((t) => t.stop());

          if (chunks.length === 0) {
            resolve('');
            return;
          }

          const audioBlob = new Blob(chunks, { type: mimeType.split(';')[0] });

          // Send to backend STT
          try {
            const formData = new FormData();
            const ext = mimeType.includes('webm') ? 'webm' : mimeType.includes('ogg') ? 'ogg' : 'mp4';
            formData.append('audio', audioBlob, `recording.${ext}`);

            const response = await apiClient.post('/api/speech-to-text', formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
              timeout: 30000,  // 30s timeout for transcription
            });

            const result = response.data;

            if (result.error) {
              console.warn('STT returned error:', result.error);
              onError?.(result.error);
            }

            resolve(result.transcript || '');
          } catch (err: any) {
            console.error('Backend STT request failed:', err);
            onError?.(err.message || 'Transcription failed');
            reject(err);
          }
        };

        recorder.onerror = (e: any) => {
          stream.getTracks().forEach((t) => t.stop());
          onError?.(e.error?.message || 'Recording error');
          reject(new Error('MediaRecorder error'));
        };

        // Start recording
        recorder.start();

        // Auto-stop after 30 seconds (safety limit)
        const autoStopTimeout = setTimeout(() => {
          if (recorder.state === 'recording') {
            recorder.stop();
          }
        }, 30000);

        // Listen for silence / user stopping (via the isRecording state)
        // The caller (handleMicToggle) will set isRecording=false which triggers
        // a re-render. We use a simpler approach: stop after speech pause.
        // Use a 3-second silence detection via AudioContext
        try {
          const audioCtx = new AudioContext();
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 512;
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          let silenceStart = Date.now();
          const SILENCE_THRESHOLD = 10;
          const SILENCE_DURATION = 3000; // 3 seconds of silence = stop
          const MIN_RECORDING = 1500; // Minimum 1.5s recording

          const checkSilence = () => {
            if (recorder.state !== 'recording') return;

            analyser.getByteFrequencyData(dataArray);
            const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

            if (avg < SILENCE_THRESHOLD) {
              if (Date.now() - silenceStart > SILENCE_DURATION && Date.now() - (recorder as any)._startTime > MIN_RECORDING) {
                clearTimeout(autoStopTimeout);
                recorder.stop();
                audioCtx.close();
                return;
              }
            } else {
              silenceStart = Date.now();
            }

            requestAnimationFrame(checkSilence);
          };

          (recorder as any)._startTime = Date.now();
          requestAnimationFrame(checkSilence);
        } catch {
          // If AudioContext fails, just rely on the 30s auto-stop
        }
      } catch (err: any) {
        onError?.(err.message || 'Microphone access denied');
        reject(err);
      }
    });
  },

  // ─── Web Speech API fallback ───────────────────────────────────────
  _webSpeechAPIFallback: async (
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (error: string) => void
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        reject(new Error('Speech Recognition API not supported'));
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      let transcript = '';

      recognition.onstart = () => onStart?.();
      recognition.onerror = (event: any) => {
        onError?.(event.error);
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      recognition.onresult = (event: any) => {
        transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
      };

      recognition.onend = () => {
        onEnd?.();
        resolve(transcript);
      };

      recognition.start();
    });
  },
};
