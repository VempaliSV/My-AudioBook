import React from 'react';
import { Bookmark as BookmarkIcon, Trash2, Play, X, ExternalLink, MessageSquare } from 'lucide-react';
import { Bookmark, Chapter } from '../types';

interface BookmarksViewProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: Bookmark[];
  chapters: Chapter[];
  onSelectBookmark: (chapterId: string, paragraphIndex: number) => void;
  onRemoveBookmark: (id: string) => void;
  onUpdateBookmarkNote: (id: string, note: string) => void;
}

export const BookmarksView: React.FC<BookmarksViewProps> = ({
  isOpen,
  onClose,
  bookmarks,
  chapters,
  onSelectBookmark,
  onRemoveBookmark,
  onUpdateBookmarkNote,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl text-slate-100 overflow-hidden relative">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <BookmarkIcon className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Saved Bookmarks & Notes</h2>
              <p className="text-xs text-slate-400">{bookmarks.length} saved audio quotes</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
          {bookmarks.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <BookmarkIcon className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs">No bookmarks saved yet.</p>
              <p className="text-[11px] text-slate-600">Click the bookmark icon next to any paragraph during playback to save it here.</p>
            </div>
          ) : (
            bookmarks.map((b) => {
              const chap = chapters.find((c) => c.id === b.chapterId);

              return (
                <div
                  key={b.id}
                  className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-amber-400">
                      {chap ? chap.title : 'Chapter'} • Paragraph {b.paragraphIndex + 1}
                    </span>
                    <span className="text-[10px] text-slate-500">{b.timestamp}</span>
                  </div>

                  <p className="text-xs text-slate-300 italic bg-slate-900 p-2.5 rounded-lg border border-slate-800/80">
                    "{b.textSnippet}"
                  </p>

                  {/* Note Input */}
                  <div className="flex items-center gap-2 pt-1">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <input
                      type="text"
                      placeholder="Add personal note..."
                      value={b.note || ''}
                      onChange={(e) => onUpdateBookmarkNote(b.id, e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-900">
                    <button
                      onClick={() => {
                        onSelectBookmark(b.chapterId, b.paragraphIndex);
                        onClose();
                      }}
                      className="flex items-center gap-1.5 text-xs text-amber-400 hover:underline font-medium"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      Jump to Audio Position
                    </button>

                    <button
                      onClick={() => onRemoveBookmark(b.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors"
                      title="Delete Bookmark"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};
