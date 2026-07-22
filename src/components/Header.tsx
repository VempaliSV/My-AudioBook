import React from 'react';
import { Headphones, Upload, BookOpen, Settings, Volume2, Bookmark as BookmarkIcon, Mic, UserCheck } from 'lucide-react';
import { VoiceOption } from '../types';

interface HeaderProps {
  onOpenUploadModal: () => void;
  onOpenSampleModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenBookmarksModal: () => void;
  onOpenVoiceCloneModal: () => void;
  currentTitle?: string;
  hasAudiobook: boolean;
  activeTab: 'player' | 'pdf';
  setActiveTab: (tab: 'player' | 'pdf') => void;
  selectedVoice?: VoiceOption;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenUploadModal,
  onOpenSampleModal,
  onOpenSettingsModal,
  onOpenBookmarksModal,
  onOpenVoiceCloneModal,
  currentTitle,
  hasAudiobook,
  activeTab,
  setActiveTab,
  selectedVoice,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-600 p-0.5 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Headphones className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <h1 className="font-semibold text-base tracking-tight text-white flex items-center gap-2">
              <span>PDF to Audiobook</span>
              <span className="text-[10px] font-medium tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                AI Studio
              </span>
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block truncate max-w-xs">
              {currentTitle ? `Listening to: ${currentTitle}` : 'Convert any PDF into a natural AI audiobook'}
            </p>
          </div>
        </div>

        {/* Navigation Tabs (if audiobook loaded) */}
        {hasAudiobook && (
          <nav className="hidden md:flex items-center gap-1 bg-slate-850 p-1 rounded-xl border border-slate-800">
            <button
              id="tab-player"
              onClick={() => setActiveTab('player')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'player'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              Audiobook Reader
            </button>

            <button
              id="tab-pdf"
              onClick={() => setActiveTab('pdf')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'pdf'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Source Text
            </button>
          </nav>
        )}

        {/* Actions Button Group */}
        <div className="flex items-center gap-2">
          
          {/* Change Narrator Button */}
          <button
            id="btn-change-narrator"
            onClick={onOpenSettingsModal}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-amber-200 hover:text-white bg-slate-800/90 hover:bg-slate-800 rounded-lg border border-amber-500/30 transition-all shadow-sm"
            title="Change Narrator / Speaker Voice"
          >
            <UserCheck className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline font-semibold truncate max-w-[120px]">
              {selectedVoice ? selectedVoice.name.split(' ')[0] : 'Narrator'}
            </span>
          </button>

          <button
            id="btn-voice-clone"
            onClick={onOpenVoiceCloneModal}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-amber-300 hover:text-white bg-amber-500/10 hover:bg-amber-500/20 rounded-lg border border-amber-500/30 transition-all shadow-sm"
            title="Clone Your Voice for Custom Narration"
          >
            <Mic className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Clone Voice</span>
          </button>

          <button
            id="btn-sample-books"
            onClick={onOpenSampleModal}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700/60 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Classic</span> Library
          </button>

          <button
            id="btn-bookmarks"
            onClick={onOpenBookmarksModal}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700/60 transition-colors"
            title="View Bookmarks & Notes"
          >
            <BookmarkIcon className="w-4 h-4 text-amber-400" />
          </button>

          <button
            id="btn-voice-settings"
            onClick={onOpenSettingsModal}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700/60 transition-colors"
            title="Audio & Voice Settings"
          >
            <Settings className="w-4 h-4 text-slate-300" />
          </button>

          <button
            id="btn-upload-pdf-header"
            onClick={onOpenUploadModal}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-semibold rounded-lg shadow-md shadow-amber-500/15 transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload PDF</span>
          </button>
        </div>
      </div>
    </header>
  );
};
