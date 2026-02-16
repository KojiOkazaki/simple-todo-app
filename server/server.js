import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes.js';

dotenv.config();

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

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║   Interview Simulation Server                  ║
║   Running on http://localhost:${PORT}             ║
║                                                ║
║   Providers:                                   ║
║   - Gemini: ${process.env.GEMINI_API_KEY ? 'Configured' : 'Not configured'}                     ║
║   - OpenAI: ${process.env.OPENAI_API_KEY ? 'Configured' : 'Not configured'}                     ║
║   - TTS:    ${(process.env.TTS_API_KEY || process.env.GEMINI_API_KEY) ? 'Configured' : 'Not configured'}                     ║
╚════════════════════════════════════════════════╝
  `);
});
