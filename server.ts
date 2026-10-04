import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Modality } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '50mb' }));

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
      time: new Date().toISOString()
    });
  });

  // Lyria 3 Music Generation Endpoint
  app.post('/api/generate-music', async (req: Request, res: Response) => {
    try {
      const {
        prompt,
        model = 'lyria-3-clip-preview',
        tempo = 112,
        instrumentEmphasis = ['madal', 'harmonium', 'guitar', 'flute'],
        duckingForVocals = true
      } = req.body;

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({
          error: 'GEMINI_API_KEY is not configured in server environment.',
          code: 'MISSING_API_KEY'
        });
      }

      const ai = new GoogleGenAI({ apiKey });

      // Construct a rich prompt that guarantees organic textures and vocal space
      let enrichedPrompt = prompt || "Upbeat Nepali devotional folk-pop fusion instrumental, featuring a lively acoustic rhythm guitar, traditional harmonium melodies, a rhythmic and energetic madal drum beat, light melodic flute accents, devotional and uplifting atmosphere, high energy, crisp and clean studio sound.";

      // Add specific sonic mixing instructions
      const sonicDirectives: string[] = [];
      if (tempo) sonicDirectives.push(`tempo: ${tempo} BPM`);
      if (instrumentEmphasis.length > 0) {
        sonicDirectives.push(`emphasize the organic acoustic textures of: ${instrumentEmphasis.join(', ')}`);
      }
      if (duckingForVocals) {
        sonicDirectives.push('leave clear spectral space in the 1kHz to 3.5kHz mid-range for lead vocals to cut through cleanly');
      }

      if (sonicDirectives.length > 0) {
        enrichedPrompt += ` [Audio directives: ${sonicDirectives.join('; ')}]`;
      }

      const selectedModel = model === 'lyria-3-pro-preview' ? 'lyria-3-pro-preview' : 'lyria-3-clip-preview';

      // Call Lyria model via generateContentStream with Modality.AUDIO
      const responseStream = await ai.models.generateContentStream({
        model: selectedModel,
        contents: enrichedPrompt,
        config: {
          responseModalities: [Modality.AUDIO]
        }
      });

      let audioBase64 = '';
      let lyrics = '';
      let mimeType = 'audio/wav';

      for await (const chunk of responseStream) {
        const parts = chunk.candidates?.[0]?.content?.parts;
        if (!parts) continue;

        for (const part of parts) {
          if (part.inlineData?.data) {
            if (!audioBase64 && part.inlineData.mimeType) {
              mimeType = part.inlineData.mimeType;
            }
            audioBase64 += part.inlineData.data;
          }
          if (part.text && !lyrics) {
            lyrics = part.text;
          }
        }
      }

      if (!audioBase64) {
        return res.status(500).json({
          error: 'No audio data returned by music generation model.',
          details: 'The model completed without inline audio data.'
        });
      }

      return res.json({
        success: true,
        model: selectedModel,
        audioBase64,
        mimeType,
        lyrics,
        prompt: enrichedPrompt
      });
    } catch (err: unknown) {
      console.error('Error generating music:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown music generation error';
      return res.status(500).json({
        error: errorMessage,
        code: 'GENERATION_FAILED'
      });
    }
  });

  // Prompt refiner / Nepali Devotional Lyrics assistant
  app.post('/api/enhance-prompt', async (req: Request, res: Response) => {
    try {
      const { topic = 'Lord Shiva and Goddess Durga Nepali devotional bhajan' } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: 'GEMINI_API_KEY missing' });
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a music producer specializing in Nepali folk-pop devotional fusion (featuring Madal, Harmonium, Acoustic Guitar, and Bansuri Flute).
Craft an optimized music generation prompt for Lyria 3 (max 60 words) that describes an upbeat, high-energy Nepali devotional instrumental track.
Topic/Mood: "${topic}".
Include details about acoustic rhythm guitar, energetic madal groove (dha-tin-tin-ta), warm harmonium chords, ethereal bansuri flute, and transparent vocal-ready mix.
Return ONLY the prompt string.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt
      });

      return res.json({
        prompt: response.text?.trim()
      });
    } catch (err: unknown) {
      console.error('Error enhancing prompt:', err);
      return res.status(500).json({ error: 'Failed to enhance prompt' });
    }
  });

  // Setup Vite middleware in dev or static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nepali Devotional Studio server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
