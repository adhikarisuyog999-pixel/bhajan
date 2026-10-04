import React, { useState, useEffect } from 'react';
import { Drum, Music, Sparkles, Wind } from 'lucide-react';
import { studioEngine } from '../audio/engine';

export const VirtualInstruments: React.FC = () => {
  const [activePad, setActivePad] = useState<string | null>(null);
  const [bellowsLevel, setBellowsLevel] = useState(85);

  const madalPads = [
    { id: 'daa', label: 'दाँ (Daa)', head: 'Bayan (Bass Head)', key: 'A', desc: 'Deep resonance with pitch drop' },
    { id: 'tin', label: 'तिन् (Tin)', head: 'Dayan (Open Ring)', key: 'S', desc: 'High metallic tuned ring' },
    { id: 'ta', label: 'ता (Ta)', head: 'Dayan (Rim Slap)', key: 'D', desc: 'Crisp wooden attack' },
    { id: 'kha', label: 'ख (Kha)', head: 'Chutki (Muted Palm)', key: 'F', desc: 'Rhythmic dry folk chuck' },
    { id: 'dhin', label: 'धिन् (Dhin)', head: 'Bayan + Dayan (Both)', key: 'Space', desc: 'Full power combined strike' }
  ];

  const harmoniumNotes = [
    { note: 'Sa', freq: 293.66, key: 'Z', swara: 'सा', octave: '4' },
    { note: 'Re', freq: 329.63, key: 'X', swara: 'रे', octave: '4' },
    { note: 'Ga', freq: 369.99, key: 'C', swara: 'ग', octave: '4' },
    { note: 'Ma', freq: 392.00, key: 'V', swara: 'म', octave: '4' },
    { note: 'Pa', freq: 440.00, key: 'B', swara: 'प', octave: '4' },
    { note: 'Dha', freq: 493.88, key: 'N', swara: 'ध', octave: '4' },
    { note: 'Ni', freq: 554.37, key: 'M', swara: 'नि', octave: '4' },
    { note: 'Sa\'', freq: 587.33, key: ',', swara: 'साँ', octave: '5' }
  ];

  const fluteFlourishes = [
    { title: 'Kailash Meend Glide', freq: 587.33, dur: 0.9 },
    { title: 'Durga High Chiff (Pa)', freq: 880.00, dur: 0.7 },
    { title: 'Devotional Murki (Ga)', freq: 739.99, dur: 0.8 },
    { title: 'Aarti Air Swell', freq: 659.25, dur: 1.1 }
  ];

  const triggerMadal = (id: 'daa' | 'tin' | 'ta' | 'kha' | 'dhin') => {
    setActivePad(id);
    studioEngine.playMadalHit(id, undefined, 0.9);
    setTimeout(() => setActivePad(null), 150);
  };

  const triggerHarmonium = (freq: number, noteName: string) => {
    setActivePad(noteName);
    studioEngine.playHarmoniumReed(freq, undefined, 0.7, 0.6);
    setBellowsLevel(prev => Math.max(30, prev - 8));
    setTimeout(() => {
      setActivePad(null);
      setBellowsLevel(prev => Math.min(100, prev + 10));
    }, 200);
  };

  const triggerFlute = (freq: number) => {
    studioEngine.playBansuriNote(freq, undefined, 0.7, 0.85);
  };

  // Keyboard shortcut listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const key = e.key.toUpperCase();
      if (key === 'A') triggerMadal('daa');
      else if (key === 'S') triggerMadal('tin');
      else if (key === 'D') triggerMadal('ta');
      else if (key === 'F') triggerMadal('kha');
      else if (key === ' ') {
        e.preventDefault();
        triggerMadal('dhin');
      }

      // Harmonium keys
      const harm = harmoniumNotes.find(h => h.key === key || (h.key === ',' && e.key === ','));
      if (harm) {
        triggerHarmonium(harm.freq, harm.note);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Nepali Madal Drum Pad */}
      <div className="bg-stone-900/80 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Drum className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white font-['Plus_Jakarta_Sans']">
                नेपाली मादल प्याड (Nepali Madal Interactive Pad)
              </h2>
              <p className="text-xs text-stone-400">
                Tap or use keyboard (A, S, D, F, Space) to play authentic Bayan & Dayan acoustic hits
              </p>
            </div>
          </div>

          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-stone-950 border border-stone-800 text-amber-300 self-start sm:self-auto">
            Physical Acoustic Model
          </span>
        </div>

        {/* 5 Madal Pads */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          {madalPads.map((pad) => (
            <button
              key={pad.id}
              onClick={() => triggerMadal(pad.id as 'daa' | 'tin' | 'ta' | 'kha' | 'dhin')}
              className={`p-4 rounded-2xl border text-center transition-all cursor-pointer select-none active:scale-95 flex flex-col justify-between min-h-[135px] ${
                activePad === pad.id
                  ? 'bg-gradient-to-t from-amber-500 to-orange-500 border-amber-400 text-stone-950 shadow-xl shadow-amber-500/30 scale-102'
                  : 'bg-stone-950/80 border-stone-800/80 text-stone-200 hover:border-amber-500/40 hover:bg-stone-900'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] opacity-75">
                <span className="font-mono font-bold bg-stone-800/80 px-1.5 py-0.5 rounded text-amber-300">
                  [{pad.key}]
                </span>
                <span className="text-[10px] uppercase tracking-wider">{pad.id}</span>
              </div>

              <div>
                <span className="text-2xl font-black block my-1 font-['Rozha_One']">
                  {pad.label}
                </span>
                <span className="text-[11px] font-semibold block text-amber-400/90">
                  {pad.head}
                </span>
              </div>

              <span className="text-[10px] opacity-70 block">
                {pad.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Traditional Harmonium Virtual Keyboard */}
      <div className="bg-stone-900/80 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white font-['Plus_Jakarta_Sans']">
                हार्मोनियम सरगम (Traditional Harmonium Keys)
              </h2>
              <p className="text-xs text-stone-400">
                Play Bilawal / Bhairav devotional melody with authentic dual-reed bellows tremolo
              </p>
            </div>
          </div>

          {/* Bellows Indicator */}
          <div className="flex items-center gap-2 bg-stone-950 border border-stone-800 px-3 py-1.5 rounded-xl self-start sm:self-auto">
            <Wind className="w-4 h-4 text-amber-400" />
            <div className="w-20 bg-stone-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-amber-400 h-full transition-all duration-300"
                style={{ width: `${bellowsLevel}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-stone-400 font-bold">Bellows</span>
          </div>
        </div>

        {/* Harmonium Keys */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {harmoniumNotes.map((note) => (
            <button
              key={note.note}
              onClick={() => triggerHarmonium(note.freq, note.note)}
              className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer select-none active:scale-95 flex flex-col justify-between h-36 ${
                activePad === note.note
                  ? 'bg-amber-500 border-amber-400 text-stone-950 shadow-lg shadow-amber-500/30'
                  : 'bg-stone-950 border-stone-800 text-stone-200 hover:border-orange-500/50 hover:bg-stone-900'
              }`}
            >
              <span className="font-mono text-[10px] text-amber-400/90 font-bold">
                [{note.key}]
              </span>

              <div>
                <span className="text-2xl font-bold block font-['Rozha_One']">
                  {note.swara}
                </span>
                <span className="text-xs font-semibold block text-stone-400">
                  {note.note}
                </span>
              </div>

              <span className="text-[9px] font-mono text-stone-500">
                {Math.round(note.freq)} Hz
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Bansuri Bamboo Flute Accents */}
      <div className="bg-stone-900/80 border border-stone-800 rounded-3xl p-6 sm:p-7 shadow-2xl">
        <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          बाँसुरी मुरली (Bansuri Flute Light Melodic Accents)
        </h3>
        <p className="text-xs text-stone-400 mb-4">
          Devotional bamboo flourishes with microtonal glides, delayed vibrato, and breath chiff
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {fluteFlourishes.map((f) => (
            <button
              key={f.title}
              onClick={() => triggerFlute(f.freq)}
              className="p-3 bg-stone-950 border border-stone-800 hover:border-emerald-500/40 rounded-xl text-left transition-colors cursor-pointer group"
            >
              <span className="text-xs font-bold text-stone-200 group-hover:text-emerald-300 block">
                {f.title}
              </span>
              <span className="text-[10px] text-stone-500 block mt-0.5">
                Play devotional flourish
              </span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};
