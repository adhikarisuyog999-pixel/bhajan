import { BhajanLyricLine, PresetPattern } from '../types';

export const BHAJAN_LYRICS: BhajanLyricLine[] = [
  {
    id: 1,
    timeSec: 0,
    durationSec: 18,
    nepali: "आज आमाले चिया खाँदै एउटा भजन गाउनुहुन्छ... आमा ल सुरु गर्नु त!",
    transliteration: "Aaja aama le chiya khaadai euta bhajan gaunuhunchha... Aama la suru garnu ta!",
    meaning: "Child eagerly invites mother to sing a devotional song over tea",
    deity: 'General'
  },
  {
    id: 2,
    timeSec: 19,
    durationSec: 7,
    nepali: "शिव हर हर गाईको दुध जलधारा...",
    transliteration: "Shiva hara hara gaiko dudha jaldhara...",
    meaning: "Offering sacred cow milk and holy water stream to Lord Shiva",
    deity: 'Shiva'
  },
  {
    id: 3,
    timeSec: 26,
    durationSec: 13,
    nepali: "गौरी शङ्कर कैलाशमा नन्दी साथैमा, लम्बोदर गणेश बसेका काखमा...",
    transliteration: "Gauri Shankar Kailash ma nandi saathaima, Lambodar Ganesh baseka kaakhma...",
    meaning: "Gauri Shankar seated in Mount Kailash with Nandi, cradling pot-bellied Lord Ganesha",
    deity: 'Shiva'
  },
  {
    id: 4,
    timeSec: 39,
    durationSec: 12,
    nepali: "गौरी शङ्कर कैलाशमा नन्दी साथैमा, लम्बोदर गणेश बसेका काखमा...",
    transliteration: "Gauri Shankar Kailash ma nandi saathaima, Lambodar Ganesh baseka kaakhma...",
    meaning: "Gauri Shankar seated in Mount Kailash with Nandi, cradling pot-bellied Lord Ganesha (chorus ref.)",
    deity: 'Shiva'
  },
  {
    id: 5,
    timeSec: 51,
    durationSec: 12,
    nepali: "लगाऊँ गणेशलाई दुबो लड्डु फूलमाला...",
    transliteration: "Lagau ganesh lai dubo laddu phoolmala...",
    meaning: "Offering sacred Dubo grass, sweet laddus, and floral garlands to Lord Ganesha",
    deity: 'Ganesh'
  },
  {
    id: 6,
    timeSec: 63,
    durationSec: 13,
    nepali: "लगाऊँ गणेशलाई दुबो लड्डु सिन्दूर हरि हरि...",
    transliteration: "Lagau ganesh lai dubo laddu sindoor Hari Hari...",
    meaning: "Adoring Ganesha with vermilion, sweet laddus, chanting the holy name of Hari",
    deity: 'Ganesh'
  },
  {
    id: 7,
    timeSec: 76,
    durationSec: 19,
    nepali: "जय जय दुर्गे माता दर्शन दिनुस् अब त, जय जय दुर्गे माता दर्शन दिनुस् अब त हे हरि...",
    transliteration: "Jai Jai Durge Mata darshan dinus aba ta, Jai Jai Durge Mata darshan dinus aba ta hey Hari...",
    meaning: "Victory to Mother Durga! Please bestow your divine vision and blessings upon us",
    deity: 'Durga'
  },
  {
    id: 8,
    timeSec: 95,
    durationSec: 13,
    nepali: "हरि भजनैमा छु दाइ म त ध्यानैमा, हरि भजनैमा छौ है म त ध्यानैमा हरि हरि...",
    transliteration: "Hari bhajanai ma chhu dai ma ta dhyanai ma, Hari bhajanai ma chhau hai ma ta dhyanai ma Hari Hari...",
    meaning: "Deeply immersed in the sacred Bhajan of Hari, absorbed in divine meditative bliss",
    deity: 'Hari'
  },
  {
    id: 9,
    timeSec: 108,
    durationSec: 12,
    nepali: "धन्यवाद आमा, कस्तो राम्रो स्वरले भन्नुभएकोमा, धन्यवाद!",
    transliteration: "Dhanyabad aama, kasto ramro swor le bhannubhayeko ma, dhanyabad!",
    meaning: "Heartfelt gratitude to mother for singing so melodiously with pure devotion",
    deity: 'General'
  }
];

