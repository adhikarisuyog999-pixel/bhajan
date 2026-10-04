import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Square, RotateCcw, Volume2, Sparkles, Download, Layers, ShieldCheck, Activity } from 'lucide-react';
import { studioEngine } from '../audio/engine';
import { PRESET_PATTERNS } from '../data/bhajanData';
import { PresetPattern } from '../types';

interface MasterConsoleProps {
  isPlaying: boolean;
  bpm: number;
  setBpm: (bpm: number) => void;
  vocalSpaceDucking: boolean;
  setVocalSpaceDucking: (val: boolean) => void;
  selectedPreset: string;
  onSelectPreset: (preset: PresetPattern) => void;
  currentStep: number;
  elapsedSec: number;
}

export const MasterConsole: React.FC<MasterConsoleProps> = ({
  isPlaying,
  bpm,
  setBpm,
  vocalSpaceDucking,
  setVocalSpaceDucking,
  selectedPreset,
  onSelectPreset,
  currentStep,
  elapsedSec
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [masterVol, setMasterVol] = useState(0.85);
  const [isExporting, setIsExporting] = useState(false);

  // Audio spectrum visualizer loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dataArray = new Uint8Array(128);

    const render = () => {
      studioEngine.getMasterFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background glow
      const width = canvas.width;
      const height = canvas.height;
      const barWidth = (width / 48) - 1.5;

      for (let i = 0; i < 48; i++) {
        // Map non-linearly to emphasize musical range
        const dataIdx = Math.floor(Math.pow(i / 48, 1.4) * 80);
        const value = isPlaying ? dataArray[dataIdx] || 0 : 0;
        const percent = value / 255;
        const barHeight = Math.max(3, percent * (height - 6));

        // Color gradient: Warm amber into orange into golden yellow
        const x = i * (barWidth + 1.5);
        const y = height - barHeight;

        // Highlight vocal pocket range (approx bars 16-28)
        const isVocalZone = i >= 16 && i <= 28;
        if (isVocalZone && vocalSpaceDucking) {
          ctx.fillStyle = `rgba(245, 158, 11, ${0.4 + percent * 0.6})`; // Amber
        } else {
          ctx.fillStyle = `rgba(234, 88, 12, ${0.35 + percent * 0.65})`; // Orange
        }

        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, vocalSpaceDucking]);

  const handlePlayToggle = async () => {
    if (isPlaying) {
      studioEngine.pause();
    } else {
      await studioEngine.play();
    }
  };

  const handleStop = () => {
    studioEngine.stop();
  };

  const handleExportWav = async () => {
    try {
      setIsExporting(true);
      const blob = await studioEngine.exportMixToWavBlob(32);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nepali-devotional-folk-pop-${bpm}bpm.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export mix:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  const bar = Math.floor(currentStep / 16) + 1;
  const beat = Math.floor((currentStep % 16) / 4) + 1;
  const sixteenth = (currentStep % 4) + 1;

  return (
    <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 sm:p-5 shadow-2xl shadow-stone-950/60 mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        
        {/* Left: Transport Controls & Time */}
        <div className="lg:col-span-4 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePlayToggle}
              title={isPlaying ? 'Pause Instrumental' : 'Play Instrumental'}
              className={`w-13 h-13 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-lg ${
                isPlaying
                  ? 'bg-amber-500 text-stone-950 shadow-amber-500/30 hover:bg-amber-400 scale-102'
                  : 'bg-gradient-to-r from-orange-500 to-amber-500 text-stone-950 shadow-orange-500/30 hover:brightness-110'
              }`}
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
            </button>

            <button
              onClick={handleStop}
              title="Stop & Reset to Start"
              className="w-10 h-10 rounded-xl bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700 flex items-center justify-center transition-all cursor-pointer"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>

            <button
              onClick={() => studioEngine.seek(0)}
              title="Rewind to Beginning"
              className="w-10 h-10 rounded-xl bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700 flex items-center justify-center transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Time & Bar Counter */}
          <div className="bg-stone-950/80 border border-stone-800/80 rounded-xl px-3.5 py-2 flex items-center gap-4">
            <div>
              <span className="text-[10px] font-semibold text-stone-400 tracking-wider uppercase block">Time</span>
              <span className="font-mono text-base font-bold text-amber-400">
                {formatTime(elapsedSec)}
              </span>
            </div>
            <div className="w-px h-7 bg-stone-800" />
            <div>
              <span className="text-[10px] font-semibold text-stone-400 tracking-wider uppercase block">Bar.Beat</span>
              <span className="font-mono text-sm font-semibold text-stone-200">
                <span className="text-amber-400 font-bold">{bar}</span>.{beat}.{sixteenth}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Realtime Visualizer & Vocal Pocket Guard */}
        <div className="lg:col-span-5 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-300 font-medium flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-orange-400" />
              <span>Master Spectrum & Vocal Ducking Pocket</span>
            </span>

            {/* Vocal Space Switch Button */}
            <button
              onClick={() => {
                const next = !vocalSpaceDucking;
                setVocalSpaceDucking(next);
                studioEngine.setVocalSpaceDucking(next);
              }}
              title="Leave mix space for lead vocals to shine"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer border ${
                vocalSpaceDucking
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-sm shadow-amber-500/10'
                  : 'bg-stone-800/60 border-stone-700 text-stone-400 hover:text-stone-300'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Vocal Space Pocket: {vocalSpaceDucking ? 'ON (-4.5dB Mid-Cut)' : 'FLAT'}</span>
            </button>
          </div>

          <div className="relative bg-stone-950 rounded-xl p-1.5 border border-stone-800 overflow-hidden">
            <canvas ref={canvasRef} width={380} height={48} className="w-full h-12 block rounded" />
            {vocalSpaceDucking && (
              <div className="absolute top-1 left-1/3 text-[9px] font-medium text-amber-400/80 bg-stone-900/80 px-1.5 py-0.5 rounded pointer-events-none border border-amber-500/30">
                1kHz - 3.5kHz Vocal Cut
              </div>
            )}
          </div>
        </div>

        {/* Right: Tempo, Master Fader & Presets */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            {/* Tempo BPM */}
            <div className="flex-1 bg-stone-950/70 border border-stone-800/70 rounded-xl px-2.5 py-1.5">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Tempo</span>
                <span className="font-mono text-xs font-bold text-amber-400">{bpm} BPM</span>
              </div>
              <input
                type="range"
                min="80"
                max="140"
                value={bpm}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setBpm(val);
                  studioEngine.setBpm(val);
                }}
                className="w-full accent-amber-500 h-1 bg-stone-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Master Volume */}
            <div className="flex-1 bg-stone-950/70 border border-stone-800/70 rounded-xl px-2.5 py-1.5">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider flex items-center gap-1">
                  <Volume2 className="w-3 h-3 text-stone-400" /> Master
                </span>
                <span className="font-mono text-xs font-semibold text-stone-300">{Math.round(masterVol * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={masterVol}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setMasterVol(val);
                  studioEngine.setMasterVolume(val);
                }}
                className="w-full accent-orange-500 h-1 bg-stone-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Preset Selector & Export Button */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <select
                value={selectedPreset}
                onChange={(e) => {
                  const pattern = PRESET_PATTERNS.find(p => p.id === e.target.value);
                  if (pattern) onSelectPreset(pattern);
                }}
                className="w-full bg-stone-950 border border-stone-800 text-stone-200 text-xs rounded-xl px-3 py-2 pr-6 appearance-none focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {PRESET_PATTERNS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.bpm} BPM)
                  </option>
                ))}
              </select>
              <Layers className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>

            <button
              onClick={handleExportWav}
              disabled={isExporting}
              title="Export Current Instrumental Mix to High-Res WAV"
              className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-stone-950 font-semibold text-xs rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Exporting...' : 'Export WAV'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
