import { Router } from 'express';
import { GeminiProvider } from './providers/gemini.js';
import { OpenAIProvider } from './providers/openai.js';

const router = Router();

// Provider instance cache (keyed by provider+apiKey hash)
const providerCache = new Map();

function getProvider(providerName, apiKey, model) {
  const cacheKey = `${providerName}:${apiKey.slice(0, 8)}:${model || 'default'}`;
  if (providerCache.has(cacheKey)) {
    return providerCache.get(cacheKey);
  }

  let provider;
  switch (providerName) {
    case 'openai':
      provider = new OpenAIProvider(
        apiKey,
        model || process.env.DEFAULT_OPENAI_MODEL || 'gpt-4',
      );
      break;
    case 'gemini':
    default:
      provider = new GeminiProvider(
        apiKey,
        model || process.env.DEFAULT_GEMINI_MODEL || 'gemini-2.0-flash',
      );
      break;
  }

  providerCache.set(cacheKey, provider);
  return provider;
}

function resolveApiKey(providerName, clientKey) {
  if (clientKey) return clientKey;
  if (providerName === 'gemini') return process.env.GEMINI_API_KEY;
  if (providerName === 'openai') return process.env.OPENAI_API_KEY;
  return null;
}

// Health check
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    providers: {
      gemini: !!process.env.GEMINI_API_KEY,
      openai: !!process.env.OPENAI_API_KEY,
    },
    defaultProvider: process.env.DEFAULT_LLM_PROVIDER || 'gemini',
  });
});

// List available providers
router.get('/providers', (_req, res) => {
  const providers = [];
  if (process.env.GEMINI_API_KEY) {
    providers.push({
      name: 'gemini',
      model: process.env.DEFAULT_GEMINI_MODEL || 'gemini-2.0-flash',
      available: true,
    });
  }
  if (process.env.OPENAI_API_KEY) {
    providers.push({
      name: 'openai',
      model: process.env.DEFAULT_OPENAI_MODEL || 'gpt-4',
      available: true,
    });
  }
  // Client can always provide their own key
  providers.push(
    { name: 'gemini', model: 'gemini-2.0-flash', available: false, clientKeyRequired: true },
    { name: 'openai', model: 'gpt-4', available: false, clientKeyRequired: true },
  );

  res.json({
    providers,
    default: process.env.DEFAULT_LLM_PROVIDER || 'gemini',
  });
});

// Generate interviewer response
router.post('/interview/respond', async (req, res) => {
  const { provider: providerName, apiKey: clientKey, model, persona, question, candidateResponse, conversationHistory, config } = req.body;

  const selectedProvider = providerName || process.env.DEFAULT_LLM_PROVIDER || 'gemini';
  const apiKey = resolveApiKey(selectedProvider, clientKey);

  if (!apiKey) {
    return res.status(400).json({
      error: `No API key configured for provider "${selectedProvider}". Please provide an API key or configure one on the server.`,
    });
  }

  try {
    const provider = getProvider(selectedProvider, apiKey, model);
    const result = await provider.generateInterviewerResponse(
      persona, question, candidateResponse, conversationHistory || [], config,
    );
    res.json({ ...result, provider: selectedProvider });
  } catch (e) {
    console.error('[respond] Error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Evaluate candidate response
router.post('/interview/evaluate', async (req, res) => {
  const { provider: providerName, apiKey: clientKey, model, question, candidateResponse, config } = req.body;

  const selectedProvider = providerName || process.env.DEFAULT_LLM_PROVIDER || 'gemini';
  const apiKey = resolveApiKey(selectedProvider, clientKey);

  if (!apiKey) {
    return res.status(400).json({
      error: `No API key configured for provider "${selectedProvider}".`,
    });
  }

  try {
    const provider = getProvider(selectedProvider, apiKey, model);
    const result = await provider.evaluateResponse(question, candidateResponse, config);
    res.json({ result, provider: selectedProvider });
  } catch (e) {
    console.error('[evaluate] Error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Generate closing response
router.post('/interview/closing', async (req, res) => {
  const { provider: providerName, apiKey: clientKey, model, persona, config, messageCount } = req.body;

  const selectedProvider = providerName || process.env.DEFAULT_LLM_PROVIDER || 'gemini';
  const apiKey = resolveApiKey(selectedProvider, clientKey);

  if (!apiKey) {
    return res.status(400).json({
      error: `No API key configured for provider "${selectedProvider}".`,
    });
  }

  try {
    const provider = getProvider(selectedProvider, apiKey, model);
    const result = await provider.generateClosingResponse(persona, config, messageCount);
    res.json({ response: result, provider: selectedProvider });
  } catch (e) {
    console.error('[closing] Error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Text-to-Speech endpoint (for avatar lip sync)
router.post('/tts/synthesize', async (req, res) => {
  const { text, voice = 'ja-JP-Neural2-B' } = req.body;

  const ttsApiKey = process.env.TTS_API_KEY;
  const ttsEndpoint = process.env.TTS_ENDPOINT || 'https://eu-texttospeech.googleapis.com/v1beta1/text:synthesize';

  if (!ttsApiKey) {
    return res.status(400).json({ error: 'TTS API key not configured on server.' });
  }

  try {
    const ttsResponse = await fetch(`${ttsEndpoint}?key=${ttsApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: 'ja-JP', name: voice },
        audioConfig: { audioEncoding: 'MP3' },
      }),
    });

    const data = await ttsResponse.json();
    if (data.audioContent) {
      res.json({ audioContent: data.audioContent });
    } else {
      res.status(500).json({ error: 'TTS generation failed', details: data });
    }
  } catch (e) {
    console.error('[TTS] Error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

export default router;
