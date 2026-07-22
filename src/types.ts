export interface Chapter {
  id: string;
  number: number;
  title: string;
  summary: string;
  content: string;
  audioScript: string;
  estimatedMinutes: number;
  wordCount: number;
  keyPoints?: string[];
}

export interface AudiobookMetaData {
  title: string;
  author: string;
  coverColor?: string;
  totalChapters: number;
  totalPages: number;
  totalWordCount: number;
  estimatedTotalMinutes: number;
  overview: string;
  suggestedVoiceTone: string;
  chapters: Chapter[];
}

export interface SampleBook {
  id: string;
  title: string;
  author: string;
  category: string;
  description: string;
  coverBg: string;
  sampleText: string;
}

export interface VoiceOption {
  id: string;
  name: string;
  lang: string;
  gender: 'male' | 'female' | 'neutral';
  provider: 'browser' | 'gemini' | 'custom_cloned';
  geminiVoiceName?: string;
  customProfile?: CustomVoiceProfile;
}

export interface CustomVoiceProfile {
  id: string;
  name: string;
  recordedAt: string;
  pitch: number;
  rate: number;
  baseSystemVoiceName?: string;
  sampleAudioUrl?: string;
  calibrationPhrases: string[];
  acousticFeatures?: {
    avgPitchHz: number;
    clarityScore: number;
  };
}

export interface Bookmark {
  id: string;
  chapterId: string;
  paragraphIndex: number;
  textSnippet: string;
  timestamp: string;
  note?: string;
}

export type PlayerMode = 'browser' | 'gemini';
