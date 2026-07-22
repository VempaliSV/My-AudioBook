import React, { useState } from 'react';
import { BookOpen, Clock, Search, CheckCircle2, Play, Sparkles, ChevronRight, Layers, UserCheck } from 'lucide-react';
import { AudiobookMetaData, Chapter, VoiceOption } from '../types';

interface ChapterSidebarProps {
  audiobook: AudiobookMetaData;
  currentChapterIndex: number;
  onSelectChapter: (index: number) => void;
  completedChapters: string[];
  selectedVoice?: VoiceOption;
  onOpenVoiceSettings?: () => void;
}

export const ChapterSidebar: React.FC<ChapterSidebarProps> = ({
  audiobook,
  currentChapterIndex,
  onSelectChapter,
  completedChapters,
  selectedVoice,
  onOpenVoiceSettings,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredChapters = audiobook.chapters.filter(
    (chap) =>
      chap.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chap.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <aside className="w-full lg:w-80 bg-slate-900 border-r border-slate-800 flex flex-col h-full shrink-0">
      
      {/* Book Summary Card Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/60">
        <div className="flex items-start gap-3">
          <div className="w-12 h-16 rounded-lg bg-gradient-to-tr from-amber-600 via-orange-600 to-rose-700 p-1 flex flex-col justify-between shadow-md shrink-0">
            <BookOpen className="w-4 h-4 text-amber-200" />
            <div className="text-[9px] font-bold text-white uppercase tracking-tighter truncate">
              {audiobook.author}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-white truncate" title={audiobook.title}>
              {audiobook.title}
            </h2>
            <p className="text-xs text-amber-400 font-medium truncate">{audiobook.author}</p>
            
            <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3 text-slate-500" />
                {audiobook.totalChapters} Ch.
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                {audiobook.estimatedTotalMinutes} mins
              </span>
            </div>
          </div>
        </div>

        {/* Speaker / Narrator Badge */}
        <div
          onClick={onOpenVoiceSettings}
          className="mt-3 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 flex items-center justify-between text-xs cursor-pointer hover:bg-amber-500/15 transition-all"
          title="Click to change narrator"
        >
          <span className="text-slate-400 flex items-center gap-1 font-medium">
            <UserCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            Speaker:
          </span>
          <span className="text-amber-300 font-semibold flex items-center gap-1 truncate max-w-[150px]">
            {selectedVoice?.name || 'Studio Narrator'}
          </span>
        </div>
      </div>

      {/* Chapter Search Bar */}
      <div className="p-3 border-b border-slate-800/80 bg-slate-900/50">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search chapters & topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
          />
        </div>
      </div>

      {/* Chapters List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {filteredChapters.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No chapters match "{searchTerm}"
          </div>
        ) : (
          filteredChapters.map((chap, idx) => {
            const actualIndex = audiobook.chapters.findIndex((c) => c.id === chap.id);
            const isActive = actualIndex === currentChapterIndex;
            const isCompleted = completedChapters.includes(chap.id);

            return (
              <div
                key={chap.id}
                onClick={() => onSelectChapter(actualIndex)}
                className={`p-3 rounded-xl cursor-pointer transition-all border group ${
                  isActive
                    ? 'bg-amber-500/10 border-amber-500/40 shadow-sm text-white'
                    : 'bg-slate-950/40 hover:bg-slate-850 border-slate-800/80 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        isActive
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                      }`}
                    >
                      Ch. {chap.number}
                    </span>
                    <h3
                      className={`text-xs font-medium truncate max-w-[150px] ${
                        isActive ? 'text-amber-300 font-semibold' : 'text-slate-200'
                      }`}
                    >
                      {chap.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    {isActive ? (
                      <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400" />
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                  {chap.summary}
                </p>

                <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-800/40">
                  <span>{chap.estimatedMinutes} min audio</span>
                  <span>{chap.wordCount} words</span>
                </div>
              </div>
            );
          })
        )}
      </div>

    </aside>
  );
};
