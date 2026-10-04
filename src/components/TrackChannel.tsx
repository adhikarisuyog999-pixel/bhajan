import React, { useEffect, useRef } from 'react';
import { Volume2, VolumeX, Sliders, Waves, Sparkles } from 'lucide-react';
import { InstrumentTrack } from '../types';
import { studioEngine } from '../audio/engine';

interface TrackChannelProps {
  track: InstrumentTrack;
  onUpdateTrack: (updated: Partial<InstrumentTrack>) => void;
  isPlaying: boolean;
}

export const TrackChannel: React.FC<TrackChannelProps> = ({
  track,
  onUpdateTrack,
  isPlaying
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Per-channel visualizer
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dataArray = new Uint8Array(64);

    const render = () => {
      studioEngine.getTrackFrequencyData(track.id, dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const barCount = 18;
      const barWidth = width / barCount - 1.5;

      for (let i = 0; i < barCount; i++) {
        const val = isPlaying && !track.muted ? dataArray[i * 2] || 0 : 0;
        const percent = (val / 255) * track.volume;
        const barHeight = Math.max(2, percent * (height - 4));
        const x = i * (barWidth + 1.5);
        const y = height - barHeight;

        ctx.fillStyle = track.color;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, track.id, track.muted, track.volume, track.color]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    onUpdateTrack({ volume: vol });
    studioEngine.setVolume(track.id, vol);
  };

  const handlePanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pan = parseFloat(e.target.value);
    onUpdateTrack({ pan });
    studioEngine.setPan(track.id, pan);
  };

  const handleTextureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const texture = parseFloat(e.target.value);
    onUpdateTrack({ textureBoost: texture });
    studioEngine.setTextureBoost(track.id, texture);
  };

  const toggleMute = () => {
    const next = !track.muted;
    onUpdateTrack({ muted: next });
    studioEngine.setMute(track.id, next);
  };

  const toggleSolo = () => {
    const next = !track.solo;
    onUpdateTrack({ solo: next });
    studioEngine.setSolo(track.id, next);
  };

  const formatPan = (val: number) => {
    if (Math.abs(val) < 0.05) return 'C';
    if (val < 0) return `L${Math.round(Math.abs(val) * 100)}`;
    return `R${Math.round(val * 100)}`;
  };

  return (
    <div className={`bg-stone-900/80 border rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 relative overflow-hidden ${
      track.solo
        ? 'border-amber-500/80 shadow-lg shadow-amber-500/10'
        : track.muted
        ? 'border-stone-800/50 opacity-60'
        : 'border-stone-800 hover:border-stone-700'
    }`}>
      
      {/* Top Accent Stripe */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: track.color }}
      />

      {/* Header Info */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold text-white tracking-tight">{track.name}</span>
              <span className="text-xs text-amber-400 font-medium font-['Rozha_One']">({track.nepaliName})</span>
            </div>
            <p className="text-[11px] text-stone-400 line-clamp-1">{track.description}</p>
          </div>

          {/* Mute & Solo buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={toggleMute}
              title={track.muted ? 'Unmute' : 'Mute Track'}
              className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                track.muted
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-stone-800 text-stone-400 hover:text-white hover:bg-stone-700'
              }`}
            >
              M
            </button>
            <button
              onClick={toggleSolo}
              title={track.solo ? 'Turn off Solo' : 'Solo Track'}
              className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                track.solo
                  ? 'bg-amber-500 text-stone-950 font-extrabold shadow-sm'
                  : 'bg-stone-800 text-stone-400 hover:text-amber-400 hover:bg-stone-700'
              }`}
            >
              S
            </button>
          </div>
        </div>

        {/* Real-time spectrum canvas */}
        <div className="bg-stone-950 rounded-xl p-1 border border-stone-800/80 my-2.5">
          <canvas ref={canvasRef} width={180} height={28} className="w-full h-7 block rounded" />
        </div>
      </div>

      {/* Controls Section */}
      <div className="space-y-3.5 mt-2">

        {/* Volume Fader */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-stone-400 font-medium flex items-center gap-1 text-[11px]">
              {track.volume === 0 || track.muted ? (
                <VolumeX className="w-3 h-3 text-rose-400" />
              ) : (
                <Volume2 className="w-3 h-3 text-stone-400" />
              )}
              Level
            </span>
            <span className="font-mono text-xs font-semibold text-stone-200">
              {track.muted ? 'MUTED' : `${Math.round(track.volume * 100)}%`}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={track.muted ? 0 : track.volume}
            onChange={handleVolumeChange}
            className="w-full accent-amber-500 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Organic Texture Boost */}
        <div className="bg-stone-950/60 border border-stone-800/60 rounded-xl p-2.5">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Organic Texture
            </span>
            <span className="font-mono text-[11px] font-semibold text-stone-300">
              +{Math.round(track.textureBoost * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={track.textureBoost}
            onChange={handleTextureChange}
            className="w-full accent-orange-500 h-1 bg-stone-800 rounded-lg cursor-pointer"
          />
          <p className="text-[10px] text-stone-400 mt-1">
            {track.id === 'madal' && 'Emphasizes clay dough resonance & bayan slap snap'}
            {track.id === 'harmonium' && 'Boosts dual-reed acoustic air & bellows tremolo'}
            {track.id === 'guitar' && 'Crisp acoustic spruce body chime & pick attack'}
            {track.id === 'flute' && 'Airy bamboo chiff & devotional meend glides'}
            {track.id === 'vocals' && 'Direct vocal air warmth & presence'}
          </p>
        </div>

        {/* Pan Control */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-stone-800/60 text-[11px]">
          <span className="text-stone-400 font-medium flex items-center gap-1">
            <Sliders className="w-3 h-3 text-stone-400" /> Stereo Pan
          </span>
          <div className="flex items-center gap-2 w-32">
            <input
              type="range"
              min="-1"
              max="1"
              step="0.05"
              value={track.pan}
              onChange={handlePanChange}
              className="w-full accent-stone-400 h-1 bg-stone-800 rounded-lg cursor-pointer"
            />
            <span className="font-mono text-[10px] font-bold text-stone-300 w-7 text-right">
              {formatPan(track.pan)}
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};
