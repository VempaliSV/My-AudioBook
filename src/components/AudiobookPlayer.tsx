import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  Bookmark,
  Download,
  Sparkles,
  Volume2,
  FileText,
  Clock,
  Gauge,
  Sliders,
  Moon,
  Check,
  UserCheck,
  ChevronDown,
  Mic,
} from 'lucide-react';
import { Chapter, AudiobookMetaData, VoiceOption } from '../types';

interface AudiobookPlayerProps {
  audiobook: AudiobookMetaData;
  currentChapter: Chapter;
  currentChapterIndex: number;
  onSelectChapter: (index: number) => void;
  paragraphs: string[];
  currentParagraphIndex: number;
  currentCharIndex: number;
  isPlaying: boolean;
  isPaused: boolean;
  onStartPlay: () => void;
  onPauseAudio: () => void;
  onStopAudio: () => void;
  onSeekToParagraph: (index: number) => void;
  onSkipSeconds: (direction: 'forward' | 'backward') => void;
  rate: number;
  onChangeRate: (newRate: number) => void;
  onAddBookmark: (chapterId: string, paragraphIndex: number, textSnippet: string) => void;
  savedBookmarkIds: string[];
  voices?: VoiceOption[];
  selectedVoice?: VoiceOption;
  onSelectVoice?: (voice: VoiceOption) => void;
  clonedVoice?: VoiceOption | null;
  onOpenVoiceCloneModal?: () => void;
}

