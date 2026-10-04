/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { MasterConsole } from './components/MasterConsole';
import { TrackChannel } from './components/TrackChannel';
import { LyriaGenerator } from './components/LyriaGenerator';
import { BhajanKaraoke } from './components/BhajanKaraoke';
import { VirtualInstruments } from './components/VirtualInstruments';
import { studioEngine } from './audio/engine';
import { InstrumentTrack, PresetPattern } from './types';
import { PRESET_PATTERNS } from './data/bhajanData';
import { Sparkles, ShieldCheck, Heart, Sliders, Music, Info, HelpCircle } from 'lucide-react';

const INITIAL_TRACKS: InstrumentTrack[] = [
  {
    id: 'madal',
    name: 'Nepali Madal',
    nepaliName: 'मादल',
    iconName: 'Drum',
    color: '#f59e0b', // Amber
    volume: 0.88,
    pan: 0,
    muted: false,
    solo: false,
    textureBoost: 0.85,
    description: 'Bayan dough bass slide & Dayan metallic ring in upbeat folk khemta syncopation',
    frequencyRange: '60Hz - 1.2kHz'
  },
  {
    id: 'harmonium',
    name: 'Harmonium',
    nepaliName: 'हार्मोनियम',
    iconName: 'Music',
    color: '#ea580c', // Orange
    volume: 0.80,
    pan: -0.25,
    muted: false,
    solo: false,
    textureBoost: 0.80,
    description: 'Dual-reed acoustic bellows with Bilawal/Bhairav devotional chord swells',
    frequencyRange: '250Hz - 4.5kHz'
  },
  {
    id: 'guitar',
    name: 'Acoustic Rhythm Guitar',
    nepaliName: 'अकौस्टिक गितार',
    iconName: 'Guitar',
    color: '#eab308', // Warm Golden Yellow
    volume: 0.84,
    pan: 0.35,
    muted: false,
    solo: false,
    textureBoost: 0.90,
    description: 'Crisp 16th-note folk-pop strumming, spruce body resonance & percussive chucks',
    frequencyRange: '140Hz - 8kHz'
  },
  {
    id: 'flute',
    name: 'Bansuri Flute',
    nepaliName: 'बाँसुरी',
    iconName: 'Wind',
    color: '#10b981', // Emerald
    volume: 0.74,
    pan: 0.15,
    muted: false,
    solo: false,
    textureBoost: 0.75,
    description: 'Airy bamboo breath chiff, devotional meend pitch glides & high counter-melodies',
    frequencyRange: '500Hz - 9kHz'
  },
  {
    id: 'vocals',
    name: 'Lead Vocals & Sing-Along',
    nepaliName: 'भजन भोकल',
    iconName: 'Mic',
    color: '#ec4899', // Pink
    volume: 0.95,
    pan: 0,
    muted: false,
    solo: false,
    textureBoost: 0.70,
    description: 'Vocal track with dynamic 2.2kHz mid pocket so devotional singing shines clearly',
    frequencyRange: '300Hz - 4kHz (Prio)'
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'mixer' | 'lyria' | 'karaoke' | 'instruments'>('mixer');
  const [tracks, setTracks] = useState<InstrumentTrack[]>(INITIAL_TRACKS);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(112);
  const [vocalSpaceDucking, setVocalSpaceDucking] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState('kailash-fusion');
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [hasApiKey, setHasApiKey] = useState(true);

  // Check health and API key on mount
  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setHasApiKey(Boolean(data.hasApiKey));
      })
      .catch(() => {
        setHasApiKey(true);
      });
  }, []);

  // Sync engine events
  useEffect(() => {
    studioEngine.onStepChange((step, time) => {
      setCurrentStep(step);
      setElapsedSec(time);
    });

    studioEngine.onPlayStateChange((playing) => {
      setIsPlaying(playing);
    });
  }, []);

  const handleUpdateTrack = (id: InstrumentTrack['id'], updated: Partial<InstrumentTrack>) => {
    setTracks(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t));
  };

  const handleSelectPreset = (pattern: PresetPattern) => {
    setSelectedPreset(pattern.id);
    setBpm(pattern.bpm);
    studioEngine.setBpm(pattern.bpm);

    setTracks(prev => prev.map(track => {
      const presetTrack = pattern.tracks[track.id];
      if (presetTrack) {
        studioEngine.setVolume(track.id, presetTrack.volume);
        studioEngine.setPan(track.id, presetTrack.pan);
        studioEngine.setTextureBoost(track.id, presetTrack.textureBoost);
        return {
          ...track,
          volume: presetTrack.volume,
          pan: presetTrack.pan,
          textureBoost: presetTrack.textureBoost
        };
      }
      return track;
    }));
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-['Plus_Jakarta_Sans'] selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasApiKey={hasApiKey}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Global Master Transport Console (Always accessible across views) */}
        <MasterConsole
          isPlaying={isPlaying}
          bpm={bpm}
          setBpm={setBpm}
          vocalSpaceDucking={vocalSpaceDucking}
          setVocalSpaceDucking={setVocalSpaceDucking}
          selectedPreset={selectedPreset}
          onSelectPreset={handleSelectPreset}
          currentStep={currentStep}
          elapsedSec={elapsedSec}
        />

        {/* View 1: Multi-Track Mixer & Organic Stems */}
        {activeTab === 'mixer' && (
          <div className="space-y-6">
            
            {/* Quick Overview Callout */}
            <div className="bg-gradient-to-r from-amber-950/40 via-stone-900 to-orange-950/40 border border-stone-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-amber-300 block">Balanced Mix with Vocal Space Pocket</span>
                  <span className="text-stone-400">
                    Traditional instrument textures (Madal dough slap, Harmonium reed, Acoustic guitar, Flute chiff) boosted with 2.2kHz mid-cut pocket for vocals.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setActiveTab('karaoke')}
                  className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl transition-colors cursor-pointer"
                >
                  Record Vocals
                </button>
                <button
                  onClick={() => setActiveTab('lyria')}
                  className="px-3 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 rounded-xl transition-colors cursor-pointer"
                >
                  Lyria 3 AI Generator
                </button>
              </div>
            </div>

            {/* 5-Channel Studio Mixer Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {tracks.map(track => (
                <TrackChannel
                  key={track.id}
                  track={track}
                  onUpdateTrack={(updated) => handleUpdateTrack(track.id, updated)}
                  isPlaying={isPlaying}
                />
              ))}
            </div>

            {/* Devotional Bhajan Overview Banner */}
            <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Heart className="w-5 h-5 text-red-400 fill-current shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-white">
                    नेपाली भक्ति भजन: शिव हर हर, गौरी शङ्कर कैलाशमा, जय जय दुर्गे माता
                  </h4>
                  <p className="text-xs text-stone-400">
                    The instrumental track is composed to accompany the traditional devotional bhajan dedicated to Shiva, Ganesha, Durga, and Hari.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('karaoke')}
                className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:brightness-110 text-stone-950 font-bold text-xs rounded-xl shadow transition-all cursor-pointer whitespace-nowrap"
              >
                View Sing-Along Sheet & Lyrics
              </button>
            </div>

          </div>
        )}

        {/* View 2: Lyria 3 AI Music Generator */}
        {activeTab === 'lyria' && (
          <LyriaGenerator
            onLoadGeneratedTrack={(url) => {
              const audio = new Audio(url);
              studioEngine.loadVocalAudio(audio);
              setActiveTab('mixer');
            }}
            hasApiKey={hasApiKey}
          />
        )}

        {/* View 3: Bhajan Lyrics & Karaoke Sing-Along */}
        {activeTab === 'karaoke' && (
          <BhajanKaraoke
            elapsedSec={elapsedSec}
            isPlaying={isPlaying}
          />
        )}

        {/* View 4: Virtual Instruments (Interactive Madal & Harmonium) */}
        {activeTab === 'instruments' && (
          <VirtualInstruments />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-stone-800/80 bg-stone-950/60 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-300">सुर सङ्गम (Sur Sangam)</span>
            <span>•</span>
            <span>Nepali Devotional Folk-Pop Fusion Studio</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-stone-400">
            <span>Powered by Google Lyria 3 & Web Audio API</span>
            <span>•</span>
            <span className="text-amber-400 font-medium">Organic Instrument Textures & Balanced Vocal Pocket</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
