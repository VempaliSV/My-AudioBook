import React from 'react';
import { Volume2, Sparkles, Moon, X, Sliders, Check, Gauge, Mic, Radio } from 'lucide-react';
import { VoiceOption } from '../types';

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  voices: VoiceOption[];
  selectedVoice: VoiceOption;
  onSelectVoice: (v: VoiceOption) => void;
  rate: number;
  onChangeRate: (r: number) => void;
  pitch: number;
  onChangePitch: (p: number) => void;
  volume: number;
  onChangeVolume: (v: number) => void;
  sleepTimerSeconds: number | null;
  onSetSleepTimerMinutes: (mins: number | null) => void;
  clonedVoice?: VoiceOption | null;
  onOpenVoiceCloneModal?: () => void;
}

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({
  isOpen,
  onClose,
  voices,
  selectedVoice,
  onSelectVoice,
  rate,
  onChangeRate,
  pitch,
  onChangePitch,
  volume,
  onChangeVolume,
  sleepTimerSeconds,
  onSetSleepTimerMinutes,
  clonedVoice,
  onOpenVoiceCloneModal,
}) => {
  if (!isOpen) return null;

  const geminiVoices = voices.filter((v) => v.provider === 'gemini');
  const browserVoices = voices.filter((v) => v.provider === 'browser');

  const formatSleepTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}m ${s < 10 ? '0' : ''}${s}s`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl text-slate-100 overflow-hidden relative">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Audio & Voice Settings</h2>
              <p className="text-xs text-slate-400">Configure AI voices, speech rate & sleep timer</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          
          {/* Voice Engine Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Voice Engine & Speaker
            </label>

            <div className="space-y-3">
              {/* Custom Cloned Voice Block */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                    <Radio className="w-3.5 h-3.5 text-amber-400" />
                    <span>My Custom Cloned Voice</span>
                  </div>
                  {onOpenVoiceCloneModal && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenVoiceCloneModal();
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg shadow transition-all flex items-center gap-1"
                    >
                      <Mic className="w-3 h-3" />
                      <span>{clonedVoice ? 'Re-calibrate' : 'Clone My Voice'}</span>
                    </button>
                  )}
                </div>

                {clonedVoice ? (
                  <button
                    onClick={() => onSelectVoice(clonedVoice)}
                    className={`w-full p-2.5 rounded-lg border text-xs text-left transition-all flex items-center justify-between ${
                      selectedVoice.id === clonedVoice.id
                        ? 'bg-amber-500/20 border-amber-500/60 text-amber-200 font-medium'
                        : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <span>{clonedVoice.name}</span>
                    {selectedVoice.id === clonedVoice.id && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                  </button>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    Record 3 quick sentences to calibrate your own custom AI voice narrator.
                  </p>
                )}
              </div>

              <div className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Gemini HD Neural Voices (High Quality)
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {geminiVoices.map((v) => {
                  const isFemale = v.gender === 'female';
                  return (
                    <button
                      key={v.id}
                      onClick={() => onSelectVoice(v)}
                      className={`p-3 rounded-xl border text-xs text-left transition-all flex items-center justify-between ${
                        selectedVoice.id === v.id
                          ? 'bg-amber-500/15 border-amber-500/50 text-amber-200 font-medium'
                          : 'bg-slate-950 border-slate-800/80 text-slate-300 hover:bg-slate-850'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{v.name}</span>
                        {isFemale && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Female Studio Voice
                          </span>
                        )}
                      </div>
                      {selectedVoice.id === v.id && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {browserVoices.length > 0 && (
                <>
                  <div className="text-[11px] font-semibold text-slate-400 mt-4">
                    Browser System Voices
                  </div>
                  <select
                    value={selectedVoice.provider === 'browser' ? selectedVoice.id : ''}
                    onChange={(e) => {
                      const found = browserVoices.find((bv) => bv.id === e.target.value);
                      if (found) onSelectVoice(found);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="" disabled>-- Select Browser Voice --</option>
                    {browserVoices.slice(0, 15).map((bv) => (
                      <option key={bv.id} value={bv.id}>
                        {bv.name}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>
          </div>

          {/* Speech Rate Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Narration Speed</span>
              <span className="font-mono text-amber-400 font-bold">{rate}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={rate}
              onChange={(e) => onChangeRate(parseFloat(e.target.value))}
              className="w-full accent-amber-500 bg-slate-950"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0.5x</span>
              <span>1.0x (Normal)</span>
              <span>2.5x</span>
            </div>
          </div>

          {/* Sleep Timer */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                Sleep Timer
              </span>
              {sleepTimerSeconds !== null && (
                <span className="font-mono text-xs text-amber-400 font-bold">
                  Stopping in {formatSleepTime(sleepTimerSeconds)}
                </span>
              )}
            </div>

            <div className="grid grid-cols-5 gap-2">
              {[
                { label: 'Off', val: null },
                { label: '5 min', val: 5 },
                { label: '15 min', val: 15 },
                { label: '30 min', val: 30 },
                { label: '60 min', val: 60 },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={() => onSetSleepTimerMinutes(item.val)}
                  className={`py-2 rounded-xl text-xs font-medium border transition-all ${
                    (item.val === null && sleepTimerSeconds === null) ||
                    (item.val !== null && sleepTimerSeconds !== null && Math.ceil(sleepTimerSeconds / 60) === item.val)
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