export const AudiobookPlayer: React.FC<AudiobookPlayerProps> = ({
  audiobook,
  currentChapter,
  currentChapterIndex,
  onSelectChapter,
  paragraphs,
  currentParagraphIndex,
  currentCharIndex,
  isPlaying,
  isPaused,
  onStartPlay,
  onPauseAudio,
  onStopAudio,
  onSeekToParagraph,
  onSkipSeconds,
  rate,
  onChangeRate,
  onAddBookmark,
  savedBookmarkIds,
  voices = [],
  selectedVoice,
  onSelectVoice,
  clonedVoice,
  onOpenVoiceCloneModal,
}) => {
  const [useAudioScript, setUseAudioScript] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showNarratorMenu, setShowNarratorMenu] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

  const handleExportText = () => {
    const textToExport = `${audiobook.title} - ${currentChapter.title}\n\n${currentChapter.audioScript || currentChapter.content}`;
    const blob = new Blob([textToExport], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${audiobook.title.replace(/\s+/g, '_')}_${currentChapter.title.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
      
      {/* Chapter Top Navigation Header */}
      <div className="p-4 sm:p-6 border-b border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Chapter {currentChapter.number} of {audiobook.totalChapters}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              {currentChapter.estimatedMinutes} min audio
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            {currentChapter.title}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">{audiobook.title} • {audiobook.author}</p>
        </div>

        {/* View Toggle (Polished AI Audio Script vs Raw Text) */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
            <button
              onClick={() => setUseAudioScript(true)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                useAudioScript
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Citations removed, numbers & abbreviations expanded for speech"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>AI Audio Script</span>
            </button>

            <button
              onClick={() => setUseAudioScript(false)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                !useAudioScript
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Original PDF Text</span>
            </button>
          </div>

          <button
            onClick={handleExportText}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 transition-colors"
            title="Export Chapter Script Text"
          >
            {downloadSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <Download className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Audio Waveform Visualizer & Narrator Selector Banner */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/40 border-b border-slate-800/80 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-end gap-1 h-6">
            <div className={`w-1 bg-amber-400 rounded-full transition-all ${isPlaying ? 'animate-bounce h-5' : 'h-2'}`} style={{ animationDelay: '0ms' }} />
            <div className={`w-1 bg-amber-400 rounded-full transition-all ${isPlaying ? 'animate-bounce h-6' : 'h-4'}`} style={{ animationDelay: '150ms' }} />
            <div className={`w-1 bg-amber-400 rounded-full transition-all ${isPlaying ? 'animate-bounce h-3' : 'h-2'}`} style={{ animationDelay: '300ms' }} />
            <div className={`w-1 bg-amber-400 rounded-full transition-all ${isPlaying ? 'animate-bounce h-5' : 'h-3'}`} style={{ animationDelay: '450ms' }} />
          </div>
          <span className="text-xs text-slate-300 font-medium hidden sm:inline">
            {isPlaying ? 'Now Playing Audio Narration' : isPaused ? 'Audio Paused' : 'Ready to Listen'}
          </span>
        </div>

        {/* Narrator Voice Quick Selector & Speed controls */}
        <div className="flex items-center gap-2">
          
          {/* Narrator Dropdown */}
          <div className="relative">
            <button
              id="dropdown-narrator-selector"
              onClick={() => setShowNarratorMenu(!showNarratorMenu)}
              className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-200 transition-all shadow-sm"
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate max-w-[140px]">
                {selectedVoice ? selectedVoice.name : 'Select Narrator'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-amber-400/80" />
            </button>

            {showNarratorMenu && (
              <div className="absolute right-0 mt-1.5 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-40 space-y-1">
                <div className="px-3 py-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase border-b border-slate-800 flex justify-between items-center">
                  <span>Choose Narrator Voice</span>
                  {onOpenVoiceCloneModal && (
                    <button
                      onClick={() => {
                        setShowNarratorMenu(false);
                        onOpenVoiceCloneModal();
                      }}
                      className="text-amber-400 hover:underline text-[10px] flex items-center gap-0.5"
                    >
                      <Mic className="w-2.5 h-2.5" /> Clone Voice
                    </button>
                  )}
                </div>

                {/* Cloned Voice Option if present */}
                {clonedVoice && onSelectVoice && (
                  <button
                    onClick={() => {
                      onSelectVoice(clonedVoice);
                      setShowNarratorMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-xs text-left hover:bg-slate-800/80 flex items-center justify-between border-b border-slate-800/60 ${
                      selectedVoice?.id === clonedVoice.id ? 'text-amber-300 font-bold bg-amber-500/15' : 'text-slate-200'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <p className="font-semibold text-amber-300">My Cloned Voice</p>
                      <p className="text-[10px] text-slate-400 truncate">{clonedVoice.name}</p>
                    </div>
                    {selectedVoice?.id === clonedVoice.id && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                  </button>
                )}

                {/* Available Voices List */}
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/40">
                  {voices.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => {
                        if (onSelectVoice) onSelectVoice(v);
                        setShowNarratorMenu(false);
                      }}
                      className={`w-full px-3 py-2 text-xs text-left hover:bg-slate-800/80 flex items-center justify-between transition-colors ${
                        selectedVoice?.id === v.id ? 'text-amber-300 font-bold bg-amber-500/15' : 'text-slate-300'
                      }`}
                    >
                      <span className="truncate pr-2">{v.name}</span>
                      {selectedVoice?.id === v.id && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Speed Quick Selector */}
          <div className="relative">
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 text-amber-400"
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>{rate}x Speed</span>
            </button>

            {showSpeedMenu && (
              <div className="absolute right-0 mt-1 w-28 bg-slate-900 border border-slate-800 rounded-xl shadow-xl py-1 z-30">
                {speedOptions.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      onChangeRate(s);
                      setShowSpeedMenu(false);
                    }}
                    className={`w-full px-3 py-1.5 text-xs text-left hover:bg-slate-800 flex items-center justify-between ${
                      rate === s ? 'text-amber-400 font-bold bg-amber-500/10' : 'text-slate-300'
                    }`}
                  >
                    <span>{s}x</span>
                    {rate === s && <Check className="w-3 h-3 text-amber-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Main Reading & Transcript Area */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-6 max-w-4xl mx-auto w-full leading-relaxed">
        {paragraphs.map((paragraph, index) => {
          const isCurrent = index === currentParagraphIndex;
          const bookmarkKey = `${currentChapter.id}-${index}`;
          const isBookmarked = savedBookmarkIds.includes(bookmarkKey);

          return (
            <div
              key={index}
              onClick={() => onSeekToParagraph(index)}
              className={`p-4 rounded-2xl transition-all duration-300 relative group cursor-pointer border ${
                isCurrent
                  ? 'bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/20'
                  : 'bg-slate-900/30 hover:bg-slate-900/80 border-slate-800/50 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                
                {/* Paragraph Content */}
                <p className={`text-sm sm:text-base ${isCurrent ? 'text-amber-100 font-medium' : 'text-slate-300'}`}>
                  {isCurrent ? (
                    <span>
                      <span className="bg-amber-400/20 text-amber-200 px-1 py-0.5 rounded border border-amber-400/30 font-semibold mr-2">
                        ▶ Listening
                      </span>
                      {paragraph}
                    </span>
                  ) : (
                    paragraph
                  )}
                </p>

                {/* Bookmark Action */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddBookmark(currentChapter.id, index, paragraph);
                  }}
                  className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ${
                    isBookmarked
                      ? 'text-amber-400 bg-amber-500/20 opacity-100'
                      : 'text-slate-500 hover:text-amber-300 hover:bg-slate-800'
                  }`}
                  title={isBookmarked ? 'Bookmarked' : 'Add Bookmark'}
                >
                  <Bookmark className="w-4 h-4 fill-current" />
                </button>
              </div>

              {isCurrent && (
                <div className="mt-2 flex items-center gap-2 text-[11px] text-amber-400/80">
                  <Volume2 className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                  <span>Reading Paragraph {index + 1} of {paragraphs.length}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Integrated In-Player Controls Footer Bar */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/90 backdrop-blur-md shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Chapter Switcher */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          <button
            disabled={currentChapterIndex === 0}
            onClick={() => onSelectChapter(currentChapterIndex - 1)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700/80 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <SkipBack className="w-3.5 h-3.5" />
            <span>Prev Chapter</span>
          </button>

          <span className="text-xs text-slate-400 font-mono">
            Ch {currentChapter.number}/{audiobook.totalChapters}
          </span>

          <button
            disabled={currentChapterIndex === audiobook.chapters.length - 1}
            onClick={() => onSelectChapter(currentChapterIndex + 1)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700/80 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <span>Next Chapter</span>
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Main Audio Play/Pause Button Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSkipSeconds('backward')}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            title="Skip 10 seconds back"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {isPlaying ? (
            <button
              onClick={onPauseAudio}
              className="p-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold rounded-2xl shadow-lg shadow-amber-500/20 transition-all scale-105"
            >
              <Pause className="w-5 h-5 fill-current" />
            </button>
          ) : (
            <button
              onClick={onStartPlay}
              className="p-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold rounded-2xl shadow-lg shadow-amber-500/20 transition-all scale-105"
            >
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </button>
          )}

          <button
            onClick={() => onSkipSeconds('forward')}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            title="Skip 10 seconds forward"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
};
