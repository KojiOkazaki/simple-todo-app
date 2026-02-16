import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { existsSync } from 'fs';
import routes from './routes.js';

// Load .env first, then .env.example as fallback (won't override existing values)
dotenv.config();
if (existsSync('.env.example')) {
  dotenv.config({ path: '.env.example' });
}

const app = express();
const PORT = process.env.PORT || 3010;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json({ limit: '50mb' }));

// API Routes
app.use('/api', routes);

// Root
app.get('/', (_req, res) => {
  res.json({
    name: 'Interview Simulation Server',
    version: '1.0.0',
    description: 'DialogLab-inspired multi-agent interview simulation API',
    endpoints: {
      health: 'GET /api/health',
      providers: 'GET /api/providers',
      respond: 'POST /api/interview/respond',
      evaluate: 'POST /api/interview/evaluate',
      closing: 'POST /api/interview/closing',
      tts: 'POST /api/tts/synthesize',
    },
  });
});

// Validate API keys (check for placeholder values)
function isRealKey(key) {
  if (!key) return false;
  const placeholders = ['your-', 'xxx', 'test', 'placeholder', 'here'];
  return !placeholders.some(p => key.toLowerCase().includes(p));
}

app.listen(PORT, () => {
  const geminiOk = isRealKey(process.env.GEMINI_API_KEY);
  const openaiOk = isRealKey(process.env.OPENAI_API_KEY);
  const elevenOk = isRealKey(process.env.ELEVENLABS_API_KEY);

  console.log(`
╔══════════════════════════════════════════════════╗
║   Interview Simulation Server                    ║
║   Running on http://localhost:${PORT}               ║
║                                                  ║
║   Providers:                                     ║
║   - Gemini:     ${geminiOk ? '✅ Configured' : '❌ Not configured'}                  ║
║   - OpenAI:     ${openaiOk ? '✅ Configured' : '❌ Not configured'}                  ║
║   - ElevenLabs: ${elevenOk ? '✅ Configured' : '❌ Not configured'}                  ║
╠══════════════════════════════════════════════════╣`);

  if (!geminiOk && !openaiOk) {
    console.log(`║   ⚠️  LLMキーなし: 面接AI応答が使えません       ║
║   server/.env にGEMINI_API_KEYを設定してください ║`);
  }
  if (!elevenOk) {
    console.log(`║   ⚠️  ElevenLabsキーなし: ブラウザ音声使用      ║
║   高品質音声にはELEVENLABS_API_KEYを設定        ║`);
  }
  console.log(`╚══════════════════════════════════════════════════╝
  `);
});
