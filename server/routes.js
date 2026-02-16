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
      elevenlabs: !!process.env.ELEVENLABS_API_KEY,
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

// --- DialogLab-compatible endpoints ---

// State for current LLM configuration
let currentProvider = process.env.DEFAULT_LLM_PROVIDER || 'gemini';
let currentModel = process.env.DEFAULT_GEMINI_MODEL || 'gemini-2.0-flash';
let runtimeKeys = {};

// Get available LLM models
router.get('/llm-models', (_req, res) => {
  const models = {};
  if (currentProvider === 'gemini') {
    models['gemini-2.0-flash'] = 'gemini-2.0-flash';
    models['gemini-2.0-flash-lite'] = 'gemini-2.0-flash-lite';
    models['gemini-1.5-pro'] = 'gemini-1.5-pro';
    models['gemini-1.5-flash'] = 'gemini-1.5-flash';
  } else {
    models['gpt-4'] = 'gpt-4';
    models['gpt-4o'] = 'gpt-4o';
    models['gpt-4o-mini'] = 'gpt-4o-mini';
    models['gpt-3.5-turbo'] = 'gpt-3.5-turbo';
  }
  res.json({
    availableModels: models,
    currentProvider,
    currentModel,
  });
});

// Update model
router.post('/update-model', (req, res) => {
  const { provider, model } = req.body;
  if (provider) currentProvider = provider;
  if (model) currentModel = model;
  res.json({ success: true, provider: currentProvider, model: currentModel });
});

// Set LLM provider
router.post('/llm-provider', (req, res) => {
  const { provider } = req.body;
  if (provider) currentProvider = provider;
  res.json({ success: true, provider: currentProvider });
});

// Set API keys at runtime
router.post('/llm-keys', (req, res) => {
  const { provider, apiKey } = req.body;
  if (provider && apiKey) {
    runtimeKeys[provider] = apiKey;
    if (provider === 'gemini') process.env.GEMINI_API_KEY = apiKey;
    if (provider === 'openai') process.env.OPENAI_API_KEY = apiKey;
    if (provider === 'elevenlabs') process.env.ELEVENLABS_API_KEY = apiKey;
  }
  res.json({ success: true });
});

// LLM status
router.get('/llm-status', (_req, res) => {
  res.json({
    provider: currentProvider,
    model: currentModel,
    geminiConfigured: !!(process.env.GEMINI_API_KEY || runtimeKeys.gemini),
    openaiConfigured: !!(process.env.OPENAI_API_KEY || runtimeKeys.openai),
  });
});

// Start multi-agent conversation (streaming)
router.post('/start-conversation', async (req, res) => {
  const { speakers, topic, turns = 5, interactionPattern, turnTakingMode } = req.body;

  const apiKey = resolveApiKey(currentProvider, runtimeKeys[currentProvider]);
  if (!apiKey) {
    return res.status(400).json({ error: `No API key for ${currentProvider}` });
  }

  // Set up SSE-like streaming with newline-delimited JSON
  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Transfer-Encoding', 'chunked');

  try {
    const provider = getProvider(currentProvider, apiKey, currentModel);
    const conversationHistory = [];

    for (let turn = 0; turn < turns; turn++) {
      for (const speaker of speakers) {
        const prompt = `You are "${speaker.name}", a ${speaker.personality || 'neutral'} personality.
Role: ${speaker.roleDescription || 'Participant'}
Topic: ${topic || 'General discussion'}
Interaction style: ${interactionPattern || 'neutral'}

Previous conversation:
${conversationHistory.slice(-6).map(m => `${m.name}: ${m.content}`).join('\n')}

Respond naturally in character as ${speaker.name}. Keep it concise (1-3 sentences). Use Japanese if the name is Japanese.
Only output the dialogue text, nothing else.`;

        try {
          const result = await provider.model.generateContent(prompt);
          const text = result.response.text().trim();

          const message = {
            speaker: speaker.name,
            name: speaker.name,
            avatarId: speaker.id || speaker.name,
            content: text,
            turn: turn + 1,
          };

          conversationHistory.push(message);

          res.write(JSON.stringify({ type: 'message', message }) + '\n');
        } catch (err) {
          console.error(`[conversation] Error for ${speaker.name}:`, err.message);
        }
      }
    }

    res.write(JSON.stringify({ type: 'end' }) + '\n');
    res.end();
  } catch (e) {
    console.error('[start-conversation] Error:', e.message);
    if (!res.headersSent) {
      res.status(500).json({ error: e.message });
    } else {
      res.write(JSON.stringify({ type: 'error', error: e.message }) + '\n');
      res.end();
    }
  }
});

// ElevenLabs TTS endpoint
router.post('/tts/elevenlabs', async (req, res) => {
  const { text, voiceId, modelId = 'eleven_multilingual_v2' } = req.body;
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return res.status(400).json({ error: 'ELEVENLABS_API_KEY not configured' });
  }
  if (!text || !voiceId) {
    return res.status(400).json({ error: 'text and voiceId are required' });
  }

  try {
    const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!ttsResponse.ok) {
      const errorBody = await ttsResponse.text();
      console.error('[ElevenLabs TTS] Error:', ttsResponse.status, errorBody);
      return res.status(ttsResponse.status).json({ error: `ElevenLabs API error: ${ttsResponse.status}`, details: errorBody });
    }

    const audioBuffer = Buffer.from(await ttsResponse.arrayBuffer());
    res.set('Content-Type', 'audio/mpeg');
    res.set('Content-Length', audioBuffer.length.toString());
    res.send(audioBuffer);
  } catch (e) {
    console.error('[ElevenLabs TTS] Error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// TTS endpoint (compatible with TalkingHead)
router.post('/tts', async (req, res) => {
  const { text, voice = 'ja-JP-Neural2-B' } = req.body;
  const ttsApiKey = process.env.TTS_API_KEY || process.env.GEMINI_API_KEY;
  const ttsEndpoint = process.env.TTS_ENDPOINT || 'https://texttospeech.googleapis.com/v1/text:synthesize';

  if (!ttsApiKey) {
    return res.status(400).json({ error: 'TTS not configured' });
  }

  try {
    const ttsResponse = await fetch(`${ttsEndpoint}?key=${ttsApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: voice.substring(0, 5), name: voice },
        audioConfig: { audioEncoding: 'MP3' },
      }),
    });

    const data = await ttsResponse.json();
    if (data.audioContent) {
      res.json({ audioContent: data.audioContent });
    } else {
      res.status(500).json({ error: 'TTS failed', details: data });
    }
  } catch (e) {
    console.error('[TTS] Error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Text-to-Speech endpoint (for avatar lip sync)
router.post('/tts/synthesize', async (req, res) => {
  const { text, voice = 'ja-JP-Neural2-B' } = req.body;

  const ttsApiKey = process.env.TTS_API_KEY || process.env.GEMINI_API_KEY;
  const ttsEndpoint = process.env.TTS_ENDPOINT || 'https://texttospeech.googleapis.com/v1/text:synthesize';

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
