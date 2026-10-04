import React, { useState } from 'react';
import { Sparkles, Music, Play, Pause, Download, Wand2, Loader2, Volume2, ShieldCheck, RefreshCw } from 'lucide-react';
import { GeneratedMusicResult } from '../types';

interface LyriaGeneratorProps {
  onLoadGeneratedTrack: (audioUrl: string) => void;
  hasApiKey: boolean;
}

export const LyriaGenerator: React.FC<LyriaGeneratorProps> = ({
  onLoadGeneratedTrack,
  hasApiKey
}) => {
  const [model, setModel] = useState<'lyria-3-clip-preview' | 'lyria-3-pro-preview'>('lyria-3-clip-preview');
  const [prompt, setPrompt] = useState(
    "Upbeat Nepali devotional folk-pop fusion instrumental, featuring a lively acoustic rhythm guitar, traditional harmonium melodies, a rhythmic and energetic madal drum beat, light melodic flute accents, devotional and uplifting atmosphere, high energy, crisp and clean studio sound."
  );
  const [tempo, setTempo] = useState(112);
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([
    'Madal (Bayan & Dayan)',
    'Traditional Harmonium',
    'Acoustic Rhythm Guitar',
    'Bansuri Bamboo Flute'
  ]);
  const [duckingForVocals, setDuckingForVocals] = useState(true);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationTime, setGenerationTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<GeneratedMusicResult[]>([]);
  const [activeAudioUrl, setActiveAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const toggleInstrument = (inst: string) => {
    setSelectedInstruments(prev =>
      prev.includes(inst) ? prev.filter(i => i !== inst) : [...prev, inst]
    );
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setGenerationTime(0);

    const timer = setInterval(() => {
      setGenerationTime(t => t + 1);
    }, 1000);

    try {
      const response = await fetch('/api/generate-music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model,
          tempo,
          instrumentEmphasis: selectedInstruments,
          duckingForVocals
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate music with Lyria');
      }

      // Convert base64 audio to Blob URL
      const binary = atob(data.audioBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: data.mimeType || 'audio/wav' });
      const audioUrl = URL.createObjectURL(blob);

      const newTrack: GeneratedMusicResult = {
        id: `track-${Date.now()}`,
        title: `Nepali Folk-Pop (${model === 'lyria-3-pro-preview' ? 'Pro Track' : 'Clip'})`,
        prompt: data.prompt || prompt,
        model,
        audioUrl,
        createdAt: new Date().toLocaleTimeString(),
        lyrics: data.lyrics
      };

      setHistory(prev => [newTrack, ...prev]);
      setActiveAudioUrl(audioUrl);
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play().then(() => setIsPlayingAudio(true)).catch(() => {});
      }
    } catch (err: unknown) {
      console.error('Lyria generation error:', err);
      const message = err instanceof Error ? err.message : 'Unknown generation error';
      setError(message);
    } finally {
      clearInterval(timer);
      setIsGenerating(false);
    }
  };

  const handleTogglePlay = (url: string) => {
    if (activeAudioUrl === url && isPlayingAudio) {
      audioRef.current?.pause();
      setIsPlayingAudio(false);
    } else {
      setActiveAudioUrl(url);
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play().then(() => setIsPlayingAudio(true)).catch(() => {});
      }
    }
  };

  const applyPresetPrompt = (text: string, bpmVal: number) => {
    setPrompt(text);
    setTempo(bpmVal);
  };

  return (
    <div className="space-y-6">
      <audio
        ref={audioRef}
        onEnded={() => setIsPlayingAudio(false)}
        className="hidden"
      />

      {/* Main Generator Card */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow Background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-500/10 via-orange-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Google Lyria 3 Powered
              </span>
              <span className="text-xs text-stone-400">• Upbeat Devotional Studio</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight mt-1 font-['Plus_Jakarta_Sans']">
              AI Nepali Devotional Folk-Pop Generator
            </h2>
          </div>

          {/* Model Switcher */}
          <div className="flex items-center p-1 bg-stone-950 rounded-2xl border border-stone-800 self-start md:self-auto">
            <button
              onClick={() => setModel('lyria-3-clip-preview')}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                model === 'lyria-3-clip-preview'
                  ? 'bg-amber-500 text-stone-950 font-bold shadow-md'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              Lyria 3 Clip (Up to 30s)
            </button>
            <button
              onClick={() => setModel('lyria-3-pro-preview')}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                model === 'lyria-3-pro-preview'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-stone-950 font-bold shadow-md'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              Lyria 3 Pro (Full Track)
            </button>
          </div>
        </div>

        {/* Prompt Input */}
        <div className="space-y-3 mb-5">
          <label className="text-xs font-semibold text-stone-300 uppercase tracking-wider block">
            Music Generation Prompt & Acoustic Directives
          </label>
          <div className="relative">
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the Nepali devotional folk-pop instrumental..."
              className="w-full bg-stone-950 border border-stone-800 rounded-2xl p-4 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500/80 transition-colors leading-relaxed"
            />
          </div>

          {/* Prompt Presets */}
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="text-[11px] text-stone-400 font-medium py-1">Quick Presets:</span>
            <button
              onClick={() => applyPresetPrompt("Upbeat Nepali devotional folk-pop fusion instrumental, featuring a lively acoustic rhythm guitar, traditional harmonium melodies, a rhythmic and energetic madal drum beat, light melodic flute accents, devotional and uplifting atmosphere, high energy, crisp and clean studio sound.", 112)}
              className="px-2.5 py-1 text-xs bg-stone-800/80 hover:bg-stone-700/80 text-amber-300 rounded-lg border border-stone-700 transition-colors cursor-pointer"
            >
              Nepali Folk-Pop Fusion (Prompt Default)
            </button>
            <button
              onClick={() => applyPresetPrompt("High energy Nepali Kailash Aarti bhajan fusion, fast syncopated madal dadra beat, bright 12-string acoustic guitar, ringing harmonium solos, soaring bansuri flute, uplifting temple atmosphere.", 120)}
              className="px-2.5 py-1 text-xs bg-stone-800/80 hover:bg-stone-700/80 text-orange-300 rounded-lg border border-stone-700 transition-colors cursor-pointer"
            >
              Kailash Shiva Aarti (120 BPM)
            </button>
            <button
              onClick={() => applyPresetPrompt("Joyful Nepali Dashain-Tihar devotional jhyaure folk-pop, organic madal bayan rolls, rhythmic acoustic guitar strumming, festive harmonium riffs, clean vocal-ready mix.", 124)}
              className="px-2.5 py-1 text-xs bg-stone-800/80 hover:bg-stone-700/80 text-stone-300 rounded-lg border border-stone-700 transition-colors cursor-pointer"
            >
              Durga Festive Jhyaure (124 BPM)
            </button>
          </div>
        </div>

        {/* Detailed Sonic Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 mb-6">
          
          {/* Organic Instruments Focus */}
          <div className="md:col-span-2 bg-stone-950/70 border border-stone-800/70 rounded-2xl p-4">
            <span className="text-xs font-semibold text-stone-300 block mb-2.5">
              Emphasize Organic Textures (Nepali Acoustic Stems):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { name: 'Madal (Bayan & Dayan)', desc: 'Organic dough slap & bass thud' },
                { name: 'Traditional Harmonium', desc: 'Acoustic reed bellows swell' },
                { name: 'Acoustic Rhythm Guitar', desc: '16th-note folk chucks & chime' },
                { name: 'Bansuri Bamboo Flute', desc: 'Airy chiff & devotional meend' }
              ].map(item => (
                <button
                  key={item.name}
                  onClick={() => toggleInstrument(item.name)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedInstruments.includes(item.name)
                      ? 'bg-amber-500/15 border-amber-500/50 text-white shadow-sm'
                      : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-300'
                  }`}
                >
                  <span className="text-xs font-bold block">{item.name}</span>
                  <span className="text-[10px] text-stone-400 block mt-0.5">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Vocal Space Ducking & Tempo */}
          <div className="bg-stone-950/70 border border-stone-800/70 rounded-2xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-stone-300">Tempo / BPM</span>
                <span className="font-mono text-xs font-bold text-amber-400">{tempo} BPM</span>
              </div>
              <input
                type="range"
                min="85"
                max="135"
                value={tempo}
                onChange={(e) => setTempo(Number(e.target.value))}
                className="w-full accent-amber-500 h-1 bg-stone-800 rounded-lg cursor-pointer mb-3"
              />
            </div>

            {/* Vocal Pocket Guard */}
            <div
              onClick={() => setDuckingForVocals(!duckingForVocals)}
              className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                duckingForVocals
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                  : 'bg-stone-900 border-stone-800 text-stone-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="text-xs font-semibold block">Vocal Space Cut</span>
                  <span className="text-[10px] text-stone-400">Leaves 1k-3.5k clear for singing</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={duckingForVocals}
                onChange={() => {}}
                className="accent-amber-500"
              />
            </div>
          </div>

        </div>

        {/* Action Button & Status */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="text-xs text-stone-400">
            {isGenerating ? (
              <span className="flex items-center gap-2 text-amber-400 animate-pulse font-medium">
                <Loader2 className="w-4 h-4 animate-spin" />
                Synthesizing Nepali folk-pop instrumental with Lyria 3... ({generationTime}s)
              </span>
            ) : (
              <span>Ready to generate pristine, vocal-balanced devotional audio</span>
            )}
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 hover:from-orange-400 hover:via-amber-400 hover:to-yellow-400 text-stone-950 font-bold rounded-2xl shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50 text-sm"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating Track...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>Generate with {model === 'lyria-3-pro-preview' ? 'Lyria 3 Pro' : 'Lyria 3 Clip'}</span>
              </>
            )}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            <span className="font-bold">Generation notice:</span> {error}.
            <div className="mt-1 text-stone-400">
              Note: You can always use the Multi-Track Studio to play and record with the built-in high-fidelity Nepali folk-pop synthesis engine!
            </div>
          </div>
        )}

      </div>

      {/* Generated Tracks Showcase */}
      {history.length > 0 && (
        <div className="bg-stone-900/60 border border-stone-800 rounded-3xl p-6">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Music className="w-4 h-4 text-amber-400" />
            Generated Lyria Stems & Tracks ({history.length})
          </h3>

          <div className="space-y-3">
            {history.map((track) => (
              <div
                key={track.id}
                className="bg-stone-950 border border-stone-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-stone-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleTogglePlay(track.audioUrl)}
                    className="w-11 h-11 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center hover:bg-amber-400 transition-all cursor-pointer shadow-md"
                  >
                    {activeAudioUrl === track.audioUrl && isPlayingAudio ? (
                      <Pause className="w-5 h-5 fill-current" />
                    ) : (
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    )}
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{track.title}</span>
                      <span className="text-[10px] text-stone-400 bg-stone-900 px-2 py-0.5 rounded-full border border-stone-800">
                        {track.createdAt}
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 line-clamp-1 max-w-xl mt-0.5">
                      {track.prompt}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => onLoadGeneratedTrack(track.audioUrl)}
                    className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Load in Vocal Mixer</span>
                  </button>

                  <a
                    href={track.audioUrl}
                    download={`nepali-devotional-${track.id}.wav`}
                    className="w-8 h-8 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 flex items-center justify-center transition-colors"
                    title="Download WAV File"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
