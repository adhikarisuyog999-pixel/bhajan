import React from 'react';
import { Music, Sparkles, Disc3, Volume2, Mic, Flame } from 'lucide-react';

interface HeaderProps {
  activeTab: 'mixer' | 'lyria' | 'karaoke' | 'instruments';
  setActiveTab: (tab: 'mixer' | 'lyria' | 'karaoke' | 'instruments') => void;
  hasApiKey: boolean;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, hasApiKey }) => {
  return (
    <header className="border-b border-stone-800 bg-stone-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-600 via-orange-600 to-red-600 p-0.5 shadow-lg shadow-orange-950/40 flex items-center justify-center">
              <div className="w-full h-full bg-stone-950 rounded-[10px] flex items-center justify-center text-amber-400">
                <Disc3 className="w-6 h-6 animate-[spin_8s_linear_infinite]" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-['Plus_Jakarta_Sans']">
                  सुर सङ्गम <span className="text-amber-400 font-light text-lg sm:text-xl">Sur Sangam</span>
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  Nepali Folk-Pop Fusion
                </span>
              </div>
              <p className="text-xs text-stone-400 flex items-center gap-2">
                <span>मादल • हार्मोनियम • अकौस्टिक गितार • बाँसुरी</span>
                <span className="text-stone-600">•</span>
                <span className="text-orange-400 font-medium flex items-center gap-1">
                  <Flame className="w-3 h-3 text-orange-400" />
                  Devotional Atmosphere & Vocal Space Mix
                </span>
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-stone-900/90 rounded-xl border border-stone-800/80 self-start md:self-auto overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('mixer')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'mixer'
                  ? 'bg-amber-500 text-stone-950 font-semibold shadow-md shadow-amber-500/20'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800/50'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Multi-Track Studio</span>
            </button>

            <button
              onClick={() => setActiveTab('lyria')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap relative ${
                activeTab === 'lyria'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-stone-950 font-semibold shadow-md shadow-orange-500/20'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Lyria 3 AI Generator</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            </button>

            <button
              onClick={() => setActiveTab('karaoke')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'karaoke'
                  ? 'bg-amber-500 text-stone-950 font-semibold shadow-md shadow-amber-500/20'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800/50'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Bhajan Lyrics & Vocal Recorder</span>
            </button>

            <button
              onClick={() => setActiveTab('instruments')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'instruments'
                  ? 'bg-amber-500 text-stone-950 font-semibold shadow-md shadow-amber-500/20'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800/50'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>Madal & Harmonium Pads</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
