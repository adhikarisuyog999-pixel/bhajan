export interface InstrumentTrack {
  id: 'madal' | 'harmonium' | 'guitar' | 'flute' | 'vocals';
  name: string;
  nepaliName: string;
  iconName: string;
  color: string;
  volume: number; // 0 to 1
  pan: number; // -1 to 1
  muted: boolean;
  solo: boolean;
  textureBoost: number; // 0 to 1 (organic texture enhancement)
  description: string;
  frequencyRange: string;
}

export interface BhajanLyricLine {
  id: number;
  timeSec: number;
  durationSec: number;
  nepali: string;
  transliteration: string;
  meaning: string;
  deity: 'Shiva' | 'Ganesh' | 'Durga' | 'Hari' | 'General';
}

export interface PresetPattern {
  id: string;
  title: string;
  nepaliTitle: string;
  description: string;
  bpm: number;
  key: string;
  tracks: Partial<Record<InstrumentTrack['id'], { volume: number; pan: number; textureBoost: number }>>;
}

export interface GeneratedMusicResult {
  id: string;
  title: string;
  prompt: string;
  model: 'lyria-3-clip-preview' | 'lyria-3-pro-preview';
  audioUrl: string;
  createdAt: string;
  lyrics?: string;
  durationSeconds?: number;
}
