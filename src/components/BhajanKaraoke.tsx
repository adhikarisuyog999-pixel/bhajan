import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Play, Pause, RotateCcw, Volume2, Upload, Sparkles, Heart } from 'lucide-react';
import { BHAJAN_LYRICS } from '../data/bhajanData';
import { studioEngine } from '../audio/engine';

interface BhajanKaraokeProps {
  elapsedSec: number;
  isPlaying: boolean;
  onVocalRecorded?: (audioBlob: Blob) => void;
}

export const BhajanKaraoke: React.FC<BhajanKaraokeProps> = ({
  elapsedSec,
  isPlaying,
  onVocalRecorded
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const vocalAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isVocalPlaying, setIsVocalPlaying] = useState(false);

  // Find active lyric line based on playback time
  const currentLine = BHAJAN_LYRICS.find(
    line => elapsedSec >= line.timeSec && elapsedSec < line.timeSec + line.durationSec
  ) || BHAJAN_LYRICS[1];

  // Start vocal microphone recording
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);
        if (onVocalRecorded) onVocalRecorded(audioBlob);

        // Load into audio engine for vocal track playback & sidechain ducking
        if (vocalAudioRef.current) {
          vocalAudioRef.current.src = url;
          studioEngine.loadVocalAudio(vocalAudioRef.current);
        }

        // Stop all tracks
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);

      // Also trigger instrumental playback if paused
      if (!isPlaying) {
        await studioEngine.play();
      }
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('Microphone permission is required to record your singing over the instrumental.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  // Timer for recording
  useEffect(() => {
    let interval: number;
    if (isRecording) {
      interval = window.setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleToggleVocalPlay = () => {
    if (!vocalAudioRef.current) return;
    if (isVocalPlaying) {
      vocalAudioRef.current.pause();
      setIsVocalPlaying(false);
    } else {
      vocalAudioRef.current.play().then(() => setIsVocalPlaying(true)).catch(() => {});
    }
  };

  // Handle custom audio file upload for vocals
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setRecordedAudioUrl(url);
      if (vocalAudioRef.current) {
        vocalAudioRef.current.src = url;
        studioEngine.loadVocalAudio(vocalAudioRef.current);
      }
    }
  };

  const getDeityBadge = (deity: string) => {
    switch (deity) {
      case 'Shiva':
        return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
      case 'Ganesh':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'Durga':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'Hari':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      default:
        return 'bg-orange-500/15 text-orange-300 border-orange-500/30';
    }
  };

  return (
    <div className="space-y-6">
      <audio
        ref={vocalAudioRef}
        onEnded={() => setIsVocalPlaying(false)}
        className="hidden"
      />

      {/* Top Banner: Karaoke Sing-Along Hero */}
      <div className="bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950/40 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
                <Heart className="w-3 h-3 text-amber-400 fill-current" />
                Nepali Devotional Bhajan Sing-Along
              </span>
              <span className="text-xs text-stone-400">• Vocal Space Mix Active</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight mt-1 font-['Plus_Jakarta_Sans']">
              भजन गायन र भोकल रेकर्डर (Bhajan Vocal Studio)
            </h2>
          </div>

          {/* Recording & Upload Actions */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            {isRecording ? (
              <button
                onClick={handleStopRecording}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-all cursor-pointer animate-pulse"
              >
                <MicOff className="w-4 h-4" />
                <span>Stop Recording ({recordingTime}s)</span>
              </button>
            ) : (
              <button
                onClick={handleStartRecording}
                className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-600/30 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Mic className="w-4 h-4" />
                <span>Record Your Voice</span>
              </button>
            )}

            <label className="px-3.5 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 border border-stone-700">
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>Import Audio</span>
              <input
                type="file"
                accept="audio/*"
                onChange={handleAudioUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Active Live Lyric Display */}
        <div className="bg-stone-950/80 border border-stone-800 rounded-2xl p-6 sm:p-7 text-center relative overflow-hidden my-4">
          <div className="absolute top-3 left-4 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Live Active Line</span>
          </div>

          <div className="max-w-3xl mx-auto space-y-2 mt-2">
            <span className={`inline-block px-2.5 py-0.5 text-[11px] font-semibold rounded-full border mb-1 ${getDeityBadge(currentLine.deity)}`}>
              Lord {currentLine.deity} Stuti
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-['Rozha_One'] tracking-wide leading-relaxed">
              {currentLine.nepali}
            </p>
            <p className="text-sm sm:text-base font-semibold text-stone-200 italic font-mono">
              "{currentLine.transliteration}"
            </p>
            <p className="text-xs text-stone-400 max-w-xl mx-auto pt-1">
              Devotional Meaning: {currentLine.meaning}
            </p>
          </div>
        </div>

        {/* Recorded Vocal Player Card if available */}
        {recordedAudioUrl && (
          <div className="mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleVocalPlay}
                className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold hover:bg-amber-400 cursor-pointer shadow-md"
              >
                {isVocalPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>
              <div>
                <span className="text-xs font-bold text-amber-300 block">Vocal Track Loaded in Studio Mixer</span>
                <span className="text-[11px] text-stone-400">
                  Instrumental automatically ducks 1kHz - 3.5kHz mid frequencies to let your voice cut through!
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setRecordedAudioUrl(null);
                if (vocalAudioRef.current) vocalAudioRef.current.src = '';
              }}
              className="text-xs text-stone-400 hover:text-stone-200"
            >
              Clear
            </button>
          </div>
        )}

      </div>

      {/* Complete Song Sheet / Bhajan Lyrics Timeline */}
      <div className="bg-stone-900/60 border border-stone-800 rounded-3xl p-6 sm:p-7">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Nepali Bhajan Complete Verses & Devotional Structure
            </h3>
            <p className="text-xs text-stone-400">
              As sung in the recorded bhajan: Shiva, Ganesha, Durga Mata, and Hari Dhyan
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {BHAJAN_LYRICS.map((line) => {
            const isCurrent = currentLine.id === line.id;
            return (
              <div
                key={line.id}
                onClick={() => studioEngine.seek(Math.floor((line.timeSec / (60 / 112 / 4))))}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-amber-500/15 border-amber-500/60 shadow-lg shadow-amber-500/10 scale-101'
                    : 'bg-stone-950/70 border-stone-800/80 hover:border-stone-700'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${getDeityBadge(line.deity)}`}>
                        {line.deity}
                      </span>
                      <span className="text-xs font-mono text-stone-400">
                        {Math.floor(line.timeSec / 60)}:{(line.timeSec % 60).toString().padStart(2, '0')}
                      </span>
                    </div>

                    <p className="text-base font-bold text-white font-['Rozha_One'] tracking-wide">
                      {line.nepali}
                    </p>
                    <p className="text-xs text-amber-300/90 font-mono italic">
                      {line.transliteration}
                    </p>
                    <p className="text-[11px] text-stone-400">
                      {line.meaning}
                    </p>
                  </div>

                  <span className="text-[11px] font-medium text-amber-400/80 bg-stone-900 px-2 py-1 rounded-lg border border-stone-800 whitespace-nowrap">
                    Jump to bar
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
