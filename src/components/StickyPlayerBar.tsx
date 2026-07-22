import React from 'react';
import { Play, Pause, RotateCcw, RotateCw, Volume2, Maximize2, SkipBack, SkipForward, Headphones } from 'lucide-react';
import { AudiobookMetaData, Chapter } from '../types';

interface StickyPlayerBarProps {
  audiobook: AudiobookMetaData;
  currentChapter: Chapter;
  currentChapterIndex: number;
  onSelectChapter: (index: number) => void;
  isPlaying: boolean;
  onStartPlay: () => void;
  onPauseAudio: () => void;
  onSkipSeconds: (direction: 'forward' | 'backward') => void;
  progressPercent: number;
  rate: number;
  onOpenPlayerTab: () => void;
}

export const StickyPlayerBar: React.FC<StickyPlayerBarProps> = ({
  audiobook,
  currentChapter,
  currentChapterIndex,
  onSelectChapter,
  isPlaying,
  onStartPlay,
  onPauseAudio,
  onSkipSeconds,
  progressPercent,
  rate,
  onOpenPlayerTab,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 shadow-2xl px-4 py-2.5">
      
      {/* Progress Bar Top Edge */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Left: Book & Chapter Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-amber-600 to-orange-700 p-0.5 flex items-center justify-center shrink-0 shadow">
            <Headphones className="w-5 h-5 text-amber-200" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-white truncate">{currentChapter.title}</h4>
            <p className="text-[11px] text-slate-400 truncate">{audiobook.title} • Ch. {currentChapter.number}</p>
          </div>
        </div>

        {/* Center: Play/Pause Controls */}
        <div className="flex items-center gap-3">
          <button
            disabled={currentChapterIndex === 0}
            onClick={() => onSelectChapter(currentChapterIndex - 1)}
            className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 transition-colors hidden sm:block"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={() => onSkipSeconds('backward')}
            className="p-1.5 text-slate-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {isPlaying ? (
            <button
              onClick={onPauseAudio}
              className="p-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 rounded-full font-bold shadow-md hover:scale-105 transition-all"
            >
              <Pause className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button
              onClick={onStartPlay}
              className="p-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 rounded-full font-bold shadow-md hover:scale-105 transition-all"
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </button>
          )}

          <button
            onClick={() => onSkipSeconds('forward')}
            className="p-1.5 text-slate-400 hover:text-white transition-colors"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            disabled={currentChapterIndex === audiobook.chapters.length - 1}
            onClick={() => onSelectChapter(currentChapterIndex + 1)}
            className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 transition-colors hidden sm:block"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Fullscreen Reader Expand Button */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 hidden sm:inline">
            {rate}x
          </span>

          <button
            onClick={onOpenPlayerTab}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700/80 rounded-lg transition-all"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Open Reader</span>
          </button>
        </div>

      </div>
    </div>
  );
};