export const PRESET_PATTERNS: PresetPattern[] = [
  {
    id: 'kailash-fusion',
    title: 'Upbeat Kailash Folk-Pop (Default)',
    nepaliTitle: 'कैलाश लोक-पप फ्युजन',
    description: 'Energetic Madal rhythm with crisp 16th-note acoustic guitar strums, sweet harmonium chords, and airy bansuri flourishes.',
    bpm: 112,
    key: 'D Major',
    tracks: {
      madal: { volume: 0.88, pan: 0, textureBoost: 0.85 },
      harmonium: { volume: 0.78, pan: -0.25, textureBoost: 0.8 },
      guitar: { volume: 0.82, pan: 0.35, textureBoost: 0.9 },
      flute: { volume: 0.72, pan: 0.15, textureBoost: 0.75 },
      vocals: { volume: 0.92, pan: 0, textureBoost: 0.7 }
    }
  },
  {
    id: 'durga-festive',
    title: 'Durga Puja Festive Jhyaure',
    nepaliTitle: 'दुर्गा पूजा झ्याउरे ताल',
    description: 'High-energy 124 BPM celebration beat featuring punching Madal Bayan/Dayan hits and driving harmonium bellows.',
    bpm: 124,
    key: 'E Major',
    tracks: {
      madal: { volume: 0.95, pan: 0, textureBoost: 0.95 },
      harmonium: { volume: 0.85, pan: -0.3, textureBoost: 0.85 },
      guitar: { volume: 0.8, pan: 0.3, textureBoost: 0.8 },
      flute: { volume: 0.82, pan: -0.1, textureBoost: 0.85 },
      vocals: { volume: 0.9, pan: 0, textureBoost: 0.6 }
    }
  },
  {
    id: 'meditative-morning',
    title: 'Morning Aarti & Dubo Laddoo',
    nepaliTitle: 'बिहानी आरती र दुबो लड्डु',
    description: 'Gentle, devotional atmosphere emphasizing warm harmonium reed swell and expressive bansuri flute meend glides.',
    bpm: 98,
    key: 'C Major',
    tracks: {
      madal: { volume: 0.7, pan: 0, textureBoost: 0.6 },
      harmonium: { volume: 0.88, pan: -0.15, textureBoost: 0.9 },
      guitar: { volume: 0.68, pan: 0.25, textureBoost: 0.75 },
      flute: { volume: 0.86, pan: 0.2, textureBoost: 0.95 },
      vocals: { volume: 0.95, pan: 0, textureBoost: 0.8 }
    }
  },
  {
    id: 'acoustic-unplugged',
    title: 'Organic Acoustic Unplugged',
    nepaliTitle: 'अर्ग्यानिक अकौस्टिक स्टुडियो',
    description: 'Maximum emphasis on raw wooden textures, fingerpick attack, harmonium key clicks, and natural acoustic room resonance.',
    bpm: 108,
    key: 'G Major',
    tracks: {
      madal: { volume: 0.85, pan: -0.1, textureBoost: 1.0 },
      harmonium: { volume: 0.8, pan: -0.35, textureBoost: 0.95 },
      guitar: { volume: 0.92, pan: 0.4, textureBoost: 1.0 },
      flute: { volume: 0.75, pan: 0.1, textureBoost: 0.9 },
      vocals: { volume: 0.88, pan: 0, textureBoost: 0.85 }
    }
  }
];
