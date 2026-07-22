import React, { useState, useRef } from 'react';
import { Upload, FileText, Sparkles, X, CheckCircle2, AlertCircle, Loader2, BookOpen } from 'lucide-react';
import { SAMPLE_BOOKS } from '../data/sampleBooks';
import { SampleBook } from '../types';

interface PdfUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProcessPdf: (file: File) => Promise<void>;
  onProcessText: (title: string, text: string) => Promise<void>;
  onSelectSample: (sample: SampleBook) => Promise<void>;
  isProcessing: boolean;
  processingStep: string;
}

export const PdfUploaderModal: React.FC<PdfUploaderModalProps> = ({
  isOpen,
  onClose,
  onProcessPdf,
  onProcessText,
  onSelectSample,
  isProcessing,
  processingStep,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'text' | 'sample'>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [customText, setCustomText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setErrorMessage(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        setSelectedFile(file);
      } else {
        setErrorMessage('Please upload a valid PDF document (.pdf).');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        setSelectedFile(file);
      } else {
        setErrorMessage('Please upload a valid PDF document (.pdf).');
      }
    }
  };

  const handleSubmitPdf = async () => {
    if (!selectedFile) return;
    try {
      setErrorMessage(null);
      await onProcessPdf(selectedFile);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error converting PDF to audiobook.');
    }
  };

  const handleSubmitText = async () => {
    if (!customText.trim()) {
      setErrorMessage('Please paste or type text to convert.');
      return;
    }
    try {
      setErrorMessage(null);
      await onProcessText(customTitle || 'My Document', customText);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error processing document text.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl text-slate-100 overflow-hidden relative">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Create Audiobook</h2>
              <p className="text-xs text-slate-400">Transform any PDF or text into an AI audio experience</p>
            </div>
          </div>

          {!isProcessing && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6">
          
          {/* Tab Selection */}
          {!isProcessing && (
            <div className="flex rounded-xl bg-slate-950 p-1 mb-6 border border-slate-800">
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'upload'
                    ? 'bg-slate-800 text-amber-300 border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                Upload PDF File
              </button>

              <button
                onClick={() => setActiveTab('text')}
                className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'text'
                    ? 'bg-slate-800 text-amber-300 border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Paste Raw Text
              </button>

              <button
                onClick={() => setActiveTab('sample')}
                className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'sample'
                    ? 'bg-slate-800 text-amber-300 border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Sample Books
              </button>
            </div>
          )}

          {/* Processing Screen */}
          {isProcessing ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center animate-pulse">
                  <Sparkles className="w-8 h-8 text-amber-400 animate-spin" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-slate-900 rounded-full p-1 border border-slate-800">
                  <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                </div>
              </div>
              <div>
                <h3 className="text-base font-semibold text-white mb-1">Generating Audiobook Script</h3>
                <p className="text-xs text-amber-400/90 font-mono bg-amber-950/40 px-3 py-1 rounded-md border border-amber-500/20 inline-block">
                  {processingStep || 'Gemini AI parsing chapters & formatting audio script...'}
                </p>
              </div>
              <p className="text-xs text-slate-500 max-w-sm">
                Cleaning running headers, citations, formatting tables into prose, and calculating speech timings...
              </p>
            </div>
          ) : (
            <>
              {/* Tab 1: PDF Dropzone */}
              {activeTab === 'upload' && (
                <div className="space-y-4">
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                      dragActive
                        ? 'border-amber-400 bg-amber-500/10'
                        : selectedFile
                        ? 'border-emerald-500/50 bg-emerald-950/10'
                        : 'border-slate-800 hover:border-slate-700 bg-slate-950/50'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {selectedFile ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-medium text-white truncate max-w-md">{selectedFile.name}</p>
                        <p className="text-xs text-slate-400">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to convert
                        </p>
                        <span className="text-xs text-amber-400 hover:underline mt-1">Click or drag to replace</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-800 text-amber-400 flex items-center justify-center border border-slate-700">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-200">
                            Drag & drop your PDF file here, or <span className="text-amber-400 underline">browse</span>
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            Supports books, research papers, manuals, and documents
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {errorMessage && (
                    <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={!selectedFile}
                      onClick={handleSubmitPdf}
                      className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-amber-500/10 flex items-center gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Convert PDF to Audiobook
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 2: Raw Text Input */}
              {activeTab === 'text' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Document / Book Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Chapter 1 Notes, Article Title"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Raw Text Content</label>
                    <textarea
                      rows={7}
                      placeholder="Paste your text content here..."
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 font-mono"
                    />
                  </div>

                  {errorMessage && (
                    <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitText}
                      disabled={!customText.trim()}
                      className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 disabled:opacity-50 shadow-md shadow-amber-500/10 flex items-center gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Convert Text to Audiobook
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 3: Sample Classic Library */}
              {activeTab === 'sample' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400 mb-2">
                    Select a classic sample document to test the audiobook reader instantly:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {SAMPLE_BOOKS.map((book) => (
                      <div
                        key={book.id}
                        onClick={() => onSelectSample(book)}
                        className="bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/50 rounded-xl p-3.5 cursor-pointer transition-all group flex flex-col justify-between"
                      >
                        <div>
                          <div className={`h-1.5 w-12 rounded-full bg-gradient-to-r ${book.coverBg} mb-3`} />
                          <h4 className="text-xs font-semibold text-white group-hover:text-amber-300 line-clamp-1">
                            {book.title}
                          </h4>
                          <p className="text-[11px] text-amber-500/80 mb-2">{book.author}</p>
                          <p className="text-[11px] text-slate-400 line-clamp-2">{book.description}</p>
                        </div>
                        <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-900">
                          <span>{book.category}</span>
                          <span className="text-amber-400 group-hover:underline">Load &rarr;</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
};
