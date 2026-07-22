import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ChapterSidebar } from './components/ChapterSidebar';
import { AudiobookPlayer } from './components/AudiobookPlayer';
import { PdfUploaderModal } from './components/PdfUploaderModal';
import { VoiceSettingsModal } from './components/VoiceSettingsModal';
import { VoiceCloneModal } from './components/VoiceCloneModal';
import { BookmarksView } from './components/BookmarksView';
import { StickyPlayerBar } from './components/StickyPlayerBar';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { extractTextFromPdfFile, fileToBase64 } from './utils/pdfExtractor';
import { SAMPLE_BOOKS } from './data/sampleBooks';
import { AudiobookMetaData, Bookmark, SampleBook, VoiceOption } from './types';
import { Headphones, Sparkles, Upload, BookOpen, Layers, Clock, Mic, UserCheck } from 'lucide-react';

export default function App() {
  const [audiobook, setAudiobook] = useState<AudiobookMetaData | null>(null);
  const [currentChapterIndex, setCurrentChapterIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'player' | 'pdf'>('player');

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isBookmarksModalOpen, setIsBookmarksModalOpen] = useState(false);
  const [isVoiceCloneModalOpen, setIsVoiceCloneModalOpen] = useState(false);
  const [clonedVoice, setClonedVoice] = useState<VoiceOption | null>(null);

  // PDF processing state
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [processingStep, setProcessingStep] = useState('');

  // Local saved bookmarks
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    try {
      const saved = localStorage.getItem('audiobook_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [completedChapters, setCompletedChapters] = useState<string[]>([]);

  // Audio hook
  const audio = useAudioPlayer();

  // Save bookmarks to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('audiobook_bookmarks', JSON.stringify(bookmarks));
    } catch (e) {}
  }, [bookmarks]);

  // Load current chapter script into audio player
  useEffect(() => {
    if (audiobook && audiobook.chapters[currentChapterIndex]) {
      const currentChap = audiobook.chapters[currentChapterIndex];
      const textToPlay = currentChap.audioScript || currentChap.content || '';
      audio.loadTextScript(textToPlay);
    }
  }, [audiobook, currentChapterIndex]);

  // Convert uploaded PDF file
  const handleProcessPdf = async (file: File) => {
    try {
      setIsProcessingPdf(true);
      setProcessingStep('Extracting PDF text & pages...');

      // Convert file to base64
      const base64Data = await fileToBase64(file);

      setProcessingStep('AI analyzing structure, formatting audio script...');

      const response = await fetch('/api/parse-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfBase64: base64Data,
          fileName: file.name,
        }),
      });

      if (!response.ok) throw new Error('Server failed to convert PDF.');

      const parsedAudiobook: AudiobookMetaData = await response.json();
      setAudiobook(parsedAudiobook);
      setCurrentChapterIndex(0);
      setIsUploadModalOpen(false);
      setActiveTab('player');
    } catch (err: any) {
      console.warn('Backend API parse-pdf failed, falling back to local client text extraction:', err);
      
      // Fallback: extract client-side via pdfjs-dist
      try {
        setProcessingStep('Extracting client-side text...');
        const extracted = await extractTextFromPdfFile(file);

        let parsedAudiobook: AudiobookMetaData | null = null;
        try {
          setProcessingStep('Formatting chapters with Gemini AI...');
          const response = await fetch('/api/parse-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              rawText: extracted.fullText,
              fileName: file.name,
            }),
          });

          if (response.ok) {
            parsedAudiobook = await response.json();
          }
        } catch (apiErr) {
          console.warn('Server API offline, constructing local client chapters:', apiErr);
        }

        if (!parsedAudiobook) {
          // Construct client-side chapters if API is 404 or offline
          const rawChunks = extracted.fullText.split(/\n\s*\n/).filter((c) => c.trim().length > 30);
          const chunkSize = 6;
          const chapters = [];
          for (let i = 0; i < rawChunks.length; i += chunkSize) {
            const chapParas = rawChunks.slice(i, i + chunkSize);
            const chapNum = Math.floor(i / chunkSize) + 1;
            const content = chapParas.join('\n\n');
            chapters.push({
              id: `chap-${chapNum}-${Date.now()}`,
              number: chapNum,
              title: `Chapter ${chapNum}`,
              summary: chapParas[0].slice(0, 150) + '...',
              content: content,
              audioScript: content,
              estimatedMinutes: Math.max(1, Math.ceil(content.split(/\s+/).length / 150)),
              wordCount: content.split(/\s+/).length,
              keyPoints: ['Client extracted section.'],
            });
          }

          parsedAudiobook = {
            title: file.name.replace(/\.[^/.]+$/, ''),
            author: 'Uploaded Document',
            overview: 'Parsed PDF content formatted for narration.',
            suggestedVoiceTone: 'Studio Female Narrator',
            totalChapters: chapters.length || 1,
            totalPages: extracted.totalPages || 1,
            totalWordCount: chapters.reduce((s, c) => s + c.wordCount, 0),
            estimatedTotalMinutes: chapters.reduce((s, c) => s + c.estimatedMinutes, 0),
            chapters: chapters.length > 0 ? chapters : [{
              id: 'chap-1',
              number: 1,
              title: 'Chapter 1',
              summary: 'Extracted content',
              content: extracted.fullText,
              audioScript: extracted.fullText,
              estimatedMinutes: Math.max(1, Math.ceil(extracted.fullText.split(/\s+/).length / 150)),
              wordCount: extracted.fullText.split(/\s+/).length,
              keyPoints: ['Document text.'],
            }],
          };
        }

        setAudiobook(parsedAudiobook);
        setCurrentChapterIndex(0);
        setIsUploadModalOpen(false);
        setActiveTab('player');
      } catch (fallbackErr: any) {
        throw new Error('Failed to convert PDF: ' + (fallbackErr.message || String(fallbackErr)));
      }
    } finally {
      setIsProcessingPdf(false);
      setProcessingStep('');
    }
  };

  // Process raw text document
  const handleProcessText = async (title: string, text: string) => {
    try {
      setIsProcessingPdf(true);
      setProcessingStep('Analyzing text & generating audiobook chapters...');

      let parsedAudiobook: AudiobookMetaData | null = null;
      try {
        const response = await fetch('/api/parse-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rawText: text,
            fileName: title,
          }),
        });

        if (response.ok) {
          parsedAudiobook = await response.json();
        }
      } catch (err) {
        console.warn('API route unavailable, formatting text locally:', err);
      }

      if (!parsedAudiobook) {
        const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
        const chunkSize = 5;
        const chapters = [];
        for (let i = 0; i < paragraphs.length; i += chunkSize) {
          const chapParas = paragraphs.slice(i, i + chunkSize);
          const chapNum = Math.floor(i / chunkSize) + 1;
          const content = chapParas.join('\n\n');
          chapters.push({
            id: `chap-${chapNum}-${Date.now()}`,
            number: chapNum,
            title: `Chapter ${chapNum}`,
            summary: chapParas[0].slice(0, 150) + '...',
            content: content,
            audioScript: content,
            estimatedMinutes: Math.max(1, Math.ceil(content.split(/\s+/).length / 150)),
            wordCount: content.split(/\s+/).length,
            keyPoints: ['Section text analysis.'],
          });
        }

        parsedAudiobook = {
          title: title || 'Custom Document',
          author: 'Document Author',
          overview: 'Custom text formatted into audiobook chapters.',
          suggestedVoiceTone: 'Studio Female Narrator',
          totalChapters: chapters.length || 1,
          totalPages: 1,
          totalWordCount: chapters.reduce((s, c) => s + c.wordCount, 0),
          estimatedTotalMinutes: chapters.reduce((s, c) => s + c.estimatedMinutes, 0),
          chapters: chapters.length > 0 ? chapters : [{
            id: 'chap-1',
            number: 1,
            title: 'Chapter 1',
            summary: 'Content summary',
            content: text,
            audioScript: text,
            estimatedMinutes: Math.max(1, Math.ceil(text.split(/\s+/).length / 150)),
            wordCount: text.split(/\s+/).length,
            keyPoints: ['Full text.'],
          }],
        };
      }

      setAudiobook(parsedAudiobook);
      setCurrentChapterIndex(0);
      setIsUploadModalOpen(false);
      setActiveTab('player');
    } finally {
      setIsProcessingPdf(false);
      setProcessingStep('');
    }
  };

  // Load classic sample book
  const handleSelectSample = async (sample: SampleBook) => {
    try {
      setIsProcessingPdf(true);
      setProcessingStep(`Loading ${sample.title}...`);

      const response = await fetch('/api/parse-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: sample.sampleText,
          fileName: `${sample.title} by ${sample.author}`,
        }),
      });

      let parsedAudiobook: AudiobookMetaData;
      if (response.ok) {
        parsedAudiobook = await response.json();
      } else {
        throw new Error('Server response not OK');
      }

      // Ensure title/author match sample
      parsedAudiobook.title = sample.title;
      parsedAudiobook.author = sample.author;

      setAudiobook(parsedAudiobook);
      setCurrentChapterIndex(0);
      setIsUploadModalOpen(false);
      setActiveTab('player');
    } catch (err) {
      console.warn('Fallback loading sample directly on client:', err);
      const rawChunks = sample.sampleText.split(/(?=\bChapter\s+\d+)/i).filter((c) => c.trim().length > 10);
      const chapters = (rawChunks.length > 0 ? rawChunks : [sample.sampleText]).map((chunk, idx) => ({
        id: `chap-${idx + 1}-${Date.now()}`,
        number: idx + 1,
        title: chunk.split('\n')[0].replace(/^[#*-\s]+/, '').trim() || `Chapter ${idx + 1}`,
        summary: chunk.slice(0, 160).replace(/\s+/g, ' ') + '...',
        content: chunk,
        audioScript: chunk.replace(/\[\d+\]/g, '').replace(/\bDr\./g, 'Doctor').replace(/\bvs\./g, 'versus'),
        estimatedMinutes: Math.max(1, Math.ceil(chunk.split(/\s+/).length / 150)),
        wordCount: chunk.split(/\s+/).length,
        keyPoints: ['Core narrative point and section analysis.', 'Pristine female voice pronunciation script.'],
      }));

      setAudiobook({
        title: sample.title,
        author: sample.author,
        overview: sample.description,
        suggestedVoiceTone: 'Pristine Studio Female Narrator',
        totalChapters: chapters.length,
        totalPages: 1,
        totalWordCount: chapters.reduce((s, c) => s + c.wordCount, 0),
        estimatedTotalMinutes: chapters.reduce((s, c) => s + c.estimatedMinutes, 0),
        chapters,
      });
      setCurrentChapterIndex(0);
      setIsUploadModalOpen(false);
      setActiveTab('player');
    } finally {
      setIsProcessingPdf(false);
      setProcessingStep('');
    }
  };

  // Select Chapter
  const handleSelectChapter = (index: number) => {
    if (!audiobook || index < 0 || index >= audiobook.chapters.length) return;
    setCurrentChapterIndex(index);
    setActiveTab('player');
  };

  // Add Bookmark
  const handleAddBookmark = (chapterId: string, paragraphIndex: number, textSnippet: string) => {
    const newBookmark: Bookmark = {
      id: `bm-${Date.now()}`,
      chapterId,
      paragraphIndex,
      textSnippet,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setBookmarks((prev) => [newBookmark, ...prev]);
  };

  const handleRemoveBookmark = (id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleUpdateBookmarkNote = (id: string, note: string) => {
    setBookmarks((prev) => prev.map((b) => (b.id === id ? { ...b, note } : b)));
  };

  const handleSelectBookmark = (chapterId: string, paragraphIndex: number) => {
    if (!audiobook) return;
    const chapIndex = audiobook.chapters.findIndex((c) => c.id === chapterId);
    if (chapIndex !== -1) {
      setCurrentChapterIndex(chapIndex);
      setActiveTab('player');
      setTimeout(() => {
        audio.seekToParagraph(paragraphIndex);
      }, 100);
    }
  };

  const currentChapter = audiobook?.chapters[currentChapterIndex];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-amber-500/30 selection:text-amber-200 pb-16">
      
      {/* Header Bar */}
      <Header
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
        onOpenSampleModal={() => setIsUploadModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onOpenBookmarksModal={() => setIsBookmarksModalOpen(true)}
        onOpenVoiceCloneModal={() => setIsVoiceCloneModalOpen(true)}
        currentTitle={audiobook?.title}
        hasAudiobook={!!audiobook}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedVoice={audio.selectedVoice}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {audiobook ? (
          <>
            {/* Chapter Navigation Sidebar */}
            <ChapterSidebar
              audiobook={audiobook}
              currentChapterIndex={currentChapterIndex}
              onSelectChapter={handleSelectChapter}
              completedChapters={completedChapters}
              selectedVoice={audio.selectedVoice}
              onOpenVoiceSettings={() => setIsSettingsModalOpen(true)}
            />

            {/* Content Area according to active tab */}
            {activeTab === 'player' && currentChapter && (
              <AudiobookPlayer
                audiobook={audiobook}
                currentChapter={currentChapter}
                currentChapterIndex={currentChapterIndex}
                onSelectChapter={handleSelectChapter}
                paragraphs={audio.paragraphs}
                currentParagraphIndex={audio.currentParagraphIndex}
                currentCharIndex={audio.currentCharIndex}
                isPlaying={audio.isPlaying}
                isPaused={audio.isPaused}
                onStartPlay={audio.startPlay}
                onPauseAudio={audio.pauseAudio}
                onStopAudio={audio.stopAudio}
                onSeekToParagraph={audio.seekToParagraph}
                onSkipSeconds={audio.skipSeconds}
                rate={audio.rate}
                onChangeRate={audio.setRate}
                onAddBookmark={handleAddBookmark}
                savedBookmarkIds={bookmarks.map((b) => `${b.chapterId}-${b.paragraphIndex}`)}
                voices={audio.voices}
                selectedVoice={audio.selectedVoice}
                onSelectVoice={audio.setSelectedVoice}
                clonedVoice={clonedVoice}
                onOpenVoiceCloneModal={() => setIsVoiceCloneModalOpen(true)}
              />
            )}

            {activeTab === 'pdf' && currentChapter && (
              <div className="flex-1 overflow-y-auto p-6 sm:p-10 max-w-4xl mx-auto w-full">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
                  <div className="border-b border-slate-800 pb-4">
                    <h2 className="text-lg font-bold text-white">Original PDF Source Text</h2>
                    <p className="text-xs text-slate-400">Chapter {currentChapter.number}: {currentChapter.title}</p>
                  </div>
                  <div className="text-xs sm:text-sm text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                    {currentChapter.content}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Empty State / Welcome Hero Banner */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-3xl mx-auto space-y-8 my-12">
            
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-600 p-0.5 flex items-center justify-center shadow-2xl shadow-amber-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
                <Headphones className="w-10 h-10 text-amber-400" />
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Turn Any PDF Into an <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400">Audiobook</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
                Upload books, research papers, manuals, or notes. Gemini AI cleans raw citations, extracts chapters, and generates expressive spoken audio with live text highlighting.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                id="btn-hero-upload"
                onClick={() => setIsUploadModalOpen(true)}
                className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-bold text-sm rounded-2xl shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2.5 transition-all transform hover:scale-[1.02]"
              >
                <Upload className="w-4 h-4" />
                <span>Upload PDF Document</span>
              </button>

              <button
                id="btn-hero-clone"
                onClick={() => setIsVoiceCloneModalOpen(true)}
                className="w-full sm:w-auto px-6 py-3.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold text-sm rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                <Mic className="w-4 h-4 text-amber-400" />
                <span>{clonedVoice ? 'My Cloned Voice Active' : 'Clone Your Voice'}</span>
              </button>

              <button
                id="btn-hero-sample"
                onClick={() => handleSelectSample(SAMPLE_BOOKS[0])}
                className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 hover:border-slate-700 font-semibold text-sm rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>Try Classic Sample</span>
              </button>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 border-t border-slate-900 text-left w-full">
              <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800/60">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-semibold text-white">Smart Audio Formatting</h3>
                <p className="text-[11px] text-slate-400 mt-1">Cleans citations, page numbers, and formats tables into narrative prose.</p>
              </div>

              <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800/60">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-semibold text-white">Automatic Chapters</h3>
                <p className="text-[11px] text-slate-400 mt-1">Detects table of contents, logical sections, and estimated listening times.</p>
              </div>

              <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800/60">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2">
                  <Clock className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-semibold text-white">Live Cursor & Controls</h3>
                <p className="text-[11px] text-slate-400 mt-1">Interactive sentence highlighting, variable speed (0.5x-2.5x), and sleep timer.</p>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Sticky Bottom Player Bar (if audiobook is loaded) */}
      {audiobook && currentChapter && (
        <StickyPlayerBar
          audiobook={audiobook}
          currentChapter={currentChapter}
          currentChapterIndex={currentChapterIndex}
          onSelectChapter={handleSelectChapter}
          isPlaying={audio.isPlaying}
          onStartPlay={audio.startPlay}
          onPauseAudio={audio.pauseAudio}
          onSkipSeconds={audio.skipSeconds}
          progressPercent={audio.progressPercent}
          rate={audio.rate}
          onOpenPlayerTab={() => setActiveTab('player')}
        />
      )}

      {/* Modals */}
      <PdfUploaderModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onProcessPdf={handleProcessPdf}
        onProcessText={handleProcessText}
        onSelectSample={handleSelectSample}
        isProcessing={isProcessingPdf}
        processingStep={processingStep}
      />

      <VoiceSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        voices={audio.voices}
        selectedVoice={audio.selectedVoice}
        onSelectVoice={audio.setSelectedVoice}
        rate={audio.rate}
        onChangeRate={audio.setRate}
        pitch={audio.pitch}
        onChangePitch={audio.setPitch}
        volume={audio.volume}
        onChangeVolume={audio.setVolume}
        sleepTimerSeconds={audio.sleepTimerSeconds}
        onSetSleepTimerMinutes={(mins) =>
          audio.setSleepTimerSeconds(mins ? mins * 60 : null)
        }
        clonedVoice={clonedVoice}
        onOpenVoiceCloneModal={() => setIsVoiceCloneModalOpen(true)}
      />

      <VoiceCloneModal
        isOpen={isVoiceCloneModalOpen}
        onClose={() => setIsVoiceCloneModalOpen(false)}
        onVoiceCloned={(cv) => {
          setClonedVoice(cv);
          audio.setSelectedVoice(cv);
        }}
        currentClonedVoice={clonedVoice}
      />

      <BookmarksView
        isOpen={isBookmarksModalOpen}
        onClose={() => setIsBookmarksModalOpen(false)}
        bookmarks={bookmarks}
        chapters={audiobook?.chapters || []}
        onSelectBookmark={handleSelectBookmark}
        onRemoveBookmark={handleRemoveBookmark}
        onUpdateBookmarkNote={handleUpdateBookmarkNote}
      />

    </div>
  );
}
