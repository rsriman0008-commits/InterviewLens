import { ELEVENLABS_API_KEY } from './config';

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

export const voiceService = {
  // Text to speech using ElevenLabs
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

  // Play audio
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

  // Speech to text using Web Speech API
  speechToText: async (
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
      recognition.onend = () => onEnd?.();
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
