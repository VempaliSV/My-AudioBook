import { useState, useEffect, useRef, useCallback } from 'react';
import { VoiceOption } from '../types';

export const GEMINI_VOICES: VoiceOption[] = [
  { id: 'gemini-kore', name: 'Kore (Pristine Female Studio Voice)', lang: 'en-US', gender: 'female', provider: 'gemini', geminiVoiceName: 'Kore' },
  { id: 'gemini-zephyr', name: 'Zephyr (Clear & Articulate Female Narration)', lang: 'en-US', gender: 'female', provider: 'gemini', geminiVoiceName: 'Zephyr' },
  { id: 'gemini-puck', name: 'Puck (Lively Expressive Male)', lang: 'en-US', gender: 'male', provider: 'gemini', geminiVoiceName: 'Puck' },
  { id: 'gemini-charon', name: 'Charon (Deep Storyteller Male)', lang: 'en-US', gender: 'male', provider: 'gemini', geminiVoiceName: 'Charon' },
  { id: 'gemini-fenrir', name: 'Fenrir (Resonant Dramatic Male)', lang: 'en-US', gender: 'male', provider: 'gemini', geminiVoiceName: 'Fenrir' },
];

export function useAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(1.0);
  const [voices, setVoices] = useState<VoiceOption[]>(GEMINI_VOICES);
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>(GEMINI_VOICES[0]);
  
  const [paragraphs, setParagraphs] = useState<string[]>([]);
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState<number>(0);
  const [currentCharIndex, setCurrentCharIndex] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(0);

  // Sleep timer in seconds
  const [sleepTimerSeconds, setSleepTimerSeconds] = useState<number | null>(null);

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const isPausedRef = useRef<boolean>(false);

  // Load browser speech voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;

      const updateBrowserVoices = () => {
        const browserVoices = window.speechSynthesis.getVoices();
        const formattedBrowserVoices: VoiceOption[] = browserVoices.map((v, i) => ({
          id: `browser-${i}-${v.name}`,
          name: `${v.name} (${v.lang})`,
          lang: v.lang,
          gender: v.name.toLowerCase().includes('female') ? 'female' : 'male',
          provider: 'browser',
        }));

        setVoices([...GEMINI_VOICES, ...formattedBrowserVoices]);
      };

      updateBrowserVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = updateBrowserVoices;
      }
    }
  }, []);

  // Handle sleep timer interval
  useEffect(() => {
    if (sleepTimerSeconds === null || sleepTimerSeconds <= 0) return;

    const timer = setInterval(() => {
      setSleepTimerSeconds((prev) => {
        if (prev === null || prev <= 1) {
          stopAudio();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sleepTimerSeconds]);

  // Set new chapter / text script
  const loadTextScript = useCallback((fullText: string) => {
    // Stop current speech
    if (synthRef.current) synthRef.current.cancel();
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current = null;
    }

    // Split text into paragraphs/chunks for fine-grained highlighting
    const chunks = fullText
      .split(/(?:\r?\n){2,}|\.\s+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    setParagraphs(chunks.length > 0 ? chunks : [fullText]);
    setCurrentParagraphIndex(0);
    setCurrentCharIndex(0);
    setProgressPercent(0);
    setIsPlaying(false);
    setIsPaused(false);
  }, []);

  // Play Browser TTS paragraph by index
  const playParagraph = useCallback(
    (index: number) => {
      if (!synthRef.current || paragraphs.length === 0) return;

      synthRef.current.cancel();

      if (index >= paragraphs.length) {
        setIsPlaying(false);
        setIsPaused(false);
        setProgressPercent(100);
        return;
      }

      const text = paragraphs[index];
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      // Select female speech voice (e.g. Samantha, Karen, Google US English Female, Victoria)
      const bVoices = window.speechSynthesis.getVoices();
      const preferredFemaleVoice = bVoices.find((v) =>
        v.lang.startsWith('en') && (
          v.name.toLowerCase().includes('female') ||
          v.name.toLowerCase().includes('samantha') ||
          v.name.toLowerCase().includes('karen') ||
          v.name.toLowerCase().includes('zira') ||
          v.name.toLowerCase().includes('victoria') ||
          v.name.toLowerCase().includes('google us english') ||
          v.name.toLowerCase().includes('natural')
        )
      ) || bVoices.find((v) => v.lang.startsWith('en'));

      if (selectedVoice.provider === 'browser') {
        const matched = bVoices.find((v) => `${v.name} (${v.lang})` === selectedVoice.name);
        if (matched) utterance.voice = matched;
        else if (preferredFemaleVoice) utterance.voice = preferredFemaleVoice;
      } else if (selectedVoice.provider === 'custom_cloned') {
        if (selectedVoice.customProfile) {
          utterance.pitch = Math.max(0.5, Math.min(2.0, selectedVoice.customProfile.pitch));
          utterance.rate = Math.max(0.5, Math.min(2.0, rate * (selectedVoice.customProfile.rate || 1.0)));
        }
        if (selectedVoice.customProfile?.baseSystemVoiceName) {
          const matched = bVoices.find((v) => v.name === selectedVoice.customProfile?.baseSystemVoiceName);
          if (matched) utterance.voice = matched;
          else if (preferredFemaleVoice) utterance.voice = preferredFemaleVoice;
        } else if (preferredFemaleVoice) {
          utterance.voice = preferredFemaleVoice;
        }
      } else if (preferredFemaleVoice) {
        // Default to clear female voice on browser speech engine
        utterance.voice = preferredFemaleVoice;
      }

      utterance.onboundary = (event) => {
        if (event.name === 'word' || event.name === 'sentence') {
          setCurrentCharIndex(event.charIndex);
        }
      };

      utterance.onend = () => {
        if (isPausedRef.current) return;
        const nextIdx = index + 1;
        setCurrentParagraphIndex(nextIdx);
        setProgressPercent(Math.round(((nextIdx) / paragraphs.length) * 100));
        
        if (nextIdx < paragraphs.length) {
          playParagraph(nextIdx);
        } else {
          setIsPlaying(false);
          setIsPaused(false);
        }
      };

      utterance.onerror = (err) => {
        if (isPausedRef.current) return;
        console.warn('Speech synthesis utterance event error:', err);
        setIsPlaying(false);
      };

      utteranceRef.current = utterance;
      setCurrentParagraphIndex(index);
      setProgressPercent(Math.round((index / paragraphs.length) * 100));
      setIsPlaying(true);
      setIsPaused(false);
      isPausedRef.current = false;

      synthRef.current.speak(utterance);
    },
    [paragraphs, rate, pitch, volume, selectedVoice]
  );

  // Play Gemini HD Voice (via server API)
  const playGeminiTts = useCallback(
    async (textToSpeak: string) => {
      try {
        setIsPlaying(true);
        setIsPaused(false);
        isPausedRef.current = false;

        const res = await fetch('/api/generate-tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: textToSpeak,
            voiceName: selectedVoice.geminiVoiceName || 'Kore',
          }),
        });

        if (!res.ok) {
          throw new Error('Gemini TTS generation failed');
        }

        const data = await res.json();
        
        if (data.fallbackToBrowser || !data.audioBase64) {
          console.info('Gemini TTS fallback triggered, playing with clear browser female voice.');
          playParagraph(currentParagraphIndex);
          return;
        }

        const base64Audio = data.audioBase64;

        // Decode PCM audio 24000Hz
        const binaryStr = atob(base64Audio);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }

        // Create 24kHz Audio Context for Gemini PCM
        if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        } else if (audioCtxRef.current.state === 'suspended') {
          await audioCtxRef.current.resume();
        }

        const ctx = audioCtxRef.current;
        // Convert 16-bit PCM buffer to AudioBuffer
        const pcm16 = new Int16Array(bytes.buffer);
        const float32 = new Float32Array(pcm16.length);
        for (let i = 0; i < pcm16.length; i++) {
          float32[i] = pcm16[i] / 32768.0;
        }

        const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
        audioBuffer.getChannelData(0).set(float32);

        if (audioSourceRef.current) {
          audioSourceRef.current.stop();
        }

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.playbackRate.value = rate;

        const gainNode = ctx.createGain();
        gainNode.gain.value = volume;

        source.connect(gainNode);
        gainNode.connect(ctx.destination);

        source.onended = () => {
          if (!isPausedRef.current) {
            setIsPlaying(false);
            setIsPaused(false);
          }
        };

        audioSourceRef.current = source;
        source.start(0);
      } catch (err) {
        console.warn('Gemini HD Voice unavailable or errored, falling back to browser speech:', err);
        // Fallback to browser TTS
        playParagraph(currentParagraphIndex);
      }
    },
    [selectedVoice, rate, volume, playParagraph, currentParagraphIndex]
  );

  const startPlay = useCallback(() => {
    isPausedRef.current = false;

    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
      setIsPlaying(true);
      setIsPaused(false);
      return;
    }

    if (selectedVoice.provider === 'gemini') {
      const textRemaining = paragraphs.slice(currentParagraphIndex).join(' ');
      playGeminiTts(textRemaining || paragraphs.join(' '));
    } else {
      playParagraph(currentParagraphIndex);
    }
  }, [selectedVoice, paragraphs, currentParagraphIndex, playGeminiTts, playParagraph]);

  const pauseAudio = useCallback(() => {
    isPausedRef.current = true;
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'running') {
      audioCtxRef.current.suspend();
    }
    setIsPlaying(false);
    setIsPaused(true);
  }, []);

  const stopAudio = useCallback(() => {
    isPausedRef.current = false;
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch (e) {}
      audioSourceRef.current = null;
    }
    setIsPlaying(false);
    setIsPaused(false);
  }, []);

  const seekToParagraph = useCallback(
    (index: number) => {
      if (index < 0 || index >= paragraphs.length) return;
      setCurrentParagraphIndex(index);
      setCurrentCharIndex(0);
      setProgressPercent(Math.round((index / paragraphs.length) * 100));
      if (isPlaying) {
        playParagraph(index);
      }
    },
    [paragraphs, isPlaying, playParagraph]
  );

  const skipSeconds = useCallback(
    (direction: 'forward' | 'backward') => {
      const step = direction === 'forward' ? 1 : -1;
      const nextIdx = Math.max(0, Math.min(paragraphs.length - 1, currentParagraphIndex + step));
      seekToParagraph(nextIdx);
    },
    [currentParagraphIndex, paragraphs, seekToParagraph]
  );

  return {
    isPlaying,
    isPaused,
    rate,
    setRate,
    pitch,
    setPitch,
    volume,
    setVolume,
    voices,
    selectedVoice,
    setSelectedVoice,
    paragraphs,
    currentParagraphIndex,
    currentCharIndex,
    progressPercent,
    sleepTimerSeconds,
    setSleepTimerSeconds,
    loadTextScript,
    startPlay,
    pauseAudio,
    stopAudio,
    seekToParagraph,
    skipSeconds,
  };
}
